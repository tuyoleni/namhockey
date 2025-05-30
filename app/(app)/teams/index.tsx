import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator, RefreshControl, Alert, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import { useTeamStore, TeamRow } from 'store/teamStore';
import { useUserStore } from 'store/userStore';
import TeamListItem from '@components/teams/TeamListItem';
import { PlusIcon, Users } from 'lucide-react-native';

export default function TeamsScreen() {
  const router = useRouter();
  const {
    teams,
    userTeams,
    fetchTeams,
    fetchUserTeams,
    loadingTeams,
    error: teamError,
    subscribeToTeams,
  } = useTeamStore();
  const { authUser, fetchAuthUser } = useUserStore();

  const [refreshing, setRefreshing] = useState(false);

  const handleCreateTeamPress = () => {
    if (authUser) {
      router.push('/teams/create'); 
    } else {
      Alert.alert("Authentication Required", "You need to be logged in to create a team.");
    }
  };

  useEffect(() => {
    if (!authUser) {
      fetchAuthUser();
    }
    fetchTeams();
    if (authUser?.id) {
      fetchUserTeams(authUser.id);
    }
    const unsubscribe = subscribeToTeams();
    return () => {
      unsubscribe();
    };
  }, [fetchTeams, subscribeToTeams, fetchAuthUser, authUser, fetchUserTeams]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchTeams();
    if (authUser?.id) {
      await fetchUserTeams(authUser.id);
    }
    setRefreshing(false);
  }, [fetchTeams, authUser, fetchUserTeams]);

  const handleTeamSelect = (team: TeamRow) => {
    router.push(`/teams/${team.id}`);
  };
  
  const userTeamIds = new Set(userTeams.map(t => t.id));

  if (loadingTeams && teams.length === 0 && !refreshing) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-gray-50" edges={['top', 'bottom', 'left', 'right']}>
        <StatusBar barStyle="dark-content" />
        <Stack.Screen options={{ title: 'Teams', headerRight: () => null }} />
        <ActivityIndicator size="large" color="#007AFF" />
        <Text className="mt-3 text-gray-600">Loading Teams...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top', 'bottom', 'left', 'right']}>
      <StatusBar barStyle="dark-content" />
      <Stack.Screen 
        options={{ 
          title: 'Teams',
          headerLargeTitle: true,
          headerRight: () => (
            <TouchableOpacity
              onPress={handleCreateTeamPress}
              className="mr-4 p-1.5"
              disabled={!authUser}
            >
              <PlusIcon size={26} color={authUser ? "#007AFF" : "#CBD5E1"} />
            </TouchableOpacity>
          ),
        }} 
      />

      <FlatList
        data={teams}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View className="px-4">
            <TeamListItem 
              team={item} 
              onPress={() => handleTeamSelect(item)} 
              isUserTeam={userTeamIds.has(item.id)}
            />
          </View>
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          !loadingTeams && !teamError ? (
            <View className="flex-1 justify-center items-center mt-24 px-6">
              <Users size={48} className="text-gray-300 mb-4" />
              <Text className="text-gray-600 text-xl font-semibold mb-1">No Teams Yet</Text>
              <Text className="text-gray-400 text-center">
                {authUser ? "Be the first to create a team!" : "Teams created by users will appear here."}
              </Text>
            </View>
          ) : teamError && teams.length === 0 ? (
            <View className="flex-1 justify-center items-center p-4 mt-20">
                <Text className="text-red-500 text-center mb-4">Error loading teams: {teamError}</Text>
                <TouchableOpacity
                onPress={onRefresh}
                className="bg-sky-500 py-2.5 px-5 rounded-lg active:bg-sky-600"
                >
                <Text className="text-white font-semibold">Retry</Text>
                </TouchableOpacity>
            </View>
           ) : null
        }
        contentContainerStyle={{ paddingTop: 12, paddingBottom: 16 }}
      />
    </SafeAreaView>
  );
}