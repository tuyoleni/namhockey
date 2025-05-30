import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, Modal, TouchableOpacity, FlatList, ActivityIndicator, Alert, Image, ScrollView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTeamStore, TeamMemberRow, TeamJoinRequestRow } from '../../store/teamStore';
import { useUserStore, Profile } from '../../store/userStore';
import AddMemberModal from './AddMemberModal';
import { X, LogOut, UserPlus, Users, ShieldCheck, Mail } from 'lucide-react-native';

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
    requestToJoinTeam,
    fetchJoinRequests,
    approveJoinRequest,
    rejectJoinRequest,
    joinRequests,
    loadingJoinRequests,
    subscribeToTeamMembers,
    subscribeToJoinRequests,
    error: teamStoreError,
  } = useTeamStore();

  const { fetchUser } = useUserStore();

  const [isAddMemberModalVisible, setAddMemberModalVisible] = useState(false);
  const [memberProfiles, setMemberProfiles] = useState<Record<string, Profile | null>>({});
  const [requesterProfiles, setRequesterProfiles] = useState<Record<string, Profile | null>>({});

  const loadAllDetails = useCallback(async () => {
    if (teamId) {
      await fetchTeamDetails(teamId);
      await fetchJoinRequests(teamId);
    }
  }, [teamId, fetchTeamDetails, fetchJoinRequests]);

  useEffect(() => {
    if (isVisible && teamId) {
      loadAllDetails();
      const unsubscribeMembers = subscribeToTeamMembers(teamId);
      const unsubscribeRequests = subscribeToJoinRequests(teamId);
      return () => {
        unsubscribeMembers();
        unsubscribeRequests();
      };
    }
  }, [isVisible, teamId, loadAllDetails, subscribeToTeamMembers, subscribeToJoinRequests]);

  const fetchProfilesForUsers = useCallback(async (
    userIds: string[], 
    currentProfiles: Record<string, Profile | null>, 
    setProfiles: React.Dispatch<React.SetStateAction<Record<string, Profile | null>>>
  ) => {
    const profilesToFetch = userIds.filter(id => id && !currentProfiles[id]);
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
      setProfiles(prev => ({ ...prev, ...fetchedProfilesUpdate }));
    }
  }, [fetchUser]);

  useEffect(() => {
    const memberUserIds = teamMembers.map(member => member.user_id).filter(Boolean);
    if (memberUserIds.length > 0) {
      fetchProfilesForUsers(memberUserIds as string[], memberProfiles, setMemberProfiles);
    }
  }, [teamMembers, fetchProfilesForUsers]);

 useEffect(() => {
    const requesterUserIds = joinRequests.map(req => req.user_id).filter(Boolean);
    if (requesterUserIds.length > 0) {
      fetchProfilesForUsers(requesterUserIds as string[], requesterProfiles, setRequesterProfiles);
    }
  }, [joinRequests, fetchProfilesForUsers]);

  const currentUserMembership = teamMembers.find(member => member.user_id === currentUserId);
  const isUserAdmin = currentUserMembership?.role === 'admin';
  const hasPendingRequest = joinRequests.some(req => req.user_id === currentUserId && req.status === 'pending');

  const handleLeaveTeam = () => {
    Alert.alert("Leave Team", "Are you sure you want to leave this team?", [
      { text: "Cancel", style: "cancel" },
      { text: "Leave", style: "destructive", onPress: async () => {
          await leaveTeam(teamId, currentUserId);
          if (teamStoreError) Alert.alert("Error", teamStoreError); else onClose();
      }}
    ]);
  };

  const handleRequestToJoin = async () => {
    await requestToJoinTeam(teamId, currentUserId);
    if (teamStoreError) Alert.alert("Error", teamStoreError);
    else Alert.alert('Request Sent', 'Your request to join the team has been sent.');
    loadAllDetails();
  };

  const handleApproveRequest = async (requestId: string) => {
    await approveJoinRequest(requestId);
    if (teamStoreError) Alert.alert("Error", teamStoreError);
    else Alert.alert('Approved', 'Join request approved.');
    loadAllDetails();
  };

  const handleRejectRequest = async (requestId: string) => {
    await rejectJoinRequest(requestId);
    if (teamStoreError) Alert.alert("Error", teamStoreError);
    else Alert.alert('Rejected', 'Join request rejected.');
    loadAllDetails();
  };

  const renderMemberItem = ({ item, index }: { item: TeamMemberRow, index: number }) => {
    const profile = memberProfiles[item.user_id];
    const displayName = profile?.display_name || profile?.username || item.user_id.substring(0, 8);
    return (
      <View className={`flex-row items-center p-4 space-x-3 ${index > 0 ? 'border-t border-gray-100 dark:border-gray-700' : ''}`}>
        {profile?.profile_picture ? (
            <Image source={{uri: profile.profile_picture}} className="w-10 h-10 rounded-full bg-gray-200" />
        ): (
            <View className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-600 justify-center items-center">
                <Text className="text-gray-500 dark:text-gray-300 font-semibold">{displayName.charAt(0).toUpperCase()}</Text>
            </View>
        )}
        <View className="flex-1">
            <Text className="text-base font-medium text-gray-800 dark:text-gray-100">{displayName}</Text>
            <Text className="text-sm text-gray-500 dark:text-gray-400 capitalize">{item.role}</Text>
        </View>
        {item.user_id === currentUserId && <ShieldCheck size={20} className="text-sky-500" />}
      </View>
    );
  };

  const renderJoinRequestItem = ({ item, index }: { item: TeamJoinRequestRow, index: number }) => {
    if (!item.user_id) return null;
    const profile = requesterProfiles[item.user_id];
    const displayName = profile?.display_name || profile?.username || item.user_id.substring(0,8);
    return (
      <View className={`flex-row items-center p-4 space-x-3 justify-between ${index > 0 ? 'border-t border-gray-100 dark:border-gray-700' : ''}`}>
        <View className="flex-row items-center space-x-3 flex-1">
             {profile?.profile_picture ? (
                <Image source={{uri: profile.profile_picture}} className="w-10 h-10 rounded-full bg-gray-200" />
            ): (
                <View className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-600 justify-center items-center">
                     <Text className="text-gray-500 dark:text-gray-300 font-semibold">{displayName.charAt(0).toUpperCase()}</Text>
                </View>
            )}
            <Text className="text-base text-gray-700 dark:text-gray-200 flex-shrink mr-2" numberOfLines={1}>{displayName}</Text>
        </View>
        <View className="flex-row space-x-2">
          <TouchableOpacity onPress={() => handleApproveRequest(item.id)} className="bg-green-500 py-1.5 px-3 rounded-md active:bg-green-600">
            <Text className="text-white text-xs font-medium">Approve</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleRejectRequest(item.id)} className="bg-red-500 py-1.5 px-3 rounded-md active:bg-red-600">
            <Text className="text-white text-xs font-medium">Reject</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (!isVisible) return null;

  return (
    <Modal
      animationType="slide"
      transparent={false}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-gray-50 dark:bg-gray-900" >
          <View className="flex-row justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <Text className="text-xl font-semibold text-gray-800 dark:text-white">{teamDetails?.name || 'Team Details'}</Text>
            <TouchableOpacity onPress={onClose} className="p-2 rounded-full active:bg-gray-200 dark:active:bg-gray-700">
              <X size={24} className="text-gray-600 dark:text-gray-300" />
            </TouchableOpacity>
          </View>

          {loadingTeamDetails && !teamDetails ? (
            <View className="flex-1 p-6 items-center justify-center">
              <ActivityIndicator size="large" color="#007AFF" />
            </View>
          ) : teamStoreError && !teamDetails ? (
             <View className="flex-1 p-6 items-center justify-center">
                <Text className="text-red-500 text-center">Error: {teamStoreError}</Text>
                 <TouchableOpacity onPress={loadAllDetails} className="mt-3 bg-sky-500 py-2 px-4 rounded-md active:bg-sky-600">
                    <Text className="text-white">Retry</Text>
                </TouchableOpacity>
             </View>
          ) : teamDetails ? (
            <ScrollView>
                <View className="items-center p-6 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                    {teamDetails.logo_url && (
                        <Image source={{uri: teamDetails.logo_url}} className="w-24 h-24 rounded-full mb-4 bg-gray-200 border-2 border-gray-300 dark:border-gray-600" />
                    )}
                    <Text className="text-2xl font-bold text-center text-gray-800 dark:text-white mb-1">{teamDetails.name}</Text>
                    <Text className="text-base text-gray-600 dark:text-gray-400 text-center mb-1">{teamDetails.description || 'No description.'}</Text>
                    <Text className={`text-xs ${teamDetails.is_public ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'} font-medium`}>
                        {teamDetails.is_public ? 'Public Team' : 'Private Team'}
                    </Text>
                </View>
                
                <View className="py-4 px-2">
                    <View className="flex-row justify-center space-x-3 my-2">
                        {currentUserMembership && (
                        <TouchableOpacity onPress={handleLeaveTeam} className="bg-red-600 py-3 px-5 rounded-lg flex-row items-center space-x-2 active:bg-red-700">
                            <LogOut size={18} color="white"/>
                            <Text className="text-white font-semibold">Leave Team</Text>
                        </TouchableOpacity>
                        )}
                        {!currentUserMembership && teamDetails.is_public && !hasPendingRequest && (
                        <TouchableOpacity onPress={handleRequestToJoin} className="bg-green-600 py-3 px-5 rounded-lg flex-row items-center space-x-2 active:bg-green-700">
                            <UserPlus size={18} color="white"/>
                            <Text className="text-white font-semibold">Request to Join</Text>
                        </TouchableOpacity>
                        )}
                        {hasPendingRequest && (
                             <View className="bg-yellow-100 dark:bg-yellow-700 py-3 px-5 rounded-lg flex-row items-center space-x-2">
                                <Mail size={18} className="text-yellow-600 dark:text-yellow-200"/>
                                <Text className="text-yellow-700 dark:text-yellow-100 font-semibold">Request Pending</Text>
                            </View>
                        )}
                         {isUserAdmin && (
                           <TouchableOpacity onPress={() => setAddMemberModalVisible(true)} className="bg-sky-500 py-3 px-5 rounded-lg flex-row items-center space-x-2 active:bg-sky-600">
                             <UserPlus size={18} color="white"/>
                             <Text className="text-white font-semibold">Add Member</Text>
                           </TouchableOpacity>
                         )}
                    </View>

                    <View className="mt-6">
                        <Text className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase px-4 mb-1">Members ({teamMembers.length})</Text>
                        {loadingTeamDetails && teamMembers.length === 0 ? (<ActivityIndicator className="mt-4"/>
                        ) : teamMembers.length > 0 ? (
                            <View className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                                {teamMembers.map((item, index) => renderMemberItem({item, index}))}
                            </View>
                        ) : (
                            <Text className="text-gray-500 dark:text-gray-400 text-center py-4">No members in this team yet.</Text>
                        )}
                    </View>

                    {isUserAdmin && (
                        <View className="mt-8">
                            <Text className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase px-4 mb-1">Join Requests ({joinRequests.filter(req => req.status === 'pending').length})</Text>
                            {loadingJoinRequests ? (<ActivityIndicator className="mt-4"/>
                            ) : joinRequests.filter(req => req.status === 'pending').length > 0 ? (
                                 <View className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                                    {joinRequests.filter(req => req.status === 'pending').map((item, index) => renderJoinRequestItem({item, index}))}
                                </View>
                            ) : (
                                <Text className="text-gray-500 dark:text-gray-400 text-center py-4">No pending join requests.</Text>
                            )}
                        </View>
                    )}
                </View>
            </ScrollView>
          ) : (
             <View className="flex-1 p-6 items-center justify-center">
                <Text className="text-gray-500 dark:text-gray-400">Team not found.</Text>
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
    </Modal>
  );
};

export default TeamDetailsModal;