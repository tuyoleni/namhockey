import React from 'react';
import { View, Text, FlatList, Animated, StyleSheet, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useHomeScreenData } from 'hooks/useHomeScreenData';

import { EventCard } from '@components/cards/EventCard';
import { ResultCard } from '@components/cards/ResultCard';
import { NewsCard } from '@components/cards/NewsCard';
import { EventSkeleton } from '@components/skeletons/EventSkeleton';
import { ResultSkeleton } from '@components/skeletons/ResultSkeleton';
import { NewsSkeleton } from '@components/skeletons/NewsSkeleton';
import { useScrollStore } from 'store/ScrollStore';

// Wrap FlatList to be animated
const AnimatedFlatList = Animated.createAnimatedComponent(FlatList);

export default function HomeScreen() {
  const router = useRouter();
  const scrollY = useScrollStore((state) => state.scrollY);

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
    <View style={styles.animatedContainer}>
      <Text className="text-xl font-bold mb-3 px-4">Upcoming Matches</Text>
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
          contentContainerStyle={{ paddingHorizontal: 16 }}
          ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
          renderItem={({ item }) => (
            <EventCard
              home_team_name={item.home_team?.name ?? 'Home'}
              away_team_name={item.away_team?.name ?? 'Away'}
              start_time={item.start_time ?? 'No start time'}
              onPress={() => router.push(`/event/${item.id}`)}
              scrollY={scrollY}
            />
          )}
        />
      )}
    </View>
  );

  const renderRecentResults = () => (
    <View className="mb-6">
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
    <View className="mb-6">
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
          renderItem={({ item }) => (
            <NewsCard
              title={item.title}
              published_at={item.published_at ?? 'No Date Available'}
              onPress={() => router.push(`/news/${item.id}`)}
            />
          )}
        />
      )}
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-white">
      {renderUpcomingMatches()}
      <AnimatedFlatList
        data={[{ key: 'content' }]}
        renderItem={() => null}
        keyExtractor={(item: unknown, index: number) => (item as { key: string }).key}
        ListHeaderComponent={
          <>
            {renderRecentResults()}
            {renderLatestNews()}
          </>
        }
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ paddingBottom: 32 }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  animatedContainer: {
    paddingBottom: 16,
  },
});
