import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, Image, StatusBar, ScrollView, StyleSheet, Platform, KeyboardAvoidingView } from 'react-native';
import { Link, Stack, useRouter } from 'expo-router';
import { UserIcon, ChevronLeftIcon, ChevronRightIcon, CheckIcon, StarIcon, ShieldCheckIcon, HashIcon, Mail, Lock, FingerprintIcon } from 'lucide-react-native'; // Added Fingerprint for DisplayName
import { supabase } from '@utils/superbase';

// Placeholder for your app logo
const AppLogo = () => (
  <View className="items-center justify-center w-20 h-20 bg-sky-500 rounded-full mb-6 shadow-lg">
    <Text className="text-white text-3xl font-bold">App</Text>
    {/* <Image source={require('../../../assets/icon.png')} className="w-16 h-16" resizeMode="contain" /> */}
  </View>
);

// Helper for step indicator
const StepIndicator = ({ currentStep, totalSteps }: { currentStep: number, totalSteps: number }) => {
  return (
    <View className="flex-row justify-center items-center my-4">
      {Array.from({ length: totalSteps }).map((_, index) => (
        <View
          key={index}
          className={`w-3 h-3 rounded-full mx-1 ${
            index + 1 === currentStep ? 'bg-sky-500' : 'bg-gray-300'
          }`}
        />
      ))}
    </View>
  );
};


