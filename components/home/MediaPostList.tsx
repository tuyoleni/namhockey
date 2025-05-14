// src/components/home/MediaPostList.tsx

import React from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet } from 'react-native';
import { useMediaStore } from 'store/mediaStore'; // Adjust import path
import MediaPostItem from './MediaPostItem';

const MediaPostList: React.FC = () => {
  const { mediaPosts, loadingMedia, error: mediaError } = useMediaStore();

  // Media posts are fetched and subscribed to in HomeScreen, so we just use the state here.

  if (loadingMedia) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text>Loading media posts...</Text>
      </View>
    );
  }

  if (mediaError) {
    return (
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Media Posts</Text>
        <Text style={styles.errorText}>Error loading media posts: {mediaError}</Text>
      </View>
    );
  }

  if (mediaPosts.length === 0) {
    return (
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Media Posts</Text>
        <Text style={styles.noDataText}>No media posts found.</Text>
      </View>
    );
  }

  return (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>Media Posts</Text>
      <FlatList
        data={mediaPosts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <MediaPostItem post={item} />}
        scrollEnabled={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  sectionContainer: {
    marginBottom: 20,
    backgroundColor: '#fff',
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginHorizontal: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    paddingHorizontal: 5,
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

export default MediaPostList;
