import { create } from 'zustand';
import { supabase } from '@utils/superbase';
import { Tables } from '../types/database.types';
import { PostgrestError, User } from '@supabase/supabase-js';

export type Profile = Tables<'profiles'> & {
  authUserUsername: string | null; 
  authUserFullName: string | null;  
  following_count: number;
  followers_count: number;
  posts_count: number;
};

type AuthUser = User;

export type SearchableUser = Pick<Tables<'profiles'>, 'id' | 'display_name' | 'profile_picture'>;

interface UserState {
  profile: Profile | null;
  authUser: AuthUser | null;
  loading: boolean;
  error: string | null;
  searchedUsers: SearchableUser[];
  loadingSearch: boolean;
  fetchProfile: () => Promise<void>;
  updateProfile: (updates: Partial<Omit<Profile, 'id' | 'following_count' | 'followers_count' | 'posts_count'>>) => Promise<void>;
  fetchUserPosts: () => Promise<Tables<'news_articles'>[]>;
  fetchUserFollowers: () => Promise<Tables<'follows'>[]>;
  fetchUserFollowing: () => Promise<Tables<'follows'>[]>;
  fetchUserActivity: () => Promise<Tables<'notifications'>[]>;
  fetchAuthUser: () => Promise<void>;
  fetchUser: (uuid: string) => Promise<Profile | null>; 
  searchUsers: (query: string) => Promise<SearchableUser[]>;
}

const logSupabaseError = (context: string, error: any) => {
  console.error(`Error in ${context}:`);
  if (error && typeof error === 'object') {
    if (error.message) console.error(`  Message: ${error.message}`);
    if (error.code) console.error(`  Code: ${error.code}`);
    if (error.details) console.error(`  Details: ${error.details}`);
    if (error.hint) console.error(`  Hint: ${error.hint}`);
  } else {
    console.error(`  Error: ${error}`);
  }
};

