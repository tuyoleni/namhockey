import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, ActivityIndicator, Alert, ScrollView, Switch, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
  const [logoUrl, setLogoUrl] = useState('');
  const [isPublic, setIsPublic] = useState(true);

  const handleCreateTeam = async () => {
    if (!teamName.trim()) {
      Alert.alert('Required Field', 'Team name cannot be empty.');
      return;
    }
    if (!currentUserId) {
        Alert.alert('Authentication Error', 'User not identified. Please try again.');
        return;
    }

    const newTeamData = {
      name: teamName.trim(),
      description: description.trim() || null,
      logo_url: logoUrl.trim() || null,
      is_public: isPublic,
    };

    const result = await addTeam(newTeamData, currentUserId);
    if (result) {
      Alert.alert('Team Created!', `${teamName.trim()} has been successfully created.`);
      setTeamName('');
      setDescription('');
      setLogoUrl('');
      setIsPublic(true);
      onClose();
    } else {
      Alert.alert('Creation Failed', 'Could not create the team. Please try again later.');
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent={false}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <SafeAreaView className="flex-1 bg-gray-100" edges={['top', 'bottom']}>
        <View className="flex-row justify-between items-center p-4 border-b border-gray-200 bg-white">
          <Text className="text-xl font-semibold text-gray-800">Create New Team</Text>
          <TouchableOpacity onPress={onClose} className="p-2 rounded-full active:bg-gray-200">
            <X size={24} className="text-gray-600" />
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1" contentContainerClassName="p-4" keyboardShouldPersistTaps="handled">
          <View className="bg-white p-5 rounded-lg mb-4">
            <Text className="text-base font-medium text-gray-700 mb-1">Team Name <Text className="text-red-500">*</Text></Text>
            <TextInput
              placeholder="Official team name"
              value={teamName}
              onChangeText={setTeamName}
              className="border border-gray-300 p-3 rounded-lg text-base text-gray-900 focus:border-sky-500 bg-white"
            />
          </View>

          <View className="bg-white p-5 rounded-lg mb-4">
            <Text className="text-base font-medium text-gray-700 mb-1">Description</Text>
            <TextInput
              placeholder="Briefly describe your team (optional)"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              className="border border-gray-300 p-3 rounded-lg text-base h-28 focus:border-sky-500 bg-white"
              textAlignVertical="top"
            />
          </View>

          <View className="bg-white p-5 rounded-lg mb-4">
            <Text className="text-base font-medium text-gray-700 mb-1">Logo URL</Text>
            <TextInput
              placeholder="https://example.com/logo.png (optional)"
              value={logoUrl}
              onChangeText={setLogoUrl}
              className="border border-gray-300 p-3 rounded-lg text-base text-gray-900 focus:border-sky-500 bg-white"
              autoCapitalize="none"
              keyboardType="url"
            />
          </View>

          <View className="bg-white p-5 rounded-lg mb-6 flex-row justify-between items-center">
            <Text className="text-base font-medium text-gray-700">Make Team Public?</Text>
            <Switch
              trackColor={{ false: "#E5E7EB", true: Platform.OS === 'android' ? "#7DD3FC" : "#34C759" }}
              thumbColor={isPublic ? (Platform.OS === 'android' ? "#0284C7" : "#f4f3f4") : "#f4f3f4"}
              ios_backgroundColor="#D1D5DB"
              onValueChange={setIsPublic}
              value={isPublic}
            />
          </View>

           <TouchableOpacity
            onPress={handleCreateTeam}
            disabled={loadingTeams}
            className={`py-3.5 px-4 rounded-lg ${loadingTeams ? 'bg-gray-400' : 'bg-sky-500 active:bg-sky-600'} shadow`}
          >
            {loadingTeams ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white text-center font-semibold text-lg">Create Team</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

export default CreateTeamModal;