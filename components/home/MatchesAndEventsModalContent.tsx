import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
// Removed SafeAreaView as the modal structure now handles safe areas

// Import the components that will be displayed inside the modal
import UpcomingMatches from '@components/home/UpcomingMatches';
import RecentMatches from '@components/home/RecentMatches';

import { modalStyles } from './minimalStyles'; // Import styles

interface MatchesAndEventsModalContentProps {
    onClose: () => void;
}

const MatchesAndEventsModalContent: React.FC<MatchesAndEventsModalContentProps> = ({ onClose }) => {
    const [showUpcoming, setShowUpcoming] = useState(true);

    return (
        // Changed from SafeAreaView to View and added flex: 1
        <View style={{ flex: 1 }}>
            <View style={modalStyles.modalHeader}>
                <Text style={modalStyles.modalTitle}>Matches & Events</Text>
                <TouchableOpacity onPress={onClose} style={modalStyles.closeButton}>
                    <Text style={modalStyles.closeButtonText}>Close</Text>
                </TouchableOpacity>
            </View>
            <View style={modalStyles.segmentControl}>
                <TouchableOpacity
                    style={[modalStyles.segmentButton, showUpcoming && modalStyles.segmentButtonActive]}
                    onPress={() => setShowUpcoming(true)}
                >
                    <Text style={[modalStyles.segmentText, showUpcoming && modalStyles.segmentTextActive]}>Upcoming</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[modalStyles.segmentButton, !showUpcoming && modalStyles.segmentButtonActive]}
                    onPress={() => setShowUpcoming(false)}
                >
                    <Text style={[modalStyles.segmentText, !showUpcoming && modalStyles.segmentTextActive]}>Recent</Text>
                </TouchableOpacity>
            </View>
            {/* ScrollView is needed here to allow scrolling within the modal */}
            <ScrollView style={modalStyles.modalScrollView}>
                {showUpcoming ? <UpcomingMatches /> : <RecentMatches />}
            </ScrollView>
        </View>
    );
};

export default MatchesAndEventsModalContent;
