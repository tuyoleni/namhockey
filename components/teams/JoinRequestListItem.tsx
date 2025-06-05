import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { TeamJoinRequestRow } from 'store/teamStore';
import { XCircleIcon, CheckCircleIcon, ShieldXIcon } from 'lucide-react-native';

interface JoinRequestListItemProps {
  item: TeamJoinRequestRow;
  currentUserId: string | null;
  onApprove: (requestId: string) => void;
  onReject: (requestId: string) => void;
  onCancelRequest: (requestId: string, teamId: string) => void;
  isFirstItem: boolean;
  canManageRequests?: boolean;
}

const JoinRequestListItem: React.FC<JoinRequestListItemProps> = ({
  item,
  currentUserId,
  onApprove,
  onReject,
  onCancelRequest,
  isFirstItem,
  canManageRequests = false,
}) => {
  if (!item || !item.user_id) {
    return null;
  }

  const userProfile = item.profiles;
  const displayName = userProfile?.display_name || `User ${item.user_id.substring(0, 6)}`;
  const profilePictureUrl = userProfile?.profile_picture;
  const isOwnRequest = item.user_id === currentUserId;

  return (
    <View
      className={`flex-row items-center bg-white p-3.5 ${
        !isFirstItem ? 'border-t border-gray-200' : ''
      }`}
    >
      <View className="flex-row items-center flex-1 space-x-3">
        {profilePictureUrl ? (
          <Image
            source={{ uri: profilePictureUrl }}
            className="w-10 h-10 rounded-full bg-gray-100"
          />
        ) : (
          <View className="w-10 h-10 rounded-full bg-gray-300 justify-center items-center">
            <Text className="text-gray-600 font-semibold text-sm">
              {displayName.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        <View className="flex-1 mr-2">
          <Text
            className="text-sm text-gray-800 font-semibold"
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {displayName}
          </Text>
          {isOwnRequest && (
            <Text className="text-xs text-sky-600 font-medium">(Your Request)</Text>
          )}
        </View>
      </View>

      <View className="flex-row space-x-1.5">
        {isOwnRequest ? (
          <TouchableOpacity
            onPress={() => onCancelRequest(item.id, item.team_id)}
            className="bg-yellow-500 py-1.5 px-2.5 rounded-md active:bg-yellow-600 shadow-sm flex-row items-center"
          >
            <XCircleIcon size={14} color="white" className="mr-1"/>
            <Text className="text-white text-xs font-semibold">Cancel</Text>
          </TouchableOpacity>
        ) : canManageRequests ? (
          <>
            <TouchableOpacity
              onPress={() => onApprove(item.id)}
              className="bg-green-500 py-1.5 px-2.5 rounded-md active:bg-green-600 shadow-sm flex-row items-center"
            >
              <CheckCircleIcon size={14} color="white" className="mr-1"/>
              <Text className="text-white text-xs font-semibold">Approve</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => onReject(item.id)}
              className="bg-red-500 py-1.5 px-2.5 rounded-md active:bg-red-600 shadow-sm flex-row items-center"
            >
              <ShieldXIcon size={14} color="white" className="mr-1"/>
              <Text className="text-white text-xs font-semibold">Reject</Text>
            </TouchableOpacity>
          </>
        ) : (
          item.status === 'pending' && <Text className="text-xs text-gray-500 italic px-2">Pending</Text>
        )}
      </View>
    </View>
  );
};

export default React.memo(JoinRequestListItem);
