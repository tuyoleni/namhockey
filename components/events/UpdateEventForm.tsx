import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { TablesUpdate } from 'types/database.types'; // Adjust import path
import DateTimePickerModal from "react-native-modal-datetime-picker"; // You'll need to install this
import { format } from 'date-fns'; // You'll need to install this
import { EventWithTeams, useEventStore } from 'store/eventStore';

interface UpdateEventFormProps {
  event: EventWithTeams; // The event to update
  onSuccess?: () => void; // Optional callback on successful update
  onCancel?: () => void; // Optional callback on cancel
}

const UpdateEventForm: React.FC<UpdateEventFormProps> = ({ event, onSuccess, onCancel }) => {
  const [title, setTitle] = useState(event.title);
  const [description, setDescription] = useState(event.description || '');
  const [eventType, setEventType] = useState(event.event_type);
  const [startTime, setStartTime] = useState<Date | null>(event.start_time ? new Date(event.start_time) : null);
  const [endTime, setEndTime] = useState<Date | null>(event.end_time ? new Date(event.end_time) : null);
  const [locationName, setLocationName] = useState(event.location_name || '');
  const [locationAddress, setLocationAddress] = useState(event.location_address || '');
  const [homeTeamScore, setHomeTeamScore] = useState<string>(event.home_team_score !== null ? String(event.home_team_score) : '');
  const [awayTeamScore, setAwayTeamScore] = useState<string>(event.away_team_score !== null ? String(event.away_team_score) : '');
  const [status, setStatus] = useState(event.status); // Consider making this a dropdown/picker

  const [isStartTimePickerVisible, setStartTimePickerVisible] = useState(false);
  const [isEndTimePickerVisible, setEndTimePickerVisible] = useState(false);

  const { updateEvent, loadingEvents, error } = useEventStore(); // Use loadingEvents from store

  // Effect to update form state if the event prop changes (e.g., when selecting a different event)
  useEffect(() => {
    setTitle(event.title);
    setDescription(event.description || '');
    setEventType(event.event_type);
    setStartTime(event.start_time ? new Date(event.start_time) : null);
    setEndTime(event.end_time ? new Date(event.end_time) : null);
    setLocationName(event.location_name || '');
    setLocationAddress(event.location_address || '');
    setHomeTeamScore(event.home_team_score !== null ? String(event.home_team_score) : '');
    setAwayTeamScore(event.away_team_score !== null ? String(event.away_team_score) : '');
    setStatus(event.status);
  }, [event]);


  const handleUpdateEvent = async () => {
    if (!title || !eventType || !startTime || !endTime || !locationName) {
      Alert.alert('Missing Information', 'Please fill in all required fields (Title, Event Type, Start Time, End Time, Location Name)');
      return;
    }

    const updatedEventData: TablesUpdate<'events'> = {
      title,
      description: description || null,
      event_type: eventType,
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      location_name: locationName,
      location_address: locationAddress || null,
      home_team_score: homeTeamScore === '' ? null : parseInt(homeTeamScore, 10),
      away_team_score: awayTeamScore === '' ? null : parseInt(awayTeamScore, 10),
      status: status,
      // home_team_id and away_team_id updates would go here if you implement team selection
    };

    const updatedEvent = await updateEvent(event.id, updatedEventData);

    if (updatedEvent) {
      Alert.alert('Success', 'Event updated successfully!');
      onSuccess?.(); // Call success callback
    } else {
      // Error is handled by the store and console.error
      Alert.alert('Error', error || 'Failed to update event.');
    }
  };

  const showStartTimePicker = () => setStartTimePickerVisible(true);
  const hideStartTimePicker = () => setStartTimePickerVisible(false);
  const handleConfirmStartTime = (date: Date) => {
    setStartTime(date);
    hideStartTimePicker();
  };

  const showEndTimePicker = () => setEndTimePickerVisible(true);
  const hideEndTimePicker = () => setEndTimePickerVisible(false);
  const handleConfirmEndTime = (date: Date) => {
    setEndTime(date);
    hideEndTimePicker();
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.heading}>Update Event</Text>

      <TextInput
        style={styles.input}
        placeholder="Title"
        value={title ?? ''} // Use nullish coalescing
        onChangeText={setTitle}
      />
      <TextInput
        style={styles.input}
        placeholder="Description (Optional)"
        value={description ?? ''} // Use nullish coalescing
        onChangeText={setDescription}
        multiline
      />
       <TextInput
        style={styles.input}
        placeholder="Event Type"
        value={eventType ?? ''} // Use nullish coalescing
        onChangeText={setEventType}
      />

       {/* Date/Time Pickers */}
      <View style={styles.dateTimeContainer}>
        <TouchableOpacity onPress={showStartTimePicker} style={styles.dateTimeButton}>
          <Text>{startTime ? format(startTime, 'yyyy-MM-dd HH:mm') : 'Select Start Time'}</Text>
        </TouchableOpacity>
        <DateTimePickerModal
          isVisible={isStartTimePickerVisible}
          mode="datetime"
          onConfirm={handleConfirmStartTime}
          onCancel={hideStartTimePicker}
        />
         <TouchableOpacity onPress={showEndTimePicker} style={styles.dateTimeButton}>
          <Text>{endTime ? format(endTime, 'yyyy-MM-dd HH:mm') : 'Select End Time'}</Text>
        </TouchableOpacity>
        <DateTimePickerModal
          isVisible={isEndTimePickerVisible}
          mode="datetime"
          onConfirm={handleConfirmEndTime}
          onCancel={hideEndTimePicker}
        />
      </View>

      <TextInput
        style={styles.input}
        placeholder="Location Name"
        value={locationName ?? ''} // Use nullish coalescing
        onChangeText={setLocationName}
      />
      <TextInput
        style={styles.input}
        placeholder="Location Address (Optional)"
        value={locationAddress ?? ''} // Use nullish coalescing
        onChangeText={setLocationAddress}
      />

      {/* Score Inputs */}
      <View style={styles.scoreContainer}>
         <TextInput
            style={[styles.input, styles.scoreInput]}
            placeholder="Home Score"
            value={homeTeamScore ?? ''} // Use nullish coalescing
            onChangeText={setHomeTeamScore}
            keyboardType="numeric"
         />
         <TextInput
            style={[styles.input, styles.scoreInput]}
            placeholder="Away Score"
            value={awayTeamScore ?? ''} // Use nullish coalescing
            onChangeText={setAwayTeamScore}
            keyboardType="numeric"
         />
      </View>


      {/* Status Picker would go here */}
       <TextInput
        style={styles.input}
        placeholder="Status (e.g., scheduled, completed)"
        value={status ?? ''} // Use nullish coalescing
        onChangeText={setStatus}
      />


      {/* Team Pickers would go here */}

      <View style={styles.buttonContainer}>
        <Button title="Update Event" onPress={handleUpdateEvent} disabled={loadingEvents} />
        {onCancel && <Button title="Cancel" onPress={onCancel} color="red" />}
      </View>


      {loadingEvents && <ActivityIndicator/>}
      {error && <Text style={styles.errorText}>{error}</Text>}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  heading: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginBottom: 15,
    borderRadius: 5,
  },
   dateTimeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  dateTimeButton: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 5,
    flex: 1,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  scoreContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  scoreInput: {
    flex: 1,
    marginHorizontal: 5,
    textAlign: 'center',
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

export default UpdateEventForm;
