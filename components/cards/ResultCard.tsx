// components/cards/ResultCard.tsx
import React from 'react';
import { Text, View, Image, TouchableOpacity } from 'react-native';

type ResultCardProps = {
  title: string;
  home_team_name: string;
  away_team_name: string;
  home_team_score: number;
  away_team_score: number;
  start_time: string;
  location_name?: string;
  home_team_logo?: string;
  away_team_logo?: string;
  onPress: () => void;
  isLive?: boolean;
  backgroundColor?: string;
};

export const ResultCard = ({
  home_team_name,
  away_team_name,
  home_team_score,
  away_team_score,
  home_team_logo,
  away_team_logo,
  start_time,
  location_name,
  onPress,
  isLive = false,
  backgroundColor = 'bg-blue-600',
}: ResultCardProps) => (
  <TouchableOpacity
    onPress={onPress}
    className={`${backgroundColor} rounded-3xl p-4 m-2 w-[280px] h-[280px] relative`}
  >
    {isLive && (
      <View className="absolute top-3 left-3 flex-row items-center">
        <Text className="bg-white px-3 py-1 rounded-full text-xs font-bold">LIVE</Text>
      </View>
    )}

    <View className="flex-1 flex-row items-center justify-between">
      {/* Home Team */}
      <View className="flex-1 items-center">
        {home_team_logo && (
          <Image
            source={{ uri: home_team_logo }}
            className="w-16 h-16 mb-2"
            resizeMode="contain"
          />
        )}
        <Text className="text-white text-base font-semibold text-center">
          {home_team_name}
        </Text>
      </View>

      {/* Score */}
      <View className="flex-row items-center justify-center space-x-3 px-4">
        <Text className="text-white text-3xl font-bold">
          {home_team_score ?? 0}
        </Text>
        <Text className="text-white/60 text-2xl font-medium">-</Text>
        <Text className="text-white text-3xl font-bold">
          {away_team_score ?? 0}
        </Text>
      </View>

      {/* Away Team */}
      <View className="flex-1 items-center">
        {away_team_logo && (
          <Image
            source={{ uri: away_team_logo }}
            className="w-16 h-16 mb-2"
            resizeMode="contain"
          />
        )}
        <Text className="text-white text-base font-semibold text-center">
          {away_team_name}
        </Text>
      </View>
    </View>

    {/* Bottom Details */}
    <View className="absolute bottom-4 left-4">
      <Text className="text-white/80 text-sm font-medium">
        {new Date(start_time).toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric'
        })}
      </Text>
      {location_name && (
        <Text className="text-white/60 text-xs mt-1">
          {location_name}
        </Text>
      )}
    </View>
  </TouchableOpacity>
);