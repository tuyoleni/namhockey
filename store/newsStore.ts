// src/store/newsStore.ts (or wherever you keep your stores)

import { create } from 'zustand';
import { supabase } from '@utils/superbase'; // Adjust the import path for your supabase client
import { Database, Tables, TablesInsert, TablesUpdate } from 'types/database.types'; // Adjust the import path for your database types
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

// Define the type for a news article row
type NewsArticleRow = Tables<'news_articles'>;

// Define the state interface for the news store
interface NewsState {
  newsArticles: NewsArticleRow[];
  loadingNews: boolean;
  error: string | null;
}

// Define the actions interface for the news store
interface NewsActions {
  fetchNewsArticles: () => Promise<void>;
  addNewsArticle: (articleData: TablesInsert<'news_articles'>) => Promise<NewsArticleRow | null>;
  updateNewsArticle: (articleId: string, articleData: TablesUpdate<'news_articles'>) => Promise<NewsArticleRow | null>;
  deleteNewsArticle: (articleId: string) => Promise<void>;
  subscribeToNewsArticles: () => () => void; // Returns an unsubscribe function
}

// Combine state and actions interfaces
type NewsStore = NewsState & NewsActions;

export const useNewsStore = create<NewsStore>((set, get) => ({
  // Initial state
  newsArticles: [],
  loadingNews: false,
  error: null,

  // Actions

  /**
   * Fetches all news articles from the database.
   */
  fetchNewsArticles: async () => {
    set({ loadingNews: true, error: null });
    try {
      const { data, error } = await supabase
        .from('news_articles')
        .select('*') // Select all columns for news articles
        .order('published_at', { ascending: false }); // Order by published date, newest first

      if (error) throw error;

      set({ newsArticles: data || [], loadingNews: false });
    } catch (e: any) {
      set({ error: e.message || 'Failed to fetch news articles', loadingNews: false, newsArticles: [] });
      console.error('Error fetching news articles:', e);
    }
  },

  /**
   * Adds a new news article to the database.
   * @param articleData - The data for the new article.
   * @returns The added article data, or null if an error occurred.
   */
  addNewsArticle: async (articleData) => {
    try {
      const { data, error } = await supabase
        .from('news_articles')
        .insert(articleData)
        .select('*') // Select the inserted row
        .single(); // Expect a single result

      if (error) throw error;

      // Realtime subscription will handle updating the store state
      return data as NewsArticleRow | null;
    } catch (e: any) {
      set({ error: e.message || 'Failed to add news article' });
      console.error('Error adding news article:', e);
      return null;
    }
  },

  /**
   * Updates an existing news article in the database.
   * @param articleId - The ID of the article to update.
   * @param articleData - The updated data for the article.
   * @returns The updated article data, or null if an error occurred.
   */
  updateNewsArticle: async (articleId, articleData) => {
    try {
      const { data, error } = await supabase
        .from('news_articles')
        .update(articleData)
        .eq('id', articleId) // Filter by article ID
        .select('*') // Select the updated row
        .single(); // Expect a single result

      if (error) throw error;

      // Realtime subscription will handle updating the store state
      return data as NewsArticleRow | null;
    } catch (e: any) {
      set({ error: e.message || 'Failed to update news article' });
      console.error('Error updating news article:', e);
      return null;
    }
  },

  /**
   * Deletes a news article from the database.
   * @param articleId - The ID of the article to delete.
   */
  deleteNewsArticle: async (articleId) => {
    try {
      const { error } = await supabase
        .from('news_articles')
        .delete()
        .eq('id', articleId); // Filter by article ID

      if (error) throw error;

      // Realtime subscription will handle removing the article from the store state
    } catch (e: any) {
      set({ error: e.message || 'Failed to delete news article' });
      console.error('Error deleting news article:', e);
    }
  },

  /**
   * Subscribes to realtime changes in the 'news_articles' table.
   * Updates the store state based on received changes.
   * Returns an unsubscribe function.
   */
  subscribeToNewsArticles: () => {
    const channel = supabase
      .channel('public-news-articles-realtime') // Unique channel name
      .on<NewsArticleRow>(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'news_articles' },
        (payload: RealtimePostgresChangesPayload<NewsArticleRow>) => {
          console.log('News article change received!', payload);
          const { eventType, new: newData, old: oldData } = payload;

          set((state) => {
            let updatedArticles = [...state.newsArticles];

            // Helper function to get published_at time value safely for sorting
            const getPublishedAtValue = (article: NewsArticleRow): number => {
               return article.published_at ? new Date(article.published_at).getTime() : 0; // Treat null as beginning
            }

            if (eventType === 'INSERT') {
              // Add new article and keep sorted by published_at (newest first)
              updatedArticles = [...updatedArticles, newData as NewsArticleRow].sort((a, b) =>
                 getPublishedAtValue(b) - getPublishedAtValue(a) // Sort descending
              );
            } else if (eventType === 'UPDATE') {
              // Find and update the article, then re-sort
              updatedArticles = updatedArticles.map((article) =>
                article.id === (newData as NewsArticleRow).id ? (newData as NewsArticleRow) : article
              ).sort((a, b) =>
                 getPublishedAtValue(b) - getPublishedAtValue(a) // Sort descending
              );
            } else if (eventType === 'DELETE') {
              // Remove the deleted article
              const oldId = (oldData as Partial<NewsArticleRow>)?.id;
              if (oldId) {
                updatedArticles = updatedArticles.filter((article) => article.id !== oldId);
              }
            }

            return { newsArticles: updatedArticles };
          });
        }
      )
      .subscribe((status, err) => {
        if (err) {
          console.error('Error subscribing to news articles channel:', err);
          set({ error: `Subscription error: ${err.message}` });
        } else {
           console.log('Subscribed to news articles channel with status:', status);
           // Optionally fetch initial data if subscription is successful and store is empty
           if (status === 'SUBSCRIBED' && get().newsArticles.length === 0 && !get().loadingNews) {
               get().fetchNewsArticles();
           }
        }
      });

    return () => {
      // Unsubscribe from the channel when the component using the store unmounts
      supabase.removeChannel(channel);
      console.log('Unsubscribed from news articles channel');
    };
  },
}));
