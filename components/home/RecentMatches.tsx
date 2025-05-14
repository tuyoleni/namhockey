// src/components/home/RecentMatches.tsx

import React from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet } from 'react-native';
import { useEventStore, EventWithTeams } from 'store/eventStore'; // Adjust import path
import EventItem from '@components/events/EventItem'; // Reuse the EventItem component

const RecentMatches: React.FC = () => {
  const { events, loadingEvents, error: eventError } = useEventStore();

  // Filter events to show only recent completed matches/tournaments
  const recentEvents = events.filter(event =>
    event.end_time !== null &&
    (event.event_type === 'Match' || event.event_type === 'Tournament') &&
    new Date(event.end_time) < new Date() && 
    event.status === 'completed'
  ).sort((a, b) => {
    return new Date(b.end_time!).getTime() - new Date(a.end_time!).getTime();
  });

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
        <Text style={styles.sectionTitle}>Recent Matches & Tournaments</Text>
        <Text style={styles.errorText}>Error loading events: {eventError}</Text>
      </View>
    );
  }

  if (recentEvents.length === 0) {
    return (
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Recent Matches & Tournaments</Text>
        <Text style={styles.noDataText}>No recent completed matches or tournaments found.</Text>
      </View>
    );
  }

  return (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>Recent Matches & Tournaments</Text>
      <FlatList
        data={recentEvents}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <EventItem
            event={item}
          />
        )}
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

export default RecentMatches;

