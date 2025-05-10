// components/skeletons/NewsSkeleton.tsx
import React from 'react';
import { View } from 'react-native';

export const NewsSkeleton = () => (
  <View className="bg-gray-200 rounded-lg p-4 mb-4 h-40">
    <View className="bg-gray-300 rounded-md w-full h-10" />
    <View className="bg-gray-300 rounded-md w-3/4 h-3 mt-4" />
    <View className="bg-gray-300 rounded-md w-1/2 h-3 mt-2" />
  </View>
);
