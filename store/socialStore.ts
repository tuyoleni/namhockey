import { create } from 'zustand';
import { supabase } from '@utils/superbase';
import { Database } from 'types/database.types';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

type Tables = Database['public']['Tables']
type Comment = Tables['comments']['Row'] & {
  user: Tables['profiles']['Row']
}

interface SocialState {
  likes: Record<string, boolean>;
  comments: Record<string, Comment[]>;
  
  // Like actions
  toggleLike: (postId: string) => Promise<void>;
  getLikes: (postId: string) => Promise<number>;
  
  // Comment actions
  addComment: (postId: string, text: string) => Promise<void>;
  getComments: (postId: string) => Promise<Comment[]>;
}

export const useSocialStore = create<SocialState>((set, get) => ({
  likes: {},
  comments: {},
  
  toggleLike: async (postId) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const currentLiked = get().likes[postId] || false;
    
    if (currentLiked) {
      await supabase
        .from('likes')
        .delete()
        .match({ user_id: user.id, post_id: postId });
    } else {
      await supabase
        .from('likes')
        .insert({ user_id: user.id, post_id: postId });
    }
    
    set((state) => ({
      likes: { ...state.likes, [postId]: !currentLiked }
    }));
  },
  
  getLikes: async (postId) => {
    const { count } = await supabase
      .from('likes')
      .select('*', { count: 'exact' })
      .eq('post_id', postId);
    return count || 0;
  },
  
  addComment: async (postId, text) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    console.log('[Comment] Adding comment to post:', postId); // Log before adding
    
    const { data: comment, error } = await supabase
      .from('comments')
      .insert({
        user_id: user.id,
        post_id: postId,
        content: text,
        created_at: new Date().toISOString()
      })
      .select(`
        *,
        user:profiles(*)
      `)
      .single();
      
    if (error) {
      console.error('[Comment] Error adding comment:', error);
      return;
    }
    
    if (comment) {
      console.log('[Comment] Successfully added:', comment); // Log successful addition
      set((state) => ({
        comments: {
          ...state.comments,
          [postId]: [...(state.comments[postId] || []), comment]
        }
      }));
    }
  },
  
  getComments: async (postId) => {
    console.log('[Comment] Fetching comments for post:', postId);
    
    const { data: comments, error } = await supabase
      .from('comments')
      .select(`
        *,
        user:profiles(*)
      `)
      .eq('post_id', postId)
      .order('created_at', { ascending: true });
      
    if (error) {
      console.error('[Comment] Error fetching comments:', error);
    } else {
      console.log('[Comment] Successfully fetched:', comments?.length, 'comments');
      console.log('[Comment] Full comments data:', JSON.stringify(comments, null, 2));
    }
    
    return (comments || []) as Comment[];
  },

  // Add real-time subscription
  subscribeToComments: (postId: any, callback: (arg0: RealtimePostgresChangesPayload<{ [key: string]: any; }>) => void) => {
    console.log('[Comment] Subscribing to comments for post:', postId);
    
    const subscription = supabase
      .channel('comments_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comments',
          filter: `post_id=eq.${postId}`
        },
        (payload) => {
          console.log('[Comment] Change received:', payload);
          callback(payload);
        }
      )
      .subscribe();

    return () => {
      console.log('[Comment] Unsubscribing from comments for post:', postId);
      supabase.removeChannel(subscription);
    };
  }
}));