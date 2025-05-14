// src/screens/HomeScreen.tsx

import React, { useEffect } from 'react';
import { View, Text, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import { useNewsStore } from 'store/newsStore'; // Adjust import path
import { useEventStore } from 'store/eventStore'; // Adjust import path
import { useMediaStore } from 'store/mediaStore'; // Adjust import path
import { useUserStore } from 'store/userStore'; // Adjust import path

// Import modular components
import NewsFeed from '@components/home/NewsFeed'; // Adjust import path
import LiveMatches from '@components/home/LiveMatches'; // Adjust import path
import UpcomingMatches from '@components/home/UpcomingMatches'; // Adjust import path
import RecentMatches from '@components/home/RecentMatches'; // Adjust import path
import MediaPostUpload from '@components/home/MediaPostUpload'; // Adjust import path
import MediaPostList from '@components/home/MediaPostList'; // We'll create this to display media posts


const HomeScreen: React.FC = () => {
  // Fetch initial data and subscribe to realtime changes
  const { fetchNewsArticles, subscribeToNewsArticles, loadingNews, error: newsError } = useNewsStore();
  const { fetchEvents, subscribeToEvents, loadingEvents, error: eventError } = useEventStore();
  const { fetchMediaPosts, subscribeToMediaPosts, loadingMedia, error: mediaError } = useMediaStore();
  const { fetchAuthUser, authUser, loading: loadingUser, error: userError } = useUserStore();


  useEffect(() => {
    // Fetch initial data when the component mounts
    fetchNewsArticles();
    fetchEvents();
    fetchMediaPosts();
    fetchAuthUser(); // Fetch authenticated user

    // Subscribe to realtime changes
    const unsubscribeNews = subscribeToNewsArticles();
    const unsubscribeEvents = subscribeToEvents();
    const unsubscribeMedia = subscribeToMediaPosts();

    // Clean up subscriptions on component unmount
    return () => {
      unsubscribeNews();
      unsubscribeEvents();
      unsubscribeMedia();
    };
  }, [fetchNewsArticles, subscribeToNewsArticles, fetchEvents, subscribeToEvents, fetchMediaPosts, subscribeToMediaPosts, fetchAuthUser]);


  // Show loading indicator if any data is being loaded initially
  if (loadingNews || loadingEvents || loadingMedia || loadingUser) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text>Loading data...</Text>
      </View>
    );
  }

  // Display error message if any store has an error
  if (newsError || eventError || mediaError || userError) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Error loading data:</Text>
        {newsError && <Text style={styles.errorText}>News: {newsError}</Text>}
        {eventError && <Text style={styles.errorText}>Events: {eventError}</Text>}
        {mediaError && <Text style={styles.errorText}>Media: {mediaError}</Text>}
        {userError && <Text style={styles.errorText}>User: {userError}</Text>}
      </View>
    );
  }


  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.heading}>Home</Text>
        {/* Add a welcome message or user info here */}
        {authUser && <Text>Welcome, {authUser.email || 'User'}!</Text>}
      </View>

      {/* Live Matches Section (Placeholder) */}
      <LiveMatches />

      {/* Upcoming Matches Section */}
      <UpcomingMatches />

      {/* Recent Matches Section */}
      <RecentMatches />

      {/* Media Post Upload Section (Only show if user is authenticated) */}
      {authUser && <MediaPostUpload currentUserId={authUser.id} />}

      {/* Media Post List Section */}
      <MediaPostList />

      {/* News Feed Section */}
      <NewsFeed />

      {/* Add other sections as needed */}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f0f0', // Light gray background
    paddingVertical: 10,
  },
  header: {
    paddingHorizontal: 15,
    marginBottom: 15,
  },
  heading: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    textAlign: 'center',
  },
});

export default HomeScreen;