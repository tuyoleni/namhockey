import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Calendar, Play } from 'lucide-react-native';

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
        className="rounded-2xl bg-[#0A84FF] overflow-hidden h-full"
        style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.15,
          shadowRadius: 6,
          elevation: 4,
        }}
        activeOpacity={0.9}
      >
        {/* Background Icon */}
        <View className="absolute right-0 bottom-0 opacity-10">
          <Play size={80} color="#FFFFFF" />
        </View>
        
        <View className="flex-1 flex-row items-center justify-between px-3 py-2">
          {/* Home Team */}
          <View className="items-center flex-1">
            <View 
              className="w-12 h-12 rounded-full bg-white p-1 shadow-sm"
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.1,
                shadowRadius: 2,
                elevation: 1,
              }}
            >
              <Image
                source={{
                  uri: home_team_logo || 'https://via.placeholder.com/48x48.png?text=H',
                }}
                className="w-full h-full rounded-full bg-gray-50"
                resizeMode="contain"
              />
            </View>
            <Text
              className="text-xs font-bold text-white text-center mt-1.5"
              numberOfLines={1}
            >
              {home_team_name || 'Home'}
            </Text>
          </View>

          {/* VS Divider */}
          <View className="items-center px-2">
            <Text className="text-sm font-bold text-white">VS</Text>
            <View className="flex-row items-center mt-1 bg-white/20 px-2 py-0.5 rounded-full">
              <Text className="text-xs font-medium text-white">{formattedTime}</Text>
            </View>
          </View>

          {/* Away Team */}
          <View className="items-center flex-1">
            <View 
              className="w-12 h-12 rounded-full bg-white p-1 shadow-sm"
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.1,
                shadowRadius: 2,
                elevation: 1,
              }}
            >
              <Image
                source={{
                  uri: away_team_logo || 'https://via.placeholder.com/48x48.png?text=A',
                }}
                className="w-full h-full rounded-full bg-gray-50"
                resizeMode="contain"
              />
            </View>
            <Text
              className="text-xs font-bold text-white text-center mt-1.5"
              numberOfLines={1}
            >
              {away_team_name || 'Away'}
            </Text>
          </View>
        </View>

        {/* Date Footer */}
        <View className="bg-white/20 px-3 py-1.5 flex-row items-center justify-center">
          <Calendar size={12} color="#FFFFFF" strokeWidth={2.5} />
          <Text className="text-xs text-white font-medium ml-1.5">
            {formattedDate}
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};