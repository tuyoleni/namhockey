import 'react-native-url-polyfill/auto';
import '../global.css';

import React, { useState, useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../utils/superbase';
import { AuthContext } from '../context/auth.context';
import { useAuth } from '../context/auth.context';

function useProtectedRoute() {
  const { session, initialLoading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (initialLoading) {
      return;
    }

    const currentPath = segments.join('/');
    const authPath = '/(auth)/login';
    const appPath = '/(app)/';

    if (!session?.user && currentPath !== authPath) {
      router.replace(authPath);
    } else if (session?.user && currentPath !== appPath) {
       router.replace(appPath);
    }
  }, [session, initialLoading, router]);
}

function AuthGate() {
  useProtectedRoute();

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(app)" />
    </Stack>
  );
}

export default function RootLayout() {
  const [session, setSession] = useState<Session | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const getInitialSession = async () => {
      try {
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();

        if (error) {
            console.error("Supabase getSession error:", error.message);
        }

        if (isMounted) {
          setSession(currentSession);
        }
      } catch (error) {
        console.error("Failed to get session (network/other error):", error);
      } finally {
        if (isMounted) {
          setInitialLoading(false);
        }
      }
    };

    getInitialSession();

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

  if (initialLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <AuthContext.Provider value={{ session, initialLoading }}>
      <AuthGate />
    </AuthContext.Provider>
  );
}
