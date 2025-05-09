import 'react-native-url-polyfill/auto';
import { Stack, useRouter, useSegments } from 'expo-router';
import React, { useState, useEffect, createContext, useContext, useRef } from 'react';
import { Session } from '@supabase/supabase-js';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { supabase } from '@utils/superbase'; // Ensure this path is correct
import { Buffer } from 'buffer';
global.Buffer = Buffer;

// Create a context for the auth state
const AuthContext = createContext<{ session: Session | null; loading: boolean; initialLoading: boolean }>({
    session: null,
    loading: true, // This will reflect initialLoading for now
    initialLoading: true,
});

export const useAuth = () => {
    return useContext(AuthContext);
};

function useProtectedRoute() {
    const { session, initialLoading } = useAuth();
    const segments = useSegments();
    const router = useRouter();

    useEffect(() => {
        if (initialLoading) {
            console.log('useProtectedRoute: Waiting for initial loading to complete.');
            return;
        }

        const currentRootSegment = segments.length > 0 ? segments[0] : null;
        const inAuthGroup = currentRootSegment === '(auth)';
        const inAppGroup = currentRootSegment === '(app)';

        console.log('useProtectedRoute: Check', { session: !!session, initialLoading, segments, currentRootSegment, inAuthGroup, inAppGroup });

        if (!session) {
            if (!inAuthGroup) {
          
                console.log('useProtectedRoute: No session, not in auth group. Redirecting to /auth/login.');
                router.replace('/(auth)/login');
            }
        } else { 
            if (inAuthGroup) {
                console.log('useProtectedRoute: Session exists, in auth group. Redirecting to /app/home.');
                router.replace('/(app)/home');
            } else if (!inAppGroup && currentRootSegment !== null) { // Added currentRootSegment !== null to avoid redirecting from truly initial '/' if needed
                console.log('useProtectedRoute: Session exists, not in known app group. Redirecting to /app/home.');
                router.replace('/(app)/home');
            }
        }
    }, [session, initialLoading, segments, router]);
}

export default function RootLayout() {
    const [session, setSession] = useState<Session | null>(null);
    const [initialLoading, setInitialLoading] = useState(true);


    useEffect(() => {
        console.log('RootLayout: Mount useEffect for auth setup running (should run once).');
        let isMounted = true;

        // Attempt to get the session immediately
        supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
            console.log('RootLayout: supabase.auth.getSession() completed.', { session: !!currentSession });
            if (isMounted) {
                setSession(currentSession);
                setInitialLoading(false);
            }
        }).catch(error => {
            console.error("RootLayout: Error fetching initial session from supabase.auth.getSession():", error);
            if (isMounted) {
                setInitialLoading(false);
            }
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (_event, currentSession) => {
                console.log('RootLayout: supabase.auth.onAuthStateChange triggered.', { event: _event, session: !!currentSession });
                if (isMounted) {
                    setSession(currentSession);
                    if (initialLoading) {
                        setInitialLoading(false);
                    }
                }
            }
        );

        return () => {
            console.log('RootLayout: Unsubscribing from onAuthStateChange (on unmount).');
            isMounted = false;
            subscription.unsubscribe();
        };
    }, []);

    useProtectedRoute();

    if (initialLoading) {
        console.log('RootLayout: Rendering initial loading indicator.');
        return (
            <View style={styles.container}>
                <ActivityIndicator/>
            </View>
        );
    }

    console.log('RootLayout: Rendering AuthContext.Provider and Stack.', { session: !!session, initialLoading });

    return (
        <AuthContext.Provider value={{ session, loading: initialLoading, initialLoading }}>
            <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="(auth)" />
                <Stack.Screen name="(app)" />
            </Stack>
        </AuthContext.Provider>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f0f0f0',
    },
});
