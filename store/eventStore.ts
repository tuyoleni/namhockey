import { create } from 'zustand';
import { Tables, TablesInsert, TablesUpdate } from 'database.types';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { supabase } from '@utils/superbase';

type EventRow = Tables<'events'>;

export type EventRegistrationRowWithTeamDetails = Tables<'event_registrations'> & {
  teams: Pick<Tables<'teams'>, 'id' | 'name' | 'logo_url' | 'manager_id'> | null;
};

export type EventWithTeams = EventRow & {
  home_team: Pick<Tables<'teams'>, 'name' | 'logo_url'> | null;
  away_team: Pick<Tables<'teams'>, 'name' | 'logo_url'> | null;
};

interface EventState {
  events: EventWithTeams[];
  registrations: EventRegistrationRowWithTeamDetails[];
  loadingEvents: boolean;
  loadingRegistrations: boolean;
  error: string | null;
}

interface EventActions {
  fetchEvents: () => Promise<void>;
  getEventById: (eventId: string) => Promise<EventWithTeams | null>;
  addEvent: (eventData: TablesInsert<'events'>) => Promise<EventWithTeams | null>;
  updateEvent: (eventId: string, eventData: TablesUpdate<'events'>) => Promise<EventWithTeams | null>;
  deleteEvent: (eventId: string) => Promise<void>;
  subscribeToEvents: () => () => void;
  fetchRegistrationsByEventId: (eventId: string) => Promise<EventRegistrationRowWithTeamDetails[]>;
  registerTeamForEvent: (registrationData: TablesInsert<'event_registrations'>) => Promise<EventRegistrationRowWithTeamDetails | null>;
  unregisterTeamFromEvent: (registrationId: string) => Promise<void>;
  subscribeToEventRegistrations: (eventId?: string) => () => void;
}

const eventSelectQuery = `
  id, title, description, event_type, start_time, end_time, location_name, location_address, status, home_team_id, away_team_id, home_team_score, away_team_score, created_by_profile_id, created_at, updated_at,
  home_team:teams!events_home_team_id_fkey(name, logo_url),
  away_team:teams!events_away_team_id_fkey(name, logo_url)
`;

const registrationWithTeamSelectQuery = `
  id, event_id, team_id, registration_date, status, created_at,
  teams!inner (id, name, logo_url, manager_id)
`;

