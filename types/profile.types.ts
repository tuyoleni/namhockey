// types.ts

import { User } from '@supabase/supabase-js'; // Import Supabase User type

// Define the structure of your user profile data from your 'profiles' table (or wherever)
export interface ProfileType {
  id: string; // Matches auth.users id
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  posts_count: number | null; // Assuming these are stored in your profile table
  followers_count: number | null;
  following_count: number | null;
  // Add any other fields from your public.profiles table
  created_at?: string; // Example optional field
}

// AuthUserType is the type for the user object from supabase.auth.getUser()
// Supabase's JS SDK provides a User type. You can use or extend it.
export type AuthUserType = User;

// Define the shape of your Zustand user store state and actions
export interface UserStore {
    profile: ProfileType | null | undefined;
    authUser: AuthUserType | null | undefined;
    loading: boolean;
    error: string | null;
    // Define the exact return types and arguments for your store actions
    fetchProfile: () => Promise<void>; // Assuming it fetches and sets the profile internally
    fetchAuthUser: () => Promise<void>; // Assuming it fetches and sets the authUser internally
    // Add any other state properties or actions from your store
    setProfile: (profile: ProfileType | null) => void; // Example setter
    setAuthUser: (user: AuthUserType | null) => void; // Example setter
}