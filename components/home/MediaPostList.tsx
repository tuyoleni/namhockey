import React from 'react';
import { View, Text, FlatList } from 'react-native';
import { useMediaStore, MediaPostWithAuthor } from 'store/mediaStore'; // Import MediaPostWithAuthor
import MediaPostItem from './MediaPostItem';
import { InfoMessage } from '@components/ui/InfoMessage';

const MediaPostList: React.FC = () => {
  const { 
    allMediaPosts, 
    isLoadingMedia, 
    operationError: mediaFetchError 
  } = useMediaStore();

  if (isLoadingMedia && (!allMediaPosts || allMediaPosts.length === 0)) {
    return <InfoMessage message="Loading media..." type="loading" />;
  }

  if (mediaFetchError) {
    return <InfoMessage message="Error loading media" type="error" details={mediaFetchError} />;
  }

  if (!allMediaPosts || allMediaPosts.length === 0) {
    return <InfoMessage message="No media posts found" type="no-data" />;
  }

  return (
    <View className="flex-1">
      <FlatList
        data={allMediaPosts}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }: { item: MediaPostWithAuthor }) => <MediaPostItem post={item} />}
        scrollEnabled={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 80 }}
        ItemSeparatorComponent={() => <View className="h-4" />}
      />
    </View>
  );
};

export default MediaPostList;