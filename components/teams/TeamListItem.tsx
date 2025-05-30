import React from 'react';
import { View, Text, TouchableOpacity, Image, Platform } from 'react-native';
import { TeamRow } from '../../store/teamStore';
import { Users, ShieldCheck } from 'lucide-react-native';

interface TeamListItemProps {
  team: TeamRow;
  onPress: () => void;
  isUserTeam?: boolean;
}

const TeamListItem: React.FC<TeamListItemProps> = ({ team, onPress, isUserTeam }) => {
  const teamInitial = team.name?.charAt(0).toUpperCase() || '?';

  const cardBackgroundColor = 'bg-[#0A84FF]';
  const textColor = 'text-white';
  const iconColor = '#FFFFFF';
  const descriptionBoxBg = 'bg-white/20 backdrop-blur-md'; 

  return (
    <TouchableOpacity
      onPress={onPress}
      className={`${cardBackgroundColor} rounded-2xl my-2.5 overflow-hidden active:opacity-90`}
      style={{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 5,
      }}
    >
      <View className="p-4">
        <View className="flex-row items-center mb-3">
          {team.logo_url ? (
            <Image 
              source={{ uri: team.logo_url }} 
              className="w-16 h-16 rounded-xl mr-4 bg-white/30" 
            />
          ) : (
            <View className="w-16 h-16 rounded-xl mr-4 bg-white/30 justify-center items-center">
              <Text className={`text-3xl font-semibold ${textColor} opacity-80`}>{teamInitial}</Text>
            </View>
          )}
          <View className="flex-1">
            <View className="flex-row items-center">
              <Text 
                className={`text-xl font-bold ${textColor} mr-2`} 
                numberOfLines={2}
              >
                {team.name}
              </Text>
              {isUserTeam && <ShieldCheck size={20} color={iconColor} className="opacity-90" />}
            </View>
          </View>
        </View>

        {team.description && (
          <View className={`${descriptionBoxBg} rounded-xl p-3`}>
            <Text 
              className={`text-sm ${textColor} opacity-90 leading-snug`} 
              numberOfLines={3}
            >
              {team.description}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

export default TeamListItem;