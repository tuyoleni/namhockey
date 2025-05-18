// src/components/teams/TeamDetailsModal.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, Modal, TouchableOpacity, FlatList, ActivityIndicator, Alert, Image, ScrollView } from 'react-native';
import { useTeamStore, TeamMemberRow } from '../../store/teamStore';
import { useUserStore, Profile } from '../../store/userStore'; // For user profiles
import { Tables } from 'types/database.types';
import AddMemberModal from './AddMemberModal';
import { X, LogOut, UserPlus, Users } from 'lucide-react-native'; // Added Lucide icons

interface TeamDetailsModalProps {
  isVisible: boolean;
  onClose: () => void;
  teamId: string;
  currentUserId: string;
}

const TeamDetailsModal: React.FC<TeamDetailsModalProps> = ({ isVisible, onClose, teamId, currentUserId }) => {
  const {
    teamDetails,
    teamMembers,
    loadingTeamDetails,
    fetchTeamDetails,
    leaveTeam,
    addTeamMember, // For admin to directly add
    requestToJoinTeam,
    fetchJoinRequests,
    approveJoinRequest,
    rejectJoinRequest,
    joinRequests,
    loadingJoinRequests,
    subscribeToTeamMembers,
    subscribeToJoinRequests,
    error: teamError,
  } = useTeamStore();

  const { fetchUser } = useUserStore(); // To fetch profile details for members/requesters

  const [isAddMemberModalVisible, setAddMemberModalVisible] = useState(false);
  const [memberProfiles, setMemberProfiles] = useState<Record<string, Profile | null>>({});
  const [requesterProfiles, setRequesterProfiles] = useState<Record<string, Profile | null>>({});


  const loadDetails = useCallback(async () => {
    await fetchTeamDetails(teamId);
    await fetchJoinRequests(teamId); // Fetch join requests for this team
  }, [teamId, fetchTeamDetails, fetchJoinRequests]);


  useEffect(() => {
    if (isVisible && teamId) {
      loadDetails();
      const unsubscribeMembers = subscribeToTeamMembers(teamId);
      const unsubscribeRequests = subscribeToJoinRequests(teamId);
      return () => {
        unsubscribeMembers();
        unsubscribeRequests();
      };
    }
  }, [isVisible, teamId, loadDetails, subscribeToTeamMembers, subscribeToJoinRequests]);

  // Fetch user profiles for team members
  useEffect(() => {
    const fetchProfiles = async () => {
      const profilesToFetch = teamMembers
        .filter(member => !memberProfiles[member.user_id])
        .map(member => member.user_id);

      if (profilesToFetch.length > 0) {
        const fetchedProfiles: Record<string, Profile | null> = { ...memberProfiles };
        for (const userId of profilesToFetch) {
          const profileData = await fetchUser(userId);
          if (profileData && 'user' in profileData) { // Check if it's not a PostgrestError
            fetchedProfiles[userId] = profileData.user;
          } else {
            fetchedProfiles[userId] = null; // Handle case where profile might not be found
          }
        }
        setMemberProfiles(fetchedProfiles);
      }
    };
    if (teamMembers.length > 0) {
      fetchProfiles();
    }
  }, [teamMembers, fetchUser]); // Removed memberProfiles from dependency array to avoid loop


 useEffect(() => {
    const fetchReqProfiles = async () => {
      const profilesToFetch = joinRequests
        .filter(req => !requesterProfiles[req.user_id] && req.user_id) // Ensure user_id exists
        .map(req => req.user_id!);

      if (profilesToFetch.length > 0) {
        const fetchedProfiles: Record<string, Profile | null> = { ...requesterProfiles };
        for (const userId of profilesToFetch) {
          const profileData = await fetchUser(userId);
           if (profileData && 'user' in profileData) {
            fetchedProfiles[userId] = profileData.user;
          } else {
            fetchedProfiles[userId] = null;
          }
        }
        setRequesterProfiles(fetchedProfiles);
      }
    };
    if (joinRequests.length > 0) {
      fetchReqProfiles();
    }
  }, [joinRequests, fetchUser]); // Removed requesterProfiles from dependency array


  const currentUserMembership = teamMembers.find(member => member.user_id === currentUserId);
  const currentUserRole = currentUserMembership?.role;
  const isUserAdmin = currentUserRole === 'admin';

  const handleLeaveTeam = async () => {
    Alert.alert(
      "Confirm Leave",
      "Are you sure you want to leave this team?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Leave", style: "destructive",
          onPress: async () => {
            await leaveTeam(teamId, currentUserId);
            onClose(); // Close modal after leaving
          }
        }
      ]
    );
  };

  const handleRequestToJoin = async () => {
    await requestToJoinTeam(teamId, currentUserId);
    Alert.alert('Request Sent', 'Your request to join the team has been sent.');
    loadDetails(); // Refresh details
  };

  const handleApproveRequest = async (requestId: string) => {
    await approveJoinRequest(requestId);
    Alert.alert('Approved', 'Join request approved.');
    loadDetails(); // Refresh details
  };

  const handleRejectRequest = async (requestId: string) => {
    await rejectJoinRequest(requestId);
    Alert.alert('Rejected', 'Join request rejected.');
    loadDetails(); // Refresh details
  };

  const renderMemberItem = ({ item }: { item: TeamMemberRow }) => {
    const profile = memberProfiles[item.user_id];
    return (
      <View className="flex-row items-center p-3 border-b border-gray-200">
        {profile?.profile_picture ? (
            <Image source={{uri: profile.profile_picture}} className="w-10 h-10 rounded-full mr-3 bg-gray-200" />
        ): (
            <View className="w-10 h-10 rounded-full mr-3 bg-gray-300 justify-center items-center">
                <Users size={20} color="gray" /> {/* Changed from UserGroupIcon */}
            </View>
        )}
        <View className="flex-1">
            <Text className="text-base font-medium text-gray-800">
                {profile?.display_name || profile?.username || item.user_id.substring(0, 8)}
            </Text>
            <Text className="text-sm text-gray-500 capitalize">{item.role}</Text>
        </View>
        {/* Optionally add kick button for admins here */}
      </View>
    );
  };

  const renderJoinRequestItem = ({ item }: { item: Tables<'team_join_requests'> }) => {
    if (!item.user_id) return null; // Should not happen with proper data
    const profile = requesterProfiles[item.user_id];
    return (
      <View className="flex-row items-center p-3 border-b border-gray-200 justify-between">
        <View className="flex-row items-center">
             {profile?.profile_picture ? (
                <Image source={{uri: profile.profile_picture}} className="w-10 h-10 rounded-full mr-3 bg-gray-200" />
            ): (
                <View className="w-10 h-10 rounded-full mr-3 bg-gray-300 justify-center items-center">
                    <Users size={20} color="gray" /> {/* Changed from UserGroupIcon */}
                </View>
            )}
            <Text className="text-base text-gray-700">{profile?.display_name || profile?.username || item.user_id.substring(0,8)}</Text>
        </View>
        <View className="flex-row">
          <TouchableOpacity onPress={() => handleApproveRequest(item.id)} className="bg-green-500 p-2 rounded-md mr-2">
            <Text className="text-white text-xs">Approve</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleRejectRequest(item.id)} className="bg-red-500 p-2 rounded-md">
            <Text className="text-white text-xs">Reject</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };


  if (!isVisible) return null;

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end bg-black/50">
        <View className="bg-white rounded-t-2xl shadow-xl max-h-[90vh]">
          <View className="flex-row justify-between items-center p-4 border-b border-gray-200">
            <Text className="text-xl font-bold text-gray-800">{teamDetails?.name || 'Team Details'}</Text>
            <TouchableOpacity onPress={onClose} className="p-1">
              <X size={28} color="gray" />
            </TouchableOpacity>
          </View>

          {loadingTeamDetails && !teamDetails ? (
            <View className="p-6 items-center justify-center h-64">
              <ActivityIndicator size="large" color="#0000ff" />
            </View>
          ) : teamError && !teamDetails ? (
             <View className="p-6 items-center justify-center">
                <Text className="text-red-500 text-center">Error: {teamError}</Text>
                 <TouchableOpacity onPress={loadDetails} className="mt-2 bg-blue-500 p-2 rounded">
                    <Text className="text-white">Retry</Text>
                </TouchableOpacity>
             </View>
          ) : teamDetails ? (
            <ScrollView className="p-1">
                <View className="p-4">
                    {teamDetails.logo_url && (
                        <Image source={{uri: teamDetails.logo_url}} className="w-24 h-24 rounded-full self-center mb-4 bg-gray-200" />
                    )}
                    <Text className="text-2xl font-bold text-center text-gray-800 mb-2">{teamDetails.name}</Text>
                    <Text className="text-base text-gray-600 text-center mb-6">{teamDetails.description || 'No description provided.'}</Text>

                    {/* Action Buttons */}
                    <View className="flex-row justify-center space-x-2 mb-6">
                        {currentUserMembership && (
                        <TouchableOpacity
                            onPress={handleLeaveTeam}
                            className="bg-red-500 py-2 px-4 rounded-lg flex-row items-center"
                        >
                            <LogOut size={20} color="white" className="mr-1"/> {/* Changed from ArrowLeftOnRectangleIcon */}
                            <Text className="text-white font-semibold">Leave Team</Text>
                        </TouchableOpacity>
                        )}
                        {!currentUserMembership && teamDetails && ( // Assuming is_public field
                        <TouchableOpacity
                            onPress={handleRequestToJoin}
                            className="bg-green-500 py-2 px-4 rounded-lg flex-row items-center"
                        >
                            <UserPlus size={20} color="white" className="mr-1"/> {/* Changed from UserPlusIcon */}
                            <Text className="text-white font-semibold">Request to Join</Text>
                        </TouchableOpacity>
                        )}
                         {isUserAdmin && (
                           <TouchableOpacity
                             onPress={() => setAddMemberModalVisible(true)}
                             className="bg-blue-500 py-2 px-4 rounded-lg flex-row items-center"
                           >
                             <UserPlus size={20} color="white" className="mr-1"/> {/* Changed from UserPlusIcon */}
                             <Text className="text-white font-semibold">Add Member</Text>
                           </TouchableOpacity>
                         )}
                    </View>


                    {/* Team Members List */}
                    <Text className="text-lg font-semibold text-gray-700 mb-2 mt-4">Members ({teamMembers.length})</Text>
                    {loadingTeamDetails && teamMembers.length === 0 ? (
                        <ActivityIndicator />
                    ) : teamMembers.length > 0 ? (
                        <FlatList
                            data={teamMembers}
                            keyExtractor={(item) => item.id}
                            renderItem={renderMemberItem}
                            scrollEnabled={false} // If inside ScrollView
                        />
                    ) : (
                        <Text className="text-gray-500">No members yet.</Text>
                    )}

                    {/* Join Requests (Admin View) */}
                    {isUserAdmin && (
                        <>
                            <Text className="text-lg font-semibold text-gray-700 mb-2 mt-6">Join Requests ({joinRequests.length})</Text>
                            {loadingJoinRequests ? (
                                <ActivityIndicator />
                            ) : joinRequests.length > 0 ? (
                                <FlatList
                                    data={joinRequests.filter(req => req.status === 'pending')} // Only show pending
                                    keyExtractor={(item) => item.id}
                                    renderItem={renderJoinRequestItem}
                                    scrollEnabled={false}
                                />
                            ) : (
                                <Text className="text-gray-500">No pending join requests.</Text>
                            )}
                        </>
                    )}
                </View>
            </ScrollView>
          ) : (
             <View className="p-6 items-center justify-center">
                <Text className="text-gray-500">Team not found or could not be loaded.</Text>
             </View>
          )}

          {teamDetails && (
            <AddMemberModal
              isVisible={isAddMemberModalVisible}
              onClose={() => setAddMemberModalVisible(false)}
              teamId={teamDetails.id}
              currentMembers={teamMembers.map(m => m.user_id)}
            />
          )}
        </View>
      </View>
    </Modal>
  );
};

export default TeamDetailsModal;