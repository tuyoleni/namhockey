// src/store/interactionStore.ts (or wherever you keep your stores)

import { create } from 'zustand';
import { supabase } from '@utils/superbase'; // Adjust the import path for your supabase client
import { Database, Tables, TablesInsert } from 'types/database.types'; // Adjust the import path for your database types
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

// Define the types for likes and comments rows
type LikeRow = Tables<'likes'>;
type CommentRow = Tables<'comments'>;

// Define the state interface for the interaction store
interface InteractionState {
  likes: LikeRow[]; // Store all likes, or filter as needed
  comments: CommentRow[]; // Store all comments, or filter as needed
  loadingLikes: boolean;
  loadingComments: boolean;
  error: string | null;
}

// Define the actions interface for the interaction store
interface InteractionActions {
  // Likes actions
  fetchLikesForPost: (postId: string) => Promise<LikeRow[]>;
  likePost: (postId: string, userId: string) => Promise<LikeRow | null>;
  unlikePost: (postId: string, userId: string) => Promise<void>;
  isPostLikedByUser: (postId: string, userId: string) => boolean; // Check if a specific post is liked by a user
  subscribeToLikes: () => () => void; // Subscribe to all like changes

  // Comments actions
  fetchCommentsForPost: (postId: string) => Promise<CommentRow[]>;
  addCommentToPost: (commentData: TablesInsert<'comments'>) => Promise<CommentRow | null>;
  deleteComment: (commentId: string) => Promise<void>;
  subscribeToComments: (postId?: string) => () => void; // Subscribe to comment changes, optionally filtered by post
}

// Combine state and actions interfaces
type InteractionStore = InteractionState & InteractionActions;

