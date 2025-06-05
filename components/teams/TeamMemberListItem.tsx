import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { ShieldCheck, Trash2, UserCircle2 } from 'lucide-react-native'; // Added UserCircle2 for placeholder
import { TeamMemberRow } from '../../store/teamStore'; // Adjust path as needed

interface TeamMemberListItemProps {
  member: TeamMemberRow; // This type includes 'profiles'
  isCurrentUser: boolean;
  canManage: boolean; // True if the current user can manage this member (e.g., remove)
  onRemove?: (memberUserId: string, memberRole: string) => void; // Pass member's user_id and role for removal logic
  isFirstItem: boolean;
}

const TeamMemberListItem: React.FC<TeamMemberListItemProps> = ({
  member,
  isCurrentUser,
  canManage,
  onRemove,
  isFirstItem,
}) => {
  // Use profile information from the nested 'profiles' object within 'member'
  const userProfile = member.profiles;
  const displayName = userProfile?.display_name || `User ${member.user_id?.substring(0, 6) || 'N/A'}`;
  const profilePictureUrl = userProfile?.profile_picture;

  const handleRemove = () => {
    if (onRemove && member.user_id) {
      // Prevent removing oneself if that's not allowed, or if manager tries to remove self (handled by store)
      if (isCurrentUser && member.role === 'admin') { // Example: admin cannot remove self directly here
          // Alert.alert("Cannot Remove Self", "Admins cannot remove themselves directly from this list.");
          console.warn("Attempted to remove self as admin via list item.");
          return;
      }
      onRemove(member.user_id, member.role);
    }
  };

  return (
    <View
      className={`flex-row items-center bg-white p-4 space-x-3 ${
        !isFirstItem ? 'border-t border-gray-100' : ''
      }`}
    >
      {profilePictureUrl ? (
        <Image
          source={{ uri: profilePictureUrl }}
          className="w-10 h-10 rounded-full bg-gray-100"
        />
      ) : (
        <View className="w-10 h-10 rounded-full bg-gray-200 justify-center items-center">
          <UserCircle2 size={24} className="text-gray-400"/>
        </View>
      )}
      <View className="flex-1">
        <Text className="text-base font-medium text-gray-800" numberOfLines={1}>{displayName}</Text>
        <Text className="text-sm text-gray-500 capitalize">{member.role}</Text>
      </View>
      {isCurrentUser && <ShieldCheck size={20} className="text-sky-500" />}
      {canManage && !isCurrentUser && onRemove && ( // Show remove button if admin and not self
        <TouchableOpacity onPress={handleRemove} className="p-1.5 active:bg-gray-100 rounded-full">
          <Trash2 size={18} className="text-red-500" />
        </TouchableOpacity>
      )}
    </View>
  );
};

export default React.memo(TeamMemberListItem);