export default function RegisterScreen() {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;

  // --- Step 1 State ---
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // --- Step 2 State ---
  const [fullName, setFullName] = useState(''); // New state for Full Name
  const [displayName, setDisplayName] = useState(''); // This is now for public Display Name/Username
  const [bio, setBio] = useState('');

  // --- Step 3 State ---
  const [favoriteNHLTeam, setFavoriteNHLTeam] = useState('');
  const [playingPosition, setPlayingPosition] = useState('');
  const [skillLevel, setSkillLevel] = useState('');
  const [jerseyNumber, setJerseyNumber] = useState('');


  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Refs for input focusing
  const passwordInputRef = useRef<TextInput>(null);
  const confirmPasswordInputRef = useRef<TextInput>(null);
  const displayNameInputRef = useRef<TextInput>(null); // New ref for Display Name
  const bioInputRef = useRef<TextInput>(null);
  const favTeamInputRef = useRef<TextInput>(null);
  const positionInputRef = useRef<TextInput>(null);
  const skillLevelInputRef = useRef<TextInput>(null);
  const jerseyNumberInputRef = useRef<TextInput>(null);


  const handleNextStep = () => {
    if (currentStep === 1) {
      if (!email || !password || !confirmPassword) {
        Alert.alert('Missing Information', 'Please fill in email, password, and confirm password.');
        return false; // Indicate failure
      }
      if (password !== confirmPassword) {
        Alert.alert('Password Mismatch', 'Passwords do not match.');
        return false;
      }
      if (!email.includes('@') || !email.includes('.')) {
         Alert.alert('Invalid Email', 'Please enter a valid email address.');
         return false;
      }
      if (password.length < 6) {
        Alert.alert('Weak Password', 'Password should be at least 6 characters long.');
        return false;
      }
    }
    if (currentStep === 2) {
      if (!fullName) {
        Alert.alert('Missing Information', 'Please enter your full name.');
        return false;
      }
      if (!displayName) {
        Alert.alert('Missing Information', 'Please enter your display name.');
        return false;
      }
      // Optional: Add validation for display name format/length if needed
    }
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
    return true; // Indicate success
  };

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  async function createOrUpdateProfileEntry(userId: string) {
    console.log('[createOrUpdateProfileEntry] Called for userId:', userId);
    const profileData = {
      full_name: fullName, // Use the new fullName state
      display_name: displayName, // Use the displayName state
      bio: bio || null,
      profile_picture: null,
      favorite_nhl_team: favoriteNHLTeam || null,
      playing_position: playingPosition || null,
      skill_level: skillLevel || null,
      jersey_number: jerseyNumber ? parseInt(jerseyNumber, 10) : null,
    };
    console.log('[createOrUpdateProfileEntry] Profile data to upsert:', profileData);

    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({ id: userId, ...profileData }, { onConflict: 'id' });

    if (profileError) {
      console.error('[createOrUpdateProfileEntry] Error upserting profile entry:', JSON.stringify(profileError, null, 2));
      Alert.alert(
        'Profile Save Issue',
        'Your account was created, but there was an issue saving some profile details. You can update them later.'
      );
    } else {
      console.log('[createOrUpdateProfileEntry] Profile entry upserted successfully for user:', userId);
    }
  }


  async function signUpWithEmail() {
    // Final validation before submitting
    if (!fullName || !displayName || !email || !password) {
      Alert.alert('Missing Information', 'Please ensure all required fields from previous steps are filled.');
      // Optionally, navigate back to the step with missing info, or just show alert.
      // For simplicity, just showing alert here.
      if (!email || !password) setCurrentStep(1);
      else if (!fullName || !displayName) setCurrentStep(2);
      return;
    }

    console.log('[signUpWithEmail] Attempting sign up with:', { email, fullName, displayName });
    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          full_name: fullName, // Pass the new fullName state to auth metadata
          // You could also pass displayName to metadata if desired, e.g., username: displayName
        },
      },
    });

    console.log('[signUpWithEmail] Supabase signUp response:', { data: data, error: error ? JSON.stringify(error, null, 2) : null });

    if (error) {
      Alert.alert('Registration Error', error.message || 'An unexpected error occurred.');
      setLoading(false);
      return;
    }

    const user = data.user;
    const session = data.session;

    if (user?.id) {
      console.log('[signUpWithEmail] User created successfully. User ID:', user.id);
      await createOrUpdateProfileEntry(user.id);

      if (session) {
        console.log('[signUpWithEmail] User has an active session.');
        Alert.alert('Success!', 'Registered and logged in successfully! Your profile details have been saved.');
        router.replace('/(app)');
      } else {
        console.log('[signUpWithEmail] User created, email confirmation is likely pending.');
        Alert.alert('Registration Successful!', 'Please check your email to confirm your account. Your profile details have been saved.');
        router.replace('/(auth)/login');
      }
    } else {
      console.error('[signUpWithEmail] User object not found in Supabase response, though no error was reported.');
      Alert.alert('Registration Incomplete', 'Something went wrong during registration. Please try again.');
    }
    setLoading(false);
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1: // Account Basics
        return (
          <>
            <Text className="text-2xl font-bold text-gray-800 mb-1 text-center">Account Basics</Text>
            <Text className="text-gray-600 mb-6 text-center">Let's get your account set up.</Text>
            <View className="w-full mb-4">
              <View className="flex-row items-center bg-white p-3 rounded-xl border border-gray-300 shadow-sm">
                <Mail size={20} color="#6B7280" className="mr-3" />
                <TextInput
                  className="flex-1 text-base text-gray-700"
                  placeholder="Email Address"
                  placeholderTextColor="#9CA3AF"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  textContentType="emailAddress" // Helps with email autofill if desired
                  autoComplete="email"
                  returnKeyType="next"
                  onSubmitEditing={() => passwordInputRef.current?.focus()}
                />
              </View>
            </View>
            <View className="w-full mb-4">
              <View className="flex-row items-center bg-white p-3 rounded-xl border border-gray-300 shadow-sm">
                <Lock size={20} color="#6B7280" className="mr-3" />
                <TextInput
                  ref={passwordInputRef}
                  className="flex-1 text-base text-gray-700"
                  placeholder="Password (min. 6 characters)"
                  placeholderTextColor="#9CA3AF"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  textContentType="newPassword" // Helps password managers
                  returnKeyType="next"
                  onSubmitEditing={() => confirmPasswordInputRef.current?.focus()}
                />
              </View>
            </View>
            <View className="w-full mb-6">
              <View className="flex-row items-center bg-white p-3 rounded-xl border border-gray-300 shadow-sm">
                <Lock size={20} color="#6B7280" className="mr-3" />
                <TextInput
                  ref={confirmPasswordInputRef}
                  className="flex-1 text-base text-gray-700"
                  placeholder="Confirm Password"
                  placeholderTextColor="#9CA3AF"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  textContentType="newPassword"
                  returnKeyType="done"
                  onSubmitEditing={() => { if(handleNextStep()) { /* Focus next field or handle error */ } }}
                />
              </View>
            </View>
          </>
        );
      case 2: // Profile Information
        return (
          <>
            <Text className="text-2xl font-bold text-gray-800 mb-1 text-center">Your Profile</Text>
            <Text className="text-gray-600 mb-6 text-center">Tell us a bit about yourself.</Text>
            {/* Full Name Input */}
            <View className="w-full mb-4">
              <View className="flex-row items-center bg-white p-3 rounded-xl border border-gray-300 shadow-sm">
                <UserIcon size={20} color="#6B7280" className="mr-3" />
                <TextInput
                  className="flex-1 text-base text-gray-700"
                  placeholder="Full Name (e.g., Jane Doe)"
                  placeholderTextColor="#9CA3AF"
                  value={fullName}
                  onChangeText={setFullName}
                  autoCapitalize="words"
                  textContentType="name" // Appropriate for full name
                  autoComplete="name"
                  returnKeyType="next"
                  onSubmitEditing={() => displayNameInputRef.current?.focus()}
                />
              </View>
            </View>
            {/* Display Name Input */}
            <View className="w-full mb-4">
              <View className="flex-row items-center bg-white p-3 rounded-xl border border-gray-300 shadow-sm">
                <View pointerEvents="none">
                  <FingerprintIcon size={20} color="#6B7280" className="mr-3" />
                </View>
                <TextInput
                  editable={true}
                  ref={displayNameInputRef}
                  className="flex-1 text-base text-gray-700"
                  placeholder="Display Name (e.g., HockeyFan99)"
                  placeholderTextColor="#9CA3AF"
                  value={displayName}
                  onChangeText={setDisplayName}
                  autoCapitalize="none"
                  textContentType="none" // To prevent autofill highlight
                  autoComplete="off"     // To prevent autofill highlight
                  returnKeyType="next"
                  onSubmitEditing={() => bioInputRef.current?.focus()}
                />
              </View>
            </View>
            {/* Bio Input */}
            <View className="w-full mb-6">
              <View className="flex-row items-start bg-white p-3 rounded-xl border border-gray-300 shadow-sm" style={{ minHeight: 80 }}>
                <UserIcon size={20} color="#6B7280" className="mr-3 mt-1" />
                <TextInput
                  ref={bioInputRef}
                  className="flex-1 text-base text-gray-700"
                  placeholder="Short Bio (Optional)"
                  placeholderTextColor="#9CA3AF"
                  value={bio}
                  onChangeText={setBio}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  returnKeyType="default"
                />
              </View>
            </View>
          </>
        );
      case 3: // Hockey Details
        return (
          <>
            <Text className="text-2xl font-bold text-gray-800 mb-1 text-center">Hockey Details</Text>
            <Text className="text-gray-600 mb-6 text-center">Share your hockey preferences (optional).</Text>
            <View className="w-full mb-4">
              <View className="flex-row items-center bg-white p-3 rounded-xl border border-gray-300 shadow-sm">
                <StarIcon size={20} color="#6B7280" className="mr-3" />
                <TextInput
                  ref={favTeamInputRef}
                  className="flex-1 text-base text-gray-700"
                  placeholder="Favorite NHL Team (e.g., Oilers)"
                  placeholderTextColor="#9CA3AF"
                  value={favoriteNHLTeam}
                  onChangeText={setFavoriteNHLTeam}
                  autoCapitalize="words"
                  returnKeyType="next"
                  onSubmitEditing={() => positionInputRef.current?.focus()}
                />
              </View>
            </View>
            <View className="w-full mb-4">
              <View className="flex-row items-center bg-white p-3 rounded-xl border border-gray-300 shadow-sm">
                <ShieldCheckIcon size={20} color="#6B7280" className="mr-3" />
                <TextInput
                  ref={positionInputRef}
                  className="flex-1 text-base text-gray-700"
                  placeholder="Playing Position (e.g., Forward, Fan)"
                  placeholderTextColor="#9CA3AF"
                  value={playingPosition}
                  onChangeText={setPlayingPosition}
                  autoCapitalize="words"
                  returnKeyType="next"
                  onSubmitEditing={() => skillLevelInputRef.current?.focus()}
                />
              </View>
            </View>
            <View className="w-full mb-4">
              <View className="flex-row items-center bg-white p-3 rounded-xl border border-gray-300 shadow-sm">
                <UserIcon size={20} color="#6B7280" className="mr-3" />
                <TextInput
                  ref={skillLevelInputRef}
                  className="flex-1 text-base text-gray-700"
                  placeholder="Skill Level (e.g., Recreational)"
                  placeholderTextColor="#9CA3AF"
                  value={skillLevel}
                  onChangeText={setSkillLevel}
                  autoCapitalize="words"
                  returnKeyType="next"
                  onSubmitEditing={() => jerseyNumberInputRef.current?.focus()}
                />
              </View>
            </View>
            <View className="w-full mb-6">
              <View className="flex-row items-center bg-white p-3 rounded-xl border border-gray-300 shadow-sm">
                <HashIcon size={20} color="#6B7280" className="mr-3" />
                <TextInput
                  ref={jerseyNumberInputRef}
                  className="flex-1 text-base text-gray-700"
                  placeholder="Jersey Number (e.g., 99)"
                  placeholderTextColor="#9CA3AF"
                  value={jerseyNumber}
                  onChangeText={setJerseyNumber}
                  keyboardType="number-pad"
                  returnKeyType="done"
                  onSubmitEditing={signUpWithEmail}
                />
              </View>
            </View>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.flexGrow}
        keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
    >
        <ScrollView
        className="flex-1 bg-gray-100"
        contentContainerStyle={styles.scrollContentContainer}
        keyboardShouldPersistTaps="handled"
        >
        <StatusBar barStyle="dark-content" />
        <Stack.Screen options={{ title: 'Create Account', headerShown: false }} />

        <View className="w-full max-w-sm items-center self-center py-6 px-4">
            <AppLogo />
            <StepIndicator currentStep={currentStep} totalSteps={totalSteps} />

            {renderStepContent()}

            <View className="w-full flex-row justify-between mt-4 mb-4">
            {currentStep > 1 ? (
                <TouchableOpacity
                className="bg-gray-200 py-3 px-6 rounded-xl shadow-md active:bg-gray-300 flex-row items-center"
                onPress={handlePreviousStep}
                disabled={loading}
                >
                <ChevronLeftIcon size={18} color="#374151" className="mr-1" />
                <Text className="text-gray-700 text-base font-semibold">Back</Text>
                </TouchableOpacity>
            ) : (
                <View style={{ width: 90 }} />
            )}

            {currentStep < totalSteps ? (
                <TouchableOpacity
                className="bg-sky-500 py-3 px-6 rounded-xl shadow-md active:bg-sky-600 flex-row items-center"
                onPress={() => { if(handleNextStep()) { /* Optional: logic after successful next step */ } }}
                disabled={loading}
                >
                <Text className="text-white text-base font-semibold">Next</Text>
                <ChevronRightIcon size={18} color="#FFFFFF" className="ml-1" />
                </TouchableOpacity>
            ) : (
                <TouchableOpacity
                className={`py-3 px-6 rounded-xl shadow-md ${loading ? 'bg-sky-400' : 'bg-sky-500 active:bg-sky-600'} flex-row items-center`}
                onPress={signUpWithEmail}
                disabled={loading}
                >
                {loading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" className="mr-2" />
                ) : (
                    <CheckIcon size={18} color="#FFFFFF" className="mr-1" />
                )}
                <Text className="text-white text-center text-base font-semibold">
                    {loading ? 'Creating...' : 'Create Account'}
                </Text>
                </TouchableOpacity>
            )}
            </View>

            <View className="mt-8 flex-row justify-center">
            <Text className="text-gray-600">Already have an account? </Text>
            <Link href="/(auth)/login" asChild>
                <TouchableOpacity disabled={loading}>
                <Text className="text-sky-500 font-semibold active:text-sky-600">Login</Text>
                </TouchableOpacity>
            </Link>
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
    justifyContent: 'center',
  }
});
