import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    TextInput,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { PlusSquare } from 'lucide-react-native';
import { useMediaStore } from 'store/mediaStore';

interface MediaPostUploadProps {
    currentUserId: string;
}

const MediaPostUpload: React.FC<MediaPostUploadProps> = ({ currentUserId }) => {
    const [caption, setCaption] = useState('');
    const { uploadMediaPost, error: mediaError } = useMediaStore();
    const [isUploading, setUploadingMedia] = useState(false);

    const requestPermissions = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Required', 'Media access is needed to upload.');
            return false;
        }
        return true;
    };

    const uriToBlob = (uri: string): Promise<Blob> =>
        new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.onload = () => resolve(xhr.response);
            xhr.onerror = () => reject(new Error('Failed to convert URI to Blob'));
            xhr.responseType = 'blob';
            xhr.open('GET', uri, true);
            xhr.send(null);
        });

    const handleUpload = async (mediaType: 'image' | 'video') => {
        const permission = await requestPermissions();
        if (!permission) return;

        const pickerResult = await ImagePicker.launchImageLibraryAsync({
            mediaTypes:
                mediaType === 'image'
                    ? ImagePicker.MediaTypeOptions.Images
                    : ImagePicker.MediaTypeOptions.Videos,
            allowsEditing: true,
            quality: 1,
        });

        if (pickerResult.canceled || !pickerResult.assets?.[0]) return;

        const asset = pickerResult.assets[0];
        setUploadingMedia(true);

        try {
            const blob = await uriToBlob(asset.uri);
            if (blob.size === 0) throw new Error('File is empty');

            const success = await uploadMediaPost({
                userId: currentUserId,
                type: mediaType,
                file: blob,
                caption,
            });

            if (success) {
                Alert.alert('Success', `${mediaType} uploaded`);
                setCaption('');
            } else {
                Alert.alert('Upload Failed', mediaError || 'Upload error');
            }
        } catch (e: any) {
            Alert.alert('Error', e.message);
        } finally {
            setUploadingMedia(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            className="px-4"
        >
            <View className="space-y-4">
                <TextInput
                    className="border border-gray-300 rounded-xl p-3 text-base text-gray-800 bg-white"
                    placeholder="Add a caption (optional)"
                    placeholderTextColor="#8e8e93"
                    value={caption}
                    onChangeText={setCaption}
                    multiline
                />

                <View className="flex-row justify-between">
                    <TouchableOpacity
                        onPress={() => handleUpload('image')}
                        className="flex-row items-center gap-2 px-4 py-2 bg-blue-100 rounded-xl"
                        disabled={isUploading}
                    >
                        <PlusSquare size={20} color={isUploading ? '#ccc' : '#007bff'} />
                        <Text className={`text-sm ${isUploading ? 'text-gray-400' : 'text-blue-600'}`}>
                            Upload Image
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => handleUpload('video')}
                        className="flex-row items-center gap-2 px-4 py-2 bg-blue-100 rounded-xl"
                        disabled={isUploading}>
                        <PlusSquare size={20} color={isUploading ? '#ccc' : '#007bff'} />
                        <Text className={`text-sm ${isUploading ? 'text-gray-400' : 'text-blue-600'}`}>
                            Upload Video
                        </Text>
                    </TouchableOpacity>
                </View>

                {isUploading && <ActivityIndicator className="mt-2" />}
                {mediaError && <Text className="text-red-500 text-sm">{mediaError}</Text>}
            </View>
        </KeyboardAvoidingView>
    );
};

export default MediaPostUpload;