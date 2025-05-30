import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useUserStore } from 'store/userStore';
import MediaPostUpload from '@components/home/MediaPostUpload';
import { GalleryHorizontal, Camera, XCircle, CheckCircle } from 'lucide-react-native';

const CreateMediaPostScreen = () => {
  const router = useRouter();
  const { authUser, loading: loadingUser } = useUserStore();
  const [selectedAsset, setSelectedAsset] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [isLoadingMedia, setIsLoadingMedia] = useState(false); // For local picking/capturing
  const [uploadSuccess, setUploadSuccess] = useState(false);


  const requestPermissions = async (type: 'gallery' | 'camera') => {
    let permissionResult;
    if (type === 'camera') {
      permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      if (permissionResult.status !== 'granted') {
        Alert.alert('Permission Required', 'Camera access is needed to take photos/videos.');
        return false;
      }
    }

    permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.status !== 'granted') {
      Alert.alert('Permission Required', 'Media library access is needed to select photos/videos.');
      return false;
    }
    return true;
  };

  const handlePickFromGallery = async () => {
    const hasPermission = await requestPermissions('gallery');
    if (!hasPermission) return;

    setIsLoadingMedia(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All, // Allow both images and videos
        allowsEditing: true,
        quality: 0.8,
        // aspect: [4, 3], // Optional: enforce aspect ratio
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedAsset(result.assets[0]);
        setUploadSuccess(false); // Reset success state for new upload
      }
    } catch (error) {
      console.error("Error picking from gallery:", error);
      Alert.alert("Error", "Could not select media from gallery.");
    } finally {
      setIsLoadingMedia(false);
    }
  };

  const handleCaptureFromCamera = async () => {
    const hasPermission = await requestPermissions('camera');
    if (!hasPermission) return;

    setIsLoadingMedia(true);
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: true,
        quality: 0.8,
        // aspect: [4, 3], // Optional
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedAsset(result.assets[0]);
        setUploadSuccess(false); // Reset success state for new upload
      }
    } catch (error) {
      console.error("Error capturing from camera:", error);
      Alert.alert("Error", "Could not capture media from camera.");
    } finally {
      setIsLoadingMedia(false);
    }
  };

  const handleClearSelection = () => {
    setSelectedAsset(null);
    setUploadSuccess(false);
  };

  const onUploadComplete = () => {
    setUploadSuccess(true);
    // Optionally, clear selection or offer to make another post immediately
    // setSelectedAsset(null); // Keep asset for viewing or clear it
    // router.back(); // Or navigate to feed
  };


  if (loadingUser) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-900">
        <ActivityIndicator size="large" color="#FFFFFF" />
        <Text className="text-gray-300 mt-2">Loading user...</Text>
      </View>
    );
  }

  if (!authUser) {
    return (
      <SafeAreaView className="flex-1 bg-gray-900">
        <Stack.Screen options={{ title: 'Create Post', headerStyle: { backgroundColor: '#1F2937'}, headerTintColor: '#FFFFFF', headerTitleStyle: { color: '#FFFFFF'} }} />
        <View className="flex-1 justify-center items-center p-5">
          <Text className="text-red-400 text-center">
            User not authenticated. Please log in to create a post.
          </Text>
          <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(app)/home')} className="mt-4 bg-sky-600 px-4 py-2 rounded-lg">
            <Text className="text-white font-semibold">Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-800">
      <Stack.Screen
        options={{
          title: 'New Post',
          headerStyle: { backgroundColor: '#1F2937'}, // Darker header
          headerTintColor: '#FFFFFF', // White back button and title
          headerTitleStyle: { color: '#FFFFFF', fontWeight: '600'},
          headerRight: () => (
            selectedAsset && !uploadSuccess ? (
              <TouchableOpacity onPress={handleClearSelection} className="mr-4">
                <XCircle size={26} color="#F87171" />
              </TouchableOpacity>
            ) : null
          ),
        }}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0} // Adjust if header height changes
      >
        <ScrollView 
            className="flex-1" 
            contentContainerStyle={{ flexGrow: 1 }}
            keyboardShouldPersistTaps="handled"
        >
          {isLoadingMedia && (
            <View className="absolute inset-0 justify-center items-center bg-black/50 z-50">
              <ActivityIndicator size="large" color="#FFFFFF" />
              <Text className="text-white mt-2">Loading Media...</Text>
            </View>
          )}

          {!selectedAsset && !uploadSuccess && (
            <View className="flex-1 justify-center items-center p-5">
              <Text className="text-xl font-semibold text-gray-200 mb-8 text-center">
                Share a photo or video
              </Text>
              <View className="w-full space-y-4">
                <TouchableOpacity
                  onPress={handlePickFromGallery}
                  className="bg-sky-600 p-4 rounded-lg flex-row items-center justify-center space-x-2 shadow-md"
                >
                  <GalleryHorizontal size={22} color="white" />
                  <Text className="text-white text-lg font-semibold">Choose from Gallery</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleCaptureFromCamera}
                  className="bg-teal-500 p-4 rounded-lg flex-row items-center justify-center space-x-2 shadow-md"
                >
                  <Camera size={22} color="white" />
                  <Text className="text-white text-lg font-semibold">Take Photo or Video</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {selectedAsset && !uploadSuccess && (
            <View className="flex-1">
              <View className="w-full aspect-square bg-black mb-3">
                {selectedAsset.type === 'image' ? (
                  <Image source={{ uri: selectedAsset.uri }} className="w-full h-full" resizeMode="contain" />
                ) : (
                  <View className="w-full h-full justify-center items-center bg-black">
                    <Camera size={60} color="gray" />
                    <Text className="text-gray-400 mt-2 text-center">Video Selected: {selectedAsset.fileName || 'video'}</Text>
                    <Text className="text-xs text-gray-500 mt-1">(Preview not shown, will upload)</Text>
                  </View>
                )}
              </View>
              {/* Pass the selected asset and user ID to MediaPostUpload */}
              <MediaPostUpload
                loggedInUserId={authUser.id}
                assetToUpload={selectedAsset}
                onUploadComplete={onUploadComplete}
                onCancel={handleClearSelection} // Allow MediaPostUpload to trigger a cancel
              />
            </View>
          )}
           {uploadSuccess && (
            <View className="flex-1 justify-center items-center p-5">
              <CheckCircle size={80} color="#34D399" />
              <Text className="text-2xl font-semibold text-gray-100 mt-6 mb-4">Post Uploaded!</Text>
              <TouchableOpacity
                onPress={() => {
                  handleClearSelection(); // Reset for a new post
                  // Optionally navigate or offer other actions
                }}
                className="bg-sky-600 py-3 px-6 rounded-lg flex-row items-center justify-center space-x-2 shadow-md"
              >
                <Text className="text-white text-lg font-semibold">Create Another Post</Text>
              </TouchableOpacity>
               <TouchableOpacity
                onPress={() => router.replace('/(app)')} // Navigate to home or feed
                className="mt-4 py-3 px-6"
              >
                <Text className="text-sky-400 text-base">Go to Feed</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default CreateMediaPostScreen;
