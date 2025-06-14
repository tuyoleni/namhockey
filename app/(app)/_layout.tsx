import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function AppLayout() {
  return (
      <Tabs
        screenOptions={({ route }) => ({
          headerShown: true,
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
