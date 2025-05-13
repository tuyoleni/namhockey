import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const ProfileSettings: React.FC = () => {
  const router = useRouter();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogout = () => {
    // Add your logout logic here
    console.log('User logged out');
    setShowLogoutModal(false);
  };

  return (
    <View className="px-6 mt-2">
      <TouchableOpacity
        className="flex-row items-center justify-between bg-[#F2F2F7] rounded-xl px-4 py-4"
        onPress={() => setShowDropdown(!showDropdown)}
        accessibilityRole="button"
        accessibilityLabel="Settings dropdown"
      >
        <View className="flex-row items-center">
          <View className="w-8 h-8 bg-[#E9E9EB] rounded-full items-center justify-center">
            <Ionicons name="settings-outline" size={18} color="#636366" />
          </View>
          <Text className="ml-3 text-base text-[#1D1D1F]">Settings</Text>
        </View>
        <Ionicons
          name={showDropdown ? "chevron-up" : "chevron-down"}
          size={18}
          color="#C7C7CC"
        />
      </TouchableOpacity>

      {showDropdown && (
        <View className="mt-2 bg-[#F2F2F7] rounded-xl overflow-hidden">
          <TouchableOpacity
            className="flex-row items-center px-4 py-4 border-b border-white/30"
            onPress={() => router.push('/profile/settings')}
            accessibilityRole="button"
            accessibilityLabel="Go to settings screen"
          >
            <Text className="text-base text-[#1D1D1F]">Account Settings</Text>
            <Ionicons
              name="chevron-forward"
              size={18}
              color="#C7C7CC"
              style={{ marginLeft: 'auto' }}
            />
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-row items-center px-4 py-4 border-t border-white/30"
            onPress={() => setShowLogoutModal(true)}
            accessibilityRole="button"
            accessibilityLabel="Logout option"
          >
            <Text className="text-base text-[#FF3B30]">Logout</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Logout Confirmation Modal */}
      <Modal
        visible={showLogoutModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowLogoutModal(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/50">
          <View className="bg-white rounded-xl p-6 w-4/5">
            <Text className="text-lg font-bold mb-4 text-center">Are you sure you want to logout?</Text>
            <View className="flex-row justify-between">
              <Pressable
                className="px-6 py-3 rounded-lg bg-[#F2F2F7]"
                onPress={() => setShowLogoutModal(false)}
              >
                <Text className="text-[#1D1D1F]">Cancel</Text>
              </Pressable>
              <Pressable
                className="px-6 py-3 rounded-lg bg-[#FF3B30]"
                onPress={handleLogout}
              >
                <Text className="text-white">Logout</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default ProfileSettings;