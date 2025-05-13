import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const ProfileActivity: React.FC = () => {
  return (
    <View className="px-6 mt-8">
      <Text className="text-lg font-bold mb-4 text-[#1D1D1F]">Recent Activity</Text>
      <View className="items-center justify-center py-12 bg-[#F2F2F7] rounded-xl">
        <View className="w-16 h-16 bg-white rounded-full items-center justify-center mb-2">
          <Ionicons name="calendar-outline" size={32} color="#8E8E93" />
        </View>
        <Text className="text-[#8E8E93] text-base">No recent activity</Text>
        <TouchableOpacity className="mt-4" accessibilityRole="button">
          <Text className="text-[#007AFF] font-medium">Find Events</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default ProfileActivity;