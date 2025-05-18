import { create } from 'zustand';
import { supabase } from '@utils/superbase';
import { Database, Tables } from '../types/database.types';
import { AuthError, User } from '@supabase/supabase-js';
import { PostgrestError } from '@supabase/supabase-js';

export type Profile = Tables<'profiles'> & {
  username: string | null;
  full_name: string | null;
  following_count: number;
  followers_count: number;
  posts_count: number;
};

type AuthUser = User;

interface UserState {
  profile: Profile | null;
  authUser: AuthUser | null;
  loading: boolean;
  error: string | null;
  fetchProfile: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  fetchUserPosts: () => Promise<Tables<'news_articles'>[]>;
  fetchUserFollowers: () => Promise<Tables<'follows'>[]>;
  fetchUserFollowing: () => Promise<Tables<'follows'>[]>;
  fetchUserActivity: () => Promise<Tables<'notifications'>[]>;
  fetchAuthUser: () => Promise<void>;
  fetchUser: (uuid: string) => Promise<{ user: Profile } | PostgrestError | undefined>;
}

export const useUserStore = create<UserState>((set, get) => ({
  profile: null,
  authUser: null,
  loading: false,
  error: null,

  fetchProfile: async () => {
    try {
      set({ loading: true, error: null });
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('No user found');

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      const combinedProfile: Profile = {
        ...(profileData as Tables<'profiles'>),
        username: user.user_metadata?.username || null,
        full_name: user.user_metadata?.full_name || null,
        following_count: 0,
        followers_count: 0,
        posts_count: 0,
      };

      set({ 
        authUser: user,
        profile: combinedProfile,
        loading: false 
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      set({ error: `Failed to fetch profile: ${errorMessage}`, loading: false });
    }
  },

  updateProfile: async (updates) => {
    try {
      set({ loading: true, error: null });
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('No user found');

      const profileTableUpdates: Partial<Tables<'profiles'>> = {
        bio: updates.bio,
        profile_picture: updates.profile_picture,
      };

      const { error } = await supabase
        .from('profiles')
        .update(profileTableUpdates)
        .eq('id', user.id);

      if (error) throw error;

      set((state) => ({
        profile: state.profile ? { ...state.profile, ...updates } : null,
        loading: false
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      set({ error: `Failed to update profile: ${errorMessage}`, loading: false });
    }
  },

  fetchUserPosts: async () => {
    try {
      const profile = get().profile;
      if (!profile) return [];

      const { data, error } = await supabase
        .from('news_articles')
        .select('*')
        .eq('author_profile_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching user posts:', error);
      return [];
    }
  },

  fetchUserFollowers: async () => {
    try {
      const profile = get().profile;
      if (!profile) return [];

      const { data, error } = await supabase
        .from('follows')
        .select(`
          created_at,
          followee_id,
          follower_id,
          profiles!follows_follower_id_fkey (
            id,
            bio,
            profile_picture
          )
        `)
        .eq('followee_id', profile.id);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching followers:', error);
      return [];
    }
  },

  fetchUserFollowing: async () => {
    try {
      const profile = get().profile;
      if (!profile) return [];

      const { data, error } = await supabase
        .from('follows')
        .select(`
          created_at,
          followee_id,
          follower_id,
          profiles!follows_followee_id_fkey (
            id,
            bio,
            profile_picture
          )
        `)
        .eq('follower_id', profile.id);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching following:', error);
      return [];
    }
  },

  fetchUserActivity: async () => {
    try {
      const profile = get().profile;
      if (!profile) return [];

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('recipient_profile_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching activity:', error);
      return [];
    }
  },
  
  fetchUser: async (uuid: string) => {
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', uuid)
        .single();
  
      if (profileError) {
        console.log('fetchUser error:', profileError);
        return profileError;
      }
  
      const enrichedProfile: Profile = {
        ...(profileData as Tables<'profiles'>),
        username: null,
        full_name: null,
        following_count: 0,
        followers_count: 0,
        posts_count: 0,
      }
      
      console.log('fetchUser result:', enrichedProfile);
      return enrichedProfile ? { user: enrichedProfile } : undefined;
    } catch (error) {
      console.log('Error Fetching Data:', error);
      return undefined;
    }
  },

  fetchAuthUser: async () => {
    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !sessionData.session) {
        set({ error: 'No active session. Please log in.' });
        return;
      }

      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;
      if (!user) {
        set({ error: 'No authenticated user found' });
        return;
      }

      console.log('Verified User Data:', {
        id: user.id,
        email: user.email,
        display_name: user.user_metadata?.full_name || 'display name'
      });

      set({ authUser: user });
    } catch (error) {
      console.error('Error fetching auth user:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      set({ error: `Failed to fetch auth user: ${errorMessage}` });
    }
  }
}));