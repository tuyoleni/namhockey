// src/components/teams/CreateTeamModal.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, ActivityIndicator, Alert, ScrollView, Switch, Platform } from 'react-native'; // Added Switch and Platform
import { useTeamStore } from '../../store/teamStore';
import { X } from 'lucide-react-native';

interface CreateTeamModalProps {
  isVisible: boolean;
  onClose: () => void;
  currentUserId: string;
}

const CreateTeamModal: React.FC<CreateTeamModalProps> = ({ isVisible, onClose, currentUserId }) => {
  const { addTeam, loadingTeams } = useTeamStore();
  const [teamName, setTeamName] = useState('');
  const [description, setDescription] = useState('');
  const [logoUrl, setLogoUrl] = useState(''); // State for logo URL
  const [isPublic, setIsPublic] = useState(true); // State for is_public, defaulting to true

  const handleCreateTeam = async () => {
    if (!teamName.trim()) {
      Alert.alert('Validation Error', 'Team name is required.');
      return;
    }
    if (!currentUserId) {
        Alert.alert('Error', 'User not identified. Cannot create team.');
        return;
    }

    const newTeamData = {
      name: teamName.trim(),
      description: description.trim() || null,
      logo_url: logoUrl.trim() || null, // Use state for logo_url
      is_public: isPublic, // Use state for is_public
    };

    const result = await addTeam(newTeamData, currentUserId);
    if (result) {
      Alert.alert('Success', 'Team created successfully!');
      setTeamName('');
      setDescription('');
      setLogoUrl(''); // Clear logoUrl
      setIsPublic(true); // Reset isPublic
      onClose();
    } else {
      Alert.alert('Error', 'Failed to create team. Please try again.');
      // Error is also handled in store, this is an additional UI feedback
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-center items-center bg-black/50">
        <View className="bg-white p-6 rounded-xl shadow-xl w-11/12 max-w-md">
          <ScrollView showsVerticalScrollIndicator={false}>
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-2xl font-bold text-gray-800">Create New Team</Text>
              <TouchableOpacity onPress={onClose} className="p-1">
                <X size={28} color="gray" />
              </TouchableOpacity>
            </View>

            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-1">Team Name <Text className="text-red-500">*</Text></Text>
              <TextInput
                placeholder="Enter team name"
                value={teamName}
                onChangeText={setTeamName}
                className="border border-gray-300 p-3 rounded-lg text-base focus:border-blue-500"
              />
            </View>

            <View className="mb-6">
              <Text className="text-sm font-medium text-gray-700 mb-1">Description (Optional)</Text>
              <TextInput
                placeholder="Describe your team"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
                className="border border-gray-300 p-3 rounded-lg text-base h-24 focus:border-blue-500"
                textAlignVertical="top"
              />
            </View>

            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-1">Logo URL (Optional)</Text>
              <TextInput
                placeholder="Enter team logo URL"
                value={logoUrl}
                onChangeText={setLogoUrl}
                className="border border-gray-300 p-3 rounded-lg text-base focus:border-blue-500"
                autoCapitalize="none"
                keyboardType="url"
              />
            </View>

            <View className="mb-6 flex-row justify-between items-center">
              <Text className="text-sm font-medium text-gray-700">Make Team Public?</Text>
              <Switch
                trackColor={{ false: "#767577", true: Platform.OS === 'android' ? "#81b0ff" : "#34C759" }}
                thumbColor={isPublic ? (Platform.OS === 'android' ? "#3b82f6" : "#f4f3f4") : "#f4f3f4"}
                ios_backgroundColor="#3e3e3e"
                onValueChange={setIsPublic}
                value={isPublic}
              />
            </View>

             <TouchableOpacity
              onPress={handleCreateTeam}
              disabled={loadingTeams}
              className={`py-3 px-4 rounded-lg ${loadingTeams ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'} shadow-md`}
            >
              {loadingTeams ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white text-center font-semibold text-base">Create Team</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

export default CreateTeamModal;