import { supabase } from '@utils/superbase'; // Changed from '../../utils/supabase'
import { Link, Stack, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';

export default function RegisterScreen() {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function signUpWithEmail() {
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          full_name: displayName, // Supabase uses 'full_name' in user_metadata by default
                                  // or you can customize this.
        },
      },
    });

    if (error) {
      Alert.alert('Registration Error', error.message);
    } else if (data.session) {
      // User is signed up and logged in
      Alert.alert('Success', 'Registered and logged in successfully!');
      router.replace('/(app)');
    } else if (data.user) {
        // User is signed up but needs to confirm email (if email confirmation is enabled)
        Alert.alert('Success', 'Registration successful! Please check your email to confirm your account.');
        router.replace('/(auth)/login'); // Go to login after showing message
    }
    setLoading(false);
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Register' }} />
      <Text style={styles.title}>Create Account</Text>
      <TextInput
        style={styles.input}
        placeholder="Display Name"
        value={displayName}
        onChangeText={setDisplayName}
      />
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <Button
        title={loading ? 'Creating account...' : 'Sign Up'}
        onPress={signUpWithEmail}
        disabled={loading}
      />
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
    padding: 16,
  },
  title: {
    fontSize: 24,
    marginBottom: 24,
    textAlign: 'center',
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 12,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  link: {
    marginTop: 16,
    textAlign: 'center',
    color: 'blue',
  },
});