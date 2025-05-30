import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert, Image, ScrollView, Platform, RefreshControl } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { useTeamStore, TeamMemberRow, TeamJoinRequestRow, TeamRow } from 'store/teamStore';
import { useUserStore, Profile } from 'store/userStore';
import AddMemberModal from '@components/teams/AddMemberModal';
import UpdateTeamForm from '@components/teams/UpdateTeamForm'; // Import the new form
import { X, LogOut, UserPlus, Users, ShieldCheck, Mail, Edit3, Trash2, Settings, ChevronRight, ListChecks } from 'lucide-react-native';

const TeamDetailsScreen = () => {
  const { id: teamIdFromParams } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const {
    teamDetails,
    teamMembers,
    loadingTeamDetails,
    fetchTeamDetails,
    leaveTeam,
    requestToJoinTeam,
    fetchJoinRequests,
    approveJoinRequest,
    rejectJoinRequest,
    removeTeamMember,
    deleteTeam,
    joinRequests,
    loadingJoinRequests,
    subscribeToTeamMembers,
    subscribeToJoinRequests,
  } = useTeamStore();

  const { authUser, fetchUser } = useUserStore();
  const currentUserId = authUser?.id || '';

  const [isAddMemberModalVisible, setAddMemberModalVisible] = useState(false);
  const [memberProfiles, setMemberProfiles] = useState<Record<string, Profile | null>>({});
  const [requesterProfiles, setRequesterProfiles] = useState<Record<string, Profile | null>>({});
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isEditingTeam, setIsEditingTeam] = useState(false);

  const currentUserMembership = teamMembers.find(member => member.user_id === currentUserId);
  const isUserTeamAdmin = currentUserMembership?.role === 'admin';
  const isUserTeamManager = authUser?.id === teamDetails?.manager_id;
  const canUserManageTeamSettings = isUserTeamAdmin || isUserTeamManager;
  const hasPendingRequest = joinRequests.some(req => req.user_id === currentUserId && req.status === 'pending');

  const loadAllDetails = useCallback(async (showLoadingIndicator = true) => {
    if (teamIdFromParams) {
      if(showLoadingIndicator) setIsRefreshing(true);
      await fetchTeamDetails(teamIdFromParams);
      await fetchJoinRequests(teamIdFromParams);
      if(showLoadingIndicator) setIsRefreshing(false);
    }
  }, [teamIdFromParams, fetchTeamDetails, fetchJoinRequests]);

  useEffect(() => {
    loadAllDetails(false);
  }, [loadAllDetails]);

  useEffect(() => {
    if (teamIdFromParams) {
      const unsubscribeMembers = subscribeToTeamMembers(teamIdFromParams);
      const unsubscribeRequests = subscribeToJoinRequests(teamIdFromParams);
      return () => {
        unsubscribeMembers();
        unsubscribeRequests();
      };
    }
  }, [teamIdFromParams, subscribeToTeamMembers, subscribeToJoinRequests]);

  const fetchProfilesForUsers = useCallback(async (
    userIds: string[], 
    currentProfilesState: Record<string, Profile | null>, 
    setProfilesStateFunction: React.Dispatch<React.SetStateAction<Record<string, Profile | null>>>
  ) => {
    const profilesToFetch = userIds.filter(id => id && !currentProfilesState[id]);
    if (profilesToFetch.length > 0) {
      const fetchedProfilesUpdate: Record<string, Profile | null> = {};
      for (const userId of profilesToFetch) {
        const profileData = await fetchUser(userId);
        if (profileData && 'user' in profileData) {
          fetchedProfilesUpdate[userId] = profileData.user;
        } else {
          fetchedProfilesUpdate[userId] = null;
        }
      }
      setProfilesStateFunction(prev => ({ ...prev, ...fetchedProfilesUpdate }));
    }
  }, [fetchUser]);

  useEffect(() => {
    const memberUserIds = teamMembers.map(member => member.user_id).filter(id => typeof id === 'string') as string[];
    if (memberUserIds.length > 0) {
      fetchProfilesForUsers(memberUserIds, memberProfiles, setMemberProfiles);
    }
  }, [teamMembers, fetchProfilesForUsers]);

 useEffect(() => {
    const requesterUserIds = joinRequests.map(req => req.user_id).filter(id => typeof id === 'string') as string[];
    if (requesterUserIds.length > 0) {
      fetchProfilesForUsers(requesterUserIds, requesterProfiles, setRequesterProfiles);
    }
  }, [joinRequests, fetchProfilesForUsers]);

  const onRefresh = () => loadAllDetails(true);

  const handleLeaveTeam = () => {
    if (!teamIdFromParams) return;
    let message = "Are you sure you want to leave this team?";
    if (isUserTeamManager) {
        message = "You are the manager of this team. Leaving might have significant consequences. Consider transferring management first. Are you sure?";
    }
    Alert.alert("Leave Team", message, [
      { text: "Cancel", style: "cancel" },
      { text: "Leave", style: "destructive", onPress: async () => {
          await leaveTeam(teamIdFromParams, currentUserId);
          const currentError = useTeamStore.getState().error;
          if (currentError) Alert.alert("Error", currentError); 
          else {
            Alert.alert("Success", "You have left the team.");
            router.back(); 
          }
      }}
    ]);
  };

  const handleRequestToJoin = async () => {
    if (!teamIdFromParams) return;
    await requestToJoinTeam(teamIdFromParams, currentUserId);
    const currentError = useTeamStore.getState().error;
    if (currentError) Alert.alert("Error", currentError);
    else Alert.alert('Request Sent', 'Your request to join the team has been sent.');
    loadAllDetails(false);
  };

  const handleApproveRequest = async (requestId: string) => {
    await approveJoinRequest(requestId);
    const currentError = useTeamStore.getState().error;
    if (currentError) Alert.alert("Error", currentError);
    else Alert.alert('Approved', 'Join request approved.');
    loadAllDetails(false);
  };

  const handleRejectRequest = async (requestId: string) => {
    await rejectJoinRequest(requestId);
    const currentError = useTeamStore.getState().error;
    if (currentError) Alert.alert("Error", currentError);
    else Alert.alert('Rejected', 'Join request rejected.');
    loadAllDetails(false);
  };
  
  const handleRemoveMember = (memberToRemove: TeamMemberRow) => {
    if (!canUserManageTeamSettings || memberToRemove.user_id === currentUserId || !teamIdFromParams) return;
     Alert.alert("Remove Member", `Remove ${memberProfiles[memberToRemove.user_id]?.display_name || 'this member'}?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: async () => {
          const success = await removeTeamMember(teamIdFromParams, memberToRemove.user_id);
          if (success) Alert.alert("Success", "Member removed.");
          else Alert.alert("Error", useTeamStore.getState().error || "Failed to remove member.");
      }}
    ]);
  };

  const handleDeleteTeamPress = () => {
    if (!teamIdFromParams || !canUserManageTeamSettings) return;
    Alert.alert("Delete Team Permanently", "This action is irreversible.", [
        { text: "Cancel", style: "cancel" },
        { text: "Delete Team", style: "destructive", onPress: async () => {
            await deleteTeam(teamIdFromParams);
            const currentError = useTeamStore.getState().error;
            if (currentError) Alert.alert("Error", currentError);
            else { Alert.alert("Success", "Team deleted."); router.replace('/(app)/teams'); }
        }}
    ]);
  };

  const renderMemberItem = ({ item, index }: { item: TeamMemberRow, index: number }) => {
    const profile = item.user_id ? memberProfiles[item.user_id] : null;
    const displayName = profile?.display_name || profile?.display_name || item.user_id?.substring(0, 8) || 'Member';
    return (
      <View className={`flex-row items-center bg-white p-4 space-x-4 ${index > 0 ? 'border-t border-gray-200' : ''}`}>
        {profile?.profile_picture ? (
            <Image source={{uri: profile.profile_picture}} className="w-12 h-12 rounded-full bg-gray-100" />
        ): (
            <View className="w-12 h-12 rounded-full bg-gray-200 justify-center items-center">
                <Text className="text-gray-500 text-lg font-semibold">{displayName.charAt(0).toUpperCase()}</Text>
            </View>
        )}
        <View className="flex-1">
            <Text className="text-lg font-semibold text-gray-800">{displayName}</Text>
            <Text className="text-sm text-gray-500 capitalize">{item.role}</Text>
        </View>
        {item.user_id === currentUserId && <ShieldCheck size={22} className="text-sky-500" />}
        {canUserManageTeamSettings && item.user_id !== currentUserId && (
            <TouchableOpacity onPress={() => handleRemoveMember(item)} className="p-2 active:bg-gray-100 rounded-full">
                <Trash2 size={20} className="text-red-500" />
            </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderJoinRequestItem = ({ item, index }: { item: TeamJoinRequestRow, index: number }) => {
    if (!item.user_id) return null;
    const profile = requesterProfiles[item.user_id];
    const displayName = profile?.display_name || profile?.display_name || item.user_id.substring(0,8);
    return (
      <View className={`flex-row items-center bg-white p-4 space-x-3 justify-between ${index > 0 ? 'border-t border-gray-200' : ''}`}>
        <View className="flex-row items-center space-x-4 flex-1">
             {profile?.profile_picture ? (
                <Image source={{uri: profile.profile_picture}} className="w-10 h-10 rounded-full bg-gray-100" />
            ): (
                <View className="w-10 h-10 rounded-full bg-gray-200 justify-center items-center">
                     <Text className="text-gray-500 font-semibold">{displayName.charAt(0).toUpperCase()}</Text>
                </View>
            )}
            <Text className="text-base text-gray-700 flex-shrink mr-2" numberOfLines={1}>{displayName}</Text>
        </View>
        <View className="flex-row space-x-2">
          <TouchableOpacity onPress={() => handleApproveRequest(item.id)} className="bg-green-500 py-2 px-3 rounded-md active:bg-green-600">
            <Text className="text-white text-sm font-medium">Approve</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleRejectRequest(item.id)} className="bg-red-500 py-2 px-3 rounded-md active:bg-red-600">
            <Text className="text-white text-sm font-medium">Reject</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };
  
  const teamDataError = useTeamStore(state => state.error);

  if (loadingTeamDetails && !teamDetails && !isRefreshing) {
    return <SafeAreaView className="flex-1 justify-center items-center bg-gray-50"><ActivityIndicator size="large" color="#007AFF" /></SafeAreaView>;
  }
  if (teamDataError && !teamDetails) {
     return <SafeAreaView className="flex-1 justify-center items-center p-6 bg-gray-50"><Text className="text-red-600 text-center">Error: {teamDataError}</Text></SafeAreaView>;
  }
  if (!teamDetails) {
     return <SafeAreaView className="flex-1 justify-center items-center p-6 bg-gray-50"><Text className="text-gray-600">Team not found.</Text></SafeAreaView>;
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top', 'left', 'right']}>
      <Stack.Screen 
        options={{ 
            title: isEditingTeam ? "Edit Team" : (teamDetails?.name || 'Team Details'),
            headerLargeTitle: !isEditingTeam,
            headerStyle: { backgroundColor: isEditingTeam ? '#FFFFFF' : '#F9FAFB' }, // bg-white or bg-gray-50
            headerShadowVisible: isEditingTeam, // Show shadow when editing
            headerRight: () => (
                canUserManageTeamSettings && !isEditingTeam ? (
                    <TouchableOpacity onPress={() => setIsEditingTeam(true)} className="mr-4">
                        <Edit3 size={24} className="text-sky-600" />
                    </TouchableOpacity>
                ) : null
            )
        }} 
      />
      {isEditingTeam && teamDetails ? (
        <UpdateTeamForm team={teamDetails} onSuccess={() => { setIsEditingTeam(false); loadAllDetails(false);}} onCancel={() => setIsEditingTeam(false)} />
      ) : (
      <ScrollView
        className="flex-1"
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor="#007AFF"/>}
        contentContainerStyle={{paddingBottom: insets.bottom + 24}}
      >
        <View className="items-center p-6 pt-8 bg-white border-b border-gray-200">
            {teamDetails.logo_url && (
                <Image source={{uri: teamDetails.logo_url}} className="w-28 h-28 rounded-full mb-5 bg-gray-100 border-4 border-white shadow-md" />
            )}
            <Text className="text-3xl font-bold text-center text-gray-900">{teamDetails.name}</Text>
            <Text className="text-lg text-gray-600 text-center mt-1 mb-3 px-4">{teamDetails.description || 'No description available.'}</Text>
            <View className={`px-3 py-1 rounded-full ${teamDetails.is_public ? 'bg-green-100' : 'bg-gray-100'}`}>
                <Text className={`text-xs ${teamDetails.is_public ? 'text-green-700' : 'text-gray-600'} font-medium`}>
                    {teamDetails.is_public ? 'Public Team' : 'Private Team'}
                </Text>
            </View>
        </View>
        
        <View className="py-5">
            <View className="flex-row justify-center items-center flex-wrap px-4">
                {currentUserMembership && (
                <TouchableOpacity onPress={handleLeaveTeam} className="bg-red-500 py-3 px-5 rounded-lg flex-row items-center space-x-2 active:bg-red-600 m-1.5 shadow-sm">
                    <LogOut size={18} color="white"/>
                    <Text className="text-white font-semibold">Leave Team</Text>
                </TouchableOpacity>
                )}
                {!currentUserMembership && teamDetails.is_public && !hasPendingRequest && (
                <TouchableOpacity onPress={handleRequestToJoin} className="bg-green-500 py-3 px-5 rounded-lg flex-row items-center space-x-2 active:bg-green-600 m-1.5 shadow-sm">
                    <UserPlus size={18} color="white"/>
                    <Text className="text-white font-semibold">Request to Join</Text>
                </TouchableOpacity>
                )}
                {hasPendingRequest && (
                     <View className="bg-yellow-400 py-3 px-5 rounded-lg flex-row items-center space-x-2 m-1.5 shadow-sm">
                        <Mail size={18} className="text-white"/>
                        <Text className="text-white font-semibold">Request Pending</Text>
                    </View>
                )}
            </View>

            {canUserManageTeamSettings && (
                 <View className="mt-6">
                    <Text className="text-sm font-semibold text-gray-400 uppercase px-4 pb-2 pt-4">Admin Controls</Text>
                    <View className="bg-white border-y border-gray-200">
                        <TouchableOpacity onPress={() => setIsEditingTeam(true)} className="flex-row justify-between items-center p-4 border-b border-gray-100 active:bg-gray-50">
                             <View className="flex-row items-center space-x-3">
                                <Edit3 size={20} className="text-gray-600"/>
                                <Text className="text-base text-gray-700">Edit Team Details</Text>
                             </View>
                             <ChevronRight size={20} className="text-gray-400"/>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setAddMemberModalVisible(true)} className="flex-row justify-between items-center p-4 border-b border-gray-100 active:bg-gray-50">
                             <View className="flex-row items-center space-x-3">
                                <UserPlus size={20} className="text-gray-600"/>
                                <Text className="text-base text-gray-700">Add New Member</Text>
                             </View>
                             <ChevronRight size={20} className="text-gray-400"/>
                        </TouchableOpacity>
                         <TouchableOpacity onPress={() => Alert.alert("Manage Positions", "Assign and manage player positions (e.g., Forward, Defense for Hockey). This feature is coming soon!")} className="flex-row justify-between items-center p-4 border-b border-gray-100 active:bg-gray-50">
                             <View className="flex-row items-center space-x-3">
                                <ListChecks size={20} className="text-gray-600"/>
                                <Text className="text-base text-gray-700">Manage Player Positions</Text>
                             </View>
                             <ChevronRight size={20} className="text-gray-400"/>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleDeleteTeamPress} className="flex-row justify-between items-center p-4 active:bg-red-50">
                             <View className="flex-row items-center space-x-3">
                                <Trash2 size={20} className="text-red-500"/>
                                <Text className="text-base text-red-500">Delete This Team</Text>
                             </View>
                             <ChevronRight size={20} className="text-red-400"/>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {canUserManageTeamSettings && joinRequests.filter(req => req.status === 'pending').length > 0 && (
                <View className="mt-6">
                    <Text className="text-sm font-semibold text-gray-400 uppercase px-4 pb-2 pt-4">Join Requests ({joinRequests.filter(req => req.status === 'pending').length})</Text>
                    <View className="bg-white border-y border-gray-200">
                        {loadingJoinRequests ? (<View className="p-4 items-center"><ActivityIndicator/></View>
                        ) : (
                            joinRequests.filter(req => req.status === 'pending').map((item, index) => renderJoinRequestItem({item, index}))
                        )}
                    </View>
                </View>
            )}

            <View className="mt-6">
                <Text className="text-sm font-semibold text-gray-400 uppercase px-4 pb-2 pt-4">Roster ({teamMembers.length})</Text>
                {loadingTeamDetails && teamMembers.length === 0 ? (<View className="p-4 items-center"><ActivityIndicator/></View>
                ) : teamMembers.length > 0 ? (
                    <View className="bg-white border-y border-gray-200">
                        {teamMembers.map((item, index) => renderMemberItem({item, index}))}
                    </View>
                ) : (
                    <Text className="text-gray-500 text-center bg-white p-6 border-y border-gray-200">No members in this team yet.</Text>
                )}
            </View>
        </View>
      </ScrollView>
      )}

      {teamDetails && authUser && (
        <AddMemberModal
          isVisible={isAddMemberModalVisible}
          onClose={() => setAddMemberModalVisible(false)}
          teamId={teamDetails.id}
          currentMembers={teamMembers.map(m => m.user_id).filter(id => !!id) as string[]}
        />
      )}
    </SafeAreaView>
  );
};

export default TeamDetailsScreen;