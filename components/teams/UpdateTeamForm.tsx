import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, ScrollView, Switch, Platform } from 'react-native';
import { useTeamStore, TeamRow } from 'store/teamStore';
import { TablesUpdate } from 'types/database.types';

interface UpdateTeamFormProps {
  team: TeamRow;
  onSuccess: () => void;
  onCancel: () => void;
}

const UpdateTeamForm: React.FC<UpdateTeamFormProps> = ({ team, onSuccess, onCancel }) => {
  const { updateTeam, loadingTeams } = useTeamStore();
  
  const [name, setName] = useState(team.name);
  const [description, setDescription] = useState(team.description || '');
  const [logoUrl, setLogoUrl] = useState(team.logo_url || '');
  const [isPublic, setIsPublic] = useState(team.is_public === null ? true : team.is_public); // Default to true if null

  const handleSaveChanges = async () => {
    if (!name.trim()) {
      Alert.alert('Required', 'Team name cannot be empty.');
      return;
    }

    const updates: TablesUpdate<'teams'> = {
      name: name.trim(),
      description: description.trim() || null,
      logo_url: logoUrl.trim() || null,
      is_public: isPublic,
    };

    const result = await updateTeam(team.id, updates);
    if (result) {
      Alert.alert('Success', 'Team details updated successfully!');
      onSuccess();
    } else {
      Alert.alert('Error', useTeamStore.getState().error || 'Failed to update team.');
    }
  };

  return (
    <ScrollView className="flex-1 px-4 pt-2 pb-6 bg-gray-50" keyboardShouldPersistTaps="handled">
      <Text className="text-2xl font-bold text-gray-800 mb-6 text-center">Edit Team Details</Text>
      
      <View className="mb-4">
        <Text className="text-sm font-medium text-gray-600 mb-1">Team Name <Text className="text-red-500">*</Text></Text>
        <TextInput
          className="border border-gray-300 p-3 rounded-lg text-base text-gray-900 bg-white focus:border-sky-500"
          value={name}
          onChangeText={setName}
          placeholder="Official team name"
        />
      </View>

      <View className="mb-4">
        <Text className="text-sm font-medium text-gray-600 mb-1">Description</Text>
        <TextInput
          className="border border-gray-300 p-3 rounded-lg text-base text-gray-900 min-h-[100px] bg-white focus:border-sky-500"
          value={description}
          onChangeText={setDescription}
          placeholder="Briefly describe your team (optional)"
          multiline
          textAlignVertical="top"
        />
      </View>

      <View className="mb-4">
        <Text className="text-sm font-medium text-gray-600 mb-1">Logo URL</Text>
        <TextInput
          className="border border-gray-300 p-3 rounded-lg text-base text-gray-900 bg-white focus:border-sky-500"
          value={logoUrl}
          onChangeText={setLogoUrl}
          placeholder="https://example.com/logo.png (optional)"
          autoCapitalize="none"
          keyboardType="url"
        />
      </View>

      <View className="mb-6 flex-row justify-between items-center p-3 bg-white rounded-lg border border-gray-200">
        <Text className="text-base font-medium text-gray-700">Team is Public</Text>
        <Switch
          trackColor={{ false: "#E5E7EB", true: Platform.OS === 'android' ? "#7DD3FC" : "#34C759" }}
          thumbColor={isPublic ? (Platform.OS === 'android' ? "#0284C7" : "#f4f3f4") : "#f4f3f4"}
          ios_backgroundColor="#D1D5DB"
          onValueChange={setIsPublic}
          value={isPublic}
        />
      </View>

      {loadingTeams && <ActivityIndicator size="large" color="#007AFF" className="my-3" />}

      <TouchableOpacity
        className={`py-3.5 px-4 rounded-lg ${loadingTeams ? 'bg-gray-400' : 'bg-sky-500 active:bg-sky-600'} shadow-sm mb-3`}
        onPress={handleSaveChanges}
        disabled={loadingTeams}
      >
        <Text className="text-white text-center font-semibold text-lg">Save Changes</Text>
      </TouchableOpacity>
      <TouchableOpacity
        className="py-3.5 px-4 rounded-lg bg-gray-200 active:bg-gray-300 shadow-sm"
        onPress={onCancel}
        disabled={loadingTeams}
      >
        <Text className="text-gray-700 text-center font-semibold text-lg">Cancel</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default UpdateTeamForm;