import React, { useEffect } from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useTeamStore, TeamJoinRequestRow } from '../../store/teamStore'; // Adjust path as needed
import { useUserStore } from '../../store/userStore'; // Adjust path as needed
import { ListXIcon, AlertTriangleIcon, UserCogIcon } from 'lucide-react-native';
import JoinRequestListItem from './JoinRequestListItem';

interface TeamJoinRequestsSectionProps {
  teamId: string;
}

const TeamJoinRequestsSection: React.FC<TeamJoinRequestsSectionProps> = ({ teamId }) => {
  const {
    joinRequests,
    loadingJoinRequests,
    error,
    fetchJoinRequests,
    approveJoinRequest,
    rejectJoinRequest,
    cancelJoinRequest,
    subscribeToJoinRequests,
    teamDetails, // Fetch teamDetails to get manager_id
    fetchTeamDetails, // Action to fetch teamDetails if not already available
  } = useTeamStore();

  const { authUser } = useUserStore();
  const currentUserId = authUser?.id || null;

  useEffect(() => {
    if (teamId) {
      // Fetch team details if not already present or if it's for a different team
      if (!teamDetails || teamDetails.id !== teamId) {
        fetchTeamDetails(teamId);
      }
      fetchJoinRequests(teamId);
      const unsubscribe = subscribeToJoinRequests(teamId);
      return () => unsubscribe();
    }
  }, [teamId, fetchJoinRequests, subscribeToJoinRequests, fetchTeamDetails, teamDetails]);

  const handleApprove = async (requestId: string) => {
    await approveJoinRequest(requestId);
  };

  const handleReject = async (requestId: string) => {
    await rejectJoinRequest(requestId);
  };

  const handleCancelRequest = async (requestId: string, reqTeamId: string) => {
    if (reqTeamId === teamId) {
      await cancelJoinRequest(requestId, teamId);
    } else {
      console.warn("Mismatched teamId in cancelJoinRequest");
    }
  };

  // Determine if the current user can manage requests for this team
  const canManageRequests = currentUserId === teamDetails?.manager_id && teamDetails?.id === teamId;

  const pendingRequests = joinRequests.filter(req => req.team_id === teamId && req.status === 'pending');

  if (loadingJoinRequests && pendingRequests.length === 0) {
    return (
      <View className="mt-6 bg-white border-y border-gray-200 p-4 items-center rounded-lg mx-2 shadow-sm">
        <ActivityIndicator color="#007AFF" />
        <Text className="mt-2 text-gray-500">Loading Join Requests...</Text>
      </View>
    );
  }

  // Do not show this section if the user cannot manage requests and there are no requests of their own.
  // Or, if you want non-admins to see pending requests (without actions), adjust this logic.
  // For now, only show if there are requests AND (user can manage OR one of the requests is theirs).
  const userHasAPendingRequest = pendingRequests.some(req => req.user_id === currentUserId);
  if (!canManageRequests && !userHasAPendingRequest && pendingRequests.length > 0) {
    // If user cannot manage and none of the pending requests are theirs,
    // but there are other pending requests, we might show a generic "Pending requests" message or nothing.
    // For now, let's assume non-managers don't see other people's pending requests unless it's their own.
    // This part of the logic depends on your app's desired visibility rules.
    // If the goal is for admins to see all, and users to only see their own, this is implicitly handled
    // by JoinRequestListItem's internal logic if canManageRequests is correctly set.
  }


  if (error && pendingRequests.length === 0) {
    return (
      <View className="mt-6 bg-red-50 p-4 rounded-lg mx-2 items-center shadow-sm">
        <AlertTriangleIcon size={28} color="#D9534F" className="mb-2"/>
        <Text className="text-red-700 font-semibold text-center">Error loading requests</Text>
        <Text className="text-red-600 text-center mt-1 text-xs">{error}</Text>
        <TouchableOpacity
            onPress={() => fetchJoinRequests(teamId)}
            className="mt-3 bg-red-500 py-1.5 px-3 rounded-md active:bg-red-600"
        >
            <Text className="text-white text-sm font-semibold">Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Only render the section if there are pending requests to show based on user role
  // Or if the user can manage any pending requests.
  // If user is not admin and has no pending request of their own, don't show the section.
  if (pendingRequests.length === 0) {
     if (canManageRequests) { // Admin sees "no pending requests"
        return (
            <View className="mt-6 px-4 py-6 bg-white border-y border-gray-200 items-center rounded-lg mx-2 shadow-sm">
                <UserCogIcon size={28} color="#6B7280" className="mb-2"/>
                <Text className="text-gray-600">No pending join requests to manage.</Text>
            </View>
        );
     }
     // Non-admin with no pending requests of their own doesn't see this section.
     return null;
  }


  return (
    <View className="mt-6">
      <Text className="text-xs font-semibold text-gray-500 uppercase px-4 mb-2 tracking-wider">
        Pending Join Requests ({pendingRequests.length})
      </Text>
      <View className="bg-white border-y border-gray-200 rounded-lg overflow-hidden mx-2 shadow-sm">
        <FlatList
          data={pendingRequests}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <JoinRequestListItem
              item={item}
              currentUserId={currentUserId}
              onApprove={handleApprove}
              onReject={handleReject}
              onCancelRequest={handleCancelRequest}
              isFirstItem={index === 0}
              canManageRequests={canManageRequests} // Pass the determined permission
            />
          )}
        />
      </View>
    </View>
  );
};

export default React.memo(TeamJoinRequestsSection);
