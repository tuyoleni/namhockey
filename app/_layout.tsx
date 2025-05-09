import { Stack } from 'expo-router';
import React from 'react';

// Optional: Import your global CSS if not already handled by NativeWind setup
// import "../../global.css";

export default function RootLayout() {
  // Here you would typically add logic to determine if the user is authenticated.
  // For simplicity, we'll show both stacks for now.
  // In a real app, you'd conditionally render based on auth state.
  // e.g., if (isLoading) return <LoadingScreen />;
  // if (!isSignedIn) return <Redirect href="/(auth)/login" />;
  // return <Redirect href="/(app)" />;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(app)" />
      {/* You might add a global modal screen here if needed */}
      {/* <Stack.Screen name="modal" options={{ presentation: 'modal' }} /> */}
    </Stack>
  );
}