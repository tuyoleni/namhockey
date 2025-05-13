import { create } from 'zustand';
import { supabase } from '@utils/superbase';
import { Database, Tables, TablesInsert, TablesUpdate } from 'types/database.types';
import { RealtimePostgresChangesPayload, SupabaseClient } from '@supabase/supabase-js';

type EventRow = Tables<'events'>;
type EventRegistrationRow = Tables<'event_registrations'>;

export type EventWithTeams = EventRow & {
  home_team: Pick<Tables<'teams'>, 'name' | 'logo_url'> | null;
  away_team: Pick<Tables<'teams'>, 'name' | 'logo_url'> | null;
};

interface EventState {
  events: EventWithTeams[];
  registrations: EventRegistrationRow[]; // Store all registrations, or filter as needed
  loadingEvents: boolean;
  loadingRegistrations: boolean;
  error: string | null;
}

interface EventActions {
  fetchEvents: () => Promise<void>;
  addEvent: (eventData: TablesInsert<'events'>) => Promise<EventWithTeams | null>;
  updateEvent: (eventId: string, eventData: TablesUpdate<'events'>) => Promise<EventWithTeams | null>;
  deleteEvent: (eventId: string) => Promise<void>;
  subscribeToEvents: () => () => void;

  fetchRegistrationsByEventId: (eventId: string) => Promise<EventRegistrationRow[]>;
  registerTeamForEvent: (registrationData: TablesInsert<'event_registrations'>) => Promise<EventRegistrationRow | null>;
  unregisterTeamFromEvent: (registrationId: string) => Promise<void>; // Or by eventId and teamId
  subscribeToEventRegistrations: (eventId?: string) => () => void; // Optional eventId to filter subscription
}

// The select query for fetching events with team details
const eventSelectQuery = `
  id, title, description, event_type, start_time, end_time, location_name, location_address, status, home_team_id, away_team_id, home_team_score, away_team_score, created_by_profile_id, created_at, updated_at,
  home_team:teams!events_home_team_id_fkey(name, logo_url),
  away_team:teams!events_away_team_id_fkey(name, logo_url)
`;

