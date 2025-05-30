import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { TeamJoinRequestRow } from 'store/teamStore';
import JoinRequestListItem from './JoinRequestListItem';
import { Profile } from 'store/userStore';

interface JoinRequestsSectionProps {
  requests: TeamJoinRequestRow[];
  profiles: Record<string, Profile | null>;
  isLoading: boolean;
  onApprove: (requestId: string) => void;
  onReject: (requestId: string) => void;
}

const JoinRequestsSection: React.FC<JoinRequestsSectionProps> = ({
  requests,
  profiles,
  isLoading,
  onApprove,
  onReject,
}) => {
  const pendingRequests = requests.filter(req => req.status === 'pending');

  if (pendingRequests.length === 0 && !isLoading) {
    return null; // Or a message like "No pending join requests."
  }

  return (
    <View className="mt-6">
      <Text className="text-xs font-semibold text-gray-400 uppercase px-4 mb-1">
        Join Requests ({pendingRequests.length})
      </Text>
      <View className="bg-white border-y border-gray-200">
        {isLoading ? (
          <View className="p-4 items-center">
            <ActivityIndicator />
          </View>
        ) : (
          pendingRequests.map((item, index) => (
            <JoinRequestListItem
              key={item.id}
              item={item}
              profile={item.user_id ? profiles[item.user_id] : null}
              onApprove={onApprove}
              onReject={onReject}
              isFirstItem={index === 0}
            />
          ))
        )}
      </View>
    </View>
  );
};

export default React.memo(JoinRequestsSection);