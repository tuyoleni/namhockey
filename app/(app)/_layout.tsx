import { Tabs } from 'expo-router';
import React from 'react';
// You might want to import icons for the tabs
// import { Ionicons } from '@expo/vector-icons'; // Example, install if needed

export default function AppLayout() {
  return (
    <Tabs
      screenOptions={{
        // tabBarActiveTintColor: 'blue', // Customize as needed
        headerShown: true, // Show headers for tab screens, customize as needed
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          // tabBarIcon: ({ color, size }) => (
          //   <Ionicons name="home-outline" size={size} color={color} />
          // ),
        }}
      />
      <Tabs.Screen
        name="events"
        options={{
          title: 'Events',
          // tabBarIcon: ({ color, size }) => (
          //   <Ionicons name="calendar-outline" size={size} color={color} />
          // ),
        }}
      />
      <Tabs.Screen
        name="teams"
        options={{
          title: 'Teams',
          // tabBarIcon: ({ color, size }) => (
          //   <Ionicons name="people-outline" size={size} color={color} />
          // ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          // tabBarIcon: ({ color, size }) => (
          //   <Ionicons name="person-outline" size={size} color={color} />
          // ),
        }}
      />
    </Tabs>
  );
}