// src/components/home/RecentMatches.tsx
import React from 'react';
import { View, Text, FlatList, ActivityIndicator } from 'react-native';
import { useEventStore, EventWithTeams } from 'store/eventStore';
import EventItem from '@components/events/EventItem';
import { minimalStyles } from './minimalStyles';

const RecentMatches: React.FC = () => {
  const { events, loadingEvents, error: eventError } = useEventStore();

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
      <View style={minimalStyles.centered}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={minimalStyles.loadingText}>Loading recent matches...</Text>
      </View>
    );
  }

  if (eventError) {
    return (
      <View style={minimalStyles.contentWrapper}>
        {/* Removed section title here, as it's handled in the modal content */}
        <Text style={minimalStyles.errorText}>Error loading recent matches: {eventError}</Text>
      </View>
    );
  }

  if (recentEvents.length === 0) {
    return (
      <View style={minimalStyles.contentWrapper}>
        <Text style={minimalStyles.noDataText}>No recent completed matches or tournaments found.</Text>
      </View>
    );
  }

  return (
    <View style={minimalStyles.contentWrapper}>
[]      <FlatList
        data={recentEvents}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <EventItem event={item} />}
        scrollEnabled={false} // Disable scrolling within the FlatList
      />
    </View>
  );
};

export default RecentMatches;
