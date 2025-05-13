import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, SafeAreaView } from 'react-native';
import { supabase } from '@utils/superbase'; // Assuming supabase client is here
import { Tables } from 'types/database.types'; // Import your database types
// import { EventCard } from '@components/cards/EventCard'; // We are replacing this
import { RegistrableEventCard } from '@components/cards/RegistrableEventCard'; // Import the new card
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

// Define the type for an event, including related team data
type EventWithTeams = Tables<'events'> & {
  home_team: Pick<Tables<'teams'>, 'name' | 'logo_url'> | null;
  away_team: Pick<Tables<'teams'>, 'name' | 'logo_url'> | null;
  // Add other fields from 'events' table if needed by RegistrableEventCard
  // e.g., location, description
};

export default function EventsScreen() {
  const [events, setEvents] = useState<EventWithTeams[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: supabaseError } = await supabase
        .from('events')
        .select(`
          *, 
          location, 
          description, 
          home_team:teams!events_home_team_id_fkey(name, logo_url),
          away_team:teams!events_away_team_id_fkey(name, logo_url)
        `) // Ensure you select all fields needed by RegistrableEventCard
        .order('start_time', { ascending: true });

      if (supabaseError) {
        throw supabaseError;
      }
      setEvents(data as EventWithTeams[] || []);
    } catch (e: any) {
      setError(e.message || 'Failed to fetch events');
      console.error('Error fetching events:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddEvent = () => {
    // Navigate to an Add Event screen
    router.push('/events/add');
  };

  const handleRegisterForEvent = (eventId: string) => {
    // Logic to navigate to a team registration screen for this event
    // or open a registration modal.
    console.log('Register for event:', eventId);
    // Example: router.push(`/events/${eventId}/register`);
    // Or: router.push({ pathname: '/teams/select', params: { eventId: eventId } });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading Events...</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={styles.errorText}>Error: {error}</Text>
        <TouchableOpacity style={styles.button} onPress={fetchEvents}>
          <Text style={styles.buttonText}>Try Again</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Text style={styles.title}>Register for Events</Text> {/* Updated title */}
        <TouchableOpacity style={styles.addButton} onPress={handleAddEvent}>
          <Ionicons name="add-circle-outline" size={28} color="#007AFF" />
        </TouchableOpacity>
      </View>
      {events.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>No upcoming events found.</Text>
          <TouchableOpacity style={styles.button} onPress={fetchEvents}>
            <Text style={styles.buttonText}>Refresh</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={events}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.cardContainer}>
              <RegistrableEventCard
                eventName={item.name || 'Unnamed Event'}
                startTime={item.start_time}
                location={item.location}
                description={item.description}
                homeTeamName={item.home_team?.name}
                homeTeamLogo={item.home_team?.logo_url}
                awayTeamName={item.away_team?.name}
                awayTeamLogo={item.away_team?.logo_url}
                onRegisterPress={() => handleRegisterForEvent(item.id)}
              />
            </View>
          )}
          contentContainerStyle={styles.listContentContainer}
          onRefresh={fetchEvents}
          refreshing={loading}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7', // Light gray background
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1C1C1E', // Darker text
  },
  addButton: {
    padding: 8,
  },
  listContentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  cardContainer: {
    marginBottom: 16,
    // alignItems: 'center', // Card will likely be full width, so center might not be needed
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#6C6C6E',
  },
  errorText: {
    fontSize: 16,
    color: 'red',
    textAlign: 'center',
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#6C6C6E',
    textAlign: 'center',
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});