import React, { JSX } from 'react';
import { Text, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@utils/superbase'; // Adjust path if needed

export default function ProfileSignOutButton(): React.FC {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      Alert.alert(
        "Sign Out",
        "Are you sure you want to sign out?",
        [
          {
            text: "Cancel",
            style: "cancel"
          },
          {
            text: "Sign Out",
            style: "destructive",
            onPress: async () => {
              const { error } = await supabase.auth.signOut();
              if (error) {
                 console.error('Supabase sign out error:', error.message); // Log error message
                 throw error;
              }
              router.replace('/(auth)/login');
            }
          }
        ]
      );
    } catch (error: any) { // Type the caught error
      Alert.alert('Error', 'Failed to sign out');
      console.error('Error signing out:', error.message); // Log error message
    }
  };

  return (): JSX.Element => (
    <TouchableOpacity
      onPress={handleLogout}
      className="mt-4 py-4 bg-[#F2F2F7] rounded-xl mx-6 mb-8"
    >
      <Text className="text-center font-medium text-[#FF3B30]">Sign Out</Text>
    </TouchableOpacity>
  );
}