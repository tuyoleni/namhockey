// components/cards/ResultCard.tsx
import React from 'react';
import { View, Text } from 'react-native';
import Card from '@components/Card';

type ResultCardProps = {
  title: string;
  home_team_name: string;
  away_team_name: string;
  home_team_score: number;
  away_team_score: number;
  start_time: string;
  location_name?: string;
  onPress: () => void;
};

export const ResultCard = ({
  title,
  home_team_name,
  away_team_name,
  home_team_score,
  away_team_score,
  start_time,
  location_name,
  onPress,
}: ResultCardProps) => (
  <Card onPress={onPress}>
    <Text className="text-lg font-semibold mb-1.5 text-gray-800">{title || 'Match Result'}</Text>
    <View className="flex-row justify-around items-center my-2">
      <Text className="text-sm font-medium text-gray-700 flex-1 text-center">{home_team_name}</Text>
      <Text className="text-lg font-bold text-blue-600 flex-initial mx-1">{home_team_score ?? '-'}</Text>
      <Text className="text-xs text-gray-500 mx-2">vs</Text>
      <Text className="text-lg font-bold text-blue-600 flex-initial mx-1">{away_team_score ?? '-'}</Text>
      <Text className="text-sm font-medium text-gray-700 flex-1 text-center">{away_team_name}</Text>
    </View>
    <Text className="text-xs text-gray-500 mb-1">Played on: {new Date(start_time).toLocaleDateString()}</Text>
    {location_name && <Text className="text-xs text-gray-500 italic">{location_name}</Text>}
  </Card>
);
