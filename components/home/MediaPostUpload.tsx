// src/components/home/MediaPostUpload.tsx

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert, StyleSheet, TextInput } from 'react-native';
import * as ImagePicker from 'expo-image-picker'; // Assuming you are using Expo
import * as VideoPicker from 'expo-image-picker'; // Expo can pick videos too
import * as FileSystem from 'expo-file-system'; // Import Expo FileSystem
import { useMediaStore } from 'store/mediaStore'; // Adjust import path
import { PlusSquare } from 'lucide-react-native'; // Icon for upload button

interface MediaPostUploadProps {
    currentUserId: string; // The ID of the currently authenticated user
}

const MediaPostUpload: React.FC<MediaPostUploadProps> = ({ currentUserId }) => {
    const [caption, setCaption] = useState('');
    // Corrected the state declaration for uploadingMedia - assuming useMediaStore has this state
    const { uploadMediaPost, uploadingMedia, error: mediaError } = useMediaStore();
    const [isUploading, setUploadingMedia] = useState(false); // Use a separate local state for the component's uploading indicator


    // Request permissions for media library access
    const requestPermissions = async () => {
        const { status: mediaStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        // You might also need camera permissions if you allow taking photos/videos directly
        // const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();

        if (mediaStatus !== 'granted') {
            Alert.alert('Permission Required', 'Please grant access to your media library to upload photos or videos.');
            return false;
        }
        return true;
    };


    const handleUpload = async (type: 'image' | 'video') => {
        const hasPermission = await requestPermissions();
        if (!hasPermission) return;

        let result;
        if (type === 'image') {
            result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true, // Optional: allow editing
                aspect: [4, 3], // Optional: specify aspect ratio
                quality: 1, // Image quality (0 to 1)
            });
        } else { // type === 'video'
             result = await VideoPicker.launchImageLibraryAsync({
                mediaTypes: VideoPicker.MediaTypeOptions.Videos,
                allowsEditing: true, // Optional: allow editing
                quality: 1, // Video quality (0 to 1)
            });
        }


        if (!result.canceled && result.assets && result.assets.length > 0) {
            const asset = result.assets[0];
            const uri = asset.uri;
            const fileType = asset.type; // 'image' or 'video'
            const mimeType = asset.mimeType || 'application/octet-stream'; // Get MIME type from asset

            // Set local uploading state to true
            setUploadingMedia(true);

            try {
                 // Read the file content as a base64 string using Expo FileSystem
                const base64 = await FileSystem.readAsStringAsync(uri, {
                    encoding: FileSystem.EncodingType.Base64,
                });

                console.log('Read file as Base64. Length:', base64.length); // Log base64 length

                if (!base64 || base64.length === 0) {
                     throw new Error('Failed to read file content or file is empty.');
                }

                // Convert the base64 string to a Blob
                // This requires a base64 to Blob conversion utility or polyfill if not natively supported
                // A common way is using `atob` and `Uint8Array`, but this might need polyfills in RN
                // A simpler approach that often works with Supabase SDK v2 is to upload the base64 string directly,
                // but let's create a Blob explicitly for clarity and wider compatibility.

                // Helper function to convert base64 to Blob (basic implementation, might need polyfills)
                const base64ToBlob = (base64String: string, contentType: string = ''): Blob => {
                    const sliceSize = 512;
                    const byteCharacters = atob(base64String);
                    const byteArrays = [];

                    for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
                        const slice = byteCharacters.slice(offset, offset + sliceSize);
                        const byteNumbers = new Array(slice.length);
                        for (let i = 0; i < slice.length; i++) {
                            byteNumbers[i] = slice.charCodeAt(i);
                        }
                        const byteArray = new Uint8Array(byteNumbers);
                        byteArrays.push(byteArray);
                    }

                    return new Blob(byteArrays, { type: contentType });
                };

                const fileToUpload = base64ToBlob(base64, mimeType);

                console.log('Created Blob from Base64. Size:', fileToUpload.size); // Log the blob size

                 if (fileToUpload.size === 0) {
                     throw new Error('Created Blob is empty (0KB).');
                 }


                // Determine file extension more reliably from mime type
                const fileExt = mimeType.split('/').pop() || 'bin'; // Default to 'bin' if extension can't be determined
                const filePath = `${currentUserId}/${Date.now()}.${fileExt}`; // Use timestamp for unique name


                // Upload the media post using the store action
                // Supabase Storage v2 `upload` method can accept a Blob
                const uploadedPost = await uploadMediaPost({
                    userId: currentUserId,
                    type: fileType as 'image' | 'video', // Cast to correct type
                    file: fileToUpload, // Pass the prepared Blob
                    caption: caption,
                });

                if (uploadedPost) {
                    Alert.alert('Success', `${fileType === 'image' ? 'Image' : 'Video'} uploaded successfully!`);
                    setCaption(''); // Clear caption after successful upload
                } else {
                     // Error is handled by the store and console.error
                     Alert.alert('Error', mediaError || `Failed to upload ${fileType}.`);
                }
            } catch (e: any) {
                 console.error('Error preparing or uploading file:', e);
                 Alert.alert('Upload Error', `An error occurred during upload: ${e.message}`);
            } finally {
                 // Always reset local uploading state
                 setUploadingMedia(false);
            }

        } else {
            console.log('Media picking cancelled or failed.');
        }
    };


    return (
        <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Upload Media</Text>
            <TextInput
                style={styles.captionInput}
                placeholder="Add a caption (optional)"
                value={caption}
                onChangeText={setCaption}
                multiline
            />
            <View style={styles.uploadButtonsContainer}>
                <TouchableOpacity
                    onPress={() => handleUpload('image')}
                    style={styles.uploadButton}
                    disabled={isUploading} // Use local uploading state
                >
                    <PlusSquare size={24} color="#007bff" />
                    <Text style={styles.uploadButtonText}>Upload Image</Text>
                </TouchableOpacity>
                 <TouchableOpacity
                    onPress={() => handleUpload('video')}
                    style={styles.uploadButton}
                    disabled={isUploading} // Use local uploading state
                >
                    <PlusSquare size={24} color="#007bff" />
                    <Text style={styles.uploadButtonText}>Upload Video</Text>
                </TouchableOpacity>
            </View>
            {isUploading && <ActivityIndicator size="small" color="#007bff" style={{ marginTop: 10 }} />} {/* Use local uploading state */}
             {mediaError && <Text style={styles.errorText}>{mediaError}</Text>}
        </View>
    );
};

const styles = StyleSheet.create({
    sectionContainer: {
        marginBottom: 20,
        backgroundColor: '#fff',
        paddingVertical: 15,
        paddingHorizontal: 10,
        borderRadius: 8,
        marginHorizontal: 10,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 10,
        paddingHorizontal: 5,
    },
    captionInput: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        padding: 10,
        marginBottom: 15,
        minHeight: 80,
        textAlignVertical: 'top', // Align text to the top on Android
    },
    uploadButtonsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    uploadButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#e9ecef',
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderRadius: 5,
    },
    uploadButtonText: {
        marginLeft: 5,
        fontSize: 16,
        color: '#007bff',
    },
     errorText: {
        color: 'red',
        fontSize: 14,
        textAlign: 'center',
        marginTop: 10,
    },
});

export default MediaPostUpload;