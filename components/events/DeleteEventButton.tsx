import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';
import { useEventStore } from 'store/eventStore';

interface DeleteEventButtonProps {
  eventId: string;
  onSuccess?: () => void;
}

const DeleteEventButton: React.FC<DeleteEventButtonProps> = ({ eventId, onSuccess }) => {
  const { deleteEvent, loadingEvents, error } = useEventStore();

  const handleDelete = async () => {
    Alert.alert(
      'Confirm Deletion',
      'Are you sure you want to delete this event?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteEvent(eventId);
            if (!error) { // Check error from store state after async call
              Alert.alert('Success', 'Event deleted successfully!');
              onSuccess?.(); // Call success callback
            } else {
              Alert.alert('Error', error || 'Failed to delete event.');
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <TouchableOpacity
      onPress={handleDelete}
      style={styles.button}
      disabled={loadingEvents} // Disable button while loading
    >
      <Text style={styles.buttonText}>
        {loadingEvents ? 'Deleting...' : 'Delete Event'}
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

export default DeleteEventButton;
