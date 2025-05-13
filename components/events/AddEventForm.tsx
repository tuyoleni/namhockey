import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Alert,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { format } from 'date-fns';
import { useEventStore } from 'store/eventStore';
import { useTeamStore } from 'store/teamStore';
import { TablesInsert, Tables } from 'types/database.types';
import { ChevronDown, Calendar, Clock, Users, ArrowLeft } from 'lucide-react-native';

type TeamRow = Tables<'teams'>;
const eventTypes = ['Match', 'Practice', 'Tournament', 'Meeting', 'Other'];

interface AddEventFormProps {
  currentUserId: string;
  onSuccess?: () => void;
  // Assuming this component is presented in a modal that the parent controls
  // We don't need an onCancel prop here if navigation.goBack handles closing
}

const AddEventForm: React.FC<AddEventFormProps> = ({ currentUserId, onSuccess }) => {
  const navigation = useNavigation();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedEventType, setSelectedEventType] = useState('');
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [endTime, setEndTime] = useState<Date | null>(null);
  const [locationName, setLocationName] = useState('');
  const [locationAddress, setLocationAddress] = useState('');
  const [selectedHomeTeam, setSelectedHomeTeam] = useState<TeamRow | null>(null);
  const [selectedAwayTeam, setSelectedAwayTeam] = useState<TeamRow | null>(null);

  const [isStartTimePickerVisible, setStartTimePickerVisible] = useState(false);
  const [isEndTimePickerVisible, setEndTimePickerVisible] = useState(false);
  const [isEventTypePickerVisible, setEventTypePickerVisible] = useState(false);
  const [isTeamPickerVisible, setTeamPickerVisible] = useState(false);
  const [selectingTeamType, setSelectingTeamType] = useState<'home' | 'away' | null>(null);

  const { addEvent, loadingEvents, error: eventError } = useEventStore();
  const { teams, loadingTeams, error: teamError, fetchTeams, subscribeToTeams } = useTeamStore();

  useEffect(() => {
    fetchTeams();
    const unsubscribe = subscribeToTeams();
    return () => unsubscribe();
  }, [fetchTeams, subscribeToTeams]);

  useEffect(() => {
    if (selectedEventType !== 'Match') {
      setSelectedHomeTeam(null);
      setSelectedAwayTeam(null);
    }
  }, [selectedEventType]);

  const handleAddEvent = async () => {
    if (!title || !selectedEventType || !startTime || !endTime || !locationName) {
      Alert.alert('Missing Information', 'Please fill in all required fields.');
      return;
    }

    if (selectedEventType === 'Match') {
      if (!selectedHomeTeam || !selectedAwayTeam) {
         Alert.alert('Missing Information', 'Please select both Home and Away teams for a Match event.');
         return;
      }
      if (selectedHomeTeam.id === selectedAwayTeam.id) {
        Alert.alert('Invalid Selection', 'Home and Away teams cannot be the same.');
        return;
      }
    }

    const newEvent: TablesInsert<'events'> = {
      title,
      description: description || null,
      event_type: selectedEventType,
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      location_name: locationName,
      location_address: locationAddress || null,
      status: 'scheduled',
      home_team_id: selectedHomeTeam?.id || null,
      away_team_id: selectedAwayTeam?.id || null,
      created_by_profile_id: currentUserId,
    };

    const added = await addEvent(newEvent);
    if (added) {
      resetForm();
      onSuccess?.();
      // Assuming this component is presented in a modal, navigation.goBack() closes it
      navigation.goBack();
    } else {
        Alert.alert('Error', eventError || 'Failed to add event.');
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setSelectedEventType('');
    setStartTime(null);
    setEndTime(null);
    setLocationName('');
    setLocationAddress('');
    setSelectedHomeTeam(null);
    setSelectedAwayTeam(null);
  };

  // Date/Time Picker Handlers
  const handleConfirmStartTime = (date: Date) => {
    setStartTime(date);
    setStartTimePickerVisible(false);
  };

  const handleConfirmEndTime = (date: Date) => {
    setEndTime(date);
    setEndTimePickerVisible(false);
  };

  // Event Type Picker Handlers
  const handleSelectEventType = (type: string) => {
    setSelectedEventType(type);
    setEventTypePickerVisible(false);
  };

  // Team Picker Handlers
  const handleSelectTeam = (team: TeamRow) => {
    if (selectingTeamType === 'home') {
      setSelectedHomeTeam(team);
    } else if (selectingTeamType === 'away') {
      setSelectedAwayTeam(team);
    }
    setTeamPickerVisible(false);
    setSelectingTeamType(null);
  };


  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-white" // Background white for the bottom sheet content
    >
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 border-b border-gray-200">
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color="#007aff" />
        </TouchableOpacity>
        <Text className="ml-4 text-lg font-semibold text-black">Add New Event</Text>
      </View>

      {/* Scrollable Inputs */}
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 150 }}>
        {[
          { value: title, onChange: setTitle, placeholder: 'Title' },
          { value: description, onChange: setDescription, placeholder: 'Description (Optional)', multiline: true },
          { value: locationName, onChange: setLocationName, placeholder: 'Location Name' },
          { value: locationAddress, onChange: setLocationAddress, placeholder: 'Location Address (Optional)' },
        ].map((field, idx) => (
          <View key={idx} className="bg-gray-100 rounded-xl px-4 py-3 mb-3">
            <TextInput
              placeholder={field.placeholder}
              placeholderTextColor="#8e8e93"
              className="text-base text-black"
              value={field.value}
              onChangeText={field.onChange}
              multiline={field.multiline}
              style={{ minHeight: field.multiline ? 80 : undefined }} // Keep inline style for minHeight
            />
          </View>
        ))}

        {/* Event Type */}
        <TouchableOpacity onPress={() => setEventTypePickerVisible(true)} className="bg-gray-100 rounded-xl px-4 py-3 mb-3 flex-row justify-between items-center">
          <Text className={selectedEventType ? 'text-black' : 'text-gray-500'}>
            {selectedEventType || 'Select Event Type'}
          </Text>
          <ChevronDown size={20} color="#8e8e93" />
        </TouchableOpacity>
      </ScrollView>

      {/* Sticky Footer */}
      <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 pt-3 pb-6">
        {/* Time pickers */}
        <View className="flex-row mb-3 gap-2">
          <TouchableOpacity
            onPress={() => setStartTimePickerVisible(true)}
            className="flex-1 bg-gray-100 rounded-xl px-4 py-3 flex-row items-center"
          >
            <Calendar size={18} color="#007aff" />
            <Text className="ml-2 text-blue-600">
              {startTime ? format(startTime, 'MMM d, HH:mm') : 'Start Time'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setEndTimePickerVisible(true)}
            className="flex-1 bg-gray-100 rounded-xl px-4 py-3 flex-row items-center"
          >
            <Clock size={18} color="#007aff" />
            <Text className="ml-2 text-blue-600">
              {endTime ? format(endTime, 'MMM d, HH:mm') : 'End Time'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Team selection */}
        {selectedEventType === 'Match' && (
          <View className="flex-row mb-3 gap-2">
            {[
              { label: selectedHomeTeam?.name || 'Home', onPress: () => { setTeamPickerVisible(true); setSelectingTeamType('home'); } },
              { label: selectedAwayTeam?.name || 'Away', onPress: () => { setTeamPickerVisible(true); setSelectingTeamType('away'); } },
            ].map((team, idx) => (
              <TouchableOpacity
                key={idx}
                className="flex-1 bg-gray-100 rounded-xl px-4 py-3 flex-row items-center justify-between"
                onPress={team.onPress}
              >
                <View className="flex-row items-center">
                  <Users size={18} color="#007aff" />
                  <Text className="ml-2 text-black">{team.label}</Text>
                </View>
                <ChevronDown size={16} color="#8e8e93" />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Add Event button */}
        <TouchableOpacity
          className="bg-blue-600 rounded-xl py-4 items-center"
          onPress={handleAddEvent}
          disabled={loadingEvents || loadingTeams}
        >
          {loadingEvents || loadingTeams ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white text-base font-semibold">Add Event</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Modals (for pickers) */}
      <DateTimePickerModal
        isVisible={isStartTimePickerVisible}
        mode="datetime"
        onConfirm={handleConfirmStartTime}
        onCancel={() => setStartTimePickerVisible(false)}
      />

      <DateTimePickerModal
        isVisible={isEndTimePickerVisible}
        mode="datetime"
        onConfirm={handleConfirmEndTime}
        onCancel={() => setEndTimePickerVisible(false)}
      />

      {/* Event Type Picker Modal (Bottom Sheet style) */}
      <Modal visible={isEventTypePickerVisible} animationType="slide" transparent onRequestClose={() => setEventTypePickerVisible(false)}>
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-xl p-5 w-full"> {/* w-full for bottom sheet width */}
            <Text className="text-xl font-bold text-center mb-4">Select Event Type</Text>
            <FlatList
              data={eventTypes}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity className="py-4 items-center" onPress={() => handleSelectEventType(item)}>
                  <Text className="text-blue-600 text-lg">{item}</Text>
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View className="h-px bg-gray-200 mx-3" />}
            />
            <TouchableOpacity className="mt-4 py-4 items-center bg-gray-100 rounded-xl" onPress={() => setEventTypePickerVisible(false)}>
              <Text className="text-blue-600 font-semibold">Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Team Picker Modal (Bottom Sheet style) */}
      <Modal visible={isTeamPickerVisible} animationType="slide" transparent onRequestClose={() => setTeamPickerVisible(false)}>
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-xl p-5 w-full"> {/* w-full for bottom sheet width */}
            <Text className="text-xl font-bold text-center mb-4">Select {selectingTeamType === 'home' ? 'Home' : 'Away'} Team</Text>
            {loadingTeams ? (
                <ActivityIndicator size="large" color="#007bff" className="my-5"/>
            ) : teamError ? (
                <Text className="text-red-600 text-center my-5">{teamError}</Text>
            ) : teams.length === 0 ? (
                 <Text className="text-gray-500 text-center my-5">No teams available.</Text>
            ) : (
                <FlatList
                  data={teams}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                    <TouchableOpacity className="py-4 items-center" onPress={() => handleSelectTeam(item)}>
                      <Text className="text-lg text-blue-600">{item.name}</Text>
                    </TouchableOpacity>
                  )}
                  ItemSeparatorComponent={() => <View className="h-px bg-gray-200 mx-3" />}
                />
            )}
            <TouchableOpacity className="mt-4 py-4 items-center bg-gray-100 rounded-xl" onPress={() => setTeamPickerVisible(false)}>
              <Text className="text-lg text-blue-600 font-semibold">Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

export default AddEventForm;
