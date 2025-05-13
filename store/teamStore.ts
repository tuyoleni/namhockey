import { create } from 'zustand';
import { supabase } from '@utils/superbase'; // Adjust the import path for your supabase client
import { Database, Tables, TablesInsert, TablesUpdate } from 'types/database.types'; // Adjust the import path for your database types
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

// Type for a raw team row from the database
type TeamRow = Tables<'teams'>;

// Define the state interface for the team store
interface TeamState {
  teams: TeamRow[];
  loadingTeams: boolean;
  error: string | null;
}

// Define the actions interface for the team store
interface TeamActions {
  fetchTeams: () => Promise<void>;
  addTeam: (teamData: TablesInsert<'teams'>) => Promise<TeamRow | null>;
  updateTeam: (teamId: string, teamData: TablesUpdate<'teams'>) => Promise<TeamRow | null>;
  deleteTeam: (teamId: string) => Promise<void>;
  subscribeToTeams: () => () => void; // Returns an unsubscribe function
}

// Combine state and actions interfaces
type TeamStore = TeamState & TeamActions;

export const useTeamStore = create<TeamStore>((set, get) => ({
  // Initial state
  teams: [],
  loadingTeams: false,
  error: null,

  // Actions

  /**
   * Fetches all teams from the database.
   */
  fetchTeams: async () => {
    set({ loadingTeams: true, error: null });
    try {
      const { data, error } = await supabase
        .from('teams')
        .select('*') // Select all columns for the team list
        .order('name', { ascending: true }); // Order teams by name

      if (error) throw error;

      set({ teams: data || [], loadingTeams: false });
    } catch (e: any) {
      set({ error: e.message || 'Failed to fetch teams', loadingTeams: false, teams: [] });
      console.error('Error fetching teams:', e);
    }
  },

  /**
   * Adds a new team to the database.
   * @param teamData - The data for the new team.
   * @returns The added team data, or null if an error occurred.
   */
  addTeam: async (teamData) => {
    try {
      const { data, error } = await supabase
        .from('teams')
        .insert(teamData)
        .select('*') // Select the inserted row
        .single(); // Expect a single result

      if (error) throw error;

      // Realtime subscription will handle updating the store state
      return data as TeamRow | null;
    } catch (e: any) {
      set({ error: e.message || 'Failed to add team' });
      console.error('Error adding team:', e);
      return null;
    }
  },

  /**
   * Updates an existing team in the database.
   * @param teamId - The ID of the team to update.
   * @param teamData - The updated data for the team.
   * @returns The updated team data, or null if an error occurred.
   */
  updateTeam: async (teamId, teamData) => {
    try {
      const { data, error } = await supabase
        .from('teams')
        .update(teamData)
        .eq('id', teamId) // Filter by team ID
        .select('*') // Select the updated row
        .single(); // Expect a single result

      if (error) throw error;

      // Realtime subscription will handle updating the store state
      return data as TeamRow | null;
    } catch (e: any) {
      set({ error: e.message || 'Failed to update team' });
      console.error('Error updating team:', e);
      return null;
    }
  },

  /**
   * Deletes a team from the database.
   * @param teamId - The ID of the team to delete.
   */
  deleteTeam: async (teamId) => {
    try {
      const { error } = await supabase
        .from('teams')
        .delete()
        .eq('id', teamId); // Filter by team ID

      if (error) throw error;

      // Realtime subscription will handle removing the team from the store state
    } catch (e: any) {
      set({ error: e.message || 'Failed to delete team' });
      console.error('Error deleting team:', e);
    }
  },

  /**
   * Subscribes to realtime changes in the 'teams' table.
   * Returns an unsubscribe function.
   */
  subscribeToTeams: () => {
    const channel = supabase
      .channel('public-teams-realtime') // Unique channel name
      .on<TeamRow>(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'teams' },
        (payload: RealtimePostgresChangesPayload<TeamRow>) => {
          console.log('Team change received!', payload);
          const { eventType, new: newData, old: oldData } = payload;

          set((state) => {
            let updatedTeams = [...state.teams];

            if (eventType === 'INSERT') {
              // Add new team and keep sorted
              updatedTeams = [...updatedTeams, newData as TeamRow].sort((a, b) => a.name.localeCompare(b.name));
            } else if (eventType === 'UPDATE') {
              // Find and update the team, then re-sort
              updatedTeams = updatedTeams.map((team) =>
                team.id === (newData as TeamRow).id ? (newData as TeamRow) : team
              ).sort((a, b) => a.name.localeCompare(b.name));
            } else if (eventType === 'DELETE') {
              // Remove the deleted team
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
           // Optionally fetch initial data if subscription is successful and store is empty
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
}));
