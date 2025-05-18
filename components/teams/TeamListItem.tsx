// src/components/teams/TeamListItem.tsx
import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { TeamRow } from '../../store/teamStore'
import { User } from 'lucide-react-native';

interface TeamListItemProps {
  team: TeamRow;
  onPress: () => void;
}

const TeamListItem: React.FC<TeamListItemProps> = ({ team, onPress }) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="bg-white p-4 rounded-lg shadow-md mb-3 flex-row items-center"
    >
      {team.logo_url ? (
        <Image source={{ uri: team.logo_url }} className="w-12 h-12 rounded-full mr-4 bg-gray-200" />
      ) : (
        <View className="w-12 h-12 rounded-full mr-4 bg-gray-300 justify-center items-center">
          <User size={24} color="gray" />
        </View>
      )}
      <View className="flex-1">
        <Text className="text-lg font-semibold text-gray-800">{team.name}</Text>
        {team.description && (
          <Text className="text-sm text-gray-600" numberOfLines={1}>
            {team.description}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

export default TeamListItem;