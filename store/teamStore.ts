import { create } from 'zustand';
import { supabase } from '@utils/superbase';
import { Tables, TablesInsert, TablesUpdate } from 'types/database.types';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

export type TeamRow = Tables<'teams'>;
export type TeamMemberRow = Tables<'team_members'> & { profiles: Tables<'profiles'> | null };
export type TeamJoinRequestRow = Tables<'team_join_requests'> & { profiles?: Tables<'profiles'> | null };

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
    addTeam: (teamData: TablesInsert<'teams'>, creatorUserId: string) => Promise<TeamRow | null>;
    updateTeam: (teamId: string, teamData: TablesUpdate<'teams'>) => Promise<TeamRow | null>;
    deleteTeam: (teamId: string) => Promise<void>;
    subscribeToTeams: () => () => void;
    fetchTeamDetails: (teamId: string) => Promise<void>;
    addTeamMember: (teamId: string, userId: string, role: string) => Promise<TeamMemberRow | null>;
    leaveTeam: (teamId: string, userId: string) => Promise<void>;
    subscribeToTeamMembers: (teamId: string) => () => void;
    requestToJoinTeam: (teamId: string, userId: string) => Promise<void>;
    fetchJoinRequests: (teamId: string) => Promise<void>;
    approveJoinRequest: (requestId: string) => Promise<void>;
    rejectJoinRequest: (requestId: string) => Promise<void>;
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
                .select('*')
                .order('name', { ascending: true });

            if (error) throw error;
            set({ teams: data || [], loadingTeams: false });
        } catch (e: any) {
            set({ error: e.message || 'Failed to fetch teams', loadingTeams: false, teams: [] });
            console.error('Error fetching teams:', e);
        }
    },

    fetchUserTeams: async (userId: string) => {
        set({ loadingTeams: true, error: null });
        try {
            const { data: memberTeamsData, error: memberTeamsError } = await supabase
                .from('team_members')
                .select('team_id')
                .eq('user_id', userId);
    
            if (memberTeamsError) throw memberTeamsError;
            
            const teamIds = memberTeamsData?.map(mt => mt.team_id) || [];
    
            if (teamIds.length === 0) {
                set({ userTeams: [], loadingTeams: false });
                return [];
            }
    
            const { data: teamsData, error: teamsError } = await supabase
                .from('teams')
                .select('*')
                .in('id', teamIds)
                .order('name', { ascending: true });
    
            if (teamsError) throw teamsError;
            
            set({ userTeams: teamsData || [], loadingTeams: false });
            return teamsData || [];
        } catch (e: any) {
            set({ error: e.message || 'Failed to fetch user teams', loadingTeams: false, userTeams: [] });
            console.error('Error fetching user teams:', e);
            return [];
        }
    },    

    addTeam: async (teamData, creatorUserId) => {
        set({ loadingTeams: true, error: null });
        try {
            const { data: teamDataResult, error: teamError } = await supabase
                .from('teams')
                .insert(teamData)
                .select('*')
                .single();

            if (teamError) throw teamError;
            if (!teamDataResult) throw new Error("Team creation failed to return data.");

            const { error: memberError } = await supabase
                .from('team_members')
                .insert({
                    team_id: teamDataResult.id,
                    user_id: creatorUserId,
                    role: 'admin',
                    status: 'active', 
                });

            if (memberError) {
                console.error('Error adding admin member, attempting to rollback team creation or flag issue');
                await supabase.from('teams').delete().eq('id', teamDataResult.id); 
                throw memberError;
            }
            
            set({ loadingTeams: false });
            get().fetchTeams(); 
            return teamDataResult as TeamRow;

        } catch (error: any) {
            console.error('Error creating team:', error);
            set({ error: error.message || 'Could not create team', loadingTeams: false });
            return null;
        }
    },

    updateTeam: async (teamId, teamData) => {
        set({ loadingTeams: true, error: null });
        try {
            const { data, error } = await supabase
                .from('teams')
                .update(teamData)
                .eq('id', teamId)
                .select('*')
                .single();

            set({ loadingTeams: false });
            if (error) throw error;
            get().fetchTeams(); 
            return data as TeamRow | null;
        } catch (e: any) {
            set({ error: e.message || 'Failed to update team', loadingTeams: false });
            console.error('Error updating team:', e);
            return null;
        }
    },

    deleteTeam: async (teamId) => {
        set({ loadingTeams: true, error: null });
        try {
            const { error } = await supabase
                .from('teams')
                .delete()
                .eq('id', teamId);

            set({ loadingTeams: false });
            if (error) throw error;
            get().fetchTeams();
        } catch (e: any) {
            set({ error: e.message || 'Failed to delete team', loadingTeams: false });
            console.error('Error deleting team:', e);
        }
    },

    subscribeToTeams: () => {
        const channel = supabase
            .channel('public-teams-realtime')
            .on<TeamRow>(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'teams' },
                (payload: RealtimePostgresChangesPayload<TeamRow>) => {
                    const { eventType, new: newData, old: oldData } = payload;
                    set((state) => {
                        let updatedTeams = [...state.teams];
                        if (eventType === 'INSERT') {
                            updatedTeams = [...updatedTeams, newData as TeamRow].sort((a, b) => a.name.localeCompare(b.name));
                        } else if (eventType === 'UPDATE') {
                            updatedTeams = updatedTeams.map((team) =>
                                team.id === (newData as TeamRow).id ? (newData as TeamRow) : team
                            ).sort((a, b) => a.name.localeCompare(b.name));
                        } else if (eventType === 'DELETE') {
                            const oldId = (oldData as Partial<TeamRow>)?.id;
                            if (oldId) {
                                updatedTeams = updatedTeams.filter((team) => team.id !== oldId);
                            }
                        }
                        return { teams: updatedTeams };
                    });
                }
            )
            .subscribe((status, err) => {
                if (err) {
                    console.error('Error subscribing to teams channel:', err);
                    set({ error: `Subscription error: ${err.message}` });
                } else if (status === 'SUBSCRIBED' && get().teams.length === 0 && !get().loadingTeams) {
                    get().fetchTeams();
                }
            });

        return () => {
            supabase.removeChannel(channel);
        };
    },

    fetchTeamDetails: async (teamId) => {
        set({ loadingTeamDetails: true, error: null });
        try {
            const { data: teamData, error: teamError } = await supabase
                .from('teams')
                .select('*')
                .eq('id', teamId)
                .single();

            if (teamError) throw teamError;

            const { data: membersData, error: membersError } = await supabase
                .from('team_members')
                .select('*, profiles(*)')
                .eq('team_id', teamId);

            if (membersError) throw membersError;

            set({
                teamDetails: teamData || null,
                teamMembers: (membersData as TeamMemberRow[]) || [],
                loadingTeamDetails: false,
            });

        } catch (error: any) {
            console.error('Error fetching team details:', error);
            set({ error: error.message || 'Could not fetch team details', loadingTeamDetails: false });
        }
    },

    addTeamMember: async (teamId, userId, role) => {
        set({ loadingTeamDetails: true, error: null });
        try {
            const { data, error } = await supabase
                .from('team_members')
                .insert({ team_id: teamId, user_id: userId, role, status: 'active' })
                .select('*, profiles(*)')
                .single();
            
            set({ loadingTeamDetails: false });
            if (error) throw error;
            if(data){
                get().fetchTeamDetails(teamId);
            }
            return data as TeamMemberRow | null;
        } catch (error: any) {
            console.error('Error adding team member:', error);
            set({ error: error.message || 'Could not add team member', loadingTeamDetails: false });
            return null;
        }
    },

    leaveTeam: async (teamId, userId) => {
        set({ loadingTeamDetails: true, error: null });
        try {
            const { error } = await supabase
                .from('team_members')
                .delete()
                .eq('team_id', teamId)
                .eq('user_id', userId);

            set({ loadingTeamDetails: false });
            if (error) throw error;
            get().fetchTeamDetails(teamId);
        } catch (error: any) {
            console.error('Error leaving team:', error);
            set({ error: error.message || 'Could not leave team', loadingTeamDetails: false });
        }
    },

    subscribeToTeamMembers: (teamId: string) => {
        const channel = supabase
            .channel(`team-members-realtime-${teamId}`)
            .on<Tables<'team_members'>>( 
                'postgres_changes',
                { event: '*', schema: 'public', table: 'team_members', filter: `team_id=eq.${teamId}` },
                async (payload) => {
                    get().fetchTeamDetails(teamId);
                }
            )
            .subscribe((status, err) => {
                if (err) {
                    console.error(`Error subscribing to team_members ${teamId}:`, err);
                } else if (status === 'SUBSCRIBED') {
                    get().fetchTeamDetails(teamId);
                }
            });
        return () => {
            supabase.removeChannel(channel);
        };
    },
    
    requestToJoinTeam: async (teamId: string, userId: string) => {
        set({ loadingJoinRequests: true, error: null });
        try {
            const { error } = await supabase
                .from('team_join_requests')
                .insert({ team_id: teamId, user_id: userId, status: 'pending' });
            set({ loadingJoinRequests: false });
            if (error) throw error;
        } catch (error: any) {
            console.error('Error requesting to join team:', error);
            set({ error: error.message || 'Could not request to join team', loadingJoinRequests: false });
        }
    },

    fetchJoinRequests: async (teamId: string) => {
        set({ loadingJoinRequests: true, error: null });
        try {
            const { data, error } = await supabase
                .from('team_join_requests')
                .select('*, profiles(id, display_name, profile_picture)')
                .eq('team_id', teamId)
                .eq('status', 'pending');
            if (error) throw error;
            set({ joinRequests: (data as TeamJoinRequestRow[]) || [], loadingJoinRequests: false });
        } catch (error: any) {
            console.error('Error fetching join requests:', error);
            set({ error: error.message || 'Could not fetch join requests', loadingJoinRequests: false });
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
            if (!requestData) throw new Error('Join request not found');

            const { error: rpcError } = await supabase.rpc('approve_join_request_and_add_member', {
                p_request_id: requestId,
                p_team_id: requestData.team_id,
                p_user_id: requestData.user_id,
                p_role: 'member'
            });
            
            set({ loadingJoinRequests: false });
            if (rpcError) throw rpcError;
            get().fetchJoinRequests(requestData.team_id); 
            get().fetchTeamDetails(requestData.team_id); 

        } catch (error: any) {
            console.error('Error approving join request:', error);
            set({ error: error.message || 'Could not approve join request', loadingJoinRequests: false });
        }
    },

    rejectJoinRequest: async (requestId: string) => {
        set({ loadingJoinRequests: true, error: null });
        try {
            const { data: requestDetails, error: fetchError } = await supabase
                .from('team_join_requests')
                .select('team_id')
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
            get().fetchJoinRequests(requestDetails.team_id);

        } catch (error: any) {
            console.error('Error rejecting join request:', error);
            set({ error: error.message || 'Could not reject join request', loadingJoinRequests: false });
        }
    },

    subscribeToJoinRequests: (teamId: string) => {
        const channel = supabase
            .channel(`team-join-requests-realtime-${teamId}`)
            .on<Tables<'team_join_requests'>>(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'team_join_requests', filter: `team_id=eq.${teamId}` },
                (payload) => {
                   get().fetchJoinRequests(teamId);
                }
            )
            .subscribe((status, err) => {
                if(err) {
                    console.error(`Error subscribing to team_join_requests ${teamId}`, err);
                } else if (status === 'SUBSCRIBED') {
                    get().fetchJoinRequests(teamId);
                }
            });
        return () => {
            supabase.removeChannel(channel);
        };
    },
}));