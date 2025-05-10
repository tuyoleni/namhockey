import React from 'react';
import { View, Text, TouchableOpacity, Image, Animated } from 'react-native';

type EventCardProps = {
  home_team_name?: string;
  away_team_name?: string;
  home_team_logo?: string;
  away_team_logo?: string;
  start_time?: string;
  onPress: () => void;
  scrollY: Animated.Value;  // Scroll position to animate card
};

export const EventCard = ({
  home_team_name,
  away_team_name,
  home_team_logo,
  away_team_logo,
  start_time,
  onPress,
  scrollY,
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

  const scale = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0.9],  // Scale down as you scroll
    extrapolate: 'clamp',
  });

  const opacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0.5],  // Fade out as you scroll
    extrapolate: 'clamp',
  });

  return (
    <TouchableOpacity
      onPress={onPress}
      className="w-80 rounded-2xl bg-white shadow-md overflow-hidden mr-4"
      style={{ transform: [{ scale }], opacity }}  // Apply animation here
    >
      <View className="flex-row items-center justify-between px-4 py-6">
        <View className="flex-1 items-center">
          <Image
            source={{
              uri: home_team_logo || 'https://via.placeholder.com/48x48.png?text=H',
            }}
            className="w-12 h-12 mb-2 rounded-full bg-red-100"
            resizeMode="contain"
          />
          <Text className="text-sm font-medium text-black text-center" numberOfLines={1}>
            {home_team_name || 'Home'}
          </Text>
        </View>

        <View className="w-[1px] h-20 bg-gray-200 mx-4" />

        <View className="flex-1 items-center">
          <Image
            source={{
              uri: away_team_logo || 'https://via.placeholder.com/48x48.png?text=A',
            }}
            className="w-12 h-12 mb-2 rounded-full bg-blue-100"
            resizeMode="contain"
          />
          <Text className="text-sm font-medium text-black text-center" numberOfLines={1}>
            {away_team_name || 'Away'}
          </Text>
        </View>
      </View>

      <View className="border-t border-gray-200 px-4 py-3 bg-gray-50">
        <Text className="text-xs text-gray-500 font-medium text-center">
          {formattedDate} {formattedTime && `· ${formattedTime}`}
        </Text>
      </View>
    </TouchableOpacity>
  );
};
