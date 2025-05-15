import React, { useEffect } from 'react';
import { View, Text, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
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


const HomeScreen: React.FC = () => {
  const navigation = useNavigation();

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
          navigation.navigate('Login' as never);
      }
  }, [loadingUser, authUser, navigation]);


  if (loadingNews || loadingEvents || loadingMedia || loadingUser) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text>Loading data...</Text>
      </View>
    );
  }

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

  if (!authUser && !loadingUser) {
      return null;
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
        <ScrollView style={styles.container}>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f0f0',
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