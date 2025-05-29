import React, { useEffect } from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet } from 'react-native';
import RegistrationItem from './RegistrationItem';
import { useEventStore } from 'store/eventStore';
import { Tables } from 'types/database.types';

type EventRegistrationRow = Tables<'event_registrations'>;

interface RegistrationListProps {
  eventId: string;
}

const RegistrationList: React.FC<RegistrationListProps> = ({ eventId }) => {
  const {
    registrations,
    loadingRegistrations,
    error,
    fetchRegistrationsByEventId,
    subscribeToEventRegistrations,
    unregisterTeamFromEvent,  // Add this line
  } = useEventStore();

  const eventRegistrations = registrations.filter(reg => reg.event_id === eventId);

  useEffect(() => {
    // Fetch registrations for this specific event
    fetchRegistrationsByEventId(eventId);

    // Subscribe to real-time updates
    const unsubscribe = subscribeToEventRegistrations(eventId);

    // Clean up subscription when component unmounts or eventId changes
    return () => {
      unsubscribe();
    };
  }, [eventId, fetchRegistrationsByEventId, subscribeToEventRegistrations]);

  const handleUnregister = async (registrationId: string) => {
    await unregisterTeamFromEvent(registrationId);
    // The store's subscription will handle removing the item from the list
  };


  if (loadingRegistrations) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator />
        <Text>Loading registrations...</Text>
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

  if (eventRegistrations.length === 0) {
    return (
      <View style={styles.centered}>
        <Text>No registrations for this event yet.</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={eventRegistrations}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <RegistrationItem
          registration={item}
          onUnregister={handleUnregister}
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

export default RegistrationList;
