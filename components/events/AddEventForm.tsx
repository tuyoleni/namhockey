import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { TablesInsert } from 'types/database.types'; // Adjust import path
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { format } from 'date-fns';
import { useEventStore } from 'store/eventStore';

interface AddEventFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

const AddEventForm: React.FC<AddEventFormProps> = ({ onSuccess, onCancel }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventType, setEventType] = useState(''); // Consider making this a dropdown/picker
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [endTime, setEndTime] = useState<Date | null>(null);
  const [locationName, setLocationName] = useState('');
  const [locationAddress, setLocationAddress] = useState('');
  // Add state for home_team_id and away_team_id - this would likely involve a team picker component
  // For simplicity, we'll omit team selection here, assuming they can be added/updated later.
  // const [homeTeamId, setHomeTeamId] = useState<string | null>(null);
  // const [awayTeamId, setAwayTeamId] = useState<string | null>(null);


  const [isStartTimePickerVisible, setStartTimePickerVisible] = useState(false);
  const [isEndTimePickerVisible, setEndTimePickerVisible] = useState(false);

  const { addEvent, loadingEvents, error } = useEventStore(); // Use loadingEvents from store

  const handleAddEvent = async () => {
    if (!title || !eventType || !startTime || !endTime || !locationName) {
      Alert.alert('Missing Information', 'Please fill in all required fields (Title, Event Type, Start Time, End Time, Location Name)');
      return;
    }

    const newEvent: TablesInsert<'events'> = {
      title,
      description,
      event_type: eventType,
      start_time: startTime.toISOString(), // Supabase expects ISO string
      end_time: endTime.toISOString(),     // Supabase expects ISO string
      location_name: locationName,
      location_address: locationAddress || null, // Allow null
      status: 'scheduled', // Default status
      // home_team_id, // Add if you implement team selection
      // away_team_id, // Add if you implement team selection
      // created_by_profile_id: '...', // You'll need to get the current user's profile ID
    };

    const addedEvent = await addEvent(newEvent);

    if (addedEvent) {
      Alert.alert('Success', 'Event added successfully!');
      // Clear form
      setTitle('');
      setDescription('');
      setEventType('');
      setStartTime(null);
      setEndTime(null);
      setLocationName('');
      setLocationAddress('');
      // setHomeTeamId(null);
      // setAwayTeamId(null);
      onSuccess?.(); // Call success callback
    } else {
      // Error is handled by the store and console.error
      Alert.alert('Error', error || 'Failed to add event.');
    }
  };

  const showStartTimePicker = () => setStartTimePickerVisible(true);
  const hideStartTimePicker = () => setStartTimePickerVisible(false);
  const handleConfirmStartTime = (date: Date) => {
    setStartTime(date);
    hideStartTimePicker();
  };

  const showEndTimePicker = () => setEndTimePickerVisible(true);
  // Corrected declaration and scope for hideEndTimePicker
  const hideEndTimePicker = () => setEndTimePickerVisible(false);
  const handleConfirmEndTime = (date: Date) => {
    setEndTime(date);
    hideEndTimePicker();
  };


  return (
    <ScrollView style={styles.container}>
      <Text style={styles.heading}>Add New Event</Text>

      <TextInput
        style={styles.input}
        placeholder="Title"
        value={title}
        onChangeText={setTitle}
      />
      <TextInput
        style={styles.input}
        placeholder="Description (Optional)"
        value={description}
        onChangeText={setDescription}
        multiline
      />
       <TextInput
        style={styles.input}
        placeholder="Event Type (e.g., Match, Practice)"
        value={eventType}
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
        value={locationName}
        onChangeText={setLocationName}
      />
      <TextInput
        style={styles.input}
        placeholder="Location Address (Optional)"
        value={locationAddress}
        onChangeText={setLocationAddress}
      />

      {/* Team Pickers would go here */}

      <View style={styles.buttonContainer}>
        <Button title="Add Event" onPress={handleAddEvent} disabled={loadingEvents} />
        {onCancel && <Button title="Cancel" onPress={onCancel} color="red" />}
      </View>

      {loadingEvents && <ActivityIndicator size="small" color="#007bff" />}
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

export default AddEventForm;
