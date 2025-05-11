import { create } from 'zustand';
import { supabase } from '@utils/superbase';
import { Database } from '../types/database.types';
import { AuthError, User } from '@supabase/supabase-js';

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
  fetchUser: (uuid: string) => Promise<{ user: User } | AuthError | undefined>;
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
        const { data, error } = await supabase.auth.admin.getUserById(uuid);
        if (error) return error;
        return data || undefined;
    } catch (error) {
        console.log('Error Fetching Data:', error);
        return undefined;
    }
},
  fetchAuthUser: async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;
      if (!user) {
        console.log('No authenticated user found');
        return;
      }

      // Get admin-verified user data
      const { data: adminUser, error: adminError } = await supabase
        .from('auth.users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (adminError) throw adminError;

      console.log('Verified User Data:', {
        id: adminUser.id,
        email: adminUser.email,
        username: adminUser.raw_user_meta_data?.username || 'No username',
        display_name: adminUser.raw_user_meta_data?.full_name || 'No display name'
      });

      set({ authUser: user });
    } catch (error) {
      console.error('Error fetching auth user:', error);
      set({ error: 'Failed to fetch auth user' });
    }
  }
}));