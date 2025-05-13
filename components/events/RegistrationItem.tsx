import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Tables } from 'types/database.types'; // Adjust import path

type EventRegistrationRow = Tables<'event_registrations'>;

interface RegistrationItemProps {
  registration: EventRegistrationRow;
  // You might want to fetch and display team name based on registration.team_id
  // For simplicity, we'll just show the team_id for now.
  // Add a prop like `teamName: string | null;` if you fetch team data.
  onUnregister?: (registrationId: string) => void; // Optional handler for unregister action
}

const RegistrationItem: React.FC<RegistrationItemProps> = ({ registration, onUnregister }) => {
  // Format registration date
  const registrationDate = registration.registration_date
    ? new Date(registration.registration_date).toLocaleString()
    : 'N/A';

  return (
    <View style={styles.container}>
      <View style={styles.details}>
        {/* Displaying team_id - ideally, fetch and show team name */}
        <Text style={styles.teamIdText}>Team ID: {registration.team_id}</Text>
        <Text style={styles.dateText}>Registered On: {registrationDate}</Text>
        <Text style={styles.statusText}>Status: {registration.status}</Text>
      </View>

      {onUnregister && (
        <TouchableOpacity onPress={() => onUnregister(registration.id)} style={styles.unregisterButton}>
          <Text style={styles.unregisterButtonText}>Unregister</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f8f9fa',
    padding: 10,
    marginVertical: 5,
    marginHorizontal: 10,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  details: {
    flex: 1, // Allow details to take up available space
    marginRight: 10,
  },
  teamIdText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 3,
  },
  dateText: {
    fontSize: 12,
    color: '#555',
  },
  statusText: {
    fontSize: 12,
    color: '#555',
  },
  unregisterButton: {
    backgroundColor: '#dc3545',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  unregisterButtonText: {
    color: '#fff',
    fontSize: 12,
  },
});

export default RegistrationItem;
