import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { TeamMemberRow } from 'store/teamStore';
import TeamMemberListItem from './TeamMemberListItem';
import { Profile } from 'store/userStore';

interface TeamRosterSectionProps {
  members: TeamMemberRow[];
  profiles: Record<string, Profile | null>;
  isLoading: boolean;
  currentUserId: string;
  canManageSettings: boolean;
  onRemoveMember: (member: TeamMemberRow) => void;
}

const TeamRosterSection: React.FC<TeamRosterSectionProps> = ({
  members,
  profiles,
  isLoading,
  currentUserId,
  canManageSettings,
  onRemoveMember,
}) => {
  return (
    <View className="mt-6">
      <Text className="text-xs font-semibold text-gray-400 uppercase px-4 mb-1">
        Roster ({members.length})
      </Text>
      {isLoading && members.length === 0 ? (
        <View className="p-4 items-center bg-white border-y border-gray-200">
          <ActivityIndicator color="#007AFF" />
        </View>
      ) : members.length > 0 ? (
        <View className="bg-white border-y border-gray-200">
          {members.map((member, index) => (
            <TeamMemberListItem
              key={member.id || member.user_id} // Ensure unique key
              member={member}
              profile={member.user_id ? profiles[member.user_id] : null}
              isCurrentUser={member.user_id === currentUserId}
              canManage={canManageSettings}
              onRemove={onRemoveMember}
              isFirstItem={index === 0}
            />
          ))}
        </View>
      ) : (
        <Text className="text-gray-500 text-center bg-white p-6 border-y border-gray-200">
          No members in this team yet.
        </Text>
      )}
    </View>
  );
};
export default React.memo(TeamRosterSection);