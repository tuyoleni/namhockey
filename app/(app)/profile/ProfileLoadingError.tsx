import React from 'react';
import { View, Text, TouchableOpacity, Image, ActivityIndicator } from 'react-native'; // Added ActivityIndicator
import { Ionicons } from '@expo/vector-icons';

interface ProfileLoadingErrorProps {
  loading: boolean;
  error: string | null;
  onRetry?: () => Promise<void> | void; // onRetry is optional
}

const ProfileLoadingError: React.FC<ProfileLoadingErrorProps> = ({ loading, error, onRetry }) => {
  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        {/* Make sure the asset path is correct relative to THIS file */}
        <Image
          source={require('../../../assets/default-avatar.png')}
          className="w-20 h-20 opacity-20"
          accessibilityLabel="Loading indicator image" // Added accessibility label
        />
        {/* You might want a more explicit loading indicator */}
        {/* <ActivityIndicator size="large" color="#007AFF" /> */}
        <Text className="mt-4 text-[#8E8E93] font-medium">Loading profile...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <Ionicons name="alert-circle-outline" size={48} color="#FF3B30" />
        <Text className="mt-4 text-[#FF3B30] font-medium text-center px-6">{error}</Text> {/* Added text-center */}
        {onRetry && (
          <TouchableOpacity
            onPress={onRetry}
            className="mt-4 py-2 px-6 bg-[#F2F2F7] rounded-full"
            accessibilityRole="button" // Added accessibility role
          >
            <Text className="text-[#007AFF] font-medium">Try Again</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return null;
};

export default ProfileLoadingError;