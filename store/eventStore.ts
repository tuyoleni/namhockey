import { create } from 'zustand';
import { supabase } from '@utils/superbase';
import { Tables, TablesInsert, TablesUpdate } from 'types/database.types';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

type EventRow = Tables<'events'>;
export type EventRegistrationRow = Tables<'event_registrations'>;

export type EventWithTeams = EventRow & {
  home_team: Pick<Tables<'teams'>, 'name' | 'logo_url'> | null;
  away_team: Pick<Tables<'teams'>, 'name' | 'logo_url'> | null;
};

interface EventState {
  events: EventWithTeams[];
  registrations: EventRegistrationRow[];
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
  fetchRegistrationsByEventId: (eventId: string) => Promise<EventRegistrationRow[]>;
  registerTeamForEvent: (registrationData: TablesInsert<'event_registrations'>) => Promise<EventRegistrationRow | null>;
  unregisterTeamFromEvent: (registrationId: string) => Promise<void>;
  subscribeToEventRegistrations: (eventId?: string) => () => void;
}

const eventSelectQuery = `
  id, title, description, event_type, start_time, end_time, location_name, location_address, status, home_team_id, away_team_id, home_team_score, away_team_score, created_by_profile_id, created_at, updated_at,
  home_team:teams!events_home_team_id_fkey(name, logo_url),
  away_team:teams!events_away_team_id_fkey(name, logo_url)
`;

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
        throw error;
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
      if (data) {
        const newEvent = data as unknown as EventWithTeams;
        set(state => ({ events: [...state.events, newEvent].sort((a,b) => (a.start_time && b.start_time ? new Date(a.start_time).getTime() - new Date(b.start_time).getTime() : 0))}));
      }
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
      if (data) {
        const updatedEvent = data as unknown as EventWithTeams;
        set(state => ({
          events: state.events.map(evt => evt.id === eventId ? updatedEvent : evt)
                               .sort((a,b) => (a.start_time && b.start_time ? new Date(a.start_time).getTime() - new Date(b.start_time).getTime() : 0)),
        }));
      }
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
      set(state => ({
        events: state.events.filter(evt => evt.id !== eventId)
      }));
    } catch (e: any) {
      set({ error: e.message || 'Failed to delete event', loadingEvents: false });
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
          const fetchEventByIdWithDetails = async (id: string): Promise<EventWithTeams | null> => {
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

          const getEventStartTimeValue = (event: EventWithTeams): number => {
             return event.start_time ? new Date(event.start_time).getTime() : 0;
          };

          if (payload.eventType === 'INSERT') {
            const newEventDetails = await fetchEventByIdWithDetails(payload.new.id);
            if (newEventDetails) {
              set((state) => ({
                events: [...state.events, newEventDetails].sort((a, b) =>
                 getEventStartTimeValue(a) - getEventStartTimeValue(b)
                )
              }));
            }
          } else if (payload.eventType === 'UPDATE') {
            const updatedEventDetails = await fetchEventByIdWithDetails(payload.new.id);
            if (updatedEventDetails) {
              set((state) => ({
                events: state.events.map((event) =>
                  event.id === updatedEventDetails.id ? updatedEventDetails : event
                ).sort((a, b) =>
                 getEventStartTimeValue(a) - getEventStartTimeValue(b)
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
        } else if (status === 'SUBSCRIBED' && get().events.length === 0 && !get().loadingEvents) {
            get().fetchEvents();
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  },

  fetchRegistrationsByEventId: async (eventId: string) => {
    set({ loadingRegistrations: true, error: null });
    try {
      const { data, error } = await supabase
        .from('event_registrations')
        .select(registrationSelectQuery)
        .eq('event_id', eventId)
        .order('registration_date', { ascending: true });

      if (error) throw error;
      set((state) => ({
        registrations: [
          ...state.registrations.filter(reg => reg.event_id !== eventId),
          ...(data as EventRegistrationRow[] || [])
        ].sort((a,b) => (a.registration_date && b.registration_date ? new Date(a.registration_date).getTime() - new Date(b.registration_date).getTime() : 0)),
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
    set({ loadingRegistrations: true, error: null });
    try {
      const { data, error } = await supabase
        .from('event_registrations')
        .insert(registrationData)
        .select(registrationSelectQuery)
        .single();

      set({loadingRegistrations: false});
      if (error) throw error;
      return data as EventRegistrationRow | null;
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
      ? `public-event-registrations-${eventId}`
      : 'public-event-registrations-all';
    const filterString = eventId ? `event_id=eq.${eventId}` : undefined;

    const channel = supabase
      .channel(channelName)
      .on<EventRegistrationRow>(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'event_registrations', filter: filterString },
        (payload: RealtimePostgresChangesPayload<EventRegistrationRow>) => {
          const getRegistrationDateValue = (reg: EventRegistrationRow): number => {
            return reg.registration_date ? new Date(reg.registration_date).getTime() : 0;
          };

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
        } else if (status === 'SUBSCRIBED' && eventId && !get().loadingRegistrations) {
            const hasCurrentEventRegistrations = get().registrations.some(reg => reg.event_id === eventId);
            if (!hasCurrentEventRegistrations) {
                get().fetchRegistrationsByEventId(eventId);
            }
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  },
}));