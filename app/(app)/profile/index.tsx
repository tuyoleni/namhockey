import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  Image, 
  TouchableOpacity, 
  ScrollView, 
  RefreshControl, 
  Alert,
  Animated,
  Dimensions
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@utils/superbase';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUserStore } from '../../../store/userStore';
import { BlurView } from 'expo-blur';
import { StatusBar } from 'expo-status-bar';

const { width } = Dimensions.get('window');
const HEADER_MAX_HEIGHT = 240;
const HEADER_MIN_HEIGHT = 90;
const PROFILE_IMAGE_MAX_SIZE = 100;
const PROFILE_IMAGE_MIN_SIZE = 40;

export default function ProfileScreen() {
  const router = useRouter();
  const { 
    profile, 
    authUser,
    loading, 
    error, 
    fetchProfile,
    fetchAuthUser 
  } = useUserStore();

  const scrollY = new Animated.Value(0);
  const headerHeight = scrollY.interpolate({
    inputRange: [0, HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT],
    outputRange: [HEADER_MAX_HEIGHT, HEADER_MIN_HEIGHT],
    extrapolate: 'clamp'
  });

  const profileImageSize = scrollY.interpolate({
    inputRange: [0, HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT],
    outputRange: [PROFILE_IMAGE_MAX_SIZE, PROFILE_IMAGE_MIN_SIZE],
    extrapolate: 'clamp'
  });

  const profileImageMarginTop = scrollY.interpolate({
    inputRange: [0, HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT],
    outputRange: [HEADER_MAX_HEIGHT - PROFILE_IMAGE_MAX_SIZE / 2, HEADER_MIN_HEIGHT - PROFILE_IMAGE_MIN_SIZE / 2],
    extrapolate: 'clamp'
  });

  const headerZIndex = scrollY.interpolate({
    inputRange: [0, HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT, HEADER_MAX_HEIGHT],
    outputRange: [0, 0, 1],
    extrapolate: 'clamp'
  });

  const headerTitleOpacity = scrollY.interpolate({
    inputRange: [0, HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT - 20, HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT],
    outputRange: [0, 0, 1],
    extrapolate: 'clamp'
  });

  useEffect(() => {
    fetchProfile();
    fetchAuthUser();
  }, []);

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
              if (error) throw error;
              router.replace('/(auth)/login');
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to sign out');
      console.error('Error signing out:', error);
    }
  };

  const onRefresh = async () => {
    await fetchProfile();
  };

  if (loading && !profile) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <Image 
          source={require('../../../assets/default-avatar.png')} 
          className="w-20 h-20 opacity-20"
        />
        <Text className="mt-4 text-[#8E8E93] font-medium">Loading profile...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <Ionicons name="alert-circle-outline" size={48} color="#FF3B30" />
        <Text className="mt-4 text-[#FF3B30] font-medium">{error}</Text>
        <TouchableOpacity 
          onPress={fetchProfile}
          className="mt-4 py-2 px-6 bg-[#F2F2F7] rounded-full"
        >
          <Text className="text-[#007AFF] font-medium">Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <StatusBar style="light" />
      
      {/* Animated Header */}
      <Animated.View 
        style={{ 
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: headerHeight,
          width: '100%',
          zIndex: headerZIndex,
          elevation: headerZIndex,
          backgroundColor: '#007AFF'
        }}
      >
        <BlurView 
          intensity={0} 
          className="absolute inset-0 bg-[#007AFF]/90"
        />
        
        {/* Header Content */}
        <SafeAreaView className="flex-1">
          <Animated.View 
            style={{ opacity: headerTitleOpacity }}
            className="flex-row justify-between items-center px-4 h-[44px]"
          >
            <Text className="text-lg font-semibold text-white">
              {profile?.username || 'Profile'}
            </Text>
            <TouchableOpacity onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={24} color="white" />
            </TouchableOpacity>
          </Animated.View>
        </SafeAreaView>
      </Animated.View>

      {/* Profile Image */}
      <Animated.View 
        style={{ 
          position: 'absolute',
          top: 0,
          left: width / 2 - PROFILE_IMAGE_MAX_SIZE / 2,
          width: profileImageSize,
          height: profileImageSize,
          marginTop: profileImageMarginTop,
          zIndex: 2,
          elevation: 2,
          transform: [{ translateX: (PROFILE_IMAGE_MAX_SIZE - PROFILE_IMAGE_MIN_SIZE) / 2 }]
        }}
      >
        <Image
          source={
            profile?.avatar_url
              ? { uri: profile.avatar_url }
              : require('../../../assets/default-avatar.png')
          }
          style={{ 
            width: '100%', 
            height: '100%', 
            borderRadius: PROFILE_IMAGE_MAX_SIZE / 2,
            borderWidth: 3,
            borderColor: 'white'
          }}
        />
      </Animated.View>

      <Animated.ScrollView
        contentContainerStyle={{ paddingTop: HEADER_MAX_HEIGHT + 60 }}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        refreshControl={
          <RefreshControl 
            refreshing={loading} 
            onRefresh={onRefresh} 
            tintColor="#007AFF"
            colors={["#007AFF"]}
          />
        }
      >
        {/* Profile Info */}
        <View className="px-6 items-center">
          <Text className="text-2xl font-bold text-center text-[#1D1D1F]">
            {profile?.full_name || 'Name not set'}
          </Text>
          <Text className="text-[#8E8E93] text-center mt-1 text-base">
            @{profile?.username || 'username'}
          </Text>
          
          <Text className="text-[#3A3A3C] text-center mt-3 text-base">
            {profile?.bio || 'No bio yet'}
          </Text>

          <View className="flex-row justify-around w-full mt-6 bg-[#F2F2F7] rounded-xl p-4">
            <View className="items-center">
              <Text className="text-xl font-bold text-[#1D1D1F]">{profile?.posts_count || 0}</Text>
              <Text className="text-[#8E8E93]">Posts</Text>
            </View>
            <View className="items-center">
              <Text className="text-xl font-bold text-[#1D1D1F]">{profile?.followers_count || 0}</Text>
              <Text className="text-[#8E8E93]">Followers</Text>
            </View>
            <View className="items-center">
              <Text className="text-xl font-bold text-[#1D1D1F]">{profile?.following_count || 0}</Text>
              <Text className="text-[#8E8E93]">Following</Text>
            </View>
          </View>

          <TouchableOpacity 
            onPress={() => router.push('/profile/edit')}
            className="mt-6 py-3 px-6 bg-[#007AFF] rounded-full w-full"
          >
            <Text className="text-center font-semibold text-white">Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Activity Section */}
        <View className="px-6 mt-8">
          <Text className="text-lg font-bold mb-4 text-[#1D1D1F]">Recent Activity</Text>
          <View className="items-center justify-center py-12 bg-[#F2F2F7] rounded-xl">
            <View className="w-16 h-16 bg-white rounded-full items-center justify-center mb-2">
              <Ionicons name="calendar-outline" size={32} color="#8E8E93" />
            </View>
            <Text className="text-[#8E8E93] text-base">No recent activity</Text>
            <TouchableOpacity className="mt-4">
              <Text className="text-[#007AFF] font-medium">Find Events</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Settings Section */}
        <View className="px-6 mt-8">
          <Text className="text-lg font-bold mb-4 text-[#1D1D1F]">Settings</Text>
          <View className="bg-[#F2F2F7] rounded-xl overflow-hidden">
            <TouchableOpacity 
              className="flex-row items-center px-4 py-4 border-b border-white/30"
              onPress={() => router.push('/profile/settings')}
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
          
          <TouchableOpacity 
            onPress={handleLogout}
            className="mt-4 py-4 bg-[#F2F2F7] rounded-xl"
          >
            <Text className="text-center font-medium text-[#FF3B30]">Sign Out</Text>
          </TouchableOpacity>
        </View>

        {/* Debug Information - Hidden in production */}
        {__DEV__ && (
          <View className="px-6 mt-8 mb-8">
            <TouchableOpacity 
              className="bg-[#F2F2F7] p-4 rounded-xl"
              onPress={() => {
                Alert.alert("Debug Info", JSON.stringify({profile, authUser}, null, 2));
              }}
            >
              <Text className="font-bold mb-2 text-[#8E8E93]">Debug Information</Text>
              <Text className="text-[#8E8E93] text-xs">Tap to view full data</Text>
            </TouchableOpacity>
          </View>
        )}
      </Animated.ScrollView>
    </View>
  );
}