export const useInteractionStore = create<InteractionStore>((set, get) => ({
  // Initial state
  likes: [],
  comments: [],
  loadingLikes: false,
  loadingComments: false,
  error: null,

  // Actions

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
        .eq('post_id', postId) // Filter by post ID
        .order('created_at', { ascending: true }); // Order by creation time

      if (error) throw error;

      // Update the store's likes state, ensuring no duplicates for this post
      set((state) => ({
        likes: [
          ...state.likes.filter(like => like.post_id !== postId), // Remove old likes for this post
          ...(data || []) // Add new ones
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
        .select('*') // Select the inserted row
        .single(); // Expect a single result

      if (error) throw error;

      // Realtime subscription will handle updating the store state if active
      return data as LikeRow | null;
    } catch (e: any) {
      // Handle potential duplicate key errors gracefully (user already liked)
      if (e.code === '23505') { // Unique violation error code in PostgreSQL
         console.warn('User already liked this post.');
         // Optionally fetch the existing like to return it
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
        .eq('post_id', postId) // Filter by post ID
        .eq('user_id', userId); // Filter by user ID

      if (error) throw error;

      // Realtime subscription will handle removing the like from the store state if active
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
    // Check the current state for a like by this user for this post
    return get().likes.some(like => like.post_id === postId && like.user_id === userId);
  },

   /**
    * Subscribes to realtime changes in the 'likes' table.
    * Updates the store state based on received changes.
    * Returns an unsubscribe function.
    */
   subscribeToLikes: () => {
     const channel = supabase
       .channel('public-likes-realtime') // Unique channel name
       .on<LikeRow>(
         'postgres_changes',
         { event: '*', schema: 'public', table: 'likes' },
         (payload: RealtimePostgresChangesPayload<LikeRow>) => {
           console.log('Like change received!', payload);
           const { eventType, new: newData, old: oldData } = payload;

           set((state) => {
             let updatedLikes = [...state.likes];

             if (eventType === 'INSERT') {
               // Add new like
               updatedLikes = [...updatedLikes, newData as LikeRow];
             } else if (eventType === 'DELETE') {
               // Remove the deleted like
               const oldId = (oldData as Partial<LikeRow>)?.id;
               if (oldId) {
                 updatedLikes = updatedLikes.filter((like) => like.id !== oldId);
               }
             }
             // Note: Updates to likes are less common (maybe timestamp changes),
             // but the default handling would replace the item if needed.

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
            // Note: We don't auto-fetch all likes here, as it could be a large dataset.
            // Likes are typically fetched for specific posts when needed.
         }
       });

     return () => {
       // Unsubscribe from the channel
       supabase.removeChannel(channel);
       console.log('Unsubscribed from likes channel');
     };
   },


  // --- Comments ---

  /**
   * Fetches comments for a specific news post.
   * @param postId - The ID of the news post.
   * @returns An array of CommentRow objects.
   */
  fetchCommentsForPost: async (postId: string) => {
    set({ loadingComments: true, error: null });
    try {
      const { data, error } = await supabase
        .from('comments')
        .select('*') // Select all columns for comments
        .eq('post_id', postId) // Filter by post ID
        .order('created_at', { ascending: true }); // Order by creation time

      if (error) throw error;

       // Update the store's comments state, ensuring no duplicates for this post
      set((state) => ({
        comments: [
          ...state.comments.filter(comment => comment.post_id !== postId), // Remove old comments for this post
          ...(data || []) // Add new ones
        ],
        loadingComments: false
      }));
      return data || [];
    } catch (e: any) {
      set({ error: e.message || 'Failed to fetch comments', loadingComments: false });
      console.error('Error fetching comments:', e);
      return [];
    }
  },

  /**
   * Adds a new comment to a news post.
   * @param commentData - The data for the new comment (must include post_id and user_id).
   * @returns The created CommentRow object, or null if an error occurred.
   */
  addCommentToPost: async (commentData: TablesInsert<'comments'>) => {
    try {
      const { data, error } = await supabase
        .from('comments')
        .insert([commentData])
        .select('*') // Select the inserted row
        .single(); // Expect a single result

      if (error) throw error;

      // Realtime subscription will handle updating the store state if active
      return data as CommentRow | null;
    } catch (e: any) {
      set({ error: e.message || 'Failed to add comment' });
      console.error('Error adding comment:', e);
      return null;
    }
  },

  /**
   * Deletes a comment by its ID.
   * @param commentId - The ID of the comment to delete.
   */
  deleteComment: async (commentId: string) => {
    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId); // Filter by comment ID

      if (error) throw error;

      // Realtime subscription will handle removing the comment from the store state if active
    } catch (e: any) {
      set({ error: e.message || 'Failed to delete comment' });
      console.error('Error deleting comment:', e);
    }
  },

   /**
    * Subscribes to realtime changes in the 'comments' table.
    * Optionally filters by post ID.
    * Updates the store state based on received changes.
    * Returns an unsubscribe function.
    * @param postId - Optional. If provided, filters changes to this post's comments.
    */
   subscribeToComments: (postId?: string) => {
     const channelName = postId
       ? `public-comments-realtime-${postId}` // Unique channel name per post
       : 'public-comments-realtime-all'; // Channel for all comments

     const filter = postId ? `post_id=eq.${postId}` : undefined; // Apply filter if postId is provided

     const channel = supabase
       .channel(channelName)
       .on<CommentRow>(
         'postgres_changes',
         { event: '*', schema: 'public', table: 'comments', filter }, // Apply the filter
         (payload: RealtimePostgresChangesPayload<CommentRow>) => {
           console.log('Comment change received!', payload);
           const { eventType, new: newData, old: oldData } = payload;

           set((state) => {
             let updatedComments = [...state.comments];

             // Helper function to get created_at time value safely for sorting
             const getCreatedAtValue = (comment: CommentRow): number => {
                return comment.created_at ? new Date(comment.created_at).getTime() : 0; // Treat null as beginning
             }

             if (eventType === 'INSERT') {
               // Add new comment and keep sorted by created_at
               updatedComments = [...updatedComments, newData as CommentRow].sort((a, b) =>
                 getCreatedAtValue(a) - getCreatedAtValue(b)
               );
             } else if (eventType === 'UPDATE') {
               // Find and update the comment, then re-sort
               updatedComments = updatedComments.map((comment) =>
                 comment.id === (newData as CommentRow).id ? (newData as CommentRow) : comment
               ).sort((a, b) =>
                 getCreatedAtValue(a) - getCreatedAtValue(b)
               );
             } else if (eventType === 'DELETE') {
               // Remove the deleted comment
               const oldId = (oldData as Partial<CommentRow>)?.id;
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
            // Optionally fetch initial data if subscription is successful and a postId is provided
            if (status === 'SUBSCRIBED' && postId && !get().loadingComments) {
                // Check if comments for this post are already loaded to avoid redundant fetches
                const hasCommentsForPost = get().comments.some(comment => comment.post_id === postId);
                if (!hasCommentsForPost) {
                    get().fetchCommentsForPost(postId);
                }
            }
         }
       });

     return () => {
       // Unsubscribe from the channel
       supabase.removeChannel(channel);
       console.log(`Unsubscribed from ${channelName} channel`);
     };
   },
}));
