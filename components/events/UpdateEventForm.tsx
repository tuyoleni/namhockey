import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { EventWithTeams, useEventStore } from 'store/eventStore';
import { TablesUpdate } from 'types/database.types';

interface UpdateEventFormProps {
  event: EventWithTeams;
  onSuccess: () => void;
  onCancel: () => void;
}

const UpdateEventForm: React.FC<UpdateEventFormProps> = ({ event, onSuccess, onCancel }) => {
  const { updateEvent, loadingEvents: isLoading } = useEventStore();
  const [title, setTitle] = useState(event.title);
  const [description, setDescription] = useState(event.description || '');
  const [eventType, setEventType] = useState(event.event_type);
  const [locationName, setLocationName] = useState(event.location_name || '');
  const [locationAddress, setLocationAddress] = useState(event.location_address || '');
  const [startTime, setStartTime] = useState(event.start_time ? new Date(event.start_time).toISOString().substring(0, 16) : '');
  const [endTime, setEndTime] = useState(event.end_time ? new Date(event.end_time).toISOString().substring(0, 16) : '');


  const handleSaveChanges = async () => {
    if (!title.trim()) {
      Alert.alert('Validation Error', 'Event title cannot be empty.');
      return;
    }
    if (!startTime) {
      Alert.alert('Validation Error', 'Start time is required.');
      return;
    }

    const updates: TablesUpdate<'events'> = {
      title: title.trim(),
      description: description.trim() || null,
      event_type: eventType,
      location_name: locationName.trim() || null,
      location_address: locationAddress.trim() || null,
      start_time: new Date(startTime).toISOString(),
      end_time: endTime ? new Date(endTime).toISOString() : null,
    };

    const updatedEvent = await updateEvent(event.id, updates);
    if (updatedEvent) {
      Alert.alert('Success', 'Event updated successfully!');
      onSuccess();
    } else {
      Alert.alert('Error', 'Failed to update event. Please try again.');
    }
  };

  return (
    <ScrollView className="flex-1 px-4 py-6 bg-white" keyboardShouldPersistTaps="handled">
      <Text className="text-2xl font-bold text-gray-800 mb-6">Edit Event</Text>
      
      <View className="mb-4">
        <Text className="text-sm font-medium text-gray-600 mb-1">Title</Text>
        <TextInput
          className="border border-gray-300 p-3 rounded-md text-base text-gray-800"
          value={title}
          onChangeText={setTitle}
          placeholder="Event Title"
        />
      </View>

      <View className="mb-4">
        <Text className="text-sm font-medium text-gray-600 mb-1">Description</Text>
        <TextInput
          className="border border-gray-300 p-3 rounded-md text-base text-gray-800 min-h-[100px]"
          value={description}
          onChangeText={setDescription}
          placeholder="Event Description"
          multiline
          textAlignVertical="top"
        />
      </View>

      <View className="mb-4">
        <Text className="text-sm font-medium text-gray-600 mb-1">Event Type</Text>
        <TextInput
          className="border border-gray-300 p-3 rounded-md text-base text-gray-800"
          value={eventType}
          onChangeText={setEventType}
          placeholder="e.g., Match, Tournament, Meeting"
        />
      </View>
      
      <View className="mb-4">
        <Text className="text-sm font-medium text-gray-600 mb-1">Start Date & Time</Text>
        <TextInput
          className="border border-gray-300 p-3 rounded-md text-base text-gray-800"
          value={startTime}
          onChangeText={setStartTime}
          placeholder="YYYY-MM-DDTHH:mm"
          keyboardType="numbers-and-punctuation" // Basic, consider DateTimePicker
        />
      </View>
      
      <View className="mb-4">
        <Text className="text-sm font-medium text-gray-600 mb-1">End Date & Time (Optional)</Text>
        <TextInput
          className="border border-gray-300 p-3 rounded-md text-base text-gray-800"
          value={endTime}
          onChangeText={setEndTime}
          placeholder="YYYY-MM-DDTHH:mm"
          keyboardType="numbers-and-punctuation" // Basic, consider DateTimePicker
        />
      </View>

      <View className="mb-4">
        <Text className="text-sm font-medium text-gray-600 mb-1">Location Name</Text>
        <TextInput
          className="border border-gray-300 p-3 rounded-md text-base text-gray-800"
          value={locationName}
          onChangeText={setLocationName}
          placeholder="e.g., Central Stadium"
        />
      </View>
      
      <View className="mb-6">
        <Text className="text-sm font-medium text-gray-600 mb-1">Location Address</Text>
        <TextInput
          className="border border-gray-300 p-3 rounded-md text-base text-gray-800"
          value={locationAddress}
          onChangeText={setLocationAddress}
          placeholder="Full address"
        />
      </View>

      {isLoading && <ActivityIndicator size="large" color="#007AFF" className="my-3" />}

      <TouchableOpacity
        className="bg-sky-500 p-4 rounded-lg items-center mb-3 active:bg-sky-600"
        onPress={handleSaveChanges}
        disabled={isLoading}
      >
        <Text className="text-white text-base font-semibold">Save Changes</Text>
      </TouchableOpacity>
      <TouchableOpacity
        className="bg-gray-200 p-4 rounded-lg items-center active:bg-gray-300"
        onPress={onCancel}
        disabled={isLoading}
      >
        <Text className="text-gray-700 text-base font-semibold">Cancel</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default UpdateEventForm;