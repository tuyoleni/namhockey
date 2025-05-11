import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';

type EventCardProps = {
  home_team_name?: string;
  away_team_name?: string;
  home_team_logo?: string;
  away_team_logo?: string;
  start_time?: string;
  onPress: () => void;
};

export const EventCard = ({
  home_team_name,
  away_team_name,
  home_team_logo,
  away_team_logo,
  start_time,
  onPress,
}: EventCardProps) => {
  const formattedDate = start_time
    ? new Date(start_time).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : 'TBD';

  const formattedTime = start_time
    ? new Date(start_time).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  return (
    <View className="w-[260px] h-[100px]">
      <TouchableOpacity
        onPress={onPress}
        className="rounded-2xl bg-white shadow-lg overflow-hidden"
      >
        <View className="flex-row items-center justify-between px-3 py-2">
          {/* Home Team */}
          <View className="items-center">
            <Image
              source={{
                uri: home_team_logo || 'https://via.placeholder.com/48x48.png?text=H',
              }}
              className="w-10 h-10 rounded-full bg-gray-50"
              resizeMode="contain"
            />
            <Text
              className="text-xs font-semibold text-gray-800 text-center mt-1"
              numberOfLines={1}
            >
              {home_team_name || 'Home'}
            </Text>
          </View>

          {/* VS Divider */}
          <View className="items-center px-2">
            <Text className="text-sm font-bold text-gray-400">VS</Text>
            <Text className="text-xs text-gray-400">{formattedTime}</Text>
          </View>

          {/* Away Team */}
          <View className="items-center">
            <Image
              source={{
                uri: away_team_logo || 'https://via.placeholder.com/48x48.png?text=A',
              }}
              className="w-10 h-10 rounded-full bg-gray-50"
              resizeMode="contain"
            />
            <Text
              className="text-xs font-semibold text-gray-800 text-center mt-1"
              numberOfLines={1}
            >
              {away_team_name || 'Away'}
            </Text>
          </View>
        </View>

        {/* Date Footer */}
        <View className="border-t border-gray-100 px-3 py-0.5 bg-gray-50">
          <Text className="text-xs text-gray-500 font-medium text-center">
            {formattedDate}
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};
