import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    TextInput,
    Platform,
    ScrollView
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { PlusSquare } from 'lucide-react-native';
import { useMediaStore } from 'store/mediaStore';

interface MediaPostUploadProps {
    loggedInUserId: string;
}

const MediaPostUpload: React.FC<MediaPostUploadProps> = ({ loggedInUserId }) => {
    const [captionInput, setCaptionInput] = useState('');
    const { 
        createNewMediaPost, 
        operationError: storeOperationError, 
        isUploadingMedia: isUploadingInStore 
    } = useMediaStore();
    
    const [isProcessingMediaLocally, setIsProcessingMediaLocally] = useState(false);

    const requestMediaPermissions = useCallback(async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Required', 'Media library access is needed.');
            return false;
        }
        return true;
    }, []);

    const convertUriToBlob = (uri: string): Promise<Blob> =>
        new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.onload = () => resolve(xhr.response);
            xhr.onerror = () => reject(new Error('Failed to convert file URI to Blob.'));
            xhr.responseType = 'blob';
            xhr.open('GET', uri, true);
            xhr.send(null);
        });

    const triggerMediaUpload = async (selectedMediaType: 'image' | 'video') => {
        if (!loggedInUserId) {
            Alert.alert('Authentication Error', 'User ID is missing. Cannot upload.');
            return;
        }

        const permissionGranted = await requestMediaPermissions();
        if (!permissionGranted) return;

        setIsProcessingMediaLocally(true);

        try {
            const pickerResult = await ImagePicker.launchImageLibraryAsync({
                mediaTypes:
                    selectedMediaType === 'image'
                        ? ImagePicker.MediaTypeOptions.Images
                        : ImagePicker.MediaTypeOptions.Videos,
                allowsEditing: true,
                quality: 0.8,
            });

            if (pickerResult.canceled || !pickerResult.assets?.[0]?.uri) {
                setIsProcessingMediaLocally(false);
                return;
            }

            const selectedAsset = pickerResult.assets[0];
            if (!selectedAsset.uri) {
                throw new Error('Selected media asset is missing a URI.');
            }

            const mediaBlob = await convertUriToBlob(selectedAsset.uri);
            if (mediaBlob.size === 0) {
                throw new Error('The selected file appears to be empty.');
            }

            const newlyUploadedPost = await createNewMediaPost({
                uploaderUserId: loggedInUserId,
                mediaType: selectedMediaType,
                mediaFile: mediaBlob,
                captionText: captionInput.trim(),
                originalFileName: selectedAsset.fileName,
            });

            if (newlyUploadedPost) {
                Alert.alert('Upload Complete', `${selectedMediaType.charAt(0).toUpperCase() + selectedMediaType.slice(1)} uploaded successfully!`);
                setCaptionInput('');
            } else {
                Alert.alert('Upload Failed', storeOperationError || 'An unknown error occurred during upload.');
            }
        } catch (error: any) {
            console.error('Media Upload Process Error:', error);
            Alert.alert('Operation Error', error.message || 'An unexpected error occurred.');
        } finally {
            setIsProcessingMediaLocally(false);
        }
    };

    const isCurrentlyUploading = isProcessingMediaLocally || isUploadingInStore;

    return (
        <ScrollView 
            className="flex-1 bg-gray-50"
            contentContainerClassName="p-5"
            keyboardShouldPersistTaps="handled"
        >
            <View className="mb-[10px]">
                <TextInput
                    className="border border-gray-300 rounded-[5px] p-[10px] min-h-[80px] bg-white text-gray-900 leading-relaxed"
                    placeholder="Share your thoughts..."
                    placeholderTextColor="text-gray-500" 
                    value={captionInput}
                    onChangeText={setCaptionInput}
                    multiline
                    numberOfLines={4}
                    editable={!isCurrentlyUploading}
                    textAlignVertical="top"
                />
            </View>

            <View className="flex-row justify-between mt-[10px] mb-[10px]">
                <TouchableOpacity
                    onPress={() => triggerMediaUpload('image')}
                    className={`flex-1 flex-row items-center justify-center bg-gray-100 py-[10px] px-[15px] rounded-[5px] mx-[5px] ${isCurrentlyUploading ? 'opacity-60' : 'active:bg-gray-200'}`}
                    disabled={isCurrentlyUploading}
                >
                    <PlusSquare size={20} color={isCurrentlyUploading ? '#a0aec0' : '#007bff'} />
                    <Text className={`ml-[5px] text-base font-medium ${isCurrentlyUploading ? 'text-gray-400' : 'text-[#007bff]'}`}>
                        {isCurrentlyUploading ? 'Processing...' : 'Add Photo'}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => triggerMediaUpload('video')}
                    className={`flex-1 flex-row items-center justify-center bg-gray-100 py-[10px] px-[15px] rounded-[5px] mx-[5px] ${isCurrentlyUploading ? 'opacity-60' : 'active:bg-gray-200'}`}
                    disabled={isCurrentlyUploading}
                >
                    <PlusSquare size={20} color={isCurrentlyUploading ? '#a0aec0' : '#007bff'} />
                    <Text className={`ml-[5px] text-base font-medium ${isCurrentlyUploading ? 'text-gray-400' : 'text-[#007bff]'}`}>
                        {isCurrentlyUploading ? 'Processing...' : 'Add Video'}
                    </Text>
                </TouchableOpacity>
            </View>

            {isCurrentlyUploading && storeOperationError === null && (
                <View className="flex-row items-center justify-center space-x-2 py-2 mb-[10px]">
                    <ActivityIndicator size="small" color="#007bff" />
                    <Text className="text-sm text-gray-600">Uploading your media...</Text>
                </View>
            )}

            {storeOperationError && !isUploadingInStore && (
                <View className="mt-[10px]">
                    <Text className="text-red-600 text-sm text-center">{storeOperationError}</Text>
                </View>
            )}
        </ScrollView>
    );
};

export default MediaPostUpload;