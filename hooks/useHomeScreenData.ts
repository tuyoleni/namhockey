import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@utils/superbase';
import { Database } from 'types/database.types';

type EventRow = Database['public']['Tables']['events']['Row'];
type NewsArticleRow = Database['public']['Tables']['news_articles']['Row'];

export type EventWithTeams = EventRow & {
  home_team: { name: string } | null;
  away_team: { name: string } | null;
};

export type NewsArticleWithAuthor = NewsArticleRow;

interface HomeScreenData {
  upcomingEvents: EventWithTeams[];
  recentResults: EventWithTeams[];
  latestNews: NewsArticleWithAuthor[];
  loadingEvents: boolean;
  loadingResults: boolean;
  loadingNews: boolean;
  refreshing: boolean;
  onRefresh: () => Promise<void>;
}

export function useHomeScreenData(): HomeScreenData {
  const [upcomingEvents, setUpcomingEvents] = useState<EventWithTeams[]>([]);
  const [recentResults, setRecentResults] = useState<EventWithTeams[]>([]);
  const [latestNews, setLatestNews] = useState<NewsArticleWithAuthor[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [loadingResults, setLoadingResults] = useState(true);
  const [loadingNews, setLoadingNews] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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
      setUpcomingEvents([]);
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
      setRecentResults([]);
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

    if (error) {
      console.error('Error fetching latest news:', error);
      setLatestNews([]);
    } else {
      setLatestNews(data || []);
    }
    setLoadingNews(false);
  };

  // Fetch data on mount
  useEffect(() => {
    fetchUpcomingEvents();
    fetchRecentResults();
    fetchLatestNews();
  }, []);

  // Handle pull-to-refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      fetchUpcomingEvents(),
      fetchRecentResults(),
      fetchLatestNews(),
    ]);
    setRefreshing(false);
  }, []);

  return {
    upcomingEvents,
    recentResults,
    latestNews,
    loadingEvents,
    loadingResults,
    loadingNews,
    refreshing,
    onRefresh,
  };
}