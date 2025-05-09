import { Link, Stack } from 'expo-router';
import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';

export default function LoginScreen() {
  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Login' }} />
      <Text style={styles.title}>Login Screen</Text>
      {/* Replace with actual login form */}
      <Button title="Go to Main App (Simulate Login)" onPress={() => {
        // In a real app, you'd navigate after successful login
        // For now, this is just a placeholder.
        // router.replace('/(app)');
        console.log("Login button pressed - implement navigation");
      }} />
      <Link href="/(auth)/register" style={styles.link}>
        <Text>Don't have an account? Register</Text>
      </Link>
      <Link href="/(app)" style={styles.link}>
         <Text>Go to App (temp)</Text>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  title: {
    fontSize: 24,
    marginBottom: 16,
  },
  link: {
    marginTop: 16,
    color: 'blue',
  },
});