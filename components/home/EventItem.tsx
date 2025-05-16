// src/components/events/EventItem.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { EventWithTeams } from 'store/eventStore'; // Assuming this type is defined in your store

interface EventItemProps {
  event: EventWithTeams;
  // Optional: Add an onPress handler if you want items to be clickable
  // onPress?: (event: EventWithTeams) => void;
}

const EventItem: React.FC<EventItemProps> = ({ event /*, onPress */ }) => {
  // const handlePress = () => {
  //   if (onPress) {
  //     onPress(event);
  //   }
  // };

  return (
    // <TouchableOpacity onPress={handlePress}> {/* Wrap with TouchableOpacity if items are clickable */}
      <View style={styles.container}>
        <Text style={styles.title}>{event.title}</Text>
        <Text style={styles.location}>{event.location_name}</Text>
        {event.home_team || event.away_team ? (
          <View style={styles.teams}>
            {event.home_team && <Text style={styles.teamName}>{event.home_team.name}</Text>}
            {(event.home_team || event.away_team) && <Text style={styles.vsText}>vs</Text>}
            {event.away_team && <Text style={styles.teamName}>{event.away_team.name}</Text>}
            {(event.home_team_score !== null || event.away_team_score !== null) && (
              <Text style={styles.score}>
                {event.home_team_score !== null ? event.home_team_score : '-'} - {event.away_team_score !== null ? event.away_team_score : '-'}
              </Text>
            )}
          </View>
        ) : null}
        <Text style={styles.time}>
          {event.start_time ? `Starts: ${new Date(event.start_time).toLocaleString()}` : 'Time: N/A'}
        </Text>
        {event.end_time && event.status === 'completed' && (
             <Text style={styles.time}>
                Ended: {new Date(event.end_time).toLocaleString()}
             </Text>
        )}
        <Text style={styles.status}>Status: {event.status}</Text>
      </View>
    // </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
  },
  location: {
    fontSize: 14,
    color: '#555',
    marginBottom: 5,
  },
  teams: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  teamName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1a1a1a',
  },
  vsText: {
    fontSize: 14,
    color: '#777',
    marginHorizontal: 5,
  },
  score: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#007bff',
    marginLeft: 10,
  },
  time: {
    fontSize: 12,
    color: '#777',
    marginBottom: 2,
  },
  status: {
      fontSize: 12,
      color: '#777',
  }
});

export default EventItem;
