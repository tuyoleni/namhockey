import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  RefreshControl,
  Alert,
  Animated,
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleProp, // Import StyleProp
  ViewStyle, // Import ViewStyle
  TouchableOpacity
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@utils/superbase'; // Adjust path
import { StatusBar } from 'expo-status-bar';
import { useUserStore } from '../../../store/userStore'; // Adjust path
import ProfileHeader from './ProfileHeader';
import ProfileActivity from './ProfileActivity';
import ProfileImage from './ProfileImage';
import ProfileInfo from './ProfileInfo';
import ProfileLoadingError from './ProfileLoadingError';
import ProfileSettings from './ProfileSettings';
import { UserStore } from 'types/profile.types';


const { width } = Dimensions.get('window');
const HEADER_MAX_HEIGHT = 240;
const HEADER_MIN_HEIGHT = 90;
const PROFILE_IMAGE_MAX_SIZE = 100;
const PROFILE_IMAGE_MIN_SIZE = 40;

// Get the typed version of the Zustand hook
const useUserStoreTyped = useUserStore as unknown as () => UserStore;


const ProfileScreen: React.FC = () => {
  const router = useRouter();
  const {
    profile,
    authUser, // authUser is used here for debug info
    loading,
    error,
    fetchProfile,
    fetchAuthUser
  } = useUserStoreTyped(); // Use the typed hook

  // Use useRef for Animated.Value to keep the same instance across renders
  const scrollY = useRef(new Animated.Value(0)).current;

  // --- Interpolated Values (Passed as props or used internally) ---
  // Calculations are done here where scrollY is managed.

  // Type the scroll event handler
  const handleScroll = Animated.event<NativeSyntheticEvent<NativeScrollEvent>>(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    // Setting useNativeDriver to false is necessary for animating layout properties like height and marginTop.
    // This means the animation happens on the JavaScript thread.
    { useNativeDriver: false }
  );

  // --- Effects ---
  useEffect(() => {
    // Fetch profile and auth user when the component mounts
    fetchProfile();
    fetchAuthUser();
    // Include fetch functions in dependencies if they can change,
    // although Zustand actions are often stable. Add them to satisfy linter or if necessary.
  }, [fetchProfile, fetchAuthUser]);


  // --- Handlers ---
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
              const { error: signOutError } = await supabase.auth.signOut();
              if (signOutError) {
                 console.error('Supabase sign out error:', signOutError.message);
                 throw signOutError; // Re-throw to be caught below
              }
              // Redirect after successful sign out
              router.replace('/(auth)/login');
            }
          }
        ]
      );
    } catch (error: any) { // Catching potential errors from Alert.alert or signOut
      Alert.alert('Error', 'Failed to sign out');
      console.error('Error signing out:', error instanceof Error ? error.message : error);
    }
  };

  const onRefresh = async () => {
    // Refresh the profile data
    await fetchProfile();
    // Note: If refreshing should also re-fetch auth user, call fetchAuthUser here too
    // await fetchAuthUser();
  };

  // --- Render Logic ---

  // 1. Render Loading or Error State First
  // Use the ProfileLoadingError component
  if (loading || error || !profile) {
       // It's important to handle the case where profile might be null briefly after loading finishes but before data is set
       // Or if there's an error before profile is ever loaded.
       // ProfileLoadingError component handles both loading and error messages.
       // We pass fetchProfile as onRetry for error state.
      return <ProfileLoadingError loading={loading} error={error} onRetry={fetchProfile} />;
  }

  // 2. Render Main Content (Profile is available)
  return (
    <View style={{ flex: 1, backgroundColor: 'white' }}> {/* Use inline style for root flex */}
      <StatusBar style="light" />

      {/* Animated Header Component */}
      <ProfileHeader
        scrollY={scrollY}
        profileUsername={profile.username} // profile is guaranteed non-null here
        onLogout={handleLogout}
        headerMaxHeight={HEADER_MAX_HEIGHT}
        headerMinHeight={HEADER_MIN_HEIGHT}
      />

      {/* Profile Image Component */}
      {/* profile is guaranteed non-null here */}
      <ProfileImage
        scrollY={scrollY}
        avatarUrl={profile.avatar_url}
        headerMaxHeight={HEADER_MAX_HEIGHT}
        headerMinHeight={HEADER_MIN_HEIGHT}
        profileImageMaxSize={PROFILE_IMAGE_MAX_SIZE}
        profileImageMinSize={PROFILE_IMAGE_MIN_SIZE}
      />

      {/* Animated Scroll View */}
      <Animated.ScrollView
        contentContainerStyle={{ paddingTop: HEADER_MAX_HEIGHT + (PROFILE_IMAGE_MAX_SIZE / 2) + 10 }}
        scrollEventThrottle={16}
        onScroll={handleScroll}
        refreshControl={
          <RefreshControl
            refreshing={loading} // Use loading state for the spinner
            onRefresh={onRefresh} // Call onRefresh when pulled
            tintColor="#007AFF"
            colors={["#007AFF"]}
          />
        }
      >
        {/* Profile Info Component */}
        {/* profile is guaranteed non-null here */}
        <ProfileInfo profile={profile} />

        {/* Activity Section Component */}
        <ProfileActivity />

        {/* Settings Section Component */}
        <ProfileSettings />

         {/* Optional Separate Sign Out Button */}
         {/* Uncomment if you want a sign out button here instead of the header */}
         {/* <ProfileSignOutButton /> */}


        {/* Debug Information - Only in development */}
        {__DEV__ && (
          <View className="px-6 mt-8 mb-8">
            <TouchableOpacity
              className="bg-[#F2F2F7] p-4 rounded-xl"
              onPress={() => {
                // Use Alert.alert to display debug data
                Alert.alert(
                  "Debug Info",
                  JSON.stringify({ profile, authUser, loading, error }, null, 2) // Stringify the data
                );
              }}
              accessibilityRole="button"
              accessibilityLabel="Show debug information"
            >
              <Text className="font-bold mb-2 text-[#8E8E93]">Debug Information</Text>
              <Text className="text-[#8E8E93] text-xs">Tap to view full data</Text>
            </TouchableOpacity>
          </View>
        )}
      </Animated.ScrollView>
    </View>
  );
};

export default ProfileScreen;