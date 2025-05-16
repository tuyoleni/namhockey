// src/components/home/NewsFeed.tsx

import React from 'react';
import { View, Text, FlatList, ActivityIndicator } from 'react-native';
import { useNewsStore } from 'store/newsStore';
import NewsPostItem from './NewsPostItem';
import { minimalStyles } from './minimalStyles';

const NewsFeed: React.FC = () => {
  const { newsArticles, loadingNews, error: newsError } = useNewsStore();

  if (loadingNews) {
    return (
      <View style={minimalStyles.centered}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={minimalStyles.loadingText}>Loading news...</Text>
      </View>
    );
  }

  if (newsError) {
    return (
      <View style={minimalStyles.contentWrapper}>
        {/* Removed section title here, as it's handled in the modal content */}
        <Text style={minimalStyles.errorText}>Error loading news: {newsError}</Text>
      </View>
    );
  }

  if (newsArticles.length === 0) {
    return (
      <View style={minimalStyles.contentWrapper}>
        {/* Removed section title here */}
        <Text style={minimalStyles.noDataText}>No news articles found.</Text>
      </View>
    );
  }

  return (
    <View style={minimalStyles.contentWrapper}>
      {/* Removed section title here */}
      <FlatList
        data={newsArticles}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <NewsPostItem post={item} />}
        scrollEnabled={false} // Disable scrolling within the FlatList
      />
    </View>
  );
};

export default NewsFeed;
