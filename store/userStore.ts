import { create } from 'zustand';
import { supabase } from '@utils/superbase';
import { Database } from '../types/database.types';
import { AuthError, User } from '@supabase/supabase-js';
import { PostgrestError } from '@supabase/supabase-js'; // Add this import

type Profile = Database['public']['Tables']['profiles']['Row'] & {
  username: string;
  full_name: string;
  avatar_url: string | null;
  following_count: number;
  followers_count: number;
  posts_count: number;
};

// Update AuthUser to match Supabase User type
type AuthUser = User;

interface UserState {
  profile: Profile | null;
  authUser: AuthUser | null;
  loading: boolean;
  error: string | null;
  fetchProfile: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  fetchUserPosts: () => Promise<Database['public']['Tables']['news_articles']['Row'][]>;
  fetchUserFollowers: () => Promise<Database['public']['Tables']['follows']['Row'][]>;
  fetchUserFollowing: () => Promise<Database['public']['Tables']['follows']['Row'][]>;
  fetchUserActivity: () => Promise<Database['public']['Tables']['notifications']['Row'][]>;
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

      // Get profile data
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      // Set both auth user and profile data
      set({ 
        authUser: user,
        profile: profileData,
        loading: false 
      });
    } catch (error) {
      set({ error: 'Failed to fetch profile', loading: false });
    }
  },

  updateProfile: async (updates) => {
    try {
      set({ loading: true, error: null });
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('No user found');

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (error) throw error;

      set((state) => ({
        profile: state.profile ? { ...state.profile, ...updates } : null,
        loading: false
      }));
    } catch (error) {
      set({ error: 'Failed to update profile', loading: false });
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
            username,
            full_name,
            avatar_url
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
            username,
            full_name,
            avatar_url
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
      // Fetch user from profiles table instead of auth.users
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', uuid)
        .single();
  
      if (profileError) {
        console.log('fetchUser error:', profileError);
        return profileError;
      }
  
      console.log('fetchUser result:', profile);
      return profile ? { user: profile } : undefined;
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

      // Access user data directly from the user object
      console.log('Verified User Data:', {
        id: user.id,
        email: user.email,
        display_name: user.user_metadata?.full_name || 'display name'
      });

      set({ authUser: user });
    } catch (error) {
      console.error('Error fetching auth user:', error);
      set({ error: 'Failed to fetch auth user' });
    }
  }
}));