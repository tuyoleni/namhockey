import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useEventStore } from 'store/eventStore';
import { TablesInsert } from 'types/database.types';

interface RegisterTeamFormProps {
  eventId: string; // The event to register the team for
  onSuccess?: () => void; // Optional callback on successful registration
  onCancel?: () => void; // Optional callback on cancel
}

const RegisterTeamForm: React.FC<RegisterTeamFormProps> = ({ eventId, onSuccess, onCancel }) => {
  const [teamId, setTeamId] = useState(''); // Input for team ID - ideally, this would be a team picker
  const [status, setStatus] = useState('pending'); // Default status - consider a picker

  const { registerTeamForEvent, loadingRegistrations, error } = useEventStore(); // Use loadingRegistrations from store

  const handleRegisterTeam = async () => {
    if (!teamId) {
      Alert.alert('Missing Information', 'Please enter a Team ID.');
      return;
    }

    const newRegistration: TablesInsert<'event_registrations'> = {
      event_id: eventId,
      team_id: teamId, // Use the input value
      status: status,
      // registration_date and created_at are handled by the database
    };

    const addedRegistration = await registerTeamForEvent(newRegistration);

    if (addedRegistration) {
      Alert.alert('Success', 'Team registered successfully!');
      setTeamId(''); // Clear form
      setStatus('pending');
      onSuccess?.(); // Call success callback
    } else {
      // Error is handled by the store and console.error
      Alert.alert('Error', error || 'Failed to register team.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Register Team for Event</Text>
      <Text style={styles.eventIdText}>Event ID: {eventId}</Text>

      <TextInput
        style={styles.input}
        placeholder="Team ID" // Replace with a team picker component
        value={teamId}
        onChangeText={setTeamId}
      />

      {/* Status Picker would go here */}
       <TextInput
        style={styles.input}
        placeholder="Status (e.g., pending, confirmed)"
        value={status}
        onChangeText={setStatus}
      />

      <View style={styles.buttonContainer}>
         <Button title="Register Team" onPress={handleRegisterTeam} disabled={loadingRegistrations} />
         {onCancel && <Button title="Cancel" onPress={onCancel} color="red" />}
      </View>


      {loadingRegistrations && <ActivityIndicator size="small" color="#007bff" />}
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  heading: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  eventIdText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: '#555',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginBottom: 15,
    borderRadius: 5,
  },
   buttonContainer: {
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  errorText: {
    color: 'red',
    marginTop: 10,
    textAlign: 'center',
  },
});

export default RegisterTeamForm;
