import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { TeamRow } from '../../store/teamStore';
import { Users, ShieldCheck } from 'lucide-react-native';

interface TeamListItemProps {
  team: TeamRow;
  onPress: () => void;
  isUserTeam?: boolean;
}

const TeamListItem: React.FC<TeamListItemProps> = ({ team, onPress, isUserTeam }) => {
  const teamInitial = team.name?.charAt(0).toUpperCase() || '?';

  return (
    <TouchableOpacity
      onPress={onPress}
      className={`
        bg-white 
        p-5 
        rounded-2xl 
        mb-4 
        flex-row 
        items-center 
        active:bg-gray-100 
        border
        ${isUserTeam ? 'border-sky-500 border-2 shadow-md shadow-sky-200/50' : 'border-gray-200'}
      `}
    >
      {team.logo_url ? (
        <Image 
          source={{ uri: team.logo_url }} 
          className="w-16 h-16 rounded-xl mr-4 bg-gray-100" 
        />
      ) : (
        <View className="w-16 h-16 rounded-xl mr-4 bg-gray-200 justify-center items-center">
          <Text className="text-2xl font-semibold text-gray-500">{teamInitial}</Text>
        </View>
      )}
      <View className="flex-1">
        <View className="flex-row items-center mb-0.5">
          <Text 
            className="text-xl font-bold text-gray-900 mr-2 bg-red-600" 
            numberOfLines={1}
          >
            {team.name}
          </Text>
          {isUserTeam && <ShieldCheck size={18} className="text-sky-500" />}
        </View>
        {team.description && (
          <Text 
            className="text-sm text-gray-600 leading-snug" 
            numberOfLines={2}
          >
            {team.description}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

export default TeamListItem;