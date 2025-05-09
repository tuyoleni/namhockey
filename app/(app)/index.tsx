import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@utils/superbase';
import { Database } from '../../database.types';
import { useRouter } from 'expo-router';
import Card from '@components/Card';

type EventRow = Database['public']['Tables']['events']['Row'];
type NewsArticleRow = Database['public']['Tables']['news_articles']['Row'];

type EventWithTeams = EventRow & {
  home_team: { name: string } | null;
  away_team: { name: string } | null;
};

export default function HomeScreen() {
  const [upcomingEvents, setUpcomingEvents] = useState<EventWithTeams[]>([]);
  const [recentResults, setRecentResults] = useState<EventWithTeams[]>([]);
  const [latestNews, setLatestNews] = useState<NewsArticleRow[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [loadingResults, setLoadingResults] = useState(true);
  const [loadingNews, setLoadingNews] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const fetchUpcomingEvents = async () => {
    setLoadingEvents(true);
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('events')
      .select(`
        *,
        home_team:teams!events_home_team_id_fkey(name),
        away_team:teams!events_away_team_id_fkey(name)
      `)
      .gte('start_time', now)
      .eq('status', 'scheduled')
      .order('start_time', { ascending: true })
      .limit(5);

    if (error) {
      console.error('Error fetching upcoming events:', error);
    } else {
      setUpcomingEvents((data as EventWithTeams[]) || []);
    }
    setLoadingEvents(false);
  };

  const fetchRecentResults = async () => {
    setLoadingResults(true);
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('events')
      .select(`
        *,
        home_team:teams!events_home_team_id_fkey(name),
        away_team:teams!events_away_team_id_fkey(name)
      `)
      .lt('start_time', now)
      .eq('status', 'completed')
      .order('start_time', { ascending: false })
      .limit(5);

    if (error) {
      console.error('Error fetching recent results:', error);
    } else {
      setRecentResults((data as EventWithTeams[]) || []);
    }
    setLoadingResults(false);
  };

  const fetchLatestNews = async () => {
    setLoadingNews(true);
    const { data, error } = await supabase
      .from('news_articles')
      .select('id, title, published_at, content, cover_image_url, author_profile_id, created_at, status, updated_at')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(3);

    console.log('Fetched news data:', data);

    if (error) {
      console.error('Error fetching latest news:', error);
    } else {
      setLatestNews(data || []);
    }
    setLoadingNews(false);
  };

  useEffect(() => {
    fetchUpcomingEvents();
    fetchRecentResults();
    fetchLatestNews();
  }, []);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      fetchUpcomingEvents(),
      fetchRecentResults(),
      fetchLatestNews(),
    ]);
    setRefreshing(false);
  }, []);

  const renderEventItem = ({ item }: { item: EventWithTeams }) => (
    <Card onPress={() => router.push(`/event/${item.id}`)}>
      <Text className="text-lg font-semibold mb-1.5 text-gray-800">
        {item.title || 'Event'}
      </Text>
      {item.home_team && item.away_team ? (
        <Text className="text-sm text-gray-600 mb-2">
          {item.home_team.name} vs {item.away_team.name}
        </Text>
      ) : (
        <Text className="text-sm text-gray-600 mb-2">Details unavailable</Text>
      )}
      <Text className="text-xs text-gray-500 mb-1">
        {new Date(item.start_time).toLocaleDateString()} - {new Date(item.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </Text>
      {item.location_name && <Text className="text-xs text-gray-500 italic">{item.location_name}</Text>}
    </Card>
  );

  const renderResultItem = ({ item }: { item: EventWithTeams }) => (
    <Card onPress={() => router.push(`/event/${item.id}?view=result`)}>
      <Text className="text-lg font-semibold mb-1.5 text-gray-800">
        {item.title || 'Match Result'}
      </Text>
      {item.home_team && item.away_team ? (
        <View className="flex-row justify-around items-center my-2">
          <Text className="text-sm font-medium text-gray-700 flex-1 text-center">
            {item.home_team.name}
          </Text>
          <Text className="text-lg font-bold text-blue-600 flex-initial mx-1">
            {item.home_team_score ?? '-'}
          </Text>
          <Text className="text-xs text-gray-500 mx-2">vs</Text>
          <Text className="text-lg font-bold text-blue-600 flex-initial mx-1">
            {item.away_team_score ?? '-'}
          </Text>
          <Text className="text-sm font-medium text-gray-700 flex-1 text-center">
            {item.away_team.name}
          </Text>
        </View>
      ) : (
        <Text className="text-sm text-gray-600 mb-2">Result details unavailable</Text>
      )}
      <Text className="text-xs text-gray-500 mb-1">
        Played on: {new Date(item.start_time).toLocaleDateString()}
      </Text>
      {item.location_name && <Text className="text-xs text-gray-500 italic">{item.location_name}</Text>}
    </Card>
  );

  const renderNewsItem = ({ item }: { item: NewsArticleRow }) => (
    <Card onPress={() => router.push(`/news/${item.id}`)}>
      <Text className="text-lg font-semibold mb-1.5 text-gray-800">{item.title}</Text>
      <Text className="text-xs text-gray-500">
        {item.published_at ? new Date(item.published_at).toLocaleDateString() : 'Date N/A'}
      </Text>
    </Card>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 16 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#007AFF"]} tintColor={"#007AFF"} />}
      >

        <View className="mb-7">
          <Text className="text-xl font-semibold mb-4 text-gray-700">
            Upcoming Games
          </Text>
          {loadingEvents ? (
            <ActivityIndicator/>
          ) : upcomingEvents.length > 0 ? (
            <FlatList
              data={upcomingEvents}
              renderItem={renderEventItem}
              keyExtractor={(item) => `upcoming-${item.id}`}
              showsHorizontalScrollIndicator={false}
            />
          ) : (
            <Text className="text-center text-gray-500 mt-3 text-sm">
              No upcoming games scheduled.
            </Text>
          )}
        </View>

        <View className="mb-7">
          <Text className="text-xl font-semibold mb-4 text-gray-700">
            Recent Results
          </Text>
          {loadingResults ? (
            <ActivityIndicator/>
          ) : recentResults.length > 0 ? (
            <FlatList
              data={recentResults}
              renderItem={renderResultItem}
              keyExtractor={(item) => `result-${item.id}`}
            />
          ) : (
            <Text className="text-center text-gray-500 mt-3 text-sm">
              No recent results available.
            </Text>
          )}
        </View>

        <View className="mb-7">
          <Text className="text-xl font-semibold mb-4 text-gray-700">
            Latest News
          </Text>
          {loadingNews ? (
            <ActivityIndicator/>
          ) : latestNews.length > 0 ? (
            <FlatList
              data={latestNews}
              renderItem={renderNewsItem}
              keyExtractor={(item) => `news-${item.id}`}
            />
          ) : (
            <Text className="text-center text-gray-500 mt-3 text-sm">
              No recent news.
            </Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
