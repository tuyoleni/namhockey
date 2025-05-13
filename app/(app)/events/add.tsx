import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { supabase } from '@utils/superbase'; // Your Supabase client
import { Tables } from 'types/database.types'; // Your database types
import { useRouter } from 'expo-router';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker'; // For date/time picking


type Team = Pick<Tables<'teams'>, 'id' | 'name'>;

export default function AddEventScreen() {
  const router = useRouter();
  const [eventName, setEventName] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [startTime, setStartTime] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [teams, setTeams] = useState<Team[]>([]);
  const [homeTeamId, setHomeTeamId] = useState<string | null>(null);
  const [awayTeamId, setAwayTeamId] = useState<string | null>(null);

  const [loadingTeams, setLoadingTeams] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    setLoadingTeams(true);
    try {
      const { data, error: supabaseError } = await supabase
        .from('teams')
        .select('id, name')
        .order('name', { ascending: true });

      if (supabaseError) throw supabaseError;
      setTeams(data || []);
    } catch (e: any) {
      setError('Failed to fetch teams: ' + e.message);
      console.error('Error fetching teams:', e);
    } finally {
      setLoadingTeams(false);
    }
  };

  const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    const currentDate = selectedDate || startTime;
    setShowDatePicker(Platform.OS === 'ios'); // Keep open on iOS until done
    setStartTime(currentDate);
  };

  const validateForm = () => {
    if (!eventName.trim()) {
      Alert.alert('Validation Error', 'Event name is required.');
      return false;
    }
    if (!homeTeamId) {
      Alert.alert('Validation Error', 'Please select a home team.');
      return false;
    }
    if (!awayTeamId) {
      Alert.alert('Validation Error', 'Please select an away team.');
      return false;
    }
    if (homeTeamId === awayTeamId) {
      Alert.alert('Validation Error', 'Home and away teams cannot be the same.');
      return false;
    }
    // Add other validations as needed (e.g., start time in future)
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setSubmitting(true);
    setError(null);

    try {
      const eventToInsert: Tables<'events'>['Insert'] = {
        name: eventName,
        start_time: startTime.toISOString(),
        location: location || null,
        description: description || null,
        home_team_id: homeTeamId,
        away_team_id: awayTeamId,
      };

      const { error: insertError } = await supabase
        .from('events')
        .insert(eventToInsert);

      if (insertError) {
        throw insertError;
      }

      Alert.alert('Success', 'Event created successfully!');
      router.back(); // Or navigate to the new event's detail page
    } catch (e: any) {
      setError('Failed to create event: ' + e.message);
      Alert.alert('Error', 'Failed to create event: ' + e.message);
      console.error('Error creating event:', e);
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingTeams) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
        <Text>Loading team data...</Text>
      </View>
    );
  }

  // For team selection, you'd typically use a Picker component.
  // Since @react-native-picker/picker might not be installed,
  // I'll use TextInputs as placeholders. Replace with actual Pickers.
  // Example Picker item: <Picker.Item label="Select Home Team" value={null} />
  // teams.map(team => <Picker.Item key={team.id} label={team.name} value={team.id} />)

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>Create New Event</Text>

      {error && <Text style={styles.errorText}>{error}</Text>}

      <TextInput
        style={styles.input}
        placeholder="Event Name (e.g., Championship Final)"
        value={eventName}
        onChangeText={setEventName}
      />

      <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.dateButton}>
        <Text style={styles.dateButtonText}>Select Start Time: {startTime.toLocaleString()}</Text>
      </TouchableOpacity>
      {showDatePicker && (
        <DateTimePicker
          value={startTime}
          mode="datetime"
          display="default"
          onChange={handleDateChange}
        />
      )}

      <TextInput
        style={styles.input}
        placeholder="Location (e.g., National Stadium)"
        value={location}
        onChangeText={setLocation}
      />
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Description (Optional)"
        value={description}
        onChangeText={setDescription}
        multiline
      />

      <Text style={styles.label}>Home Team:</Text>
      {/* Replace with <Picker selectedValue={homeTeamId} onValueChange={(itemValue) => setHomeTeamId(itemValue)}> */}
      <TextInput style={styles.input} placeholder="Select Home Team ID (Use Picker)" onChangeText={setHomeTeamId} value={homeTeamId || ''} />

      <Text style={styles.label}>Away Team:</Text>
      {/* Replace with <Picker selectedValue={awayTeamId} onValueChange={(itemValue) => setAwayTeamId(itemValue)}> */}
      <TextInput style={styles.input} placeholder="Select Away Team ID (Use Picker)" onChangeText={setAwayTeamId} value={awayTeamId || ''} />


      <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={submitting}>
        {submitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Create Event</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  contentContainer: {
    padding: 20,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#1C1C1E',
  },
  input: {
    backgroundColor: 'white',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    color: '#3C3C43',
  },
  dateButton: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  dateButtonText: {
    fontSize: 16,
    color: '#007AFF',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorText: {
    color: 'red',
    marginBottom: 10,
    textAlign: 'center',
  },
  // Add styles for Picker if you use @react-native-picker/picker
});