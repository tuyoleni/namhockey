import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Platform,
  ScrollView,
  Image // For potential small preview within this component if desired
} from 'react-native';
import * as ImagePicker from 'expo-image-picker'; // Still needed for types
import { UploadCloud, X } from 'lucide-react-native'; // Changed from PlusSquare
import { useMediaStore } from 'store/mediaStore'; // Adjust path if needed

interface MediaPostUploadProps {
  loggedInUserId: string;
  assetToUpload?: ImagePicker.ImagePickerAsset | null; // Asset passed from parent
  onUploadComplete?: () => void; // Callback for parent
  onCancel?: () => void; // Callback if parent wants to handle cancel/clear
}

const MediaPostUpload: React.FC<MediaPostUploadProps> = ({
  loggedInUserId,
  assetToUpload,
  onUploadComplete,
  onCancel
}) => {
  const [captionInput, setCaptionInput] = useState('');
  const {
    createNewMediaPost,
    operationError: storeOperationError,
    isUploadingMedia: isUploadingInStore
  } = useMediaStore();

  const [isProcessingMediaLocally, setIsProcessingMediaLocally] = useState(false);
  // internalSelectedAsset is primarily driven by the assetToUpload prop
  // No need for a separate state unless this component could also pick, which it doesn't in this flow.

  // Reset caption when a new asset is provided
  useEffect(() => {
    if (assetToUpload) {
      setCaptionInput('');
    }
  }, [assetToUpload]);


  const convertUriToBlob = (uri: string): Promise<Blob> =>
    new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.onload = () => resolve(xhr.response);
      xhr.onerror = (e) => {
        console.error("XHR Error converting URI to Blob: ", e);
        reject(new Error('Failed to convert file URI to Blob. Check network and URI.'));
      };
      xhr.responseType = 'blob';
      xhr.open('GET', uri, true);
      xhr.send(null);
    });

  const handleFinalUpload = async () => {
    if (!assetToUpload) { // Check prop directly
      Alert.alert('No Media', 'No media has been selected for upload.');
      return;
    }
    if (!loggedInUserId) {
      Alert.alert('Authentication Error', 'User ID is missing. Cannot upload.');
      return;
    }

    setIsProcessingMediaLocally(true);
    useMediaStore.setState({ operationError: null }); // Clear previous errors from the store

    try {
      const mediaBlob = await convertUriToBlob(assetToUpload.uri);
      if (mediaBlob.size === 0) {
        throw new Error('The selected file appears to be empty or could not be accessed.');
      }

      // Determine mediaType more robustly if assetToUpload.type is not reliable
      let mediaType = assetToUpload.type || 'image'; // Default to image
      if (assetToUpload.uri) {
          const extension = assetToUpload.uri.split('.').pop()?.toLowerCase();
          if (extension === 'mov' || extension === 'mp4' || extension === 'm4v' || extension === '3gp') {
              mediaType = 'video';
          } else if (extension === 'jpg' || extension === 'jpeg' || extension === 'png' || extension === 'gif' || extension === 'heic') {
              mediaType = 'image';
          }
      }


      const newlyUploadedPost = await createNewMediaPost({
        uploaderUserId: loggedInUserId,
        mediaType: mediaType as 'image' | 'video',
        mediaFile: mediaBlob,
        captionText: captionInput.trim(),
        originalFileName: assetToUpload.fileName || `media_${Date.now()}.${mediaType === 'video' ? 'mp4' : 'jpg'}`, // Fallback filename
      });

      if (newlyUploadedPost) {
        setCaptionInput('');
        if (onUploadComplete) {
          onUploadComplete(); // Notify parent screen
        }
      } else {
        // Error should be in storeOperationError from useMediaStore
        Alert.alert('Upload Failed', useMediaStore.getState().operationError || 'An unknown error occurred during upload.');
      }
    } catch (error: any) {
      console.error('Media Upload Process Error:', error);
      Alert.alert('Operation Error', error.message || 'An unexpected error occurred.');
      // Optionally set error in store if not already handled by createNewMediaPost
      useMediaStore.setState({ operationError: error.message || 'An unexpected error occurred.' });
    } finally {
      setIsProcessingMediaLocally(false);
    }
  };

  const isCurrentlyUploading = isProcessingMediaLocally || isUploadingInStore;

  // This component now expects assetToUpload to be provided by its parent.
  // If no asset is provided, it shouldn't render its main UI, or parent should not render it.
  // For robustness, we can add a check here, though CreateMediaPostScreen handles this.
  if (!assetToUpload) {
    return (
        <View className="p-5 items-center justify-center">
            <Text className="text-gray-400 text-center">Media will be shown here once selected.</Text>
        </View>
    );
  }


  return (
    // This component is part of the ScrollView in CreateMediaPostScreen
    <View className="p-4 bg-gray-800 flex-1">
      <TextInput
        className="border border-gray-600 rounded-lg p-3.5 min-h-[100px] bg-gray-700 text-gray-100 leading-relaxed text-base shadow-sm focus:border-sky-500"
        placeholder="Write a caption..."
        placeholderTextColor="#9CA3AF" // Tailwind gray-400
        value={captionInput}
        onChangeText={setCaptionInput}
        multiline
        numberOfLines={4}
        editable={!isCurrentlyUploading}
        textAlignVertical="top"
      />

      <View className="mt-5 space-y-3">
        <TouchableOpacity
          onPress={handleFinalUpload}
          className={`flex-row items-center justify-center bg-sky-600 py-3.5 px-5 rounded-lg shadow-md ${isCurrentlyUploading ? 'opacity-60' : 'active:bg-sky-700'}`}
          disabled={isCurrentlyUploading}
        >
          <UploadCloud size={20} color="white" />
          <Text className="ml-2.5 text-lg font-semibold text-white">
            {isCurrentlyUploading ? 'Posting...' : 'Post'}
          </Text>
        </TouchableOpacity>

        {/* The onCancel prop is passed from CreateMediaPostScreen (handleClearSelection) */}
        {/* This button allows the user to "discard" the current selection from this step */}
        {onCancel && !isCurrentlyUploading && (
             <TouchableOpacity
                onPress={onCancel}
                className={`flex-row items-center justify-center bg-red-700 py-3 px-5 rounded-lg shadow-md active:bg-red-800`}
            >
                <X size={20} color="white" />
                <Text className="ml-2 text-base font-semibold text-white">Clear Selection</Text>
            </TouchableOpacity>
        )}
      </View>


      {isCurrentlyUploading && !storeOperationError && ( // Show loading only if no error
        <View className="flex-row items-center justify-center space-x-2 py-3 mt-3">
          <ActivityIndicator size="small" color="#FFFFFF" />
          <Text className="text-sm text-gray-300">Uploading your media...</Text>
        </View>
      )}

      {storeOperationError && !isCurrentlyUploading && (
        <View className="mt-4 p-3 bg-red-900/50 rounded-md">
          <Text className="text-red-300 text-sm text-center">{storeOperationError}</Text>
        </View>
      )}
    </View>
  );
};

export default MediaPostUpload;
