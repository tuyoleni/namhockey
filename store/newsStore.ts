import { create } from 'zustand';
import { supabase } from '@utils/superbase'; // Ensure this path is correct
import { Tables, TablesInsert, TablesUpdate } from 'types/database.types'; // Ensure this path is correct
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

type ProfileRow = Tables<'profiles'>;

type NewsArticleRow = Tables<'news_articles'> & {
  profiles: ProfileRow | null;
};

interface NewsState {
  newsArticles: NewsArticleRow[];
  loadingNews: boolean;
  error: string | null;
}

interface NewsActions {
  fetchArticleById(articleId: string): Promise<NewsArticleRow | null>;
  fetchNewsArticles: () => Promise<void>;
  addNewsArticle: (articleData: TablesInsert<'news_articles'>) => Promise<NewsArticleRow | null>;
  updateNewsArticle: (articleId: string, articleData: TablesUpdate<'news_articles'>) => Promise<NewsArticleRow | null>;
  deleteNewsArticle: (articleId: string) => Promise<void>;
  subscribeToNewsArticles: () => () => void;
}

type NewsStore = NewsState & NewsActions;

export const useNewsStore = create<NewsStore>((set, get) => ({
  newsArticles: [],
  loadingNews: false,
  error: null,

  fetchArticleById: async (articleId: string) => {
    console.log(`Workspaceing article by ID: ${articleId} using FK name news_articles_author_profile_id_fkey`);
    try {
      const { data, error } = await supabase
        .from('news_articles')
        .select(`
          *,
          profiles!news_articles_author_profile_id_fkey(*)
        `)
        .eq('id', articleId)
        .single();

      if (error) {
        console.error(`Error fetching article by id ${articleId} (raw):`, error);
        throw error;
      }
      console.log(`Workspaceed article by ID ${articleId}:`, data); // CHECK THIS LOG FOR 'profiles'
      return data as NewsArticleRow | null;
    } catch (e: any) {
      console.error(`Error fetching article by id ${articleId} (catch):`, e.message);
      return null;
    }
  },

  fetchNewsArticles: async () => {
    console.log('Fetching all news articles using FK name news_articles_author_profile_id_fkey...');
    set({ loadingNews: true, error: null });
    try {
      const { data, error } = await supabase
        .from('news_articles')
        .select(`
          *,
          profiles!news_articles_author_profile_id_fkey(*)
        `)
        .order('published_at', { ascending: false });

      if (error) {
        console.error('Error fetching news articles (raw):', error);
        throw error;
      }
      console.log('Fetched all news articles:', data); // CHECK THIS LOG FOR 'profiles'
      set({ newsArticles: (data as NewsArticleRow[]) || [], loadingNews: false });
      console.log('Current newsArticles state after fetchNewsArticles:', get().newsArticles);
    } catch (e: any) {
      console.error('Error fetching news articles (catch):', e.message);
      set({ error: e.message || 'Failed to fetch news articles', loadingNews: false, newsArticles: [] });
    }
  },

  addNewsArticle: async (articleData: TablesInsert<'news_articles'>) => {
    console.log('Adding new news article:', articleData);
    try {
      const { data, error } = await supabase
        .from('news_articles')
        .insert(articleData)
        .select(`
          *,
          profiles!news_articles_author_profile_id_fkey(*)
        `)
        .single();

      if (error) {
        console.error('Error adding news article (raw):', error);
        throw error;
      }
      console.log('Added news article, response data:', data); // CHECK THIS LOG FOR 'profiles'
      return data as NewsArticleRow | null;
    } catch (e: any) {
      console.error('Error adding news article (catch):', e.message);
      set({ error: e.message || 'Failed to add news article' });
      return null;
    }
  },

  updateNewsArticle: async (articleId: string, articleData: TablesUpdate<'news_articles'>) => {
    console.log(`Updating news article ${articleId} with:`, articleData);
    try {
      const { data, error } = await supabase
        .from('news_articles')
        .update(articleData)
        .eq('id', articleId)
        .select(`
          *,
          profiles!news_articles_author_profile_id_fkey(*)
        `)
        .single();

      if (error) {
        console.error(`Error updating news article ${articleId} (raw):`, error);
        throw error;
      }
      console.log(`Updated news article ${articleId}, response data:`, data); // CHECK THIS LOG FOR 'profiles'
      return data as NewsArticleRow | null;
    } catch (e: any) {
      console.error(`Error updating news article ${articleId} (catch):`, e.message);
      set({ error: e.message || 'Failed to update news article' });
      return null;
    }
  },

  deleteNewsArticle: async (articleId: string) => {
    console.log(`Deleting news article ${articleId}`);
    try {
      const { error } = await supabase
        .from('news_articles')
        .delete()
        .eq('id', articleId);

      if (error) {
        console.error(`Error deleting news article ${articleId} (raw):`, error);
        throw error;
      }
      console.log(`Successfully deleted news article ${articleId}`);
    } catch (e: any) {
      console.error(`Error deleting news article ${articleId} (catch):`, e.message);
      set({ error: e.message || 'Failed to delete news article' });
    }
  },

  subscribeToNewsArticles: () => {
    console.log('Attempting to subscribe to news articles changes...');
    const sortArticles = (articles: NewsArticleRow[]): NewsArticleRow[] => {
      return [...articles].sort((a, b) => {
        const timeA = a.published_at ? new Date(a.published_at).getTime() : 0;
        const timeB = b.published_at ? new Date(b.published_at).getTime() : 0;
        return timeB - timeA;
      });
    };

    const channel = supabase
      .channel('public-news-articles-realtime')
      .on<Tables<'news_articles'>>(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'news_articles' },
        async (payload: RealtimePostgresChangesPayload<Tables<'news_articles'>>) => {
          console.log('Realtime: News article change received! Payload:', payload);
          const { eventType, new: newRawData, old: oldData, errors } = payload;

          if (errors) {
            console.error('Realtime payload error:', errors);
            return;
          }

          if (eventType === 'INSERT') {
            if (newRawData?.id) {
              console.log(`Realtime INSERT detected for article ID: ${newRawData.id}. Raw data:`, newRawData);
              console.log(`Realtime INSERT: Fetching article ${newRawData.id} with profile.`);
              const newArticleWithProfile = await get().fetchArticleById(newRawData.id);
              if (newArticleWithProfile) {
                console.log(`Realtime INSERT: Fetched article ${newRawData.id} with profile:`, newArticleWithProfile);
                set((state) => {
                  const updatedArticles = sortArticles(
                    [...state.newsArticles.filter(a => a.id !== newArticleWithProfile.id), newArticleWithProfile]
                  );
                  console.log('Realtime INSERT: Updated newsArticles state:', updatedArticles);
                  return { newsArticles: updatedArticles };
                });
              } else {
                console.warn(`Realtime INSERT: Article ${newRawData.id} fetched as null after event.`);
              }
            }
          } else if (eventType === 'UPDATE') {
            if (newRawData?.id) {
              console.log(`Realtime UPDATE detected for article ID: ${newRawData.id}. Raw data:`, newRawData);
              console.log(`Realtime UPDATE: Fetching article ${newRawData.id} with profile.`);
              const updatedArticleWithProfile = await get().fetchArticleById(newRawData.id);
              if (updatedArticleWithProfile) {
                 console.log(`Realtime UPDATE: Fetched article ${newRawData.id} with profile:`, updatedArticleWithProfile);
                set((state) => {
                  const updatedArticles = sortArticles(
                    state.newsArticles.map((article) =>
                      article.id === updatedArticleWithProfile.id ? updatedArticleWithProfile : article
                    )
                  );
                  console.log('Realtime UPDATE: Updated newsArticles state:', updatedArticles);
                  return { newsArticles: updatedArticles };
                });
              } else {
                 console.warn(`Realtime UPDATE: Article ${newRawData.id} fetched as null after event.`);
              }
            }
          } else if (eventType === 'DELETE') {
            const oldId = (oldData as Partial<Tables<'news_articles'>>)?.id;
            if (oldId) {
              console.log(`Realtime DELETE detected for article ID: ${oldId}. Old data:`, oldData);
              set((state) => {
                const updatedArticles = state.newsArticles.filter((article) => article.id !== oldId);
                console.log('Realtime DELETE: Updated newsArticles state:', updatedArticles);
                return { newsArticles: updatedArticles };
              });
            }
          }
        }
      )
      .subscribe(async (status, err) => {
        if (err) {
          console.error('Error subscribing to news articles channel:', err ? err.message : 'Unknown subscription error');
          set({ error: `Subscription error: ${err ? err.message : 'Unknown error'}` });
        } else {
           console.log('Subscribed to news articles channel with status:', status);
           if (status === 'SUBSCRIBED') {
             const currentStore = get();
             if (currentStore.newsArticles.length === 0 && !currentStore.loadingNews && !currentStore.error) {
                 console.log("Subscription active, store empty, no loading, no error. Fetching initial news articles.");
                 await currentStore.fetchNewsArticles();
             }
           }
        }
      });

    return () => {
      console.log('Unsubscribing from news articles channel.');
      if (channel) {
        supabase.removeChannel(channel)
          .then(() => console.log('Successfully unsubscribed from news articles channel'))
          .catch(e => console.error('Error unsubscribing from news articles channel:', e.message));
      }
    };
  },
}));