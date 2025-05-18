import { create } from 'zustand';
import { supabase } from '@utils/superbase';
import { Database, Tables, TablesInsert, TablesUpdate } from 'types/database.types';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

export type TeamRow = Tables<'teams'>;
export type TeamMemberRow = Tables<'team_members'> & { profiles: Tables<'profiles'> }; // Assuming you want profile data

interface TeamState {
    teams: TeamRow[];
    loadingTeams: boolean;
    error: string | null;
    teamDetails: TeamRow | null;
    teamMembers: TeamMemberRow[];
    loadingTeamDetails: boolean;
    joinRequests: Tables<'team_join_requests'>[]; // Add state for join requests
    loadingJoinRequests: boolean;
}

interface TeamActions {
    fetchTeams: () => Promise<void>;
    addTeam: (teamData: TablesInsert<'teams'>, creatorUserId: string) => Promise<TeamRow | null>;
    updateTeam: (teamId: string, teamData: TablesUpdate<'teams'>) => Promise<TeamRow | null>;
    deleteTeam: (teamId: string) => Promise<void>;
    subscribeToTeams: () => () => void;
    fetchTeamDetails: (teamId: string) => Promise<void>;
    addTeamMember: (teamId: string, userId: string, role: string) => Promise<TeamMemberRow | null>;
    leaveTeam: (teamId: string, userId: string) => Promise<void>;
    subscribeToTeamMembers: (teamId: string) => () => void;

    requestToJoinTeam: (teamId: string, userId: string) => Promise<void>;  // New action
    fetchJoinRequests: (teamId: string) => Promise<void>;
    approveJoinRequest: (requestId: string) => Promise<void>;
    rejectJoinRequest: (requestId: string) => Promise<void>;
    subscribeToJoinRequests: (teamId: string) => () => void;
}

type TeamStore = TeamState & TeamActions;

