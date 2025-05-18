import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert, StyleSheet, TextInput } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

import { useMediaStore } from 'store/mediaStore';
import { PlusSquare } from 'lucide-react-native';
import { minimalStyles } from './minimalStyles';

interface MediaPostUploadProps {
    currentUserId: string;
}

const MediaPostUpload: React.FC<MediaPostUploadProps> = ({ currentUserId }) => {
    const [caption, setCaption] = useState('');
    const { uploadMediaPost, error: mediaError } = useMediaStore();
    const [isUploading, setUploadingMedia] = useState(false);


    const requestPermissions = async () => {
        const { status: mediaStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (mediaStatus !== 'granted') {
            Alert.alert('Permission Required', 'Please grant access to your media library to upload photos or videos.');
            return false;
        }
        return true;
    };

    const uriToBlob = (uri: string): Promise<Blob> => {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.onload = function () {
                resolve(xhr.response);
            };
            xhr.onerror = function () {
                reject(new Error(`uriToBlob failed for URI: ${uri}`));
            };
            xhr.responseType = 'blob';
            xhr.open('GET', uri, true);
            xhr.send(null);
        });
    };


    const handleUpload = async (mediaType: 'image' | 'video') => {
        const hasPermission = await requestPermissions();
        if (!hasPermission) return;

        let result;
        try {
            if (mediaType === 'image') {
                result = await ImagePicker.launchImageLibraryAsync({
                    mediaTypes: ImagePicker.MediaTypeOptions.Images,
                    allowsEditing: true,
                    aspect: [4, 3],
                    quality: 1,
                });
            } else {
                 result = await ImagePicker.launchImageLibraryAsync({
                    mediaTypes: ImagePicker.MediaTypeOptions.Videos,
                    allowsEditing: true,
                    quality: 1,
                });
            }
        } catch (pickerError: any) {
             console.error('Error picking media:', pickerError);
             Alert.alert('Media Picking Error', `Failed to pick media: ${pickerError.message}`);
             return;
        }


        if (!result.canceled && result.assets && result.assets.length > 0) {
            const asset = result.assets[0];
            const uri = asset.uri;
            const fileType = asset.type;
            const mimeType = asset.mimeType || 'application/octet-stream';

            setUploadingMedia(true);

            try {
                const fileToUpload = await uriToBlob(uri);

                 if (fileToUpload.size === 0) {
                     throw new Error('Created Blob is empty (0KB). Cannot upload.');
                 }

                const uploadedPost = await uploadMediaPost({
                    userId: currentUserId,
                    type: fileType as 'image' | 'video',
                    file: fileToUpload,
                    caption: caption,
                });

                if (uploadedPost) {
                    Alert.alert('Success', `${fileType === 'image' ? 'Image' : 'Video'} uploaded successfully!`);
                    setCaption('');
                } else {
                     Alert.alert('Upload Failed', mediaError || `Failed to upload ${fileType}. Check console for details.`);
                }
            } catch (e: any) {
                 console.error('Error preparing or uploading file:', e);
                 Alert.alert('Upload Error', `An error occurred during upload preparation: ${e.message}`);
            } finally {
                 setUploadingMedia(false);
            }

        } else {
            console.log('Media picking cancelled or failed.');
            setUploadingMedia(false);
        }
    };


    return (
        <View style={minimalStyles.contentWrapper}>
            {/* Removed section title here, as it's handled in the modal content */}
            <TextInput
                style={minimalStyles.captionInput}
                placeholder="Add a caption (optional)"
                placeholderTextColor="#8e8e93"
                value={caption}
                onChangeText={setCaption}
                multiline
            />
            <View style={minimalStyles.uploadButtonsContainer}>
                <TouchableOpacity
                    onPress={() => handleUpload('image')}
                    style={minimalStyles.uploadButton}
                    disabled={isUploading}
                >
                    <PlusSquare size={24} color={isUploading ? "#ccc" : "#007bff"} />
                    <Text style={[minimalStyles.uploadButtonText, isUploading && { color: '#ccc' }]}>Upload Image</Text>
                </TouchableOpacity>
                 <TouchableOpacity
                    onPress={() => handleUpload('video')}
                    style={minimalStyles.uploadButton}
                    disabled={isUploading}
                >
                    <PlusSquare size={24} color={isUploading ? "#ccc" : "#007bff"} />
                    <Text style={[minimalStyles.uploadButtonText, isUploading && { color: '#ccc' }]}>Upload Video</Text>
                 </TouchableOpacity>
            </View>
            {isUploading && <ActivityIndicator />}
             {mediaError && <Text style={minimalStyles.errorText}>{mediaError}</Text>}
        </View>
    );
};

export default MediaPostUpload;
