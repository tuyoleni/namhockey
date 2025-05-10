import React from 'react';
import { Text, View, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useHomeScreenData } from 'hooks/useHomeScreenData';

import { EventCard } from '@components/cards/EventCard';
import { ResultCard } from '@components/cards/ResultCard';
import { NewsCard } from '@components/cards/NewsCard';
import { EventSkeleton } from '@components/skeletons/EventSkeleton';
import { ResultSkeleton } from '@components/skeletons/ResultSkeleton';
import { NewsSkeleton } from '@components/skeletons/NewsSkeleton';

export default function HomeScreen() {
  const router = useRouter();
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

  // Helper to render each section
  const renderSection = () => (
    <>
      {/* Upcoming Matches */}
      <View className="mb-6">
        <Text className="text-xl font-bold mb-3 px-4">Upcoming Matches</Text>
        {loadingEvents || upcomingEvents.length === 0 ? (
          <View style={{ paddingHorizontal: 16 }}>
            {[...Array(3)].map((_, i) => <EventSkeleton key={i} />)}
          </View>
        ) : (
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={upcomingEvents}
            keyExtractor={(e) => e.id}
            contentContainerStyle={{ paddingHorizontal: 16 }}
            renderItem={({ item }) => (
              <EventCard
                title={item.title ?? 'Event'}
                home_team_name={item.home_team?.name ?? ''}
                away_team_name={item.away_team?.name ?? ''}
                start_time={item.start_time ?? ''}
                location_name={item.location_name ?? ''}
                onPress={() => router.push(`/event/${item.id}`)}
              />
            )}
          />
        )}
      </View>

      {/* Live Matches & Recent Results */}
      <View className="mb-6">
        <Text className="text-xl font-bold mb-3 px-4">
          Live Matches & Recent Results
        </Text>
        {loadingResults || recentResults.length === 0 ? (
          <View style={{ paddingHorizontal: 16 }}>
            {[...Array(3)].map((_, i) => <ResultSkeleton key={i} />)}
          </View>
        ) : (
          <FlatList
            data={recentResults}
            keyExtractor={(r) => r.id}
            contentContainerStyle={{ paddingHorizontal: 16 }}
            renderItem={({ item }) => (
              <ResultCard
                title={item.title ?? 'Result'}
                home_team_name={item.home_team?.name ?? ''}
                away_team_name={item.away_team?.name ?? ''}
                home_team_score={item.home_team_score ?? 0}
                away_team_score={item.away_team_score ?? 0}
                start_time={item.start_time ?? ''}
                location_name={item.location_name ?? ''}
                onPress={() =>
                  router.push(`/event/${item.id}?view=result`)
                }
              />
            )}
          />
        )}
      </View>

      {/* Latest News */}
      <View className="mb-6">
        <Text className="text-xl font-bold mb-3 px-4">Latest News</Text>
        {loadingNews || latestNews.length === 0 ? (
          <View style={{ paddingHorizontal: 16 }}>
            {[...Array(3)].map((_, i) => <NewsSkeleton key={i} />)}
          </View>
        ) : (
          <FlatList
            data={latestNews}
            keyExtractor={(n) => n.id}
            contentContainerStyle={{ paddingHorizontal: 16 }}
            renderItem={({ item }) => (
              <NewsCard
                title={item.title}
                published_at={item.published_at ?? ''}
                onPress={() => router.push(`/news/${item.id}`)}
              />
            )}
          />
        )}
      </View>
    </>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <FlatList
        data={[{ key: 'sections' }]}
        renderItem={renderSection}
        keyExtractor={(d) => d.key}
        onRefresh={onRefresh}
        refreshing={refreshing}
        contentContainerStyle={{ paddingTop: 16, paddingBottom: 16 }}
      />
    </SafeAreaView>
  );
}
