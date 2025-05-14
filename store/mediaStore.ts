// src/store/mediaStore.ts

import { create } from 'zustand';
import { supabase } from '@utils/superbase'; // Adjust the import path for your supabase client
import { Database, Tables, TablesInsert } from 'types/database.types'; // Adjust the import path for your database types
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

type MediaPostRow = Tables<'media_posts'> & {
  profiles?: { id: string; profile_picture: string | null } | null;
};

interface MediaState {
  mediaPosts: MediaPostRow[];
  loadingMedia: boolean;
  uploadingMedia: boolean;
  error: string | null;
}

interface MediaActions {
  fetchMediaPosts: () => Promise<void>;
  uploadMediaPost: (postData: { userId: string; type: 'image' | 'video'; file: File | Blob; caption?: string }) => Promise<MediaPostRow | null>;
  deleteMediaPost: (postId: string) => Promise<void>;
  subscribeToMediaPosts: () => () => void;
}

type MediaStore = MediaState & MediaActions;

export const useMediaStore = create<MediaStore>((set, get) => ({
  mediaPosts: [],
  loadingMedia: false,
  uploadingMedia: false,
  error: null,

  fetchMediaPosts: async () => {
    set({ loadingMedia: true, error: null });
    try {
      const { data, error } = await supabase
        .from('media_posts')
        .select(`
          *,
          profiles (
            id,
            profile_picture
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      set({ mediaPosts: (data as MediaPostRow[]) || [], loadingMedia: false });
    } catch (e: any) {
      console.error('Error fetching media posts:', e);
      set({ error: e.message || 'Failed to fetch media posts', loadingMedia: false, mediaPosts: [] });
    }
  },

  uploadMediaPost: async ({ userId, type, file, caption }) => {
    set({ uploadingMedia: true, error: null });
    try {
      const fileExt = file instanceof File ? file.name.split('.').pop() : file.type.split('/').pop();
      const filePath = `${userId}/${Math.random()}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('mediaposts') // Updated bucket name
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('mediaposts') // Updated bucket name
        .getPublicUrl(filePath);

      if (!publicUrl) throw new Error('Failed to get public URL for uploaded file.');


      const newPostData: TablesInsert<'media_posts'> = {
        user_id: userId,
        type: type,
        url: publicUrl,
        caption: caption || null,
      };

      const { data: postData, error: postError } = await supabase
        .from('media_posts')
        .insert([newPostData])
        .select(`
           *,
           profiles (
             id,
             profile_picture
           )
         `)
        .single();

      if (postError) throw postError;

      set({ uploadingMedia: false });
      return postData as MediaPostRow | null;
    } catch (e: any) {
      console.error('Error uploading media post:', e);
      set({ error: e.message || 'Failed to upload media post', uploadingMedia: false });
      return null;
    }
  },

  deleteMediaPost: async (postId: string) => {
    set({ loadingMedia: true, error: null });

    try {
      const { data: postData, error: fetchError } = await supabase
        .from('media_posts')
        .select('url')
        .eq('id', postId)
        .single();

      if (fetchError) throw fetchError;
      if (!postData?.url) throw new Error('Media post not found or missing URL.');

      const urlParts = postData.url.split('/');
      const publicIndex = urlParts.indexOf('public');
      if (publicIndex === -1 || urlParts.length <= publicIndex + 2) {
           throw new Error('Could not parse file path from URL.');
      }
      const filePath = urlParts.slice(publicIndex + 2).join('/');


      const { error: deleteDbError } = await supabase
        .from('media_posts')
        .delete()
        .eq('id', postId);

      if (deleteDbError) throw deleteDbError;

      const { data: deleteStorageData, error: deleteStorageError } = await supabase.storage
        .from('mediaposts') // Updated bucket name
        .remove([filePath]);

      if (deleteStorageError) {
         console.error('Error deleting file from storage:', deleteStorageError);
      }


      set({ loadingMedia: false });
    } catch (e: any) {
      console.error('Error deleting media post:', e);
      set({ error: e.message || 'Failed to delete media post', loadingMedia: false });
    }
  },

  subscribeToMediaPosts: () => {
    const channel = supabase
      .channel('public-media-posts-realtime')
      .on<Tables<'media_posts'>>(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'media_posts' },
        async (payload: RealtimePostgresChangesPayload<Tables<'media_posts'>>) => {
          console.log('Media post change received!', payload);

           const fetchPostWithProfile = async (id: string): Promise<MediaPostRow | null> => {
               const { data, error: fetchError } = await supabase
                 .from('media_posts')
                 .select(`
                   *,
                   profiles (
                     id,
                     profile_picture
                   )
                 `)
                 .eq('id', id)
                 .single();
               if (fetchError) {
                 console.error(`Error fetching media post ${id} for subscription:`, fetchError);
                 return null;
               }
               return data as MediaPostRow | null;
           };

           const getCreatedAtValue = (post: MediaPostRow): number => {
              return post.created_at ? new Date(post.created_at).getTime() : 0;
           }


          set((state) => {
            let updatedPosts = [...state.mediaPosts];

            if (payload.eventType === 'INSERT') {
              fetchPostWithProfile((payload.new as Tables<'media_posts'>).id).then(newPostDetails => {
                  if(newPostDetails) {
                      set((state) => ({
                          mediaPosts: [...state.mediaPosts, newPostDetails].sort((a, b) =>
                             getCreatedAtValue(b) - getCreatedAtValue(a)
                          )
                      }));
                  }
              });

            } else if (payload.eventType === 'UPDATE') {
              fetchPostWithProfile((payload.new as Tables<'media_posts'>).id).then(updatedPostDetails => {
                  if(updatedPostDetails) {
                      set((state) => ({
                          mediaPosts: state.mediaPosts.map((post) =>
                            post.id === updatedPostDetails.id ? updatedPostDetails : post
                          ).sort((a, b) =>
                            getCreatedAtValue(b) - getCreatedAtValue(a)
                          ),
                      }));
                  }
              });

            } else if (payload.eventType === 'DELETE') {
              const oldId = (payload.old as Partial<Tables<'media_posts'>>)?.id;
              if (oldId) {
                updatedPosts = updatedPosts.filter((post) => post.id !== oldId);
                set({ mediaPosts: updatedPosts });
              }
            }
             return state;
          });
        }
      )
      .subscribe((status, err) => {
        if (err) {
          console.error('Error subscribing to media posts channel:', err);
          set({ error: `Subscription error: ${err.message}` });
        } else {
           console.log('Subscribed to media posts channel with status:', status);
           if (status === 'SUBSCRIBED' && get().mediaPosts.length === 0 && !get().loadingMedia) {
               get().fetchMediaPosts();
           }
        }
      });

    return () => {
      supabase.removeChannel(channel);
      console.log('Unsubscribed from media posts channel');
    };
  },
}));
