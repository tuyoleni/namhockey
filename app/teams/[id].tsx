import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert, ScrollView, Platform, RefreshControl } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { useTeamStore, TeamMemberRow, TeamJoinRequestRow, TeamRow } from 'store/teamStore'; // Ensure correct path
import { useUserStore, Profile } from 'store/userStore'; // Ensure correct path
import AddMemberModal from '@components/teams/AddMemberModal'; // Ensure correct path
import UpdateTeamForm from '@components/teams/UpdateTeamForm'; // Ensure correct path
import { Edit3 } from 'lucide-react-native';
import AdminControlsSection from '@components/teams/AdminControlsSection';
import JoinRequestsSection from '@components/teams/JoinRequestsSection';
import TeamActionButtons from '@components/teams/TeamActionButtons';
import TeamDetailHeader from '@components/teams/TeamDetailHeader';
import TeamRosterSection from '@components/teams/TeamRosterSection';


const KNOWN_NON_UUID_ROUTES = ['create', 'edit'];

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
    error: teamDataError, // Get error directly from store
  } = useTeamStore();

  const { authUser, fetchUser } = useUserStore();
  const currentUserId = authUser?.id || '';

  const [isScreenValid, setIsScreenValid] = useState(false);
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
    if (teamIdFromParams && !KNOWN_NON_UUID_ROUTES.includes(teamIdFromParams.toLowerCase())) {
      if (showLoadingIndicator) setIsRefreshing(true);
      // Reset error before fetching
      useTeamStore.setState({ error: null });
      await fetchTeamDetails(teamIdFromParams);
      await fetchJoinRequests(teamIdFromParams);
      if (showLoadingIndicator) setIsRefreshing(false);
      setIsScreenValid(true);
    } else {
      if (!KNOWN_NON_UUID_ROUTES.includes(teamIdFromParams?.toLowerCase() || '')) {
         console.error("TeamDetailsScreen received an invalid or reserved route parameter:", teamIdFromParams);
      }
      setIsScreenValid(false);
    }
  }, [teamIdFromParams, fetchTeamDetails, fetchJoinRequests]);

  useEffect(() => {
    if (teamIdFromParams) {
      if (KNOWN_NON_UUID_ROUTES.includes(teamIdFromParams.toLowerCase())) {
        setIsScreenValid(false);
        useTeamStore.setState({ teamDetails: null, teamMembers: [], joinRequests: [] }); // Clear previous data
      } else {
        setIsScreenValid(true); // Assume valid, loadAllDetails will confirm
        loadAllDetails(false);
      }
    } else {
      setIsScreenValid(false);
    }
  }, [teamIdFromParams, loadAllDetails]);

  useEffect(() => {
    if (teamIdFromParams && isScreenValid) {
      const unsubscribeMembers = subscribeToTeamMembers(teamIdFromParams);
      const unsubscribeRequests = subscribeToJoinRequests(teamIdFromParams);
      return () => {
        unsubscribeMembers();
        unsubscribeRequests();
      };
    }
  }, [teamIdFromParams, subscribeToTeamMembers, subscribeToJoinRequests, isScreenValid]);

  const fetchProfilesForUsers = useCallback(async (
    userIds: string[],
    currentProfilesState: Record<string, Profile | null>,
    setProfilesStateFunction: React.Dispatch<React.SetStateAction<Record<string, Profile | null>>>
  ) => {
    const profilesToFetch = userIds.filter(id => id && !currentProfilesState[id]);
    if (profilesToFetch.length > 0) {
      const fetchedProfilesUpdate: Record<string, Profile | null> = { ...currentProfilesState };
      for (const userId of profilesToFetch) {
        const profileData = await fetchUser(userId);
        // Assuming fetchUser returns { user: Profile } or null/undefined
        fetchedProfilesUpdate[userId] = profileData ? (profileData as any).user || profileData : null;
      }
      setProfilesStateFunction(fetchedProfilesUpdate);
    }
  }, [fetchUser]);

  useEffect(() => {
    if (!isScreenValid) return;
    const memberUserIds = teamMembers.map(member => member.user_id).filter(id => typeof id === 'string') as string[];
    if (memberUserIds.length > 0) {
      fetchProfilesForUsers(memberUserIds, memberProfiles, setMemberProfiles);
    }
  }, [teamMembers, fetchProfilesForUsers, isScreenValid, memberProfiles]); // Added memberProfiles to prevent re-fetching if already present

 useEffect(() => {
    if (!isScreenValid) return;
    const requesterUserIds = joinRequests.map(req => req.user_id).filter(id => typeof id === 'string') as string[];
    if (requesterUserIds.length > 0) {
      fetchProfilesForUsers(requesterUserIds, requesterProfiles, setRequesterProfiles);
    }
  }, [joinRequests, fetchProfilesForUsers, isScreenValid, requesterProfiles]); // Added requesterProfiles


  const onRefresh = () => {
    if (isScreenValid) {
      // Clear profiles to force refetch if necessary, or rely on fetchProfilesForUsers logic
      // setMemberProfiles({});
      // setRequesterProfiles({});
      loadAllDetails(true);
    }
  };

  const handleLeaveTeam = () => {
    if (!teamIdFromParams || !isScreenValid) return;
    let message = "Are you sure you want to leave this team?";
    if (isUserTeamManager) {
        message = "You're the manager. Leaving might have significant consequences. Consider transferring management. Are you sure?";
    }
    Alert.alert("Leave Team", message, [
      { text: "Cancel", style: "cancel" },
      { text: "Leave", style: "destructive", onPress: async () => {
          await leaveTeam(teamIdFromParams, currentUserId);
          const currentError = useTeamStore.getState().error;
          if (currentError) Alert.alert("Error", currentError);
          else router.back();
      }}
    ]);
  };

  const handleRequestToJoin = async () => {
    if (!teamIdFromParams || !isScreenValid) return;
    await requestToJoinTeam(teamIdFromParams, currentUserId);
    const currentError = useTeamStore.getState().error;
    if (currentError) Alert.alert("Error", currentError);
    else Alert.alert('Request Sent', 'Your request to join the team has been sent.');
    if (isScreenValid) loadAllDetails(false); // Refresh to update UI
  };

  const handleApproveRequest = async (requestId: string) => {
    if(!isScreenValid) return;
    await approveJoinRequest(requestId);
    const currentError = useTeamStore.getState().error;
    if (currentError) Alert.alert("Error", currentError);
    else Alert.alert('Approved', 'Join request approved.');
    // Data should refresh via subscription, or call loadAllDetails(false) if not
  };

  const handleRejectRequest = async (requestId: string) => {
    if(!isScreenValid) return;
    await rejectJoinRequest(requestId);
    const currentError = useTeamStore.getState().error;
    if (currentError) Alert.alert("Error", currentError);
    else Alert.alert('Rejected', 'Join request rejected.');
    // Data should refresh via subscription, or call loadAllDetails(false) if not
  };

  const handleRemoveMember = (memberToRemove: TeamMemberRow) => {
    if (!canUserManageTeamSettings || memberToRemove.user_id === currentUserId || !teamIdFromParams || !isScreenValid) return;
     Alert.alert("Remove Member", `Remove ${memberProfiles[memberToRemove.user_id as string]?.display_name || 'this member'}?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: async () => {
          const success = await removeTeamMember(teamIdFromParams, memberToRemove.user_id);
          if (!success) Alert.alert("Error", useTeamStore.getState().error || "Failed to remove member.");
          else Alert.alert("Success", "Member removed.");
          // Data should refresh via subscription, or call loadAllDetails(false) if not
      }}
    ]);
  };

  const handleDeleteTeamPress = () => {
    if (!teamIdFromParams || !canUserManageTeamSettings || !isScreenValid) return;
    Alert.alert("Delete Team Permanently", "This action is irreversible and will delete all associated data.", [
        { text: "Cancel", style: "cancel" },
        { text: "Delete Team", style: "destructive", onPress: async () => {
            await deleteTeam(teamIdFromParams);
            const currentError = useTeamStore.getState().error;
            if (currentError) Alert.alert("Error", currentError);
            else { Alert.alert("Success", "Team deleted."); router.replace('/(app)/teams'); }
        }}
    ]);
  };

  const handleUpdateTeamSuccess = () => {
    setIsEditingTeam(false);
    if (isScreenValid) loadAllDetails(false);
  };


  // Loading and error states
  if (!isScreenValid && teamIdFromParams && KNOWN_NON_UUID_ROUTES.includes(teamIdFromParams.toLowerCase())) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center p-6 bg-gray-50" edges={['top','bottom']}>
        <Text className="text-red-600 text-center text-lg">Invalid Page Route</Text>
        <Text className="text-gray-600 text-center mt-2">This page is not accessible with the current link.</Text>
        <TouchableOpacity onPress={() => router.replace('/(app)/teams')} className="mt-6 bg-sky-500 py-2.5 px-6 rounded-lg">
            <Text className="text-white font-semibold">Go to Teams</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (loadingTeamDetails && !isRefreshing && !teamDetails) {
    return <SafeAreaView className="flex-1 justify-center items-center bg-gray-50" edges={['top','bottom']}><ActivityIndicator size="large" color="#007AFF" /></SafeAreaView>;
  }

  if (teamDataError && !teamDetails && !isRefreshing) { // Show error if initial load failed and not just a refresh error
     return (
      <SafeAreaView className="flex-1 justify-center items-center p-6 bg-gray-50" edges={['top','bottom']}>
        <Text className="text-red-500 text-center text-lg">Error Loading Team</Text>
        <Text className="text-gray-600 text-center mt-2">{teamDataError}</Text>
        <TouchableOpacity onPress={() => loadAllDetails(false)} className="mt-6 bg-sky-500 py-2.5 px-6 rounded-lg">
            <Text className="text-white font-semibold">Try Again</Text>
        </TouchableOpacity>
      </SafeAreaView>
     );
  }
  
  if (!teamDetails && !loadingTeamDetails && isScreenValid) { // Valid screen but no team details (e.g., team deleted, or ID was bad but not a known route)
     return (
      <SafeAreaView className="flex-1 justify-center items-center p-6 bg-gray-50" edges={['top','bottom']}>
        <Text className="text-gray-700 text-center text-lg">Team Not Found</Text>
        <Text className="text-gray-500 text-center mt-2">The team you are looking for doesn't exist or may have been deleted.</Text>
        <TouchableOpacity onPress={() => router.replace('/(app)/teams')} className="mt-6 bg-sky-500 py-2.5 px-6 rounded-lg">
            <Text className="text-white font-semibold">Go to Teams</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }
  
  if (!teamDetails) { // Fallback if still no team details, might occur briefly or if isScreenValid logic isn't perfect
    return <SafeAreaView className="flex-1 justify-center items-center bg-gray-50" edges={['top','bottom']}><ActivityIndicator size="large" color="#007AFF" /></SafeAreaView>;
  }


  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top', 'left', 'right']}>
      <Stack.Screen
        options={{
            title: isEditingTeam ? "Edit Team Information" : (teamDetails?.name || 'Team Details'),
            headerLargeTitle: !isEditingTeam,
            headerStyle: { backgroundColor: isEditingTeam ? (Platform.OS === 'ios' ? '#F2F2F7' : '#FFFFFF') : '#F9FAFB' },
            headerShadowVisible: isEditingTeam,
            headerTintColor: isEditingTeam ? '#1F2937' : undefined,
            headerRight: () => (
                canUserManageTeamSettings && !isEditingTeam && teamDetails ? (
                    <TouchableOpacity onPress={() => setIsEditingTeam(true)} className="mr-3 p-1">
                        <Edit3 size={22} className="text-sky-600" />
                    </TouchableOpacity>
                ) : null
            ),
            headerLeft: () => (
                isEditingTeam ? (
                    <TouchableOpacity onPress={() => setIsEditingTeam(false)} className={Platform.OS === 'ios' ? "ml-3 p-1" : "ml-1 p-1"}>
                        <Text className="text-sky-600 text-base">Cancel</Text>
                    </TouchableOpacity>
                ) : undefined
            )
        }}
      />
      {isEditingTeam && teamDetails ? (
        <UpdateTeamForm team={teamDetails} onSuccess={handleUpdateTeamSuccess} onCancel={() => setIsEditingTeam(false)} />
      ) : (
      <ScrollView
        className="flex-1"
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor="#007AFF"/>}
        contentContainerStyle={{paddingBottom: insets.bottom + 24}} // Ensure enough padding at the bottom
      >
        <TeamDetailHeader teamDetails={teamDetails} />

        <View className="py-5">
            <TeamActionButtons
                currentUserMembership={currentUserMembership}
                teamIsPublic={teamDetails.is_public}
                hasPendingRequest={hasPendingRequest}
                onLeaveTeam={handleLeaveTeam}
                onRequestToJoin={handleRequestToJoin}
            />

            {canUserManageTeamSettings && (
                <AdminControlsSection
                    onEditTeam={() => setIsEditingTeam(true)}
                    onAddMember={() => setAddMemberModalVisible(true)}
                    onManagePositions={() => Alert.alert("Manage Positions", "Assign and manage player positions (e.g., Forward, Defense for Hockey). This feature is coming soon!")}
                    onDeleteTeam={handleDeleteTeamPress}
                />
            )}

            {canUserManageTeamSettings && joinRequests.filter(req => req.status === 'pending').length > 0 && (
                <JoinRequestsSection
                    requests={joinRequests.filter(req => req.status === 'pending')}
                    profiles={requesterProfiles}
                    isLoading={loadingJoinRequests}
                    onApprove={handleApproveRequest}
                    onReject={handleRejectRequest}
                />
            )}

            <TeamRosterSection
                members={teamMembers}
                profiles={memberProfiles}
                isLoading={loadingTeamDetails && teamMembers.length === 0} // Show loading only if members list is empty
                currentUserId={currentUserId}
                canManageSettings={canUserManageTeamSettings}
                onRemoveMember={handleRemoveMember}
            />
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