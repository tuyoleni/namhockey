import React from 'react';
import { View } from 'react-native';

export const ResultSkeleton = () => (
  <View className="bg-gray-200 rounded-lg p-4 mb-4 h-48">
    <View className="bg-gray-300 rounded-md w-full h-24" />
    <View className="bg-gray-300 rounded-md w-3/5 h-3 mt-4" />
    <View className="bg-gray-300 rounded-md w-2/5 h-3 mt-2" />
    <View className="bg-gray-300 rounded-md w-1/4 h-3 mt-2" />
  </View>
);
