// src/store/interactionStore.ts (or wherever you keep your stores)

import { create } from 'zustand';
import { supabase } from '@utils/superbase';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { Tables, TablesInsert } from 'database.types';

// Define the types for likes and comments rows
type LikeRow = Tables<'likes'>;
// Update CommentRow to potentially include profile information
type CommentRow = Tables<'comments'> & {
  profiles?: Pick<Tables<'profiles'>, 'id' | 'bio' | 'profile_picture'> | null; // Or all fields if you add them
};


// Define the state interface for the interaction store
interface InteractionState {
  likes: LikeRow[];
  comments: CommentRow[]; // Use the updated CommentRow
  loadingLikes: boolean;
  loadingComments: boolean;
  error: string | null;
}

// Define the actions interface for the interaction store
interface InteractionActions {
  fetchLikesForPost: (postId: string) => Promise<LikeRow[]>;
  likePost: (postId: string, userId: string) => Promise<LikeRow | null>;
  unlikePost: (postId: string, userId: string) => Promise<void>;
  isPostLikedByUser: (postId: string, userId: string) => boolean;
  subscribeToLikes: () => () => void;

  fetchCommentsForPost: (postId: string) => Promise<CommentRow[]>;
  addCommentToPost: (commentData: TablesInsert<'comments'>) => Promise<CommentRow | null>; // Return type might need profile too if consistency is key
  deleteComment: (commentId: string) => Promise<void>;
  subscribeToComments: (postId?: string) => () => void;
}

type InteractionStore = InteractionState & InteractionActions;

