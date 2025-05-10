import 'react-native-url-polyfill/auto';
import '../global.css';

import React, { useState, useEffect, createContext, useContext } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@utils/superbase';
import { Buffer } from 'buffer';

global.Buffer = Buffer;

// Auth context
const AuthContext = createContext<{
  session: Session | null;
  loading: boolean;
  initialLoading: boolean;
}>({
  session: null,
  loading: true,
  initialLoading: true,
});

export const useAuth = () => useContext(AuthContext);

// Route protection
function useProtectedRoute() {
  const { session, initialLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (initialLoading) return;

    const rootSegment = segments[0] || null;
    const inAuthGroup = rootSegment === '(auth)';
    const inAppGroup = rootSegment === '(app)';

    if (!session && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (session) {
      if (inAuthGroup || (!inAppGroup && rootSegment !== null)) {
        router.replace('/(app)/home');
      }
    }
  }, [session, initialLoading, segments]);
}

// Main layout component
export default function RootLayout() {
  const [session, setSession] = useState<Session | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const getSession = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        if (isMounted) {
          setSession(currentSession);
        }
      } catch (error) {
        console.error("Failed to get session:", error);
      } finally {
        if (isMounted) {
          setInitialLoading(false);
        }
      }
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      if (isMounted) {
        setSession(currentSession);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useProtectedRoute();

  if (initialLoading) {
    return <ActivityIndicator style={{ flex: 1 }} />;
  }

  return (
    <AuthContext.Provider value={{ session, loading: initialLoading, initialLoading }}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(app)" />
      </Stack>
    </AuthContext.Provider>
  );
}
