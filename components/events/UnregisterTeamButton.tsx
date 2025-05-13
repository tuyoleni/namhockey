import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';
import { useEventStore } from 'store/eventStore';

interface UnregisterTeamButtonProps {
  registrationId: string;
  onSuccess?: () => void; // Optional callback on successful unregistration
}

const UnregisterTeamButton: React.FC<UnregisterTeamButtonProps> = ({ registrationId, onSuccess }) => {
  const { unregisterTeamFromEvent, loadingRegistrations, error } = useEventStore(); // Use loadingRegistrations from store

  const handleUnregister = async () => {
    Alert.alert(
      'Confirm Unregistration',
      'Are you sure you want to unregister this team?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Unregister',
          style: 'destructive',
          onPress: async () => {
            await unregisterTeamFromEvent(registrationId);
             if (!error) { // Check error from store state after async call
              Alert.alert('Success', 'Team unregistered successfully!');
              onSuccess?.(); // Call success callback
            } else {
              Alert.alert('Error', error || 'Failed to unregister team.');
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <TouchableOpacity
      onPress={handleUnregister}
      style={styles.button}
      disabled={loadingRegistrations} // Disable button while loading
    >
      <Text style={styles.buttonText}>
         {loadingRegistrations ? 'Unregistering...' : 'Unregister Team'}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#dc3545',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
});

export default UnregisterTeamButton;
