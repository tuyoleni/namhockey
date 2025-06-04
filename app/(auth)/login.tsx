import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  StatusBar,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  StyleSheet
} from 'react-native';
import { Link, Stack, useRouter } from 'expo-router';
import { Lock, MailOpen } from 'lucide-react-native';
import { supabase } from '@utils/superbase';

const AppLogo = () => {
  return (
    <View className="items-center justify-center w-40 h-40 mb-8">
      <Image
        // ** ACTION REQUIRED: Verify this path is correct for your project structure! **
        source={require('assets/icon.png')}
        className="w-32 h-32"
        resizeMode="contain"
      />
    </View>
  );
};

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const passwordInputRef = useRef<TextInput>(null);

  async function signInWithEmail() {
    console.log("[LoginScreen] signInWithEmail function called.");
    if (!email || !password) {
      Alert.alert('Input Required', 'Please enter both email and password.');
      return;
    }
    setLoading(true);
    console.log("[LoginScreen] Attempting to sign in with email:", email);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      console.log("[LoginScreen] Supabase signInWithPassword response:", { data: data, error: error ? JSON.stringify(error, null, 2) : null });

      if (error) {
        Alert.alert('Login Error', error.message || 'An unexpected error occurred.');
      } else {
        console.log("[LoginScreen] Login successful, navigating to /(app)");
        router.replace('/(app)');
      }
    } catch (e: any) {
      console.error("[LoginScreen] Critical error during signInWithEmail:", e);
      Alert.alert('Login Exception', e.message || 'An unexpected critical error occurred during login.');
    }
    setLoading(false);
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.flexGrow}
      keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContentContainer}
        keyboardShouldPersistTaps="handled"
        className="bg-gray-100"
      >
        <StatusBar barStyle="dark-content" />
        <Stack.Screen options={{ title: 'Login', headerShown: false }} />

        <View className="flex-1 justify-center items-center p-6">
          <View className="w-full max-w-sm items-center">
            <AppLogo />

            <Text className="text-3xl font-bold text-gray-800 mb-2 text-center">Welcome Back!</Text>
            <Text className="text-gray-600 mb-8 text-center">Sign in to continue to your account.</Text>

            <View className="w-full mb-4">
              <View className="flex-row items-center bg-white p-3 rounded-xl border border-gray-300 shadow-sm">
                <MailOpen size={20} color="#6B7280" className="mr-3" />
                <TextInput
                  className="flex-1 text-base text-gray-700"
                  placeholder="Email Address"
                  placeholderTextColor="#9CA3AF"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  returnKeyType="next"
                  onSubmitEditing={() => passwordInputRef.current?.focus()}
                />
              </View>
            </View>

            <View className="w-full mb-6">
              <View className="flex-row items-center bg-white p-3 rounded-xl border border-gray-300 shadow-sm">
                <Lock size={20} color="#6B7280" className="mr-3" />
                <TextInput
                  ref={passwordInputRef}
                  className="flex-1 text-base text-gray-700"
                  placeholder="Password"
                  placeholderTextColor="#9CA3AF"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  returnKeyType="done"
                  onSubmitEditing={signInWithEmail}
                />
              </View>
            </View>

            <TouchableOpacity
              className={`w-full py-3.5 px-4 rounded-xl shadow-md ${loading ? 'bg-sky-400' : 'bg-sky-500 active:bg-sky-600'}`}
              onPress={signInWithEmail}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text className="text-white text-center text-base font-semibold">
                  Sign In
                </Text>
              )}
            </TouchableOpacity>

            <View className="mt-8 flex-row justify-center">
              <Text className="text-gray-600">Don't have an account? </Text>
              <Link href="/(auth)/register" className="text-sky-500 font-semibold active:text-sky-600">
                Register
              </Link>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flexGrow: {
    flex: 1,
  },
  scrollContentContainer: {
    flexGrow: 1,
  }
});