export const useUserStore = create<UserState>((set, get) => ({
  profile: null,
  authUser: null,
  loading: false,
  error: null,
  searchedUsers: [],
  loadingSearch: false,

  fetchProfile: async () => {
    set({ loading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        set({ loading: false, error: 'No user session found.', authUser: null, profile: null });
        return;
      }

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, display_name, bio, profile_picture')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;
      if (!profileData) throw new Error('Profile data not found for authenticated user.');
      
      set({ 
        authUser: user, 
        profile: {
          ...profileData,
          authUserUsername: user.user_metadata?.username || null,
          authUserFullName: user.user_metadata?.full_name || profileData.display_name || null,
          following_count: 0, 
          followers_count: 0,
          posts_count: 0,
        }, 
        loading: false 
      });
    } catch (error: any) {
      logSupabaseError('fetchProfile', error);
      const errorMessage = error.message || 'An unknown error occurred';
      set({ error: `Profile fetch error: ${errorMessage}`, loading: false, authUser: null, profile: null });
    }
  },

  updateProfile: async (updates) => {
    set({ loading: true, error: null });
    try {
      const currentUser = get().authUser;
      if (!currentUser) throw new Error('No user session found for update.');

      const profileTableUpdates: Partial<Pick<Tables<'profiles'>, 'bio' | 'display_name' | 'profile_picture'>> = {};
      if(updates.bio !== undefined) profileTableUpdates.bio = updates.bio;
      if(updates.display_name !== undefined) profileTableUpdates.display_name = updates.display_name;
      else if (updates.authUserFullName !== undefined) profileTableUpdates.display_name = updates.authUserFullName;
      if(updates.profile_picture !== undefined) profileTableUpdates.profile_picture = updates.profile_picture;
      
      const userMetadataUpdate: any = {};
      if (updates.authUserFullName && updates.authUserFullName !== get().profile?.authUserFullName) {
        userMetadataUpdate.full_name = updates.authUserFullName;
      }
      if (updates.authUserUsername && updates.authUserUsername !== get().profile?.authUserUsername) {
        userMetadataUpdate.username = updates.authUserUsername;
      }

      if (Object.keys(userMetadataUpdate).length > 0) {
        const { error: userUpdateError } = await supabase.auth.updateUser({ data: userMetadataUpdate });
        if (userUpdateError) throw userUpdateError;
      }

      if (Object.keys(profileTableUpdates).length > 0) {
        const { error: profileUpdateError } = await supabase
          .from('profiles')
          .update(profileTableUpdates)
          .eq('id', currentUser.id);
        if (profileUpdateError) throw profileUpdateError;
      }
      
      await get().fetchProfile();
      set({loading: false});
    } catch (error: any) {
      logSupabaseError('updateProfile', error);
      const errorMessage = error.message || 'An unknown error occurred';
      set({ error: `Profile update error: ${errorMessage}`, loading: false });
    }
  },
  
  fetchUser: async (uuid: string): Promise<Profile | null> => {
    if (!uuid) return null;
    set({ loading: true, error: null });
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, display_name, bio, profile_picture')
        .eq('id', uuid)
        .single();
  
      set({ loading: false });
      if (profileError) throw profileError; 
      if (!profileData) return null;
  
      return {
        ...profileData,
        authUserUsername: null, 
        authUserFullName: profileData.display_name || null, 
        following_count: 0,
        followers_count: 0,
        posts_count: 0,
      };
    } catch (error: any) {
      logSupabaseError(`fetchUser (UUID: ${uuid})`, error);
      set({ loading: false, error: error.message || 'Failed to fetch user' });
      return null;
    }
  },

  fetchAuthUser: async () => {
    set({ loading: true, error: null });
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!session?.user) {
        set({ authUser: null, profile: null, loading: false, error: 'No active session or user.' });
        return;
      }
      set({ authUser: session.user }); 
      await get().fetchProfile(); 
      set({loading: false});
    } catch (error: any) {
      logSupabaseError('fetchAuthUser', error);
      const errorMessage = error.message || 'An unknown error occurred';
      set({ authUser: null, profile: null, error: `Auth user fetch error: ${errorMessage}`, loading: false });
    }
  },

  searchUsers: async (query: string): Promise<SearchableUser[]> => {
    if (!query.trim()) {
      set({ searchedUsers: [] });
      return [];
    }
    set({ loadingSearch: true, error: null });
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, display_name, profile_picture') 
        .ilike('display_name', `%${query}%`) 
        .limit(10);

      if (error) throw error;
      
      const users: SearchableUser[] = (data || []).map(p => ({
        id: p.id,
        display_name: p.display_name,
        profile_picture: p.profile_picture,
      }));
      set({ searchedUsers: users, loadingSearch: false });
      return users;
    } catch (error: any) {
      logSupabaseError('searchUsers', error);
      set({ error: `Search failed: ${error.message || 'Unknown error'}`, loadingSearch: false, searchedUsers: [] });
      return [];
    }
  },

  fetchUserPosts: async () => {
    try {
      const authUserId = get().authUser?.id;
      if (!authUserId) return [];
      const { data, error } = await supabase.from('news_articles').select('*').eq('author_profile_id', authUserId).order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    } catch (error: any) { logSupabaseError('fetchUserPosts', error); return []; }
  },
  fetchUserFollowers: async () => {
    try {
      const authUserId = get().authUser?.id;
      if (!authUserId) return [];
      const { data, error } = await supabase.from('follows').select(`*, follower:profiles!follows_follower_id_fkey(id, display_name, profile_picture)`).eq('followee_id', authUserId);
      if (error) throw error;
      return data || [];
    } catch (error: any) { logSupabaseError('fetchUserFollowers', error); return []; }
  },
  fetchUserFollowing: async () => {
    try {
      const authUserId = get().authUser?.id;
      if (!authUserId) return [];
      const { data, error } = await supabase.from('follows').select(`*, followee:profiles!follows_followee_id_fkey(id, display_name, profile_picture)`).eq('follower_id', authUserId);
      if (error) throw error;
      return data || [];
    } catch (error: any) { logSupabaseError('fetchUserFollowing', error); return []; }
  },
  fetchUserActivity: async () => {
    try {
      const authUserId = get().authUser?.id;
      if (!authUserId) return [];
      const { data, error } = await supabase.from('notifications').select('*').eq('recipient_profile_id', authUserId).order('created_at', { ascending: false }).limit(20);
      if (error) throw error;
      return data || [];
    } catch (error: any) { logSupabaseError('fetchUserActivity', error); return []; }
  },
}));