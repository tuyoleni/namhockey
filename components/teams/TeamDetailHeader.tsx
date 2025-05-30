import React from 'react';
import { View, Text, Image } from 'react-native';
import { TeamRow } from 'store/teamStore'; // Adjust path as needed

interface TeamDetailHeaderProps {
  teamDetails: TeamRow;
}

const TeamDetailHeader: React.FC<TeamDetailHeaderProps> = ({ teamDetails }) => {
  return (
    <View className="items-center p-6 py-8 bg-white border-b border-gray-200">
      {teamDetails.logo_url && (
        <Image
          source={{ uri: teamDetails.logo_url }}
          className="w-28 h-28 rounded-full mb-5 bg-gray-100 border-4 border-white shadow-md"
        />
      )}
      <Text className="text-3xl font-bold text-center text-gray-900">{teamDetails.name}</Text>
      {teamDetails.description && (
        <Text className="text-lg text-gray-600 text-center mt-1 mb-3 px-4">
          {teamDetails.description}
        </Text>
      )}
      <View
        className={`px-3 py-1 rounded-full ${
          teamDetails.is_public ? 'bg-green-100' : 'bg-gray-100'
        }`}
      >
        <Text
          className={`text-xs ${
            teamDetails.is_public ? 'text-green-700' : 'text-gray-600'
          } font-medium`}
        >
          {teamDetails.is_public ? 'Public Team' : 'Private Team'}
        </Text>
      </View>
    </View>
  );
};

export default React.memo(TeamDetailHeader);