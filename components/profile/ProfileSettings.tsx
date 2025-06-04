import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useUserStore } from 'store/userStore'; // Assuming this is the correct path to your store

const ProfileSettings: React.FC = () => {
  const router = useRouter();
  const { logoutUser, loading: userLoading } = useUserStore(); // Get logoutUser and loading state
  const [showDropdown, setShowDropdown] = useState(false);
  // const [showLogoutModal, setShowLogoutModal] = useState(false); // Removed, using Alert instead

  const confirmLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        {
          text: "Cancel",
          onPress: () => console.log("Logout cancelled"),
          style: "cancel"
        },
        {
          text: "Logout",
          onPress: handleLogout,
          style: "destructive"
        }
      ],
      { cancelable: true }
    );
  };

  const handleLogout = async () => {
    // setShowLogoutModal(false); // Not needed anymore
    const { success, error } = await logoutUser();

    if (success) {
      console.log('User logged out successfully');
      Alert.alert("Logged Out", "You have been successfully logged out.");
      // Navigate to login screen or home screen after logout
      // Example: router.replace('/auth/login'); or router.replace('/');
      // For now, let's assume you want to go to a root or auth path.
      // You might need to adjust this based on your app's navigation structure.
      router.replace('/'); // Or '/login', '/auth' etc.
    } else {
      console.error('Logout failed:', error);
      Alert.alert("Logout Failed", error || "An unexpected error occurred. Please try again.");
    }
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
            className="flex-row items-center px-4 py-4 border-b border-white/30" // Using a subtle border, adjust as needed
            onPress={() => {
              setShowDropdown(false); // Close dropdown on navigation
              router.push('/profile/settings');
            }}
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
            className="flex-row items-center px-4 py-4" // Removed border-t, relies on item separation
            onPress={() => {
              // setShowDropdown(false); // Optionally close dropdown
              confirmLogout();
            }}
            accessibilityRole="button"
            accessibilityLabel="Logout option"
            disabled={userLoading} // Disable button while logging out
          >
            <Text className="text-base text-[#FF3B30]">Logout</Text>
            {userLoading && <ActivityIndicator size="small" color="#FF3B30" style={{ marginLeft: 10 }} />}
          </TouchableOpacity>
        </View>
      )}

      {/* Logout Confirmation Modal - REMOVED */}
      {/*
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
      */}
    </View>
  );
};

export default ProfileSettings;
