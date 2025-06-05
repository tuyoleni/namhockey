// src/components/teams/EditTeamModal.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, ActivityIndicator, Alert, ScrollView, Switch, Platform } from 'react-native';
import { useTeamStore, TeamRow } from '../../store/teamStore';
import { X } from 'lucide-react-native';
import { TablesUpdate } from 'database.types';

interface EditTeamModalProps {
  isVisible: boolean;
  onClose: () => void;
  teamToEdit: TeamRow;
}

const EditTeamModal: React.FC<EditTeamModalProps> = ({ isVisible, onClose, teamToEdit }) => {
  const { updateTeam, loadingTeams } = useTeamStore(); // loadingTeams can be a generic loading state for team operations
  
  const [teamName, setTeamName] = useState('');
  const [description, setDescription] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [isPublic, setIsPublic] = useState(true);

  useEffect(() => {
    if (teamToEdit) {
      setTeamName(teamToEdit.name);
      setDescription(teamToEdit.description || '');
      setLogoUrl(teamToEdit.logo_url || '');
      setIsPublic(teamToEdit.is_public || true);
    }
  }, [teamToEdit]);

  const handleUpdateTeam = async () => {
    if (!teamName.trim()) {
      Alert.alert('Validation Error', 'Team name is required.');
      return;
    }

    const updatedTeamData: TablesUpdate<'teams'> = {
      name: teamName.trim(),
      description: description.trim() || null,
      logo_url: logoUrl.trim() || null,
      is_public: isPublic,
    };

    const result = await updateTeam(teamToEdit.id, updatedTeamData);
    if (result) {
      Alert.alert('Success', 'Team updated successfully!');
      onClose(); // Close modal on success
    } else {
      // Error is handled in store, but an alert here can be good UX
      Alert.alert('Error', 'Failed to update team. Please try again.');
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
              <Text className="text-2xl font-bold text-gray-800">Edit Team</Text>
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
              <Text className="text-sm font-medium text-gray-700 mb-1">Description</Text>
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
              <Text className="text-sm font-medium text-gray-700 mb-1">Logo URL</Text>
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
              <Text className="text-sm font-medium text-gray-700">Team is Public?</Text>
              <Switch
                trackColor={{ false: "#767577", true: Platform.OS === 'android' ? "#81b0ff" : "#34C759" }}
                thumbColor={isPublic ? (Platform.OS === 'android' ? "#3b82f6" : "#f4f3f4") : "#f4f3f4"}
                ios_backgroundColor="#3e3e3e"
                onValueChange={setIsPublic}
                value={isPublic}
              />
            </View>

             <TouchableOpacity
              onPress={handleUpdateTeam}
              disabled={loadingTeams}
              className={`py-3 px-4 rounded-lg ${loadingTeams ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'} shadow-md`}
            >
              {loadingTeams ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white text-center font-semibold text-base">Save Changes</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

export default EditTeamModal;