import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { LogOut, UserPlus, Mail } from 'lucide-react-native';
import { TeamMemberRow } from 'store/teamStore';

interface TeamActionButtonsProps {
  currentUserMembership: TeamMemberRow | undefined;
  teamIsPublic: any;
  hasPendingRequest: boolean;
  onLeaveTeam: () => void;
  onRequestToJoin: () => void;
}

const TeamActionButtons: React.FC<TeamActionButtonsProps> = ({
  currentUserMembership,
  teamIsPublic,
  hasPendingRequest,
  onLeaveTeam,
  onRequestToJoin,
}) => {
  return (
    <View className="flex-row justify-center items-center flex-wrap px-4 mb-4">
      {currentUserMembership && (
        <TouchableOpacity
          onPress={onLeaveTeam}
          className="bg-red-500 py-3 px-5 rounded-lg flex-row items-center space-x-2 active:bg-red-600 m-1.5 shadow-sm"
        >
          <LogOut size={18} color="white" />
          <Text className="text-white font-semibold">Leave Team</Text>
        </TouchableOpacity>
      )}
      {!currentUserMembership && (
        <TouchableOpacity
          onPress={onRequestToJoin}
          className="bg-green-500 py-3 px-5 rounded-lg flex-row items-center space-x-2 active:bg-green-600 m-1.5 shadow-sm"
        >
          <UserPlus size={18} color="white" />
          <Text className="text-white font-semibold">Request to Join</Text>
        </TouchableOpacity>
      )}
      {hasPendingRequest && (
        <View className="bg-yellow-400 py-3 px-5 rounded-lg flex-row items-center space-x-2 m-1.5 shadow-sm">
          <Mail size={18} className="text-white" />
          <Text className="text-white font-semibold">Request Pending</Text>
        </View>
      )}
    </View>
  );
};

export default React.memo(TeamActionButtons);