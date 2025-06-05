import { create } from 'zustand';
import { useUserStore } from './userStore';
import { supabase } from '@utils/superbase';
import { Tables, TablesInsert, TablesUpdate } from 'database.types';

export type TeamRow = Tables<'teams'>;
export type TeamMemberRow = Tables<'team_members'> & { profiles: Pick<Tables<'profiles'>, 'id' | 'display_name' | 'profile_picture'> | null };
export type TeamJoinRequestRow = Tables<'team_join_requests'> & { profiles?: Pick<Tables<'profiles'>, 'id' | 'display_name' | 'profile_picture'> | null };
export type TeamInsertArgs = Pick<TablesInsert<'teams'>, 'name' | 'description' | 'logo_url' | 'is_public' | 'manager_id'>;

const logSupabaseError = (context: string, error: any) => {
  console.error(`Error in ${context}:`);
  if (error && typeof error === 'object') {
    if (error.message) console.error(`  Message: ${error.message}`);
    if (error.code) console.error(`  Code: ${error.code}`);
    if (error.details) console.error(`  Details: ${error.details}`);
    if (error.hint) console.error(`  Hint: ${error.hint}`);
  } else {
    console.error(`  Error: ${error}`);
  }
};

interface TeamState {
    teams: TeamRow[];
    userTeams: TeamRow[];
    loadingTeams: boolean;
    error: string | null;
    teamDetails: TeamRow | null;
    teamMembers: TeamMemberRow[];
    loadingTeamDetails: boolean;
    joinRequests: TeamJoinRequestRow[];
    loadingJoinRequests: boolean;
}

interface TeamActions {
    fetchTeams: () => Promise<void>;
    fetchUserTeams: (userId: string) => Promise<TeamRow[]>;
    createTeam: (newTeamData: TeamInsertArgs, creatorUserId: string) => Promise<TeamRow | null>;
    updateTeam: (teamId: string, updates: Partial<TeamRow>) => Promise<boolean>;
    deleteTeam: (teamId: string) => Promise<boolean>;
    subscribeToTeams: () => () => void;
    fetchTeamDetails: (teamId: string) => Promise<void>;
    addTeamMember: (teamId: string, userId: string, role: 'admin' | 'member') => Promise<boolean>;
    removeTeamMember: (teamId: string, userIdToRemove: string) => Promise<boolean>;
    leaveTeam: (teamId: string, userId: string) => Promise<boolean>;
    requestToJoinTeam: (teamId: string, userId: string) => Promise<boolean>;
    fetchJoinRequests: (teamId: string) => Promise<void>;
    approveJoinRequest: (requestId: string) => Promise<boolean>;
    rejectJoinRequest: (requestId: string) => Promise<boolean>;
    cancelJoinRequest: (requestId: string, teamId: string) => Promise<boolean>; // New action
    subscribeToTeamMembers: (teamId: string) => () => void;
    subscribeToJoinRequests: (teamId: string) => () => void;
}

type TeamStore = TeamState & TeamActions;

