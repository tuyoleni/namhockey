import React, { useEffect } from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet } from 'react-native';
import EventItem from './EventItem'; // Adjust import path
import { EventWithTeams, useEventStore } from 'store/eventStore';

interface EventListProps {
  onEventPress?: (event: EventWithTeams) => void;
  onDeleteEvent?: (eventId: string) => void;
  onUpdateEvent?: (event: EventWithTeams) => void;
  onViewRegistrations?: (eventId: string) => void;
}

const EventList: React.FC<EventListProps> = ({
  onEventPress,
  onDeleteEvent,
  onUpdateEvent,
  onViewRegistrations,
}) => {
  const { events, loadingEvents, error, fetchEvents, subscribeToEvents } = useEventStore();

  useEffect(() => {
    // Fetch events initially
    fetchEvents();

    // Subscribe to realtime changes
    const unsubscribe = subscribeToEvents();

    // Clean up subscription on component unmount
    return () => {
      unsubscribe();
    };
  }, [fetchEvents, subscribeToEvents]); // Re-run if fetchEvents or subscribeToEvents change (unlikely for zustand actions)

  if (loadingEvents) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator  />
        <Text>Loading...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Error: {error}</Text>
      </View>
    );
  }

  if (events.length === 0) {
    return (
      <View style={styles.centered}>
        <Text>No events found.</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={events}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <EventItem
          event={item}
          onPress={onEventPress}
          onDelete={onDeleteEvent}
          onUpdate={onUpdateEvent}
        />
      )}
      contentContainerStyle={styles.listContent}
    />
  );
};

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: 'red',
    fontSize: 16,
  },
  listContent: {
    paddingBottom: 20, // Add some padding at the bottom
  },
});

export default EventList;
