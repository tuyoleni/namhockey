import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { TeamJoinRequestRow } from 'store/teamStore';
import { Profile } from 'store/userStore';

interface JoinRequestListItemProps {
  item: TeamJoinRequestRow;
  profile: Profile | null | undefined;
  onApprove: (requestId: string) => void;
  onReject: (requestId: string) => void;
  isFirstItem: boolean;
}

const JoinRequestListItem: React.FC<JoinRequestListItemProps> = ({
  item,
  profile,
  onApprove,
  onReject,
  isFirstItem,
}) => {
  if (!item.user_id) return null;
  const displayName = profile?.display_name || item.user_id.substring(0, 8);

  return (
    <View
      key={item.id}
      className={`flex-row items-center bg-white p-4 space-x-3 justify-between ${
        !isFirstItem ? 'border-t border-gray-100' : ''
      }`}
    >
      <View className="flex-row items-center space-x-4 flex-1">
        {profile?.profile_picture ? (
          <Image
            source={{ uri: profile.profile_picture }}
            className="w-10 h-10 rounded-full bg-gray-100"
          />
        ) : (
          <View className="w-10 h-10 rounded-full bg-gray-200 justify-center items-center">
            <Text className="text-gray-500 font-semibold">{displayName.charAt(0).toUpperCase()}</Text>
          </View>
        )}
        <Text className="text-base text-gray-700 flex-shrink mr-2" numberOfLines={1}>
          {displayName}
        </Text>
      </View>
      <View className="flex-row space-x-2">
        <TouchableOpacity
          onPress={() => onApprove(item.id)}
          className="bg-green-500 py-2 px-3 rounded-md active:bg-green-600"
        >
          <Text className="text-white text-sm font-medium">Approve</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => onReject(item.id)}
          className="bg-red-500 py-2 px-3 rounded-md active:bg-red-600"
        >
          <Text className="text-white text-sm font-medium">Reject</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default React.memo(JoinRequestListItem);