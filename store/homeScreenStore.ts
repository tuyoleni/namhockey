import { create } from 'zustand';
import { supabase } from '@utils/superbase';
import { Database } from 'types/database.types';




export type EventQueryResult = {
  id: string;
  title: string | null;
  start_time: string | null;
  location_name: string | null;
  home_team_score: number | null;
  away_team_score: number | null;
  home_team: { name: string, logo_url: string  } | null;
  away_team: { name: string, logo_url: string } | null;
};


export type NewsArticleRow = Database['public']['Tables']['news_articles']['Row'];

interface HomeScreenState {
  upcomingEvents: EventQueryResult[];
  recentResults: EventQueryResult[];
  latestNews: NewsArticleRow[];
  loadingEvents: boolean;
  loadingResults: boolean;
  loadingNews: boolean;
  refreshing: boolean;
}

// Define the actions that can modify the state
interface HomeScreenActions {
  fetchUpcomingEvents: () => Promise<void>;
  fetchRecentResults: () => Promise<void>;
  fetchLatestNews: () => Promise<void>;
  onRefresh: () => Promise<void>;
}

// Combine state and actions into a single type for the store
type HomeScreenStore = HomeScreenState & HomeScreenActions;

// Create the Zustand store
export const useHomeScreenStore = create<HomeScreenStore>((set, get) => ({
  // Initial state
  upcomingEvents: [],
  recentResults: [],
  latestNews: [],
  loadingEvents: true,
  loadingResults: true,
  loadingNews: true,
  refreshing: false,

  fetchUpcomingEvents: async () => {
    set({ loadingEvents: true });
  
    const { data, error } = await supabase
      .from('events')
      .select(`*`)
      .order('start_time', { ascending: true })
      .limit(5);
  
    if (error) {
      console.error('[fetchUpcomingEvents] Error:', error);
      set({ upcomingEvents: [] });
    } else {
      console.log('[fetchUpcomingEvents] Raw data:', data);
      set({ upcomingEvents: data as unknown as EventQueryResult[] || [] });
    }
  
    set({ loadingEvents: false });
  },
  

  fetchRecentResults: async () => {
    set({ loadingResults: true });
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('events')
      .select(`*`)
      .lt('start_time', now)
      .order('start_time', { ascending: false })
      .limit(5);

    console.log('[fetchRecentResults] error:', error);
    console.log('[fetchRecentResults] data:', data);

    if (error) {
      set({ recentResults: [] });
    } else {
      set({ recentResults: data as unknown as EventQueryResult[] || [] });
    }

    set({ loadingResults: false });
},
  

  fetchLatestNews: async () => {
    set({ loadingNews: true });

    const { data, error } = await supabase
      .from('news_articles')
      .select('*') // Select all columns as NewsArticleRow includes them
      .order('published_at', { ascending: false })
      .limit(3);

    if (error) {
      console.error('[fetchLatestNews] Error:', error.message);
      set({ latestNews: [] });
    } else {
      set({ latestNews: data || [] });
    }

    set({ loadingNews: false });
  },

  // Action to handle refreshing all data
  onRefresh: async () => {
    set({ refreshing: true });
    // Get the fetch actions from the current state
    const { fetchUpcomingEvents, fetchRecentResults, fetchLatestNews } = get();
    await Promise.all([
      fetchUpcomingEvents(),
      fetchRecentResults(),
      fetchLatestNews(),
    ]);
    set({ refreshing: false });
  },
}));