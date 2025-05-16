// src/components/home/UpcomingMatches.tsx
import React from 'react';
import { View, Text, FlatList, ActivityIndicator } from 'react-native';
import { useEventStore, EventWithTeams } from 'store/eventStore';
import EventItem from '@components/events/EventItem';
import { minimalStyles } from './minimalStyles';

const UpcomingMatches: React.FC = () => {
  const { events, loadingEvents, error: eventError } = useEventStore();

  const upcomingEvents = events.filter(event =>
    (event.event_type === 'Match' || event.event_type === 'Tournament') &&
    new Date(event.start_time) > new Date()
  ).sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

  if (loadingEvents) {
    return (
      <View style={minimalStyles.centered}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={minimalStyles.loadingText}>Loading upcoming matches...</Text>
      </View>
    );
  }

  if (eventError) {
    return (
      <View style={minimalStyles.contentWrapper}>
        {/* Removed section title here, as it's handled in the modal content */}
        <Text style={minimalStyles.errorText}>Error loading upcoming matches: {eventError}</Text>
      </View>
    );
  }

  if (upcomingEvents.length === 0) {
    return (
      <View style={minimalStyles.contentWrapper}>
        {/* Removed section title here */}
        <Text style={minimalStyles.noDataText}>No upcoming matches or tournaments found.</Text>
      </View>
    );
  }

  return (
    <View style={minimalStyles.contentWrapper}>
      {/* Removed section title here */}
      <FlatList
        data={upcomingEvents}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <EventItem event={item} />}
        scrollEnabled={false} // Disable scrolling within the FlatList
      />
    </View>
  );
};

export default UpcomingMatches;
