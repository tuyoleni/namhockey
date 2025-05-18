import React from 'react';
import { View, FlatList, RefreshControl } from 'react-native';
import { useNewsStore } from 'store/newsStore';
import NewsPostItem from './NewsPostItem';
import { InfoMessage } from '@components/ui/InfoMessage';

const NewsFeed: React.FC = () => {
  const {
    newsArticles,
    loadingNews,
    error: newsError,
    fetchNewsArticles
  } = useNewsStore();

  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await fetchNewsArticles();
    setRefreshing(false);
  }, [fetchNewsArticles]);

  if (loadingNews && !refreshing) {
    return <InfoMessage message="Loading news..." type="loading" />;
  }

  if (newsError) {
    return <InfoMessage message="Error loading news" type="error" details={newsError} />;
  }

  if (!newsArticles || newsArticles.length === 0) {
    return <InfoMessage message="No news articles found" type="no-data" />;
  }

  return (
    <View className="flex-1">
      <FlatList
        data={newsArticles}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const adaptedItem = {
            ...item,
            profiles: item.profiles
              ? {
                ...item.profiles,
              }
              : null,
          };
          return (
            <NewsPostItem
              post={adaptedItem}
            />
          );
        }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 20 }}
        ItemSeparatorComponent={() => <View className="h-4" />}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#007AFF"]}
            tintColor="#007AFF"
          />
        }
      />
    </View>
  );
};

export default NewsFeed;