// Select query for registrations (simple for now)
const registrationSelectQuery = `*`;

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

  addEvent: async (eventData) => {
    try {
      const { data, error } = await supabase
        .from('events')
        .insert(eventData)
        .select(eventSelectQuery)
        .single();

      if (error) throw error;
      return data as unknown as EventWithTeams | null;
    } catch (e: any) {
      set({ error: e.message || 'Failed to add event' });
      console.error('Error adding event:', e);
      return null;
    }
  },

  updateEvent: async (eventId, eventData) => {
    try {
      const { data, error } = await supabase
        .from('events')
        .update(eventData)
        .eq('id', eventId)
        .select(eventSelectQuery)
        .single();

      if (error) throw error;
      return data as unknown as EventWithTeams | null;
    } catch (e: any) {
      set({ error: e.message || 'Failed to update event' });
      console.error('Error updating event:', e);
      return null;
    }
  },

  deleteEvent: async (eventId) => {
    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId);

      if (error) throw error;
    } catch (e: any) {
      set({ error: e.message || 'Failed to delete event' });
      console.error('Error deleting event:', e);
    }
  },

  subscribeToEvents: () => {
    const channel = supabase
      .channel('public-events-realtime')
      .on<EventRow>(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'events' },
        async (payload: RealtimePostgresChangesPayload<EventRow>) => {
          console.log('Event change received!', payload);

          const fetchEventById = async (id: string): Promise<EventWithTeams | null> => {
            const { data, error: fetchError } = await supabase
              .from('events')
              .select(eventSelectQuery)
              .eq('id', id)
              .single();
            if (fetchError) {
              console.error(`Error fetching event ${id} for subscription:`, fetchError);
              return null;
            }
            return data as unknown as EventWithTeams | null;
          };

          // Helper function to get time value safely, handling null
          const getStartTimeValue = (event: EventWithTeams): number => {
             return event.start_time ? new Date(event.start_time).getTime() : 0; // Treat null as beginning
          }


          if (payload.eventType === 'INSERT') {
            const newEventDetails = await fetchEventById(payload.new.id);
            if (newEventDetails) {
              set((state) => ({
                events: [...state.events, newEventDetails].sort((a, b) =>
                 getStartTimeValue(a) - getStartTimeValue(b)
                )
              }));
            }
          } else if (payload.eventType === 'UPDATE') {
            const updatedEventDetails = await fetchEventById(payload.new.id);
            if (updatedEventDetails) {
              set((state) => ({
                events: state.events.map((event) =>
                  event.id === updatedEventDetails.id ? updatedEventDetails : event
                ).sort((a, b) =>
                 getStartTimeValue(a) - getStartTimeValue(b)
                ),
              }));
            }
          } else if (payload.eventType === 'DELETE') {
            const oldId = (payload.old as Partial<EventRow>)?.id;
            if (oldId) {
                set((state) => ({ events: state.events.filter((event) => event.id !== oldId) }));
            }
          }
        }
      )
      .subscribe((status, err) => {
        if (err) {
          console.error('Error subscribing to events channel:', err);
          set({ error: `Subscription error: ${err.message}` });
        } else {
          console.log('Subscribed to events channel with status:', status);
          // Optionally fetch initial data if subscription is successful and store is empty
          if (status === 'SUBSCRIBED' && get().events.length === 0 && !get().loadingEvents) {
            get().fetchEvents();
          }
        }
      });

    return () => {
      supabase.removeChannel(channel);
      console.log('Unsubscribed from events channel');
    };
  },

  // --- Event Registrations ---
  fetchRegistrationsByEventId: async (eventId: string) => {
    set({ loadingRegistrations: true, error: null });
    try {
      const { data, error } = await supabase
        .from('event_registrations')
        .select(registrationSelectQuery)
        .eq('event_id', eventId)
        .order('registration_date', { ascending: true });

      if (error) throw error;
      // This updates the global registrations list, or you might want a separate state for current event's registrations
      set((state) => ({
        registrations: [
          ...state.registrations.filter(reg => reg.event_id !== eventId), // Remove old registrations for this event
          ...(data as EventRegistrationRow[] || []) // Add new ones
        ],
        loadingRegistrations: false
      }));
      return data as EventRegistrationRow[] || [];
    } catch (e: any) {
      set({ error: e.message || 'Failed to fetch registrations', loadingRegistrations: false });
      console.error('Error fetching registrations:', e);
      return [];
    }
  },

  registerTeamForEvent: async (registrationData) => {
    // registrationData should include event_id, team_id, and optionally status
    // registration_date and created_at are usually handled by the database
    try {
      const { data, error } = await supabase
        .from('event_registrations')
        .insert(registrationData)
        .select(registrationSelectQuery)
        .single();

      if (error) throw error;
      // Subscription will handle adding to the store's state if active
      return data as EventRegistrationRow | null;
    } catch (e: any) {
      set({ error: e.message || 'Failed to register team' });
      console.error('Error registering team:', e);
      return null;
    }
  },

  unregisterTeamFromEvent: async (registrationId: string) => {
    try {
      const { error } = await supabase
        .from('event_registrations')
        .delete()
        .eq('id', registrationId);

      if (error) throw error;
      // Subscription will handle removing from the store's state if active
    } catch (e: any) {
      set({ error: e.message || 'Failed to unregister team' });
      console.error('Error unregistering team:', e);
    }
  },

  subscribeToEventRegistrations: (eventId?: string) => {
    const channelName = eventId
      ? `public-event-registrations-${eventId}`
      : 'public-event-registrations-all';

    const filter = eventId ? `event_id=eq.${eventId}` : undefined;

    const channel = supabase
      .channel(channelName)
      .on<EventRegistrationRow>(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'event_registrations', filter },
        (payload: RealtimePostgresChangesPayload<EventRegistrationRow>) => {
          console.log('Event registration change received!', payload);

          // Helper function to get time value safely, handling null
          const getRegistrationDateValue = (reg: EventRegistrationRow): number => {
            return reg.registration_date ? new Date(reg.registration_date).getTime() : 0; // Treat null as beginning
          }


          if (payload.eventType === 'INSERT') {
            set((state) => ({
              registrations: [...state.registrations, payload.new as EventRegistrationRow].sort((a,b) =>
                getRegistrationDateValue(a) - getRegistrationDateValue(b)
              )
            }));
          } else if (payload.eventType === 'UPDATE') {
            set((state) => ({
              registrations: state.registrations.map((reg) =>
                reg.id === (payload.new as EventRegistrationRow).id ? (payload.new as EventRegistrationRow) : reg
              ).sort((a,b) =>
                getRegistrationDateValue(a) - getRegistrationDateValue(b)
              )
            }));
          } else if (payload.eventType === 'DELETE') {
            const oldId = (payload.old as Partial<EventRegistrationRow>)?.id;
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
        } else {
          console.log(`Subscribed to ${channelName} channel with status:`, status);
          // Optionally fetch initial data if subscription is successful
          if (status === 'SUBSCRIBED' && eventId && !get().loadingRegistrations) {
             // Check if registrations for this event are already loaded to avoid redundant fetches
            const hasRegistrationsForEvent = get().registrations.some(reg => reg.event_id === eventId);
            if (!hasRegistrationsForEvent) {
                get().fetchRegistrationsByEventId(eventId);
            }
          }
        }
      });

    return () => {
      supabase.removeChannel(channel);
      console.log(`Unsubscribed from ${channelName} channel`);
    };
  },
}));