export const useEventStore = create<EventState & EventActions>((set, get) => ({
  events: [],
  registrations: [],
  loadingEvents: false,
  loadingRegistrations: false,
  error: null,

  fetchEvents: async () => {
    set({ loadingEvents: true, error: null });
    try {
      const { data, error } = await supabase
        .from('events')
        .select(eventSelectQuery)
        .order('start_time', { ascending: true });

      if (error) throw error;
      set({ events: (data as unknown as EventWithTeams[]) || [], loadingEvents: false });
    } catch (e: any) {
      set({ error: e.message || 'Failed to fetch events', loadingEvents: false, events: [] });
      console.error('Error fetching events:', e);
    }
  },

  getEventById: async (eventId: string) => {
    set({ loadingEvents: true, error: null });
    try {
      const { data, error } = await supabase
        .from('events')
        .select(eventSelectQuery)
        .eq('id', eventId)
        .single();

      set({ loadingEvents: false });
      if (error) {
        console.error(`Error fetching event ${eventId}:`, error);
      }
      return data as unknown as EventWithTeams | null;
    } catch (e: any) {
      set({ error: e.message || `Failed to fetch event ${eventId}`, loadingEvents: false });
      console.error(`Error fetching event ${eventId} (catch block):`, e);
      return null;
    }
  },

  addEvent: async (eventData) => {
    set({ loadingEvents: true, error: null });
    try {
      const { data, error } = await supabase
        .from('events')
        .insert(eventData)
        .select(eventSelectQuery)
        .single();

      set({ loadingEvents: false });
      if (error) throw error;
      return data as unknown as EventWithTeams | null;
    } catch (e: any) {
      set({ error: e.message || 'Failed to add event', loadingEvents: false });
      console.error('Error adding event:', e);
      return null;
    }
  },

  updateEvent: async (eventId, eventData) => {
    set({ loadingEvents: true, error: null });
    try {
      const { data, error } = await supabase
        .from('events')
        .update(eventData)
        .eq('id', eventId)
        .select(eventSelectQuery)
        .single();

      set({ loadingEvents: false });
      if (error) throw error;
      return data as unknown as EventWithTeams | null;
    } catch (e: any) {
      set({ error: e.message || 'Failed to update event', loadingEvents: false });
      console.error('Error updating event:', e);
      return null;
    }
  },

  deleteEvent: async (eventId) => {
    set({ loadingEvents: true, error: null });
    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId);

      set({ loadingEvents: false });
      if (error) throw error;
    } catch (e: any) {
      set({ error: e.message || 'Failed to delete event', loadingEvents: false });
      console.error('Error deleting event:', e);
    }
  },

  subscribeToEvents: () => {
    const channel = supabase
      .channel('public-events-realtime')
      .on<Tables<'events'>>(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'events' },
        async (payload: RealtimePostgresChangesPayload<Tables<'events'>>) => {
          console.log('Event change received!', payload);
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
             get().fetchEvents();
          } else if (payload.eventType === 'DELETE') {
             set((state) => ({ events: state.events.filter((event) => event.id !== (payload.old as Partial<EventRow>)?.id) }));
          }
        }
      )
      .subscribe((status, err) => {
        if (err) {
          console.error('Error subscribing to events channel:', err);
          set({ error: `Subscription error: ${err.message}` });
        } else if (status === 'SUBSCRIBED') {
            console.log('Successfully subscribed to events channel.');
        }
      });

    return () => {
      console.log('Removing events channel subscription');
      supabase.removeChannel(channel);
    };
  },

  fetchRegistrationsByEventId: async (eventId: string) => {
    set({ loadingRegistrations: true, error: null });
    try {
      const { data, error } = await supabase
        .from('event_registrations')
        .select(registrationWithTeamSelectQuery)
        .eq('event_id', eventId)
        .order('registration_date', { ascending: true });

      if (error) throw error;
      const fetchedRegistrations = (data as unknown as EventRegistrationRowWithTeamDetails[] || []);
      set((state) => ({
        registrations: [
          ...state.registrations.filter(reg => reg.event_id !== eventId),
          ...fetchedRegistrations
        ].sort((a,b) => (a.registration_date && b.registration_date ? new Date(a.registration_date).getTime() - new Date(b.registration_date).getTime() : 0)),
        loadingRegistrations: false
      }));
      return fetchedRegistrations;
    } catch (e: any) {
      set({ error: e.message || 'Failed to fetch registrations', loadingRegistrations: false });
      console.error('Error fetching registrations:', e);
      return [];
    }
  },

  registerTeamForEvent: async (registrationData) => {
    set({ loadingRegistrations: true, error: null });
    try {
      const { data, error } = await supabase
        .from('event_registrations')
        .insert(registrationData)
        .select(registrationWithTeamSelectQuery)
        .single();

      set({loadingRegistrations: false});
      if (error) throw error;
      return data as unknown as EventRegistrationRowWithTeamDetails | null;
    } catch (e: any) {
      set({ error: e.message || 'Failed to register team', loadingRegistrations: false });
      console.error('Error registering team:', e);
      return null;
    }
  },

  unregisterTeamFromEvent: async (registrationId: string) => {
    set({ loadingRegistrations: true, error: null });
    try {
      const { error } = await supabase
        .from('event_registrations')
        .delete()
        .eq('id', registrationId);
      set({loadingRegistrations: false});
      if (error) throw error;
    } catch (e: any) {
      set({ error: e.message || 'Failed to unregister team', loadingRegistrations: false });
      console.error('Error unregistering team:', e);
    }
  },

  subscribeToEventRegistrations: (eventId?: string) => {
    const channelName = eventId
      ? `public-event-registrations-for-event-${eventId}`
      : 'public-event-registrations-all';
    const filterString = eventId ? `event_id=eq.${eventId}` : undefined;

    console.log(`Attempting to subscribe to ${channelName} with filter: ${filterString}`);

    const channel = supabase
      .channel(channelName)
      .on<Tables<'event_registrations'>>(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'event_registrations', filter: filterString },
        async (payload: RealtimePostgresChangesPayload<Tables<'event_registrations'>>) => {
          console.log(`Registration change received on ${channelName}!`, payload);

          const fetchRegistrationWithDetails = async (id: string): Promise<EventRegistrationRowWithTeamDetails | null> => {
            const { data: regData, error: regError } = await supabase
              .from('event_registrations')
              .select(registrationWithTeamSelectQuery)
              .eq('id', id)
              .single();
            if (regError) {
              console.error(`Error fetching registration ${id} for subscription update:`, regError);
              return null;
            }
            return regData as unknown as EventRegistrationRowWithTeamDetails | null;
          };

          const getRegistrationDateValue = (reg: EventRegistrationRowWithTeamDetails): number => {
            return reg.registration_date ? new Date(reg.registration_date).getTime() : 0;
          };

          if (payload.eventType === 'INSERT') {
            const newRegDetails = await fetchRegistrationWithDetails(payload.new.id);
            if (newRegDetails && (!eventId || newRegDetails.event_id === eventId)) {
                set((state) => ({
                registrations: [...state.registrations.filter(r => r.id !== newRegDetails.id), newRegDetails].sort((a,b) =>
                    getRegistrationDateValue(a) - getRegistrationDateValue(b)
                )
                }));
            }
          } else if (payload.eventType === 'UPDATE') {
             const updatedRegDetails = await fetchRegistrationWithDetails(payload.new.id);
             if (updatedRegDetails && (!eventId || updatedRegDetails.event_id === eventId)) {
                set((state) => ({
                registrations: state.registrations.map((reg) =>
                    reg.id === updatedRegDetails.id ? updatedRegDetails : reg
                ).sort((a,b) =>
                    getRegistrationDateValue(a) - getRegistrationDateValue(b)
                )
                }));
             }
          } else if (payload.eventType === 'DELETE') {
            const oldId = (payload.old as Partial<Tables<'event_registrations'>>)?.id;
            if (oldId) {
                set((state) => ({ registrations: state.registrations.filter((reg) => reg.id !== oldId) }));
            }
          }
        }
      )
      .subscribe((status, err) => {
        if (err) {
          console.error(`Error subscribing to ${channelName} channel:`, err);
          set({ error: `Subscription error (${channelName}): ${err.message}` });
        } else if (status === 'SUBSCRIBED') {
            console.log(`Successfully subscribed to ${channelName} channel.`);
        }
      });

    return () => {
      console.log(`Removing ${channelName} channel subscription`);
      supabase.removeChannel(channel);
    };
  },
}));
