// src/components/home/MediaPostList.tsx

import React from 'react';
import { View, Text, FlatList, ActivityIndicator } from 'react-native';
import { useMediaStore } from 'store/mediaStore';
import MediaPostItem from './MediaPostItem';
import { minimalStyles } from './minimalStyles';

const MediaPostList: React.FC = () => {
  const { mediaPosts, loadingMedia, error: mediaError } = useMediaStore();

  if (loadingMedia) {
    return (
      <View style={minimalStyles.centered}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={minimalStyles.loadingText}>Loading media posts...</Text>
      </View>
    );
  }

  if (mediaError) {
    return (
      <View style={minimalStyles.contentWrapper}>
        {/* Removed section title here, as it's handled in the modal content */}
        <Text style={minimalStyles.errorText}>Error loading media posts: {mediaError}</Text>
      </View>
    );
  }

  if (mediaPosts.length === 0) {
    return (
      <View style={minimalStyles.contentWrapper}>
        {/* Removed section title here */}
        <Text style={minimalStyles.noDataText}>No media posts found.</Text>
      </View>
    );
  }

  return (
    <View style={minimalStyles.contentWrapper}>
      {/* Removed section title here */}
      <FlatList
        data={mediaPosts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <MediaPostItem key={item.id} post={item} />}
        scrollEnabled={false} // Disable scrolling within the FlatList
      />
    </View>
  );
};

export default MediaPostList;