export const useTeamStore = create<TeamStore>((set, get) => ({
    teams: [],
    userTeams: [],
    loadingTeams: false,
    error: null,
    teamDetails: null,
    teamMembers: [],
    loadingTeamDetails: false,
    joinRequests: [],
    loadingJoinRequests: false,

    fetchTeams: async () => {
        set({ loadingTeams: true, error: null });
        try {
            const { data, error } = await supabase
                .from('teams')
                .select('id, name, description, logo_url, is_public, manager_id, created_at, updated_at')
                .order('created_at', { ascending: false });
            if (error) throw error;
            set({ teams: data || [], loadingTeams: false });
        } catch (e: any) {
            logSupabaseError('fetchTeams', e);
            set({ error: e.message || 'Failed to fetch teams', loadingTeams: false });
        }
    },

    fetchUserTeams: async (userId: string) => {
        set({ loadingTeams: true, error: null });
        try {
            const { data: memberTeamsData, error: memberTeamsError } = await supabase
                .from('team_members')
                .select('teams!inner(id, name, description, logo_url, is_public, manager_id, created_at, updated_at)')
                .eq('user_id', userId);

            if (memberTeamsError) throw memberTeamsError;
            const userTeamsData = memberTeamsData?.map(item => item.teams as unknown as TeamRow).filter(Boolean) || [];
            set({ userTeams: userTeamsData, loadingTeams: false});
            return userTeamsData;
        } catch (e: any) {
            logSupabaseError('fetchUserTeams', e);
            set({ error: e.message || 'Failed to fetch user teams', loadingTeams: false, userTeams: [] });
            return [];
        }
    },

    createTeam: async (newTeamData: TeamInsertArgs, creatorUserId: string) => {
        set({ loadingTeams: true, error: null });
        try {
            const teamPayload: TablesInsert<'teams'> = {
                name: newTeamData.name,
                description: newTeamData.description,
                logo_url: newTeamData.logo_url,
                is_public: newTeamData.is_public,
                manager_id: creatorUserId,
            };

            const { data: createdTeam, error: teamError } = await supabase
                .from('teams')
                .insert(teamPayload)
                .select('id, name, description, logo_url, is_public, manager_id, created_at, updated_at')
                .single();

            if (teamError) throw teamError;
            if (!createdTeam) throw new Error("Team creation failed to return data.");

            const { error: memberError } = await supabase
                .from('team_members')
                .insert({ team_id: createdTeam.id, user_id: creatorUserId, role: 'admin', status: 'active' });

            if (memberError) {
                await supabase.from('teams').delete().eq('id', createdTeam.id);
                throw memberError;
            }

            set({ loadingTeams: false });
            await get().fetchTeams();
            await get().fetchUserTeams(creatorUserId);
            return createdTeam as TeamRow;
        } catch (error: any) {
            logSupabaseError('createTeam', error);
            set({ error: error.message || 'Could not create team', loadingTeams: false });
            return null;
        }
    },

  updateTeam: async (teamId: string, updates: Partial<TeamRow>) => {
    set({ loadingTeamDetails: true, error: null });
    try {
      const { data, error } = await supabase
        .from('teams')
        .update(updates as TablesUpdate<'teams'>)
        .eq('id', teamId)
        .select('id, name, description, logo_url, is_public, manager_id, created_at, updated_at')
        .single();

      set({ loadingTeamDetails: false });
      if (error) throw error;
      if (data) {
        set(state => ({
            teamDetails: state.teamDetails?.id === teamId ? data as TeamRow : state.teamDetails,
            teams: state.teams.map(t => t.id === teamId ? data as TeamRow : t),
            userTeams: state.userTeams.map(t => t.id === teamId ? data as TeamRow : t)
        }));
        return true;
      }
      return false;
    } catch (e: any) {
      logSupabaseError('updateTeam', e);
      set({ error: e.message || 'Failed to update team', loadingTeamDetails: false });
      return false;
    }
  },

  deleteTeam: async (teamId: string) => {
    set({ loadingTeams: true, error: null }); // loadingTeams for list impact
    try {
      const { error } = await supabase.from('teams').delete().eq('id', teamId);
      set({ loadingTeams: false });
      if (error) throw error;
      set(state => ({
        teams: state.teams.filter(team => team.id !== teamId),
        userTeams: state.userTeams.filter(team => team.id !== teamId),
        teamDetails: state.teamDetails?.id === teamId ? null : state.teamDetails,
      }));
      return true;
    } catch (e: any) {
      logSupabaseError('deleteTeam', e);
      set({ error: e.message || 'Failed to delete team', loadingTeams: false });
      return false;
    }
  },

  fetchTeamDetails: async (teamId: string) => {
    if (!teamId || typeof teamId !== 'string' || (teamId.length < 36 && !['create', 'edit'].includes(teamId))) {
        set({ error: 'Invalid team ID for details.', loadingTeamDetails: false, teamDetails: null, teamMembers: [] });
        return;
    }
    set({ loadingTeamDetails: true, error: null, teamDetails: null, teamMembers: [] });
    try {
      const { data: teamData, error: teamError } = await supabase
        .from('teams')
        .select('id, name, description, logo_url, is_public, manager_id, created_at, updated_at')
        .eq('id', teamId)
        .single();

      if (teamError) throw new Error(teamError.message);
      if (!teamData) throw new Error('Team not found.');

      const { data: membersData, error: membersError } = await supabase
        .from('team_members')
        .select('id, team_id, user_id, role, status, joined_at, profiles!inner(id, display_name, profile_picture)')
        .eq('team_id', teamId);

      if (membersError) throw new Error(membersError.message);

      set({
        teamDetails: teamData as TeamRow,
        teamMembers: (membersData as unknown as TeamMemberRow[]) || [],
        loadingTeamDetails: false
      });
    } catch (e: any) {
      logSupabaseError('fetchTeamDetails', e);
      set({ error: e.message || 'Could not fetch team details.', loadingTeamDetails: false, teamDetails: null, teamMembers: [] });
    }
  },

  leaveTeam: async (teamId: string, userId: string) => {
    set({ loadingTeamDetails: true, error: null });
    try {
      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('team_id', teamId)
        .eq('user_id', userId);

      set({ loadingTeamDetails: false });
      if (error) throw error;

      set(state => ({
        teamMembers: state.teamMembers.filter(member => !(member.team_id === teamId && member.user_id === userId)),
        userTeams: state.userTeams.filter(team => {
            const authUserId = useUserStore.getState().authUser?.id;
            return !(userId === authUserId && team.id === teamId);
        })
      }));
      if (get().teamDetails?.id === teamId && get().teamDetails?.manager_id !== userId) {
         get().fetchTeamDetails(teamId);
      } else if (get().teamDetails?.id === teamId && get().teamDetails?.manager_id === userId) {
         set({teamDetails: null});
      }
      return true;
    } catch (e: any) {
      logSupabaseError('leaveTeam', e);
      set({ error: e.message || 'Failed to leave team', loadingTeamDetails: false });
      return false;
    }
  },

  requestToJoinTeam: async (teamId: string, userId: string) => {
    set({ loadingJoinRequests: true, error: null });
    try {
      const { error } = await supabase
        .from('team_join_requests')
        .insert({ team_id: teamId, user_id: userId, status: 'pending' });

      set({ loadingJoinRequests: false });
      if (error) throw error;
      get().fetchJoinRequests(teamId);
      return true;
    } catch (e: any) {
      logSupabaseError('requestToJoinTeam', e);
      set({ error: e.message || 'Failed to send join request', loadingJoinRequests: false });
      return false;
    }
  },

  fetchJoinRequests: async (teamId: string) => {
    if (!teamId || typeof teamId !== 'string' || (teamId.length < 36 && !['create', 'edit'].includes(teamId))) {
        set({ error: 'Invalid team ID for join requests.', loadingJoinRequests: false, joinRequests: [] });
        return;
    }
    set({ loadingJoinRequests: true, error: null });
    try {
      const { data, error } = await supabase
        .from('team_join_requests')
        .select('id, team_id, user_id, status, requested_at, profiles!inner(id, display_name, profile_picture)')
        .eq('team_id', teamId)
        .eq('status', 'pending'); // Only fetch pending requests

      set({ loadingJoinRequests: false });
      if (error) throw error;
      set({ joinRequests: (data as unknown as TeamJoinRequestRow[]) || [] });
    } catch (e: any) {
      logSupabaseError('fetchJoinRequests', e);
      set({ error: e.message || 'Failed to fetch join requests', loadingJoinRequests: false, joinRequests: [] });
    }
  },

  approveJoinRequest: async (requestId: string) => {
    set({ loadingJoinRequests: true, error: null });
    try {
      const { data: requestData, error: requestError } = await supabase
        .from('team_join_requests')
        .select('team_id, user_id')
        .eq('id', requestId)
        .single();

      if (requestError) throw requestError;
      if (!requestData) throw new Error('Join request not found during approval.');

      const { error: rpcError } = await supabase.rpc('approve_join_request_and_add_member', {
          p_request_id: requestId,
          p_team_id: requestData.team_id,
          p_user_id: requestData.user_id,
          p_role: 'member' // Default role for approved members
      });

      set({ loadingJoinRequests: false });
      if (rpcError) throw rpcError;

      await get().fetchJoinRequests(requestData.team_id);
      await get().fetchTeamDetails(requestData.team_id);
      return true;
    } catch (error: any) {
      logSupabaseError('approveJoinRequest', error);
      set({ error: error.message || 'Could not approve join request', loadingJoinRequests: false });
      return false;
    }
  },

  rejectJoinRequest: async (requestId: string) => {
    set({ loadingJoinRequests: true, error: null });
    try {
      const { data: requestDetails, error: fetchError } = await supabase
        .from('team_join_requests')
        .select('team_id') // Only need team_id to refresh the list
        .eq('id', requestId)
        .single();

      if (fetchError) throw fetchError;
      if (!requestDetails) throw new Error("Request not found for rejection.");

      const { error } = await supabase
        .from('team_join_requests')
        .delete()
        .eq('id', requestId);

      set({ loadingJoinRequests: false });
      if (error) throw error;
      get().fetchJoinRequests(requestDetails.team_id); // Refresh the list for the specific team
      return true;
    } catch (error: any) {
      logSupabaseError('rejectJoinRequest', error);
      set({ error: error.message || 'Could not reject join request', loadingJoinRequests: false });
      return false;
    }
  },

  // New action to cancel a join request
  cancelJoinRequest: async (requestId: string, teamId: string) => {
    set({ loadingJoinRequests: true, error: null });
    try {
      const { error } = await supabase
        .from('team_join_requests')
        .delete()
        .eq('id', requestId);

      set({ loadingJoinRequests: false });
      if (error) throw error;

      // Refresh the join requests for the specific team
      get().fetchJoinRequests(teamId);
      return true;
    } catch (e: any) {
      logSupabaseError('cancelJoinRequest', e);
      set({ error: e.message || 'Failed to cancel join request', loadingJoinRequests: false });
      return false;
    }
  },

  addTeamMember: async (teamId: string, userId: string, role: 'admin' | 'member') => {
    set({ loadingTeamDetails: true, error: null });
    try {
      const { error } = await supabase
        .from('team_members')
        .insert({ team_id: teamId, user_id: userId, role: role, status: 'active' });

      set({ loadingTeamDetails: false });
      if (error) throw error;
      get().fetchTeamDetails(teamId);
      return true;
    } catch (e: any) {
      logSupabaseError('addTeamMember', e);
      set({ error: e.message || 'Failed to add member', loadingTeamDetails: false });
      return false;
    }
  },

  removeTeamMember: async (teamId: string, userIdToRemove: string) => {
    set({ loadingTeamDetails: true, error: null });
    try {
      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('team_id', teamId)
        .eq('user_id', userIdToRemove);

      if (error) throw error;

      await get().fetchTeamDetails(teamId);
      set({ loadingTeamDetails: false });
      return true;
    } catch (error: any) {
      logSupabaseError('removeTeamMember', error);
      const errorMessage = error instanceof Error ? error.message : 'Could not remove member';
      set({ error: errorMessage, loadingTeamDetails: false });
      return false;
    }
  },

  subscribeToTeams: () => {
    const channel = supabase
      .channel('public:teams')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'teams' }, _payload => {
        get().fetchTeams();
        const authUserId = useUserStore.getState().authUser?.id;
        if(authUserId) get().fetchUserTeams(authUserId);
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  },

  subscribeToTeamMembers: (teamId: string) => {
    const channel = supabase
      .channel(`public:team_members:team_id=eq.${teamId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'team_members', filter: `team_id=eq.${teamId}` }, () => {
        get().fetchTeamDetails(teamId);
        get().fetchJoinRequests(teamId);
        const authUserId = useUserStore.getState().authUser?.id;
        if(authUserId) get().fetchUserTeams(authUserId);
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  },

  subscribeToJoinRequests: (teamId: string) => {
    const channel = supabase
      .channel(`public:team_join_requests:team_id=eq.${teamId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'team_join_requests', filter: `team_id=eq.${teamId}` }, () => {
        get().fetchJoinRequests(teamId);
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  },
}));
