import { create } from 'zustand';
import { Tables } from '../types/database.types'; // Assuming this path is correct and reflects new DB schema
import { PostgrestError, User } from '@supabase/supabase-js';
import { supabase } from '@utils/superbase';

// The `Tables<'profiles'>` type from your database.types.ts should automatically include
// full_name, favorite_nhl_team, playing_position, skill_level, and jersey_number
// if the types were generated after your SQL table update.
export type Profile = Tables<'profiles'> & {
  // These fields are derived or specific to the auth user's session/metadata
  // rather than direct columns that every profile row would have in the same way.
  authUserUsername: string | null; // Username from auth.users.user_metadata
  authUserMetadataFullName: string | null; // Full name from auth.users.user_metadata
  // Counts are typically aggregated or fetched separately
  following_count: number;
  followers_count: number;
  posts_count: number;
};

type AuthUser = User;

// SearchableUser remains the same unless you want to include new fields in search results.
export type SearchableUser = Pick<Tables<'profiles'>, 'id' | 'display_name' | 'profile_picture'>;

interface UserState {
  profile: Profile | null;
  authUser: AuthUser | null;
  loading: boolean;
  error: string | null;
  searchedUsers: SearchableUser[];
  loadingSearch: boolean;
  fetchProfile: () => Promise<void>;
  // Ensure `updates` can accept all new fields from the `Profile` type.
  // Omit calculated fields and 'id'.
  updateProfile: (
    updates: Partial<Omit<Profile,
      'id' |
      'following_count' |
      'followers_count' |
      'posts_count' |
      'authUserUsername' | // These are from auth metadata, not directly updated on profile table here
      'authUserMetadataFullName' // ^
    >> & { authUserMetadataFullName?: string; authUserUsername?: string } // Allow updating auth metadata separately
  ) => Promise<void>;
  fetchUserPosts: () => Promise<Tables<'news_articles'>[]>;
  fetchUserFollowers: () => Promise<Tables<'follows'>[]>;
  fetchUserFollowing: () => Promise<Tables<'follows'>[]>;
  fetchUserActivity: () => Promise<Tables<'notifications'>[]>;
  fetchAuthUser: () => Promise<void>;
  fetchUser: (uuid: string) => Promise<Profile | null>;
  searchUsers: (query: string) => Promise<SearchableUser[]>;
  logoutUser: () => Promise<{ success: boolean; error?: string | null }>;
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

      // Select all relevant fields from the profiles table, including new ones.
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, display_name, bio, profile_picture, full_name, favorite_nhl_team, playing_position, skill_level, jersey_number')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;
      if (!profileData) throw new Error('Profile data not found for authenticated user.');

      set({
        authUser: user,
        profile: {
          ...profileData, // This will spread all fields from the DB query result
          // including full_name, favorite_nhl_team, etc.
          authUserUsername: user.user_metadata?.username || null,
          authUserMetadataFullName: user.user_metadata?.full_name || null,
          // Initialize counts, actual values would come from other queries
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

      // Prepare updates for the 'profiles' table
      const profileTableUpdates: Partial<Tables<'profiles'>> = {};
      if (updates.display_name !== undefined) profileTableUpdates.display_name = updates.display_name;
      if (updates.bio !== undefined) profileTableUpdates.bio = updates.bio;
      if (updates.profile_picture !== undefined) profileTableUpdates.profile_picture = updates.profile_picture;
      if (updates.full_name !== undefined) profileTableUpdates.full_name = updates.full_name;
      if (updates.favorite_nhl_team !== undefined) profileTableUpdates.favorite_nhl_team = updates.favorite_nhl_team;
      if (updates.playing_position !== undefined) profileTableUpdates.playing_position = updates.playing_position;
      if (updates.skill_level !== undefined) profileTableUpdates.skill_level = updates.skill_level;
      if (updates.jersey_number !== undefined) profileTableUpdates.jersey_number = updates.jersey_number;
      // Add any other direct profile fields here

      // Prepare updates for auth.users.user_metadata
      const userMetadataUpdate: any = {};
      if (updates.authUserMetadataFullName !== undefined && updates.authUserMetadataFullName !== get().profile?.authUserMetadataFullName) {
        userMetadataUpdate.full_name = updates.authUserMetadataFullName;
      }
      if (updates.authUserUsername !== undefined && updates.authUserUsername !== get().profile?.authUserUsername) {
        // Be cautious with username updates, they often have uniqueness constraints
        userMetadataUpdate.username = updates.authUserUsername;
      }

      // Update auth user metadata if there are changes
      if (Object.keys(userMetadataUpdate).length > 0) {
        console.log("Updating auth user metadata:", userMetadataUpdate);
        const { error: userUpdateError } = await supabase.auth.updateUser({ data: userMetadataUpdate });
        if (userUpdateError) throw userUpdateError;
      }

      // Update 'profiles' table if there are changes
      if (Object.keys(profileTableUpdates).length > 0) {
        console.log("Updating profiles table:", profileTableUpdates);
        const { error: profileUpdateError } = await supabase
          .from('profiles')
          .update(profileTableUpdates)
          .eq('id', currentUser.id);
        if (profileUpdateError) throw profileUpdateError;
      }

      await get().fetchProfile(); // Refetch to get consolidated state
      set({ loading: false });
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
      // Select all relevant fields for a generic user profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, display_name, bio, profile_picture, full_name, favorite_nhl_team, playing_position, skill_level, jersey_number')
        .eq('id', uuid)
        .single();

      set({ loading: false }); // Set loading false after the query
      if (profileError) throw profileError;
      if (!profileData) return null;

      // For a generic user profile, authUserUsername and authUserMetadataFullName are not applicable
      // unless you fetch their auth metadata separately, which is not typical here.
      return {
        ...profileData,
        authUserUsername: null, // Not the current auth user's metadata
        authUserMetadataFullName: null, // Not the current auth user's metadata
        // Initialize counts, actual values would come from other queries
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
      await get().fetchProfile(); // This will now fetch the extended profile
      // setLoading(false) is handled within fetchProfile or at the end of this block
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
        .select('id, display_name, profile_picture') // SearchableUser fields
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

  logoutUser: async () => {
    set({ loading: true, error: null });
    try {
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) throw signOutError;

      set({
        authUser: null,
        profile: null,
        loading: false,
        error: null,
      });
      console.log('User logged out successfully from store');
      return { success: true };
    } catch (error: any) {
      logSupabaseError('logoutUser', error);
      const errorMessage = error.message || 'An unknown error occurred during logout.';
      set({ error: errorMessage, loading: false });
      return { success: false, error: errorMessage };
    }
  },

  // Other fetch functions (fetchUserPosts, etc.) remain unchanged
  // unless they need to select or use new profile fields.
  // For now, assuming they primarily use authUser.id or profile.id.

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
