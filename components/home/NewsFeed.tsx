// src/components/home/NewsFeed.tsx

import React from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet } from 'react-native';
import { useNewsStore } from 'store/newsStore'; // Adjust import path
import NewsPostItem from './NewsPostItem';

const NewsFeed: React.FC = () => {
  const { newsArticles, loadingNews, error: newsError } = useNewsStore();

  // News articles are fetched and subscribed to in HomeScreen, so we just use the state here.

  if (loadingNews) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text>Loading news...</Text>
      </View>
    );
  }

  if (newsError) {
    return (
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Latest News</Text>
        <Text style={styles.errorText}>Error loading news: {newsError}</Text>
      </View>
    );
  }

  if (newsArticles.length === 0) {
    return (
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Latest News</Text>
        <Text style={styles.noDataText}>No news articles found.</Text>
      </View>
    );
  }

  return (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>Latest News</Text>
      <FlatList
        data={newsArticles}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <NewsPostItem post={item} />}
        scrollEnabled={false} 
      />
    </View>
  );
};

const styles = StyleSheet.create({
  sectionContainer: {
    marginBottom: 20,
    backgroundColor: '#fff', // White background for the section
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginHorizontal: 10, // Add horizontal margin
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    paddingHorizontal: 5, // Add some padding to align with list items
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: 'red',
    fontSize: 14,
    textAlign: 'center',
    padding: 10,
  },
  noDataText: {
    fontSize: 14,
    textAlign: 'center',
    color: '#555',
    padding: 10,
  },
});

export default NewsFeed;
