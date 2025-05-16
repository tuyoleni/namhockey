import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
// Removed SafeAreaView as the modal structure now handles safe areas

// Import the component that will be displayed inside the modal
import MediaPostUpload from '@components/home/MediaPostUpload';

import { modalStyles } from './minimalStyles'; // Import styles

interface MediaUploadModalContentProps {
    currentUserId: string;
    onClose: () => void;
}

const MediaUploadModalContent: React.FC<MediaUploadModalContentProps> = ({ currentUserId, onClose }) => {
    return (
        // Changed from SafeAreaView to View and added flex: 1
        // This View acts as the content area within the modalContentContainer
        <View style={{ flex: 1 }}>
            <View style={modalStyles.modalHeader}>
                <Text style={modalStyles.modalTitle}>Upload Media</Text>
                <TouchableOpacity onPress={onClose} style={modalStyles.closeButton}>
                    <Text style={modalStyles.closeButtonText}>Close</Text>
                </TouchableOpacity>
            </View>
             {/* Use a ScrollView here to ensure the content can scroll if it exceeds modal height */}
             {/* Give the ScrollView flex: 1 to take up available space */}
            <ScrollView style={{ flex: 1, paddingHorizontal: 10, paddingVertical: 10 }}>
                 {/* MediaPostUpload component is rendered here */}
                <MediaPostUpload currentUserId={currentUserId} />
            </ScrollView>
        </View>
    );
};

export default MediaUploadModalContent;
