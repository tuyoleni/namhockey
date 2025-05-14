// src/components/home/UpcomingMatches.tsx

import React from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet } from 'react-native';
import { useEventStore, EventWithTeams } from 'store/eventStore'; // Adjust import path
import EventItem from '@components/events/EventItem'; // Reuse the EventItem component

const UpcomingMatches: React.FC = () => {
  const { events, loadingEvents, error: eventError } = useEventStore();

  const upcomingEvents = events.filter(event =>
    (event.event_type === 'Match' || event.event_type === 'Tournament') &&
    new Date(event.start_time) > new Date() // Check if start time is in the future
  ).sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()); // Sort by start time

  if (loadingEvents) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text>Loading events...</Text>
      </View>
    );
  }

  if (eventError) {
    return (
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Upcoming Matches & Tournaments</Text>
        <Text style={styles.errorText}>Error loading events: {eventError}</Text>
      </View>
    );
  }

  if (upcomingEvents.length === 0) {
    return (
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Upcoming Matches & Tournaments</Text>
        <Text style={styles.noDataText}>No upcoming matches or tournaments found.</Text>
      </View>
    );
  }

  return (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>Upcoming Matches & Tournaments</Text>
      <FlatList
        data={upcomingEvents}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          // Reuse EventItem for displaying upcoming events
          <EventItem
            event={item}
            // Pass relevant handlers if needed (e.g., for viewing details)
            // onPress={(event) => console.log('Upcoming event pressed:', event.title)}
          />
        )}
         // Disable scrolling within the FlatList if it's nested in a ScrollView
        scrollEnabled={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  sectionContainer: {
    marginBottom: 20,
    backgroundColor: '#fff',
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginHorizontal: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    paddingHorizontal: 5,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
   errorText: {
    color: 'red',
    fontSize: 14,
    textAlign: 'center',
    padding: 10,
  },
  noDataText: {
    fontSize: 14,
    textAlign: 'center',
    color: '#555',
    padding: 10,
  },
});

export default UpcomingMatches;
