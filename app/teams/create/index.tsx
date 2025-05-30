import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Switch, Platform, ActivityIndicator, Alert, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { useUserStore } from 'store/userStore';
import { useTeamStore, TeamInsertArgs } from 'store/teamStore'; // Ensure TeamInsertArgs is exported and used
import { Check, Image as ImageIcon, Users, Globe } from 'lucide-react-native';

export default function CreateTeamScreen() {
  const router = useRouter();
  const { authUser } = useUserStore();
  const { createTeam, loadingTeams, error: teamStoreError } = useTeamStore(); // Using createTeam

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [isPublic, setIsPublic] = useState(true);

  const handleCreateTeam = async () => {
    if (!authUser?.id) {
      Alert.alert('Authentication Error', 'You must be logged in to create a team.');
      return;
    }
    if (!name.trim()) {
      Alert.alert('Required Field', 'Team name cannot be empty.');
      return;
    }

    const newTeamData: TeamInsertArgs = {
      name: name.trim(),
      description: description.trim() || null,
      logo_url: logoUrl.trim() || null,
      is_public: isPublic,
      manager_id: authUser.id, // Creator is the manager
    };

    const createdTeam = await createTeam(newTeamData, authUser.id); // Pass creatorUserId explicitly if your store's createTeam expects it

    if (createdTeam && createdTeam.id) {
      Alert.alert('Success', 'Team created successfully!');
      router.replace(`/teams/${createdTeam.id}`); 
    } else {
      Alert.alert('Error', teamStoreError || 'Failed to create team. Please try again.');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <StatusBar barStyle="dark-content" />
      <Stack.Screen 
        options={{ 
          title: 'Create New Team',
          headerStyle: { backgroundColor: Platform.OS === 'ios' ? '#F2F2F7' : '#FFFFFF' },
          headerShadowVisible: Platform.OS !== 'ios',
          headerTitleStyle: { fontWeight: '600' }
        }} 
      />
      <ScrollView 
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 24 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="p-5 space-y-5">
          <View>
            <Text className="text-sm font-medium text-gray-600 mb-1.5 ml-1">Team Name</Text>
            <View className="flex-row items-center bg-white border border-gray-300 rounded-xl p-3 focus-within:border-sky-500 focus-within:ring-1 focus-within:ring-sky-500">
              <Users size={20} className="text-gray-400 mr-2.5" />
              <TextInput
                className="flex-1 text-base text-gray-900 leading-5"
                value={name}
                onChangeText={setName}
                placeholder="Official team name"
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </View>

          <View>
            <Text className="text-sm font-medium text-gray-600 mb-1.5 ml-1 mt-4 ">Description (Optional)</Text>
            <View className="bg-white border border-gray-300 rounded-xl p-3 focus-within:border-sky-500 focus-within:ring-1 focus-within:ring-sky-500">
               <TextInput
                className="text-base text-gray-900 min-h-[80px] leading-5"
                value={description}
                onChangeText={setDescription}
                placeholder="Tell us about your team..."
                placeholderTextColor="#9CA3AF"
                multiline
                textAlignVertical="top"
              />
            </View>
          </View>
          
          <View>
            <Text className="text-sm font-medium text-gray-600 mb-1.5 ml-1 mt-4 ">Logo URL (Optional)</Text>
             <View className="flex-row items-center bg-white border border-gray-300 rounded-xl p-3 focus-within:border-sky-500 focus-within:ring-1 focus-within:ring-sky-500">
                <ImageIcon size={20} className="text-gray-400 mr-2.5" />
                <TextInput
                    className="flex-1 text-base text-gray-900 leading-5"
                    value={logoUrl}
                    onChangeText={setLogoUrl}
                    placeholder="https://example.com/logo.png"
                    placeholderTextColor="#9CA3AF"
                    autoCapitalize="none"
                    keyboardType="url"
                />
            </View>
          </View>

          <View className="flex-row justify-between items-center bg-white border border-gray-200 rounded-xl mt-4 p-4">
            <View className="flex-row items-center">
                <Globe size={20} className="text-gray-500 mr-2.5" />
                <Text className="text-base text-gray-800">Public Team</Text>
            </View>
            <Switch
              trackColor={{ false: Platform.OS === 'android' ? "#E5E7EB" : "#E9E9EA", true: Platform.OS === 'android' ? "#7DD3FC" : "#34C759" }}
              thumbColor={isPublic ? (Platform.OS === 'android' ? "#0EA5E9" : "#FFFFFF") : "#FFFFFF"}
              ios_backgroundColor="#E9E9EA"
              onValueChange={setIsPublic}
              value={isPublic}
            />
          </View>
          <Text className="text-xs text-gray-500 ml-1 mt-6 px-1 ">
            Public teams are visible to everyone and can be joined by request. Private teams are by invite only.
          </Text>
        </View>
      </ScrollView>

      <View className="p-5">
        <TouchableOpacity
          className={`py-3.5 px-4 rounded-xl flex-row justify-center items-center space-x-2
            ${loadingTeams ? 'bg-gray-300' : 'bg-sky-500 active:bg-sky-600'} 
          `}
          onPress={handleCreateTeam}
          disabled={loadingTeams}
        >
          {loadingTeams ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Check size={20} color="white" />
          )}
          <Text className="text-white text-center font-semibold text-lg">
            {loadingTeams ? 'Creating Team...' : 'Confirm & Create Team'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}