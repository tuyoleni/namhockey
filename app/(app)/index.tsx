import React from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useHomeScreenData } from 'hooks/useHomeScreenData';
import { Database } from 'types/database.types';

import { EventCard } from '@components/cards/EventCard';
import { ResultCard } from '@components/cards/ResultCard';
import { NewsCard } from '@components/cards/NewsCard';
import { EventSkeleton } from '@components/skeletons/EventSkeleton';
import { ResultSkeleton } from '@components/skeletons/ResultSkeleton';
import { NewsSkeleton } from '@components/skeletons/NewsSkeleton';
import { BlurView } from 'expo-blur';
import { CommentProvider, useComments } from '../../context/CommentContext';
import { CommentSheet } from '@components/comments/CommentSection';
import { useSocialStore } from 'store/socialStore';
import { Comment } from '@components/cards/NewsCard';


type Tables = Database['public']['Tables']
type DatabaseComment = Tables['comments']['Row'] & {
  user: Tables['profiles']['Row']
}

const HomeScreenContent = () => {
  const router = useRouter();
  const { 
    isCommentSheetVisible, 
    activePostComments,
    activePostId,  // Add this
    closeCommentSheet,
  } = useComments();
  
  const { addComment } = useSocialStore();

  const {
    upcomingEvents,
    recentResults,
    latestNews,
    loadingEvents,
    loadingResults,
    loadingNews,
    onRefresh,
    refreshing,
  } = useHomeScreenData();

  const renderUpcomingMatches = () => (
    <BlurView
      intensity={30}
      className='bg-red-400'
    >
      <View className="gap-2 backdrop-blur-md">
        <Text className="text-xl font-bold px-4 text-white">Upcoming Matches</Text>

        {loadingEvents ? (
          <View className="px-4 flex-row gap-4">
            {[...Array(2)].map((_, i) => <EventSkeleton key={i} />)}
          </View>
        ) : (
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={upcomingEvents}
            keyExtractor={(e) => e.id}
            contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 4 }}
            ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
            renderItem={({ item }) => (
              <EventCard
                home_team_name={item.home_team?.name ?? 'Home'}
                away_team_name={item.away_team?.name ?? 'Away'}
                start_time={item.start_time ?? 'No start time'}
                onPress={() => router.push(`/event/${item.id}`)}
              />
            )}
          />
        )}
      </View>
    </BlurView>
  );

  const renderRecentResults = () => (
    <View className="mb-6 ">
      <Text className="text-xl font-bold mb-3 px-4">Live Matches</Text>
      {loadingResults ? (
        <View className="px-4 flex-row gap-2">
          {[...Array(3)].map((_, i) => <ResultSkeleton key={i} />)}
        </View>
      ) : (
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={recentResults}
          keyExtractor={(r) => r.id}
          contentContainerStyle={{ paddingHorizontal: 16 }}
          ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
          renderItem={({ item }) => (
            <ResultCard
              title={item.title ?? 'Result'}
              home_team_name={item.home_team?.name ?? 'No Team Name'}
              away_team_name={item.away_team?.name ?? 'No Team Name'}
              home_team_score={item.home_team_score ?? 0}
              away_team_score={item.away_team_score ?? 0}
              start_time={item.start_time ?? 'No start time'}
              location_name={item.location_name ?? undefined}
              onPress={() => router.push(`/event/${item.id}?view=result`)}
            />
          )}
        />
      )}
    </View>
  );

  const renderLatestNews = () => (
    <View className="mb-6 ">
      <Text className="text-xl font-bold mb-3 px-4">Latest News</Text>
      {loadingNews ? (
        <View className="px-4">
          {[...Array(3)].map((_, i) => <NewsSkeleton key={i} />)}
        </View>
      ) : (
        <FlatList
          data={latestNews}
          keyExtractor={(n) => n.id}
          contentContainerStyle={{ paddingHorizontal: 16 }}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          renderItem={({ item }: { item: NewsItem }) => (
            <NewsCard
              id={item.id}
              title={item.title}
              published_at={item.published_at ?? 'No Date Available'}
              content={item.content ?? ''}
              cover_image_url={item.cover_image_url ?? null}
              onPress={() => router.push(`/news/${item.id}`)}
              comments={item.comments?.map(comment => ({
                id: comment.id,
                author: comment.author,
                text: comment.text,
                timestamp: comment.timestamp
              })) ?? []}
            />
          )}          
        />
      )}
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-white">
      {renderUpcomingMatches()}
      <FlatList
        data={[{ key: 'content' }]}
        renderItem={() => null}
        keyExtractor={(item: unknown, index: number) => (item as { key: string }).key}
        ListHeaderComponent={
          <>
            {renderRecentResults()}
            {renderLatestNews()}
          </>
        }
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ paddingBottom: 32 }}
      />
      
      <CommentSheet
        comments={activePostComments as unknown as DatabaseComment[]}
        onClose={closeCommentSheet}
        onAddComment={async (text) => {
          if (activePostId) {
            await addComment(activePostId, text);
          }
        }}
        visible={isCommentSheetVisible}
      />
    </SafeAreaView>
  );
};

// Main component that provides the comments context
export default function HomeScreen() {
  return (
    <CommentProvider>
      <HomeScreenContent />
    </CommentProvider>
  );
}

const styles = StyleSheet.create({
  animatedContainer: {
    paddingBottom: 16,
    flexGrow: 0,
    flexShrink: 0,
  },
});

// Add this interface at the top of the file
interface NewsItem {
  author_profile_id: string | null;
  content: string;
  cover_image_url: string | null;
  created_at: string | null;
  id: string;
  published_at: string | null;
  status: string | null;
  title: string;
  updated_at: string | null;
  comments?: Comment[]; // Now using the imported Comment type
}