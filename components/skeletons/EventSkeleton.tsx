import React from 'react';
import { View } from 'react-native';

export const EventSkeleton = () => (
  <View className="w-80 rounded-2xl bg-white shadow-md overflow-hidden mb-4 mr-4">
    <View className="flex-row items-center justify-between px-4 py-6">
      {/* Home Team Skeleton */}
      <View className="flex-1 items-center">
        <View className="w-12 h-12 mb-2 rounded-full bg-gray-300" />
        <View className="w-16 h-3 bg-gray-300 rounded-md" />
      </View>

      {/* VS Separator Skeleton */}
      <View className="w-[1px] h-20 bg-gray-200 mx-4" />

      {/* Away Team Skeleton */}
      <View className="flex-1 items-center">
        <View className="w-12 h-12 mb-2 rounded-full bg-gray-300" />
        <View className="w-16 h-3 bg-gray-300 rounded-md" />
      </View>
    </View>

    {/* Date & Time Skeleton */}
    <View className="border-t border-gray-200 px-4 py-3 bg-gray-50">
      <View className="w-24 h-3 bg-gray-300 rounded-md mx-auto" />
    </View>
  </View>
);
