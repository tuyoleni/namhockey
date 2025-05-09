import { Link, Stack } from 'expo-router';
import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';

export default function RegisterScreen() {
  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Register' }} />
      <Text style={styles.title}>Register Screen</Text>
      {/* Replace with actual registration form */}
      <Button title="Register" onPress={() => console.log('Register pressed')} />
      <Link href="/(auth)/login" style={styles.link}>
        <Text>Already have an account? Login</Text>
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