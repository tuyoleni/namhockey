import { Tabs, useRouter } from 'expo-router';
import React from 'react';
import { Button, Platform } from 'react-native'; // Example for a logout button
import { useAuth } from '../_layout'; // Adjust path if your RootLayout is elsewhere
import { supabase } from '@utils/superbase'; // Ensure this path is correct
import { Ionicons } from '@expo/vector-icons'; // Import Ionicons

export default function AppLayout() {
  const { session } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
    } else {
      console.error('Error logging out:', error);
    }
  };

  return (
    <Tabs
      screenOptions={({ route }) => ({ 
        headerShown: true,
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
        },
         tabBarShowLabel: false, 
      })}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused, color, size }) => {
            const iconName = focused ? 'home' : 'home-outline';
            return <Ionicons name={iconName} size={size} color={color} />;
          },
          headerRight: () => (
            <Button
              onPress={handleLogout}
              title="Logout"
              color={Platform.OS === 'ios' ? '#FF3B30' : '#FF0000'} // iOS uses different red
            />
          ),
        }}
      />
      <Tabs.Screen
        name="events/index"
        options={{
          title: 'Events',
          tabBarIcon: ({ focused, color, size }) => {
            // Using 'compass' as an "explore/discover" equivalent like Instagram's explore tab
            const iconName = focused ? 'compass' : 'compass-outline';
            return <Ionicons name={iconName} size={size} color={color} />;
          },
        }}
      />
      <Tabs.Screen
        name="teams/index"
        options={{
          title: 'Teams',
          tabBarIcon: ({ focused, color, size }) => {
            const iconName = focused ? 'people' : 'people-outline';
            return <Ionicons name={iconName} size={size} color={color} />;
          },
        }}
      />
      <Tabs.Screen
        name="profile/index"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused, color, size }) => {
            const iconName = focused ? 'person-circle' : 'person-circle-outline';
            return <Ionicons name={iconName} size={size} color={color} />;
          },
        }}
      />
    </Tabs>
  );
}
