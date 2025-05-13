import React, { useEffect } from 'react';
import {
  View,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@utils/superbase';
import { StatusBar } from 'expo-status-bar';
import { useUserStore } from '../../../store/userStore';
import ProfileActivity from '../../../components/profile/ProfileActivity';
import ProfileInfo from '../../../components/profile/ProfileInfo';
import ProfileSettings from '../../../components/profile/ProfileSettings';
import { SafeAreaView } from 'react-native-safe-area-context';



const ProfileScreen: React.FC = () => {
  const router = useRouter();
  const {
    profile,
    loading,
    fetchProfile,
    fetchAuthUser,
  } = useUserStore();

  useEffect(() => {
    fetchProfile();
    fetchAuthUser();
  }, []);

  const onRefresh = async () => {
    await fetchProfile();
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      router.replace('/(auth)/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };


  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />
      <ScrollView
        className="flex-1"
        contentContainerClassName="pb-8"
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={onRefresh}
            tintColor="#007AFF"
            colors={["#007AFF"]}
          />
        }
      >
        <View className=" h-32 w-full" />
        <ProfileInfo profile={profile} />
        <ProfileSettings />
        <ProfileActivity />
      </ScrollView>
    </SafeAreaView>
  );
};

export default ProfileScreen;