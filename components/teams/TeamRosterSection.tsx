import React from 'react';
import { View, Text, ActivityIndicator, FlatList } from 'react-native'; // Added FlatList
import { TeamMemberRow } from '../../store/teamStore'; // Adjust path as needed
import { UsersIcon } from 'lucide-react-native'; // Example icon for empty state
import TeamMemberListItem from './TeamMemberListItem';

interface TeamRosterSectionProps {
  members: TeamMemberRow[];
  isLoading: boolean;
  currentUserId: string | null; // Can be null if user is not logged in
  canManageSettings: boolean; // True if the current user is admin/manager of this team
  onRemoveMember: (memberUserId: string, memberRole: string) => void;
  teamId: string; // Added for context, though not directly used in this version's rendering logic
}

const TeamRosterSection: React.FC<TeamRosterSectionProps> = ({
  members,
  isLoading,
  currentUserId,
  canManageSettings,
  onRemoveMember,
  teamId,
}) => {

  if (isLoading && members.length === 0) {
    return (
      <View className="mt-6 p-4 items-center bg-white border-y border-gray-200 rounded-lg mx-2 shadow-sm">
        <ActivityIndicator color="#007AFF" />
        <Text className="mt-2 text-gray-500">Loading Roster...</Text>
      </View>
    );
  }

  if (members.length === 0 && !isLoading) {
    return (
      <View className="mt-6 px-4 py-6 bg-white border-y border-gray-200 items-center rounded-lg mx-2 shadow-sm">
        <UsersIcon size={28} color="#6B7280" className="mb-2"/>
        <Text className="text-gray-600">This team has no members yet.</Text>
      </View>
    );
  }

  return (
    <View className="mt-6">
      <Text className="text-xs font-semibold text-gray-500 uppercase px-4 mb-2 tracking-wider">
        Team Roster ({members.length})
      </Text>
      <View className="bg-white border-y border-gray-200 rounded-lg overflow-hidden mx-2 shadow-sm">
        <FlatList
            data={members}
            keyExtractor={(item) => item.id || item.user_id} // Fallback key
            renderItem={({ item, index }) => (
                <TeamMemberListItem
                member={item}
                // The 'profile' prop is no longer needed as item.profiles is used internally
                isCurrentUser={item.user_id === currentUserId}
                canManage={canManageSettings} // Pass the ability to manage
                onRemove={onRemoveMember}
                isFirstItem={index === 0}
                />
            )}
        />
      </View>
    </View>
  );
};
export default React.memo(TeamRosterSection);