export const useInteractionStore = create<InteractionStore>((set, get) => ({
  likes: [],
  comments: [],
  loadingLikes: false,
  loadingComments: false,
  error: null,

  // ... (like actions remain the same) ...

  // --- Likes ---

  /**
   * Fetches likes for a specific news post.
   * @param postId - The ID of the news post.
   * @returns An array of LikeRow objects.
   */
  fetchLikesForPost: async (postId: string) => {
    set({ loadingLikes: true, error: null });
    try {
      const { data, error } = await supabase
        .from('likes')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      set((state) => ({
        likes: [
          ...state.likes.filter(like => like.post_id !== postId),
          ...(data || [])
        ],
        loadingLikes: false
      }));
      return data || [];
    } catch (e: any) {
      set({ error: e.message || 'Failed to fetch likes', loadingLikes: false });
      console.error('Error fetching likes:', e);
      return [];
    }
  },

  /**
   * Records a like for a news post by a user.
   * @param postId - The ID of the news post.
   * @param userId - The ID of the user liking the post.
   * @returns The created LikeRow object, or null if an error occurred.
   */
  likePost: async (postId: string, userId: string) => {
    try {
      const { data, error } = await supabase
        .from('likes')
        .insert([{ post_id: postId, user_id: userId }])
        .select('*')
        .single();

      if (error) throw error;
      return data as LikeRow | null;
    } catch (e: any) {
      if (e.code === '23505') {
         console.warn('User already liked this post.');
         const existingLike = get().likes.find(like => like.post_id === postId && like.user_id === userId);
         return existingLike || null;
      }
      set({ error: e.message || 'Failed to like post' });
      console.error('Error liking post:', e);
      return null;
    }
  },

  /**
   * Removes a like for a news post by a user.
   * @param postId - The ID of the news post.
   * @param userId - The ID of the user who liked the post.
   */
  unlikePost: async (postId: string, userId: string) => {
    try {
      const { error } = await supabase
        .from('likes')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', userId);

      if (error) throw error;
    } catch (e: any) {
      set({ error: e.message || 'Failed to unlike post' });
      console.error('Error unliking post:', e);
    }
  },

  /**
   * Checks if a specific news post is liked by a given user.
   * @param postId - The ID of the news post.
   * @param userId - The ID of the user.
   * @returns True if the post is liked by the user, false otherwise.
   */
  isPostLikedByUser: (postId: string, userId: string): boolean => {
    return get().likes.some(like => like.post_id === postId && like.user_id === userId);
  },

   /**
    * Subscribes to realtime changes in the 'likes' table.
    * Updates the store state based on received changes.
    * Returns an unsubscribe function.
    */
   subscribeToLikes: () => {
     const channel = supabase
       .channel('public-likes-realtime')
       .on<Tables<'likes'>>( // Use Tables<'likes'> here for payload type
         'postgres_changes',
         { event: '*', schema: 'public', table: 'likes' },
         (payload: RealtimePostgresChangesPayload<Tables<'likes'>>) => { // Adjust payload type
           console.log('Like change received!', payload);
           const { eventType, new: newData, old: oldData } = payload;

           set((state) => {
             let updatedLikes = [...state.likes];

             if (eventType === 'INSERT') {
               updatedLikes = [...updatedLikes, newData as LikeRow];
             } else if (eventType === 'DELETE') {
               const oldId = (oldData as Partial<LikeRow>)?.id;
               if (oldId) {
                 updatedLikes = updatedLikes.filter((like) => like.id !== oldId);
               }
             }
             return { likes: updatedLikes };
           });
         }
       )
       .subscribe((status, err) => {
         if (err) {
           console.error('Error subscribing to likes channel:', err);
           set({ error: `Subscription error: ${err.message}` });
         } else {
            console.log('Subscribed to likes channel with status:', status);
         }
       });
     return () => {
       supabase.removeChannel(channel);
       console.log('Unsubscribed from likes channel');
     };
   },

  // --- Comments ---
  fetchCommentsForPost: async (postId: string) => {
    set({ loadingComments: true, error: null });
    try {
      // MODIFIED: Select comment data and related profile data.
      // Assumes 'user_id' in 'comments' table is the FK to 'profiles' table's 'id'.
      // And your FK constraint allows Supabase to infer this join as 'profiles'.
      // Or, be explicit: profiles!comments_user_id_fkey(id, bio, profile_picture)
      // If your 'profiles' table gets 'full_name', 'username', add them here.
      const { data, error } = await supabase
        .from('comments')
        .select('*, profiles(id, bio, profile_picture)') // Or specific FK name
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      set((state) => ({
        comments: [
          ...state.comments.filter(comment => comment.post_id !== postId),
          ...(data as CommentRow[] || []) // Cast to updated CommentRow
        ],
        loadingComments: false
      }));
      return data as CommentRow[] || [];
    } catch (e: any) {
      set({ error: e.message || 'Failed to fetch comments', loadingComments: false });
      console.error('Error fetching comments:', e);
      return [];
    }
  },

  addCommentToPost: async (commentData: TablesInsert<'comments'>) => {
    try {
      // If you want the returned comment to also have profile info, you'd need a more complex insert
      // or a subsequent fetch. For now, it returns the basic comment.
      const { data, error } = await supabase
        .from('comments')
        .insert([commentData])
        .select('*, profiles(id, bio, profile_picture)') // Fetch profile after insert
        .single();

      if (error) throw error;
      return data as CommentRow | null;
    } catch (e: any) {
      set({ error: e.message || 'Failed to add comment' });
      console.error('Error adding comment:', e);
      return null;
    }
  },

  deleteComment: async (commentId: string) => {
    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId);
      if (error) throw error;
    } catch (e: any) {
      set({ error: e.message || 'Failed to delete comment' });
      console.error('Error deleting comment:', e);
    }
  },

  subscribeToComments: (postId?: string) => {
     const channelName = postId
       ? `public-comments-realtime-${postId}`
       : 'public-comments-realtime-all';
     const filter = postId ? `post_id=eq.${postId}` : undefined;

     const channel = supabase
       .channel(channelName)
       .on<Tables<'comments'>>( // Base type for payload
         'postgres_changes',
         { event: '*', schema: 'public', table: 'comments', filter },
         async (payload: RealtimePostgresChangesPayload<Tables<'comments'>>) => { // Use base type
           console.log('Comment change received!', payload);
           const { eventType, new: newRawData, old: oldData } = payload;

           set((state) => {
             let updatedComments = [...state.comments];
             const getCreatedAtValue = (comment: CommentRow): number => {
                return comment.created_at ? new Date(comment.created_at).getTime() : 0;
             }

             // For INSERT/UPDATE, the newRawData won't have the 'profiles' object yet.
             // A full solution for realtime would require re-fetching the comment with its profile,
             // or your backend sending the enriched data.
             // This simplified version handles the raw comment data.

             if (eventType === 'INSERT' && newRawData) {
               // Ideally, fetch newRawData.id with its profile here for consistency
               const newComment = { ...newRawData } as CommentRow; // May lack .profiles initially
               updatedComments = [...updatedComments, newComment].sort((a, b) =>
                 getCreatedAtValue(a) - getCreatedAtValue(b)
               );
             } else if (eventType === 'UPDATE' && newRawData) {
               updatedComments = updatedComments.map((comment) =>
                 comment.id === newRawData.id ? ({ ...comment, ...newRawData } as CommentRow) : comment // Preserve existing .profiles if any
               ).sort((a, b) =>
                 getCreatedAtValue(a) - getCreatedAtValue(b)
               );
             } else if (eventType === 'DELETE') {
               const oldId = (oldData as Partial<Tables<'comments'>>)?.id;
               if (oldId) {
                 updatedComments = updatedComments.filter((comment) => comment.id !== oldId);
               }
             }
             return { comments: updatedComments };
           });
         }
       )
       .subscribe((status, err) => {
         if (err) {
           console.error(`Error subscribing to ${channelName} channel:`, err);
           set({ error: `Subscription error (${channelName}): ${err.message}` });
         } else {
            console.log(`Subscribed to ${channelName} channel with status:`, status);
            if (status === 'SUBSCRIBED' && postId && !get().loadingComments) {
                const hasCommentsForPost = get().comments.some(comment => comment.post_id === postId && comment.profiles); // Check if profiles are loaded
                if (!hasCommentsForPost) {
                    get().fetchCommentsForPost(postId); // This will fetch with profiles
                }
            }
         }
       });
     return () => {
       supabase.removeChannel(channel);
       console.log(`Unsubscribed from ${channelName} channel`);
     };
   },
}));