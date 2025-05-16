import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
// Removed SafeAreaView as the modal structure now handles safe areas

import { modalStyles } from './minimalStyles'; // Import styles

interface FullListModalContentProps {
    title: string;
    children: React.ReactNode;
    onClose: () => void;
}

const FullListModalContent: React.FC<FullListModalContentProps> = ({ title, children, onClose }) => {
    return (
        // Changed from SafeAreaView to View and added flex: 1
        <View style={{ flex: 1 }}>
            <View style={modalStyles.modalHeader}>
                <Text style={modalStyles.modalTitle}>{title}</Text>
                <TouchableOpacity onPress={onClose} style={modalStyles.closeButton}>
                    <Text style={modalStyles.closeButtonText}>Close</Text>
                </TouchableOpacity>
            </View>
             {/* ScrollView is needed here to allow scrolling within the modal */}
            <ScrollView style={modalStyles.modalScrollView}>
                {children}
            </ScrollView>
        </View>
    );
};

export default FullListModalContent;
