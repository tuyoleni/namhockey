// src/components/teams/CreateTeamModal.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { useTeamStore } from '../../store/teamStore';
import { X } from 'lucide-react-native'; // Changed from XMarkIcon

interface CreateTeamModalProps {
  isVisible: boolean;
  onClose: () => void;
  currentUserId: string;
}

const CreateTeamModal: React.FC<CreateTeamModalProps> = ({ isVisible, onClose, currentUserId }) => {
  const { addTeam, loadingTeams } = useTeamStore();
  const [teamName, setTeamName] = useState('');
  const [description, setDescription] = useState('');
  // Add more fields as needed (e.g., logo_url, is_public)

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
      description: description.trim() || null, // Supabase might prefer null for empty optional strings
      // created_by_profile_id: currentUserId, // teamStore's addTeam now handles creator as admin
      logo_url: null, // Placeholder, you'd need image upload logic here
      is_public: true, // Default or allow user to set
    };

    const result = await addTeam(newTeamData, currentUserId);
    if (result) {
      Alert.alert('Success', 'Team created successfully!');
      setTeamName('');
      setDescription('');
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
                <X size={28} color="gray" /> {/* Changed from XMarkIcon */}
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
            {/* Add more fields here: e.g., for logo_url (would need image picker), is_public toggle */}
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