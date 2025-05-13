import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const ProfileSettings: React.FC = () => {
   const router = useRouter();

  return (
    <View className="px-6 mt-8">
      <Text className="text-lg font-bold mb-4 text-[#1D1D1F]">Settings</Text>
      <View className="bg-[#F2F2F7] rounded-xl overflow-hidden">
        <TouchableOpacity
          className="flex-row items-center px-4 py-4 border-b border-white/30"
          onPress={() => router.push('/profile/settings')}
          accessibilityRole="button"
          accessibilityLabel="Go to settings screen"
        >
          <View className="w-8 h-8 bg-[#E9E9EB] rounded-full items-center justify-center">
            <Ionicons name="settings-outline" size={18} color="#636366" />
          </View>
          <Text className="ml-3 text-base text-[#1D1D1F]">Settings</Text>
          <Ionicons
            name="chevron-forward"
            size={18}
            color="#C7C7CC"
            style={{ marginLeft: 'auto' }}
          />
        </TouchableOpacity>

        <TouchableOpacity
          className="flex-row items-center px-4 py-4"
          onPress={() => router.push('/profile/notifications')}
          accessibilityRole="button"
          accessibilityLabel="Go to notifications settings"
        >
          <View className="w-8 h-8 bg-[#E9E9EB] rounded-full items-center justify-center">
            <Ionicons name="notifications-outline" size={18} color="#636366" />
          </View>
          <Text className="ml-3 text-base text-[#1D1D1F]">Notifications</Text>
          <Ionicons
            name="chevron-forward"
            size={18}
            color="#C7C7CC"
            style={{ marginLeft: 'auto' }}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default ProfileSettings;