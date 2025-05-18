import React from 'react';
import { View, Text, FlatList } from 'react-native';
import { useMediaStore } from 'store/mediaStore';
import MediaPostItem from './MediaPostItem';

const MediaPostList: React.FC = () => {
  const { mediaPosts, error: mediaError } = useMediaStore();

  if (mediaError) {
    return (
      <View className="p-4">
        <Text className="text-red-500">Error loading media posts: {mediaError}</Text>
      </View>
    );
  }

  if (mediaPosts.length === 0) {
    return (
      <View className="p-4">
        <Text className="text-gray-500">No media posts found.</Text>
      </View>
    );
  }

  return (
    <View className="p-4">
      <FlatList
        data={mediaPosts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <MediaPostItem key={item.id} post={item} />}
        scrollEnabled={false}
      />
    </View>
  );
};

export default MediaPostList;
