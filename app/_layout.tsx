import 'react-native-url-polyfill/auto';
import { Stack, useRouter, useSegments } from 'expo-router';
import React, { useState, useEffect, createContext, useContext } from 'react';
import { Session } from '@supabase/supabase-js';
import { View, ActivityIndicator } from 'react-native';
import { supabase } from '@utils/superbase';
import { Buffer } from 'buffer';
global.Buffer = Buffer;

// Create a context for the auth state
const AuthContext = createContext<{ session: Session | null; loading: boolean }>({
  session: null,
  loading: true,
});

// Custom hook to use the AuthContext
export const useAuth = () => {
  return useContext(AuthContext);
};

function useProtectedRoute(session: Session | null, isLoading: boolean) {
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    // Don't run navigation logic if still loading initial session
    if (isLoading) {
      return;
    }

    const inAuthGroup = segments[0] === '(auth)';

    if (!session && !inAuthGroup) {
      // Redirect to the login page if the user is not authenticated
      // and is not in the auth group.
      router.replace('/(auth)/login');
    } else if (session && inAuthGroup) {
      // Redirect to the main app if the user is authenticated
      // and is in the auth group (e.g., after login/signup).
      router.replace('/(app)');
    }
  }, [session, segments, router, isLoading]); // Add isLoading to dependency array
}

export default function RootLayout() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
      // setLoading is primarily for the initial session check
    });

    return () => subscription.unsubscribe();
  }, []);

  useProtectedRoute(session, loading); // Pass the loading state to the hook

  if (loading) {
    // You can render a loading indicator here
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <AuthContext.Provider value={{ session, loading }}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(app)" />
      </Stack>
    </AuthContext.Provider>
  );
}