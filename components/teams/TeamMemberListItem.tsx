import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { ShieldCheck, Trash2 } from 'lucide-react-native';
import { TeamMemberRow } from 'store/teamStore';
import { Profile } from 'store/userStore';

interface TeamMemberListItemProps {
  member: TeamMemberRow;
  profile: Profile | null | undefined;
  isCurrentUser: boolean;
  canManage: boolean;
  onRemove: (member: TeamMemberRow) => void;
  isFirstItem: boolean;
}

const TeamMemberListItem: React.FC<TeamMemberListItemProps> = ({
  member,
  profile,
  isCurrentUser,
  canManage,
  onRemove,
  isFirstItem,
}) => {
  const displayName = profile?.display_name || member.user_id?.substring(0, 8) || 'Member';

  return (
    <View
      key={member.id}
      className={`flex-row items-center bg-white p-4 space-x-4 ${
        !isFirstItem ? 'border-t border-gray-100' : ''
      }`}
    >
      {profile?.profile_picture ? (
        <Image
          source={{ uri: profile.profile_picture }}
          className="w-12 h-12 rounded-full bg-gray-100"
        />
      ) : (
        <View className="w-12 h-12 rounded-full bg-gray-200 justify-center items-center">
          <Text className="text-gray-500 text-lg font-semibold">{displayName.charAt(0).toUpperCase()}</Text>
        </View>
      )}
      <View className="flex-1">
        <Text className="text-lg font-semibold text-gray-800">{displayName}</Text>
        <Text className="text-sm text-gray-500 capitalize">{member.role}</Text>
      </View>
      {isCurrentUser && <ShieldCheck size={22} className="text-sky-500" />}
      {canManage && !isCurrentUser && member.user_id && (
        <TouchableOpacity onPress={() => onRemove(member)} className="p-2 active:bg-gray-100 rounded-full">
          <Trash2 size={20} className="text-red-500" />
        </TouchableOpacity>
      )}
    </View>
  );
};

export default React.memo(TeamMemberListItem);