import { Tabs, useRouter } from 'expo-router';
import { useAuth } from '../_layout'; // Adjust path if your RootLayout is elsewhere
import { supabase } from '@utils/superbase'; // Ensure this path is correct
import { Ionicons } from '@expo/vector-icons'; // Import Ionicons

export default function AppLayout() {
  const { session } = useAuth();
  const router = useRouter();

  return (
    <Tabs
      screenOptions={({ route }) => ({ 
        headerShown: false,
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: 'gray',
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