export const useTeamStore = create<TeamStore>((set, get) => ({
    teams: [],
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

    addTeam: async (teamData, creatorUserId) => {
        try {
            const { data: teamDataResult, error: teamError } = await supabase
                .from('teams')
                .insert(teamData)
                .select('*')
                .single();

            if (teamError) throw teamError;

            if (!teamDataResult) return null;

            const { data: memberData, error: memberError } = await supabase
                .from('team_members')
                .insert({
                    team_id: teamDataResult.id,
                    user_id: creatorUserId,
                    role: 'admin',
                })
                .select('*')
                .single();

            if (memberError) throw memberError;

            return teamDataResult as TeamRow;

        } catch (error) {
            console.error('Error creating team:', error);
            set({ error: 'Could not create team' });
            return null;
        }
    },

    updateTeam: async (teamId, teamData) => {
        try {
            const { data, error } = await supabase
                .from('teams')
                .update(teamData)
                .eq('id', teamId)
                .select('*')
                .single();

            if (error) throw error;
            return data as TeamRow | null;
        } catch (e: any) {
            set({ error: e.message || 'Failed to update team' });
            console.error('Error updating team:', e);
            return null;
        }
    },

    deleteTeam: async (teamId) => {
        try {
            const { error } = await supabase
                .from('teams')
                .delete()
                .eq('id', teamId);

            if (error) throw error;
        } catch (e: any) {
            set({ error: e.message || 'Failed to delete team' });
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
                    console.log('Team change received!', payload);
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
                } else {
                    console.log('Subscribed to teams channel with status:', status);
                    if (status === 'SUBSCRIBED' && get().teams.length === 0 && !get().loadingTeams) {
                        get().fetchTeams();
                    }
                }
            });

        return () => {
            supabase.removeChannel(channel);
            console.log('Unsubscribed from teams channel');
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
                teamMembers: membersData || [],
                loadingTeamDetails: false,
            });

        } catch (error: any) {
            console.error('Error fetching team details:', error);
            set({ error: error.message || 'Could not fetch team details', loadingTeamDetails: false });
        }
    },

    addTeamMember: async (teamId, userId, role) => {
        try {
            const { data, error } = await supabase
                .from('team_members')
                .insert({ team_id: teamId, user_id: userId, role })
                .select('*, profiles(*)')
                .single();

            if (error) throw error;
            return data as TeamMemberRow;
        } catch (error: any) {
            console.error('Error adding team member:', error);
            set({ error: error.message || 'Could not add team member' });
            return null;
        }
    },

    leaveTeam: async (teamId, userId) => {
        try {
            const { error } = await supabase
                .from('team_members')
                .delete()
                .eq('team_id', teamId)
                .eq('user_id', userId);

            if (error) throw error;
        } catch (error: any) {
            console.error('Error leaving team:', error);
            set({ error: error.message || 'Could not leave team' });
        }
    },

    subscribeToTeamMembers: (teamId: string) => {
        const channel = supabase
            .channel(`team_members:${teamId}`)
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'team_members' },
                (payload) => {
                    console.log('Team member change:', payload);
                    const { eventType, new: newData, old: oldData } = payload;
                    set((state) => {
                        let updatedTeamMembers = [...state.teamMembers];
                        if (eventType === 'INSERT') {
                            updatedTeamMembers = [...updatedTeamMembers, newData as TeamMemberRow];
                        } else if (eventType === 'UPDATE') {
                            updatedTeamMembers = updatedTeamMembers.map(member =>
                                member.id === (newData as TeamMemberRow).id ? (newData as TeamMemberRow) : member
                            );
                        } else if (eventType === 'DELETE') {
                             const oldId = (oldData as Partial<TeamMemberRow>)?.id;
                            if (oldId) {
                                updatedTeamMembers = updatedTeamMembers.filter((member) => member.id !== oldId);
                            }
                        }
                        return { teamMembers: updatedTeamMembers };
                    });
                }
            )
            .subscribe();

        return () => supabase.removeChannel(channel);
    },
    requestToJoinTeam: async (teamId: string, userId: string) => {
        try {
            const { error } = await supabase
                .from('team_join_requests')
                .insert({ teamId, userId });
            if (error) throw error;
        } catch (error: any) {
            console.error('Error requesting to join team:', error);
            set({ error: error.message || 'Could not request to join team' });
        }
    },

    fetchJoinRequests: async (teamId: string) => {
        set({ loadingJoinRequests: true, error: null });
        try {
            const { data, error } = await supabase
                .from('team_join_requests')
                .select('*, profiles(*)')  // Include user profile data
                .eq('team_id', teamId);
            if (error) throw error;
            set({ joinRequests: data || [], loadingJoinRequests: false });
        } catch (error: any) {
            console.error('Error fetching join requests:', error);
            set({ error: error.message || 'Could not fetch join requests', loadingJoinRequests: false });
        }
    },

    approveJoinRequest: async (requestId: string) => {
        try {
            // First, get the join request
            const { data: requestData, error: requestError } = await supabase
                .from('team_join_requests')
                .select('team_id, user_id')
                .eq('id', requestId)
                .single();

            if (requestError) throw requestError;
            if (!requestData) {
                throw new Error('Join request not found');
            }

            // Transaction to ensure both operations succeed or fail together
            const { error: transactionError } = await supabase.rpc('approve_join_request', {
                p_request_id: requestId,
                p_team_id: requestData.team_id,
                p_user_id: requestData.user_id,
                p_role: 'member' // Or any default role
            });

            if (transactionError) throw transactionError;

        } catch (error: any) {
            console.error('Error approving join request:', error);
            set({ error: error.message || 'Could not approve join request' });
        }
    },

    rejectJoinRequest: async (requestId: string) => {
        try {
            const { error } = await supabase
                .from('team_join_requests')
                .delete()
                .eq('id', requestId);
            if (error) throw error;
        } catch (error: any) {
            console.error('Error rejecting join request:', error);
            set({ error: error.message || 'Could not reject join request' });
        }
    },
    subscribeToJoinRequests: (teamId: string) => {
        const channel = supabase
            .channel(`team_join_requests:${teamId}`)
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'team_join_requests' },
                (payload) => {
                    console.log('Join request change:', payload);
                    const { eventType, new: newData, old: oldData } = payload;
                    set((state) => {
                        let updatedRequests = [...state.joinRequests];
                        if (eventType === 'INSERT') {
                            updatedRequests = [...updatedRequests, newData as Tables<'team_join_requests'>];
                        } else if (eventType === 'UPDATE') {
                            updatedRequests = updatedRequests.map(req =>
                                req.id === (newData as Tables<'team_join_requests'>).id ? (newData as Tables<'team_join_requests'>) : req
                            );
                        } else if (eventType === 'DELETE') {
                            const oldId = (oldData as Partial<Tables<'team_join_requests'>>)?.id;
                            if (oldId) {
                                updatedRequests = updatedRequests.filter((req) => req.id !== oldId);
                            }
                        }
                        return { joinRequests: updatedRequests };
                    });
                }
            )
            .subscribe();

        return () => supabase.removeChannel(channel);
    },
}));
