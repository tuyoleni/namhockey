import { create } from 'zustand';
import { supabase } from '@utils/superbase';
import { Database } from 'types/database.types';

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
    
    const { data: comment } = await supabase
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
      
    if (comment) {
      set((state) => ({
        comments: {
          ...state.comments,
          [postId]: [...(state.comments[postId] || []), comment]
        }
      }));
    }
  },
  
  getComments: async (postId) => {
    const { data: comments } = await supabase
      .from('comments')
      .select(`
        *,
        user:profiles(*)
      `)
      .eq('post_id', postId)
      .order('created_at', { ascending: true });
      
    return (comments || []) as Comment[];
  }
}));