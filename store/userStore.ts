import { create } from 'zustand';
import { supabase } from '@utils/superbase';
import { Tables } from '../types/database.types'; // Assuming your database types are here
import { PostgrestError, User } from '@supabase/supabase-js';

export type Profile = Tables<'profiles'> & {
  username: string | null; 
  full_name: string | null;
  following_count: number;
  followers_count: number;
  posts_count: number;
};

type AuthUser = User;

export type SearchableUser = Pick<Tables<'profiles'>, 'id' | 'display_name' | 'profile_picture'> & {
  email?: string | null; // Include if email is on your profiles table and you want to display/search it
};

interface UserState {
  profile: Profile | null;
  authUser: AuthUser | null;
  loading: boolean;
  error: string | null;
  searchedUsers: SearchableUser[];
  loadingSearch: boolean;
  fetchProfile: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  fetchUserPosts: () => Promise<Tables<'news_articles'>[]>;
  fetchUserFollowers: () => Promise<Tables<'follows'>[]>;
  fetchUserFollowing: () => Promise<Tables<'follows'>[]>;
  fetchUserActivity: () => Promise<Tables<'notifications'>[]>;
  fetchAuthUser: () => Promise<void>;
  fetchUser: (uuid: string) => Promise<{ user: Profile } | PostgrestError | undefined>;
  searchUsers: (query: string) => Promise<SearchableUser[]>;
}

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
        set({ loading: false, error: 'No user session found.'});
        throw new Error('No user session found');
      }

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;
      if (!profileData) throw new Error('Profile not found for authenticated user.');
      
      const combinedProfile: Profile = {
        ...profileData,
        username: user.user_metadata?.username || profileData.username || null,
        full_name: user.user_metadata?.full_name || profileData.display_name || null,
        following_count: 0, 
        followers_count: 0,
        posts_count: 0,
      };

      set({ authUser: user, profile: combinedProfile, loading: false });
    } catch (error: any) {
      const errorMessage = error.message || 'An unknown error occurred';
      set({ error: `Failed to fetch profile: ${errorMessage}`, loading: false });
      console.error("fetchProfile error:", error);
    }
  },

  updateProfile: async (updates) => {
    set({ loading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user session found for update.');

      const profileTableUpdates: Partial<Tables<'profiles'>> = {
        bio: updates.bio,
        display_name: updates.display_name || updates.full_name, // Prioritize display_name if provided
        profile_picture: updates.profile_picture,
        // username: updates.username, // If you store username in profiles table
      };
      
      const userMetadataUpdate: any = {};
      if (updates.full_name) userMetadataUpdate.full_name = updates.full_name;
      if (updates.username) userMetadataUpdate.username = updates.username;

      if (Object.keys(userMetadataUpdate).length > 0) {
        const { error: userUpdateError } = await supabase.auth.updateUser({
            data: userMetadataUpdate
        });
        if (userUpdateError) throw userUpdateError;
      }

      const { error: profileUpdateError } = await supabase
        .from('profiles')
        .update(profileTableUpdates)
        .eq('id', user.id);

      if (profileUpdateError) throw profileUpdateError;

      set((state) => ({
        profile: state.profile ? { ...state.profile, ...updates } : null,
        loading: false
      }));
      await get().fetchProfile(); // Re-fetch to ensure consistency
    } catch (error: any) {
      const errorMessage = error.message || 'An unknown error occurred';
      set({ error: `Failed to update profile: ${errorMessage}`, loading: false });
      console.error("updateProfile error:", error);
    }
  },

  fetchUserPosts: async () => {
    try {
      const authUser = get().authUser;
      if (!authUser) return [];
      const { data, error } = await supabase
        .from('news_articles')
        .select('*')
        .eq('author_profile_id', authUser.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.error('Error fetching user posts:', error);
      return [];
    }
  },

  fetchUserFollowers: async () => {
    try {
      const authUser = get().authUser;
      if (!authUser) return [];
      const { data, error } = await supabase
        .from('follows')
        .select(`*, follower:profiles!follows_follower_id_fkey(*)`)
        .eq('followee_id', authUser.id);
      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.error('Error fetching followers:', error);
      return [];
    }
  },

  fetchUserFollowing: async () => {
    try {
      const authUser = get().authUser;
      if (!authUser) return [];
      const { data, error } = await supabase
        .from('follows')
        .select(`*, followee:profiles!follows_followee_id_fkey(*)`)
        .eq('follower_id', authUser.id);
      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.error('Error fetching following:', error);
      return [];
    }
  },

  fetchUserActivity: async () => {
    try {
      const authUser = get().authUser;
      if (!authUser) return [];
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('recipient_profile_id', authUser.id)
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.error('Error fetching activity:', error);
      return [];
    }
  },
  
  fetchUser: async (uuid: string) => {
    set({ loading: true, error: null });
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', uuid)
        .single();
  
      set({ loading: false });
      if (profileError) {
        console.error('fetchUser error:', profileError);
        return profileError; 
      }
      if (!profileData) return undefined;
  
      const enrichedProfile: Profile = {
        ...profileData,
        username: profileData.username || null, // Assuming username might be on profiles table
        full_name: profileData.display_name || null, // Use display_name for full_name for consistency
        following_count: 0,
        followers_count: 0,
        posts_count: 0,
      };
      return { user: enrichedProfile };
    } catch (error: any) {
      console.error('Error Fetching User Data:', error);
      set({ loading: false, error: error.message || 'Failed to fetch user' });
      return undefined;
    }
  },

  fetchAuthUser: async () => {
    set({ loading: true, error: null });
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!session) {
        set({ authUser: null, profile: null, loading: false, error: 'No active session.' });
        return;
      }
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) {
         set({ authUser: null, profile: null, loading: false, error: 'No authenticated user found despite session.' });
        return;
      }
      set({ authUser: user, loading: false });
      await get().fetchProfile(); // Fetch associated profile after getting authUser
    } catch (error: any) {
      console.error('Error fetching auth user:', error);
      const errorMessage = error.message || 'An unknown error occurred';
      set({ authUser: null, profile: null, error: `Failed to fetch auth user: ${errorMessage}`, loading: false });
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
        .select('id, display_name, username, profile_picture') // Adjust if 'username' is not in your 'profiles' table
        .or(`display_name.ilike.%${query}%,username.ilike.%${query}%`) // Search display_name and username
        // .or(`display_name.ilike.%${query}%,email.ilike.%${query}%`) // Example if searching email from profiles table
        .limit(10);

      if (error) throw error;
      
      const users = (data || []).map(p => ({
        id: p.id,
        display_name: p.display_name,
        username: p.username || null, // If username might not exist on all profile rows
        profile_picture: p.profile_picture,
        // email: p.email // if email is selected and on profiles table
      }));
      set({ searchedUsers: users, loadingSearch: false });
      return users;
    } catch (error: any) {
      console.error('Error searching users:', error);
      set({ error: `Search failed: ${error.message}`, loadingSearch: false, searchedUsers: [] });
      return [];
    }
  }
}));