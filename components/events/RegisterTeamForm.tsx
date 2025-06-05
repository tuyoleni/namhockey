import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert, ActivityIndicator } from 'react-native';
import { useEventStore } from 'store/eventStore';
import { TablesInsert } from 'database.types';

interface RegisterTeamFormProps {
  eventId: string;
  userId: string;
  userTeams: { id: string, name: string }[];
  onSuccess?: () => void;
  onCancel?: () => void;
}

const RegisterTeamForm: React.FC<RegisterTeamFormProps> = ({ 
  eventId, 
  userId, 
  userTeams, 
  onSuccess, 
  onCancel 
}) => {
  const [teamIdInput, setTeamIdInput] = useState('');
  const [statusInput, setStatusInput] = useState('pending');

  const { registerTeamForEvent, loadingRegistrations, error: storeError } = useEventStore();

  const handleRegisterTeam = async () => {
    if (!teamIdInput.trim()) {
      Alert.alert('Missing Information', 'Please enter or select a Team ID.');
      return;
    }

    const newRegistrationData: TablesInsert<'event_registrations'> = {
      event_id: eventId,
      team_id: teamIdInput.trim(),
      status: statusInput.trim() || 'pending',
    };

    const addedRegistration = await registerTeamForEvent(newRegistrationData);

    if (addedRegistration) {
      Alert.alert('Success', 'Team registered successfully for the event!');
      setTeamIdInput('');
      setStatusInput('pending');
      onSuccess?.();
    } else {
      Alert.alert('Registration Failed', storeError || 'An unknown error occurred. Please try again.');
    }
  };

  return (
    <View className="p-5 bg-white rounded-lg mt-4">
      <Text className="text-xl font-bold mb-2 text-center text-gray-800">Register Team</Text>
      <Text className="text-base text-center mb-5 text-gray-600">Event ID: {eventId}</Text>

      <TextInput
        className="border border-gray-300 p-3 mb-4 rounded-md bg-white text-gray-800"
        placeholder="Enter Team ID"
        value={teamIdInput}
        onChangeText={setTeamIdInput}
        editable={!loadingRegistrations}
      />

      <TextInput
        className="border border-gray-300 p-3 mb-4 rounded-md bg-white text-gray-800"
        placeholder="Status (e.g., pending, confirmed)"
        value={statusInput}
        onChangeText={setStatusInput}
        editable={!loadingRegistrations}
      />

      <View className="mt-5">
        <View className="mb-3">
          <Button 
            title="Register Team" 
            onPress={handleRegisterTeam} 
            disabled={loadingRegistrations} 
            color="#007AFF"
          />
        </View>
        {onCancel && (
          <Button 
            title="Cancel" 
            onPress={onCancel} 
            color="#EF4444" 
            disabled={loadingRegistrations} 
          />
        )}
      </View>

      {loadingRegistrations && <ActivityIndicator size="large" color="#007AFF" className="mt-4" />}
      {storeError && !loadingRegistrations && (
        <Text className="text-red-500 mt-3 text-center text-sm">{storeError}</Text>
      )}
    </View>
  );
};

export default RegisterTeamForm;