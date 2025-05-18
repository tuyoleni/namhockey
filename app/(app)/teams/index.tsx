// src/screens/teams/index.tsx
import CreateTeamModal from '@components/teams/CreateTeamModal';
import TeamDetailsModal from '@components/teams/TeamDetailsModal';
import TeamListItem from '@components/teams/TeamListItem';
import { PlusIcon } from 'lucide-react-native';
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { useTeamStore, TeamRow } from 'store/teamStore';
import { useUserStore } from 'store/userStore';

export default function TeamsScreen() {
  const {
    teams,
    fetchTeams,
    loadingTeams,
    error: teamError,
    subscribeToTeams,
  } = useTeamStore();
  const { authUser, fetchAuthUser } = useUserStore(); // Assuming authUser has user.id

  const [isCreateModalVisible, setCreateModalVisible] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<TeamRow | null>(null);
  const [isDetailsModalVisible, setDetailsModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!authUser) {
      fetchAuthUser();
    }
    fetchTeams();
    const unsubscribe = subscribeToTeams();
    return () => {
      unsubscribe();
    };
  }, [fetchTeams, subscribeToTeams, fetchAuthUser, authUser]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchTeams();
    setRefreshing(false);
  }, [fetchTeams]);

  const handleTeamSelect = (team: TeamRow) => {
    setSelectedTeam(team);
    setDetailsModalVisible(true);
  };

  if (loadingTeams && teams.length === 0 && !refreshing) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-100">
        <ActivityIndicator size="large" color="#0000ff" />
        <Text className="mt-2 text-gray-600">Loading Teams...</Text>
      </View>
    );
  }

  if (teamError && teams.length === 0) {
    return (
      <View className="flex-1 justify-center items-center p-4 bg-gray-100">
        <Text className="text-red-500 text-center">Error loading teams: {teamError}</Text>
        <TouchableOpacity
          onPress={() => fetchTeams()}
          className="mt-4 bg-blue-500 p-3 rounded-lg"
        >
          <Text className="text-white font-semibold">Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 p-4 bg-gray-100">
      <View className="flex-row justify-between items-center mb-6">
        <Text className="text-3xl font-bold text-gray-800">Teams</Text>
        <TouchableOpacity
          onPress={() => setCreateModalVisible(true)}
          className="bg-blue-500 p-3 rounded-full shadow-lg"
        >
          <PlusIcon size={24} color="white" />
        </TouchableOpacity>
      </View>

      {teams.length === 0 && !loadingTeams ? (
         <View className="flex-1 justify-center items-center">
            <Text className="text-gray-500 text-lg">No teams found.</Text>
            <Text className="text-gray-400 mt-1">Why not create one?</Text>
         </View>
      ) : (
        <FlatList
          data={teams}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TeamListItem team={item} onPress={() => handleTeamSelect(item)} />
          )}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#0000ff"]} />
          }
          ListEmptyComponent={
            !loadingTeams && !teamError ? (
              <View className="flex-1 justify-center items-center mt-10">
                <Text className="text-gray-500 text-lg">No teams available.</Text>
              </View>
            ) : null
          }
        />
      )}


      <CreateTeamModal
        isVisible={isCreateModalVisible}
        onClose={() => setCreateModalVisible(false)}
        currentUserId={authUser?.id || ''}
      />

      {selectedTeam && authUser && (
        <TeamDetailsModal
          isVisible={isDetailsModalVisible}
          onClose={() => {
            setDetailsModalVisible(false);
            setSelectedTeam(null); // Clear selected team when closing
          }}
          teamId={selectedTeam.id}
          currentUserId={authUser.id}
        />
      )}
    </View>
  );
}