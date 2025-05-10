// components/cards/NewsCard.tsx
import React from 'react';
import { Text } from 'react-native';
import Card from '@components/Card';

type NewsCardProps = {
  title: string;
  published_at: string;
  onPress: () => void;
};

export const NewsCard = ({ title, published_at, onPress }: NewsCardProps) => (
  <Card onPress={onPress}>
    <Text className="text-lg font-semibold mb-1.5 text-gray-800">{title}</Text>
    <Text className="text-xs text-gray-500">
      {new Date(published_at).toLocaleDateString()}
    </Text>
  </Card>
);
