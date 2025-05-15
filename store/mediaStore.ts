import { create } from 'zustand';
import { supabase } from '@utils/superbase';
import { Tables, TablesInsert } from 'types/database.types';

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
  uploadMediaPost: (postData: {
    userId: string;
    type: 'image' | 'video';
    file: File | Blob;
    caption?: string;
  }) => Promise<MediaPostRow | null>;
  deleteMediaPost: (postId: string) => Promise<void>;
}

type MediaStore = MediaState & MediaActions;

export const useMediaStore = create<MediaStore>((set) => ({
  mediaPosts: [],
  loadingMedia: false,
  uploadingMedia: false,
  error: null,

  fetchMediaPosts: async () => {
    set({ loadingMedia: true, error: null });
    try {
      const { data, error } = await supabase
        .from('media_posts')
        .select(`*, profiles (id, profile_picture)`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      set({ mediaPosts: (data as MediaPostRow[]) || [], loadingMedia: false });
    } catch (e: any) {
      console.error('Error fetching media posts:', e);
      set({
        error: e.message || 'Failed to fetch media posts',
        loadingMedia: false,
        mediaPosts: [],
      });
    }
  },

  uploadMediaPost: async ({ userId, type, file, caption }) => {
    set({ uploadingMedia: true, error: null });
    try {
      const ext = file instanceof File
        ? file.name.split('.').pop()
        : file.type?.split('/').pop() || 'bin';

      const contentType = file.type || 'application/octet-stream';
      const filePath = `${userId}/${Date.now()}.${ext}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('mediaposts')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
          contentType,
        });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('mediaposts')
        .getPublicUrl(filePath);

      const publicUrl = publicUrlData?.publicUrl;
      if (!publicUrl) throw new Error('Could not generate public URL.');

      const insertData: TablesInsert<'media_posts'> = {
        user_id: userId,
        type,
        url: publicUrl,
        caption: caption || null,
      };

      const { data: postData, error: postError } = await supabase
        .from('media_posts')
        .insert([insertData])
        .select(`*, profiles (id, profile_picture)`)
        .single();

      if (postError) throw postError;

      set({ uploadingMedia: false });
      return postData as MediaPostRow;
    } catch (e: any) {
      console.error('Upload failed:', e);
      set({
        error: e.message || 'Upload failed',
        uploadingMedia: false,
      });
      return null;
    }
  },

  deleteMediaPost: async (postId: string) => {
    set({ loadingMedia: true, error: null });
    try {
      const { data: postData, error } = await supabase
        .from('media_posts')
        .select('url')
        .eq('id', postId)
        .single();

      if (error || !postData?.url) throw error || new Error('No media found');

      const url = new URL(postData.url);
      const filePath = decodeURIComponent(url.pathname.split('/').slice(3).join('/'));

      const { error: dbDeleteError } = await supabase
        .from('media_posts')
        .delete()
        .eq('id', postId);

      if (dbDeleteError) throw dbDeleteError;

      await supabase.storage.from('mediaposts').remove([filePath]);

      set({ loadingMedia: false });
    } catch (e: any) {
      console.error('Delete failed:', e);
      set({
        error: e.message || 'Delete failed',
        loadingMedia: false,
      });
    }
  },
}));