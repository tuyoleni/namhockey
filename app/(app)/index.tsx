import React, { useEffect } from 'react';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useNewsStore } from 'store/newsStore';
import { useEventStore } from 'store/eventStore';
import { useMediaStore } from 'store/mediaStore';
import { useUserStore } from 'store/userStore';

import NewsFeed from '@components/home/NewsFeed';
import LiveMatches from '@components/home/LiveMatches';
import UpcomingMatches from '@components/home/UpcomingMatches';
import RecentMatches from '@components/home/RecentMatches';
import MediaPostUpload from '@components/home/MediaPostUpload';
import MediaPostList from '@components/home/MediaPostList';
import { SafeAreaView } from 'react-native-safe-area-context';

// StyleSheet is no longer needed for these styles
// import { StyleSheet } from 'react-native';

const HomeScreen: React.FC = () => {
  const router = useRouter();

  const { fetchNewsArticles, subscribeToNewsArticles, loadingNews, error: newsError } = useNewsStore();
  const { fetchEvents, subscribeToEvents, loadingEvents, error: eventError } = useEventStore();
  const { fetchMediaPosts, loadingMedia, error: mediaError } = useMediaStore();
  const { fetchAuthUser, authUser, loading: loadingUser, error: userError } = useUserStore();


  useEffect(() => {
    fetchNewsArticles();
    fetchEvents();
    fetchMediaPosts();
    fetchAuthUser();

    const unsubscribeNews = subscribeToNewsArticles();
    const unsubscribeEvents = subscribeToEvents();

    return () => {
      unsubscribeNews();
      unsubscribeEvents();
    };
  }, [fetchNewsArticles, subscribeToNewsArticles, fetchEvents, subscribeToEvents, fetchMediaPosts, fetchAuthUser]);


  useEffect(() => {
      if (!loadingUser && !authUser) {
          console.log('No authenticated user found, navigating to Login using Expo Router.');
          router.replace('/(auth)/login');
      }
  }, [loadingUser, authUser, router]);


  // Use Tailwind classes for loading and error states
  if (loadingNews || loadingEvents || loadingMedia || loadingUser) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#007bff" />
        <Text className="mt-2 text-gray-700">Loading data...</Text>
      </View>
    );
  }

  if (newsError || eventError || mediaError || userError) {
    return (
      <View className="flex-1 justify-center items-center p-4">
        <Text className="text-red-500 text-lg text-center mb-2">Error loading data:</Text>
        {newsError && <Text className="text-red-500 text-base text-center">{newsError}</Text>}
        {eventError && <Text className="text-red-500 text-base text-center">{eventError}</Text>}
        {mediaError && <Text className="text-red-500 text-base text-center">{mediaError}</Text>}
        {userError && <Text className="text-red-500 text-base text-center">{userError}</Text>}
      </View>
    );
  }

  if (!authUser && !loadingUser) {
      return null;
  }

  // Use Tailwind classes for the main content layout
  return (
    <SafeAreaView className="flex-1 bg-gray-100"> {/* Applied flex-1 and background here */}
        <ScrollView className="flex-1 py-2.5"> {/* Applied flex-1 and vertical padding */}
            <LiveMatches />
            <UpcomingMatches />
            <RecentMatches />
            {authUser && <MediaPostUpload currentUserId={authUser.id} />}
            <MediaPostList />
            <NewsFeed />
        </ScrollView>
    </SafeAreaView>
  );
};

export default HomeScreen;