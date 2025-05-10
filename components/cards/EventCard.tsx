// components/cards/EventCard.tsx
import React from 'react';
import { View, Text } from 'react-native';
import Card from '@components/Card';

type EventCardProps = {
  title: string;
  home_team_name: string;
  away_team_name: string;
  start_time: string;
  location_name?: string;
  onPress: () => void;
};

export const EventCard = ({
  title,
  home_team_name,
  away_team_name,
  start_time,
  location_name,
  onPress,
}: EventCardProps) => (
  <Card onPress={onPress}>
    <Text className="text-lg font-semibold mb-1.5 text-gray-800">{title || 'Event'}</Text>
    <Text className="text-sm text-gray-600 mb-2">
      {home_team_name} vs {away_team_name}
    </Text>
    <Text className="text-xs text-gray-500 mb-1">
      {new Date(start_time).toLocaleDateString()} - {new Date(start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
    </Text>
    {location_name && <Text className="text-xs text-gray-500 italic">{location_name}</Text>}
  </Card>
);
