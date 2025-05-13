import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Calendar, MapPin, Clock } from 'lucide-react-native';
import { EventWithTeams } from 'store/eventStore';

interface EventItemProps {
  event: EventWithTeams;
  onPress?: (event: EventWithTeams) => void; // Optional handler for item press
  onDelete?: (eventId: string) => void; // Optional handler for delete action
  onUpdate?: (event: EventWithTeams) => void; // Optional handler for update action
  onViewRegistrations?: (eventId: string) => void; // Optional handler to view registrations
}

const EventItem: React.FC<EventItemProps> = ({
  event,
  onPress,
  onDelete,
  onUpdate,
  onViewRegistrations,
}) => {
  // Format dates and times
  const startTime = event.start_time ? new Date(event.start_time).toLocaleString() : 'N/A';
  const endTime = event.end_time ? new Date(event.end_time).toLocaleString() : 'N/A';

  return (
    <TouchableOpacity style={styles.container} onPress={() => onPress?.(event)}>
      <View style={styles.header}>
        <Text style={styles.title}>{event.title}</Text>
        <Text style={styles.eventType}>{event.event_type}</Text>
      </View>

      <View style={styles.details}>
        <View style={styles.detailRow}>
          <Calendar size={16} color="#555" />
          <Text style={styles.detailText}>{startTime} - {endTime}</Text>
        </View>
        <View style={styles.detailRow}>
          <MapPin size={16} color="#555" />
          <Text style={styles.detailText}>{event.location_name || 'Unknown Location'}</Text>
        </View>
        {event.location_address && (
          <Text style={styles.detailText}>{event.location_address}</Text>
        )}
      </View>

      {(event.home_team || event.away_team) && (
        <View style={styles.teamsContainer}>
          {event.home_team && (
            <View style={styles.teamInfo}>
              {event.home_team.logo_url && (
                <Image source={{ uri: event.home_team.logo_url }} style={styles.teamLogo} />
              )}
              <Text style={styles.teamName}>{event.home_team.name || 'Home Team'}</Text>
              {event.home_team_score !== null && (
                 <Text style={styles.score}>{event.home_team_score}</Text>
              )}
            </View>
          )}
          {(event.home_team || event.away_team) && <Text style={styles.vsText}>vs</Text>}
          {event.away_team && (
            <View style={styles.teamInfo}>
               {event.away_team_score !== null && (
                 <Text style={styles.score}>{event.away_team_score}</Text>
              )}
              <Text style={styles.teamName}>{event.away_team.name || 'Away Team'}</Text>
              {event.away_team.logo_url && (
                <Image source={{ uri: event.away_team.logo_url }} style={styles.teamLogo} />
              )}
            </View>
          )}
        </View>
      )}

      {/* Action Buttons (Optional, can be in a modal or context menu) */}
      <View style={styles.actions}>
        {onViewRegistrations && (
          <TouchableOpacity onPress={() => onViewRegistrations(event.id)} style={styles.actionButton}>
            <Text style={styles.actionButtonText}>View Registrations</Text>
          </TouchableOpacity>
        )}
        {onUpdate && (
          <TouchableOpacity onPress={() => onUpdate(event)} style={styles.actionButton}>
            <Text style={styles.actionButtonText}>Edit</Text>
          </TouchableOpacity>
        )}
        {onDelete && (
          <TouchableOpacity onPress={() => onDelete(event.id)} style={[styles.actionButton, styles.deleteButton]}>
            <Text style={styles.actionButtonText}>Delete</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    padding: 15,
    marginVertical: 8,
    marginHorizontal: 16,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1, // Allow title to take space
    marginRight: 10,
  },
  eventType: {
    fontSize: 14,
    color: '#555',
  },
  details: {
    marginBottom: 10,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  detailText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 5,
  },
  teamsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 10,
  },
  teamInfo: {
    alignItems: 'center',
    flex: 1, // Allow teams to take equal space
  },
  teamLogo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginBottom: 5,
  },
  teamName: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  score: {
     fontSize: 18,
     fontWeight: 'bold',
     marginTop: 5,
  },
  vsText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginHorizontal: 10,
    color: '#777',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#007bff',
    borderRadius: 5,
  },
  deleteButton: {
    backgroundColor: '#dc3545',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
  },
});

export default EventItem;
