import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, Alert, Button, StyleSheet } from 'react-native';
import { useLocalSearchParams, useNavigation, Stack } from 'expo-router';
import { useEventStore, EventWithTeams } from 'store/eventStore';
import { useUserStore } from 'store/userStore';
import { useTeamStore } from 'store/teamStore';
import RegisterTeamForm from '@components/events/RegisterTeamForm';
import RegistrationList from '@components/events/RegistrationList';
import EventItem from '@components/events/EventItem'; // To display event details

const EventDetailScreen = () => {
  const { id: eventId } = useLocalSearchParams<{ id: string }>();
  const navigation = useNavigation();
  const { getEventById, loadingEvents, error: eventError } = useEventStore();
  const { authUser, loading: loadingUser } = useUserStore();
  const { userTeams, fetchUserTeams, loading: loadingTeams } = useTeamStore();

  const [event, setEvent] = useState<EventWithTeams | null>(null);
  const [showRegisterForm, setShowRegisterForm] = useState(false);

  useEffect(() => {
    if (eventId) {
      const fetchEvent = async () => {
        const fetchedEvent = await getEventById(eventId);
        if (fetchedEvent) {
          setEvent(fetchedEvent);
        } else {
          Alert.alert('Error', 'Event not found.');
          if (navigation.canGoBack()) {
            navigation.goBack();
          }
        }
      };
      fetchEvent();
    }
  }, [eventId, getEventById, navigation]);

  useEffect(() => {
    if (authUser) {
      fetchUserTeams(authUser.id);
    }
  }, [authUser, fetchUserTeams]);

  if (loadingEvents || loadingUser || loadingTeams || !event) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (eventError) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Error loading event: {eventError}</Text>
      </View>
    );
  }

  const handleRegisterSuccess = () => {
    setShowRegisterForm(false);
    // Optionally, refresh registrations or event data
    if (eventId) {
        getEventById(eventId).then(setEvent); // Re-fetch to update team counts etc.
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Stack.Screen options={{ title: event?.title || 'Event Details' }} />
      
      {/* Display Event Details using a simplified EventItem or custom layout */}
      {/* For now, let's re-use EventItem for simplicity, but you might want a dedicated detail view */}
      <EventItem event={event} />

      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Register Your Team</Text>
        {authUser ? (
          <Button 
            title={showRegisterForm ? "Cancel Registration" : "Register a Team"} 
            onPress={() => setShowRegisterForm(!showRegisterForm)} 
          />
        ) : (
          <Text>Please log in to register a team.</Text>
        )}
        {showRegisterForm && eventId && (
          <RegisterTeamForm 
            eventId={eventId} 
            userId={authUser!.id} 
            userTeams={userTeams} 
            onSuccess={handleRegisterSuccess} 
            onCancel={() => setShowRegisterForm(false)}
          />
        )}
      </View>

      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Participating Teams</Text>
        {eventId ? (
          <RegistrationList eventId={eventId} />
        ) : (
          <Text>Loading registrations...</Text>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f0f0',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: 'red',
    fontSize: 16,
  },
  sectionContainer: {
    backgroundColor: 'white',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
});

export default EventDetailScreen;