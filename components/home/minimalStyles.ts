// src/components/home/minimalStyles.ts
import { StyleSheet, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

// Styles for the main HomeScreen layout and elements
export const minimalStyles = StyleSheet.create({
    header: {
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333',
    },
    userName: {
        fontSize: 16,
        color: '#555',
    },
    section: {
        marginBottom: 15,
        paddingHorizontal: 15, // Provide some padding for content
    },
    sectionHeaderTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
        marginTop: 10,
    },
    menuButton: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#fff',
        paddingVertical: 15,
        paddingHorizontal: 15,
        borderRadius: 8,
        marginHorizontal: 15,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 1.5,
        elevation: 2,
    },
    menuButtonText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#333',
    },
    viewAllButton: {
        marginTop: 10,
        paddingVertical: 10,
        alignItems: 'center',
        backgroundColor: '#f0f0f0',
        borderRadius: 5,
        marginHorizontal: 5,
    },
    viewAllButtonText: {
        color: '#007bff',
        fontSize: 15,
        fontWeight: '600',
    },
    noDataText: {
        fontSize: 14,
        color: '#777',
        textAlign: 'center',
        paddingVertical: 10,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 20, // Added padding for loading/error states
    },
    loadingText: {
        marginTop: 10,
        fontSize: 14,
        color: '#555',
    },
    errorText: {
        color: 'red',
        fontSize: 14,
        textAlign: 'center',
        padding: 10,
    },
    contentWrapper: {
        // Generic wrapper for content within sections or modals
        marginBottom: 10, // Add some space below the content block
    },
    captionInput: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        padding: 10,
        marginBottom: 15,
        minHeight: 80,
        textAlignVertical: 'top',
        backgroundColor: '#fff', // Added background color for input
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
});

// Styles for the modal components (non-full screen)
export const modalStyles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)', // Semi-transparent black overlay
        justifyContent: 'center', // Center modal vertically
        alignItems: 'center', // Center modal horizontally
    },
    modalContentContainer: {
        width: '90%', // Modal width (adjust as needed)
        maxHeight: '80%', // Modal max height (adjust as needed)
        backgroundColor: '#f8f8f8', // Modal background color
        borderRadius: 10, // Rounded corners for the modal
        overflow: 'hidden', // Clip content to border radius
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    closeButton: {
        padding: 5,
    },
    closeButtonText: {
        fontSize: 16,
        color: '#007bff',
    },
    modalScrollView: {
        flex: 1,
        paddingHorizontal: 10, // Add horizontal padding to the scroll view content
        paddingVertical: 10,
    },
    segmentControl: {
        flexDirection: 'row',
        backgroundColor: '#e0e0e0',
        borderRadius: 8,
        marginHorizontal: 15,
        marginVertical: 10,
        overflow: 'hidden', // Ensures rounded corners on active segment
    },
    segmentButton: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    segmentButtonActive: {
        backgroundColor: '#007bff',
    },
    segmentText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#555',
    },
    segmentTextActive: {
        color: '#fff',
    },
});
