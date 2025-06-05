import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TextInput, TouchableOpacity, FlatList, ActivityIndicator, Alert, Image, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUserStore, SearchableUser } from '../../store/userStore'; // Adjust path as needed
import { X, Search, UserCircle2 } from 'lucide-react-native';
import { useTeamStore } from 'store/teamStore';

interface AddMemberModalProps {
  isVisible: boolean;
  onClose: () => void;
  teamId: string;
  currentMembersUserIds?: string[]; // Make prop optional to allow default
}

const AddMemberModal: React.FC<AddMemberModalProps> = ({
  isVisible,
  onClose,
  teamId,
  currentMembersUserIds = [], // Provide a default empty array
}) => {
  const { addTeamMember, loadingTeamDetails: teamStoreLoading } = useTeamStore();
  const { authUser, searchUsers, searchedUsers, loadingSearch: userStoreLoadingSearch } = useUserStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  useEffect(() => {
    if (!isVisible) {
      console.log("[AddMemberModal] Modal closed. Resetting search query and results.");
      setSearchQuery('');
      setDebouncedQuery(''); // Also clear debounced query to stop any pending search
      useUserStore.setState({ searchedUsers: [], loadingSearch: false });
    }
  }, [isVisible]);

  // Debounce effect for search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300); // Debounce time

    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery]);

  // Effect to call searchUsers when debouncedQuery changes
  useEffect(() => {
    const trimmedQuery = debouncedQuery.trim();
    if (trimmedQuery.length > 0) {
      console.log(`[AddMemberModal] Debounced search: Calling searchUsers with query: "${trimmedQuery}"`);
      searchUsers(trimmedQuery);
    } else {
   console.log("[AddMemberModal] Debounced query is empty. Clearing search results in store.");
      useUserStore.setState({ searchedUsers: [], loadingSearch: false });
    }
  }, [debouncedQuery, searchUsers]); // searchUsers from Zustand is stable


  const handleAddMember = async (userIdToAdd: string) => {
    if (currentMembersUserIds.includes(userIdToAdd)) {
      Alert.alert('Already Member', 'This user is already a member of the team.');
      return;
    }
    const success = await addTeamMember(teamId, userIdToAdd, 'member');
    if (success) {
      Alert.alert('Success', 'Member added successfully!');
      onClose(); // Close modal after successful addition
    } else {
      Alert.alert('Error', useTeamStore.getState().error || 'Failed to add member. Please try again.');
    }
  };

  const renderUserItem = ({ item }: { item: SearchableUser }) => {
    const isAlreadyMember = currentMembersUserIds.includes(item.id);
    const isSelf = item.id === authUser?.id;

    if (isSelf) return null; // Don't list the current user as an option to add

    return (
      <View className="flex-row items-center justify-between p-3 border-b border-gray-100 mx-1">
        <View className="flex-row items-center flex-1 mr-2 space-x-3">
          {item.profile_picture ? (
            <Image source={{ uri: item.profile_picture }} className="w-10 h-10 rounded-full bg-gray-200" />
          ) : (
            <View className="w-10 h-10 rounded-full bg-gray-200 justify-center items-center">
                <UserCircle2 size={24} className="text-gray-400" />
            </View>
          )}
          <View className="flex-1">
            <Text className="text-base font-medium text-gray-800" numberOfLines={1}>{item.display_name || 'User'}</Text>
          </View>
        </View>
        {isAlreadyMember ? (
            <View className="py-2 px-3">
                <Text className="text-green-600 text-xs font-medium">Member</Text>
            </View>
        ) : (
            <TouchableOpacity
              onPress={() => handleAddMember(item.id)}
              disabled={teamStoreLoading} // Disable button while addMember is in progress
              className={`py-2 px-3.5 rounded-md ${teamStoreLoading ? 'bg-gray-300' : 'bg-sky-500 active:bg-sky-600'}`}
            >
              {teamStoreLoading ?
                <ActivityIndicator size="small" color="#FFFFFF" /> :
                <Text className="text-white text-xs font-semibold">Add</Text>
              }
            </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderEmptyState = () => {
    if (userStoreLoadingSearch) { // Show loading indicator if a search is in progress
      return <ActivityIndicator className="my-8" color="#007AFF" />;
    }
    const trimmedQuery = debouncedQuery.trim();
    if (trimmedQuery.length > 0 && searchedUsers.length === 0) { // Searched but no results
      return <Text className="text-center text-gray-500 my-8 px-4">No users found matching "{trimmedQuery}".</Text>;
    }
    if (trimmedQuery.length === 0 && !userStoreLoadingSearch) { // Initial state, no query, not loading
        return (
            <View className="items-center my-8 p-4">
                 <Search size={32} className="text-gray-300 mb-3"/>
                 <Text className="text-center text-gray-500">
                    Search for users by their display name to add them to the team.
                 </Text>
            </View>
        );
    }
    return null; // Should not be reached if other conditions cover all cases
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingView}
        // keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0} // Adjust if needed
      >
        <SafeAreaView className="flex-1 justify-end bg-black/50" edges={['bottom']}>
          {/* The content that should avoid the keyboard */}
          <View className="bg-white rounded-t-xl shadow-xl w-full max-h-[75vh] flex flex-col">
            {/* Header */}
            <View className="flex-row justify-between items-center p-4 border-b border-gray-200">
              <Text className="text-lg font-semibold text-gray-800">Add New Member</Text>
              <TouchableOpacity onPress={onClose} className="p-1 active:bg-gray-100 rounded-full">
                <X size={22} className="text-gray-600" />
              </TouchableOpacity>
            </View>

            {/* Search Input */}
            <View className="p-4">
              <View className="flex-row items-center border border-gray-300 rounded-lg p-0.5 bg-gray-50 focus-within:border-sky-500">
                <View className="pl-2.5 pr-1.5">
                  <Search size={18} className="text-gray-400" />
                </View>
                <TextInput
                  placeholder="Search by display name..."
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  className="flex-1 text-base h-10 text-gray-800 py-1.5"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            {/* User List */}
            <FlatList
              data={searchedUsers}
              keyExtractor={(item) => item.id}
              renderItem={renderUserItem}
              ListEmptyComponent={renderEmptyState}
              className="flex-1" // Allows list to take available space
              contentContainerClassName="pb-4"
              keyboardShouldPersistTaps="handled"
            />
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1, // Important for KeyboardAvoidingView to work correctly within the modal
  },
});

export default AddMemberModal;
