import { create } from 'zustand';
import { supabase } from '@utils/superbase';
import { Tables, TablesInsert } from 'database.types';

type PostAuthorProfile = Pick<Tables<'profiles'>, 'id' | 'display_name' | 'profile_picture'> | null;

export type MediaPostWithAuthor = Tables<'media_posts'> & {
  profiles: PostAuthorProfile;
};
type NewMediaPostPayload = TablesInsert<'media_posts'>;

interface UploadMediaDetails {
    uploaderUserId: string;
    mediaType: 'image' | 'video';
    mediaFile: Blob;
    captionText?: string;
    originalFileName?: string | null;
}

interface MediaState {
  allMediaPosts: MediaPostWithAuthor[];
  isLoadingMedia: boolean;
  isUploadingMedia: boolean;
  operationError: string | null;
}

interface MediaActions {
  loadAllMediaPosts: () => Promise<void>;
  createNewMediaPost: (details: UploadMediaDetails) => Promise<MediaPostWithAuthor | null>;
  removeMediaPost: (postId: string) => Promise<boolean>;
}

const MEDIA_POST_BUCKET_NAME = 'mediaposts';

export const useMediaStore = create<MediaState & MediaActions>((set, get) => ({
  allMediaPosts: [],
  isLoadingMedia: false,
  isUploadingMedia: false,
  operationError: null,

  loadAllMediaPosts: async () => {
    set({ isLoadingMedia: true, operationError: null });
    try {
      const { data, error } = await supabase
        .from('media_posts')
        .select(`
          *,
          profiles ( 
            id,
            display_name,
            profile_picture
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      set({ allMediaPosts: (data as MediaPostWithAuthor[]) || [], isLoadingMedia: false });
    } catch (error: any) {
      console.error('Error loading media posts:', error);
      set({ operationError: error.message || 'Failed to load posts.', isLoadingMedia: false, allMediaPosts: [] });
    }
  },

  createNewMediaPost: async ({ uploaderUserId, mediaType, mediaFile, captionText, originalFileName }) => {
    set({ isUploadingMedia: true, operationError: null });
    try {
      let fileExtension = 'bin';
      if (originalFileName) {
        const nameParts = originalFileName.split('.');
        if (nameParts.length > 1) fileExtension = nameParts.pop()?.toLowerCase() || fileExtension;
      } else if (mediaFile.type) {
        fileExtension = mediaFile.type.split('/')?.pop()?.toLowerCase() || fileExtension;
      }
      fileExtension = fileExtension.replace(/[^a-z0-9]/gi, '');
      if (!fileExtension || fileExtension.length > 5) fileExtension = 'bin';

      const fileContentType = mediaFile.type || 'application/octet-stream';
      const uniqueFileStoragePath = `${uploaderUserId}/${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExtension}`;

      const { error: storageError } = await supabase.storage
        .from(MEDIA_POST_BUCKET_NAME)
        .upload(uniqueFileStoragePath, mediaFile, {
          cacheControl: '3600',
          upsert: false,
          contentType: fileContentType,
        });

      if (storageError) throw storageError;

      const { data: urlData } = supabase.storage
        .from(MEDIA_POST_BUCKET_NAME)
        .getPublicUrl(uniqueFileStoragePath);

      const publicFileUrl = urlData?.publicUrl;
      if (!publicFileUrl) throw new Error('Could not get public URL for the uploaded file.');

      const newPostData: NewMediaPostPayload = {
        url: publicFileUrl,
        user_id: uploaderUserId,
        type: mediaType,
        caption: captionText || null,
      };

      const { data: savedPost, error: insertError } = await supabase
        .from('media_posts')
        .insert([newPostData])
        .select(`
          *,
          profiles (
            id,
            display_name,
            profile_picture
          )
        `)
        .single();

      if (insertError) throw insertError;
      if (!savedPost) throw new Error('Failed to save post data after upload.');
      
      const newPostWithAuthor = savedPost as MediaPostWithAuthor;

      set((state) => ({
        isUploadingMedia: false,
        allMediaPosts: [newPostWithAuthor, ...state.allMediaPosts],
      }));
      return newPostWithAuthor;

    } catch (error: any) {
      console.error('Create new media post failed:', error);
      set({ operationError: error.message || 'Upload failed.', isUploadingMedia: false });
      return null;
    }
  },

  removeMediaPost: async (postId: string) => {
    set({ operationError: null });
    const postToRemove = get().allMediaPosts.find(p => p.id === postId);

    if (!postToRemove || !postToRemove.url) {
      const errorMessage = "Post data or URL not found for deletion.";
      console.error(errorMessage);
      set({ operationError: errorMessage });
      return false;
    }

    let fileStoragePath = '';
    try {
      const urlObject = new URL(postToRemove.url);
      const pathSegments = urlObject.pathname.split('/');
      const bucketNameIndex = pathSegments.indexOf(MEDIA_POST_BUCKET_NAME);
      if (bucketNameIndex !== -1 && bucketNameIndex < pathSegments.length - 1) {
        fileStoragePath = pathSegments.slice(bucketNameIndex + 1).join('/');
      }
    } catch (parseError: any) {
      console.error("Error parsing URL for storage path:", parseError);
      set({ operationError: "Could not determine file path from URL." });
      return false;
    }
    
    if (!fileStoragePath) {
      const errorMessage = `Could not extract file path from URL: ${postToRemove.url}`;
      console.error(errorMessage);
      set({ operationError: errorMessage });
      return false;
    }

    try {
      const { error: dbError } = await supabase
        .from('media_posts')
        .delete()
        .eq('id', postId);

      if (dbError) throw dbError;

      const { error: storageError } = await supabase.storage
        .from(MEDIA_POST_BUCKET_NAME)
        .remove([fileStoragePath]);

      if (storageError) {
        console.warn(`Storage file deletion failed for ${fileStoragePath}:`, storageError);
        set({operationError: `Post data deleted, but failed to remove file from storage: ${storageError.message}`});
      }
      
      set((state) => ({
        allMediaPosts: state.allMediaPosts.filter((post) => post.id !== postId),
      }));
      return true;

    } catch (error: any) {
      console.error('Remove media post failed:', error);
      set({ operationError: error.message || 'Failed to delete post.'});
      return false;
    }
  },
}));