import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Modal, TextInput, TouchableOpacity, FlatList, ActivityIndicator, Alert, Image, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTeamStore } from '../../store/teamStore';
import { useUserStore, SearchableUser } from '../../store/userStore'; // Import SearchableUser from userStore
import { X, Search, UserPlus, CheckCircle, UserCircle2 } from 'lucide-react-native';

interface AddMemberModalProps {
  isVisible: boolean;
  onClose: () => void;
  teamId: string;
  currentMembers: string[]; 
}

const AddMemberModal: React.FC<AddMemberModalProps> = ({ isVisible, onClose, teamId, currentMembers }) => {
  const { addTeamMember, loadingTeamDetails } = useTeamStore();
  const { authUser, searchUsers, searchedUsers, loadingSearch } = useUserStore(); 

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  useEffect(() => {
    if (!isVisible) {
      setSearchQuery('');
      useUserStore.setState({ searchedUsers: [] }); 
    }
  }, [isVisible]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 500); 

    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery]);

  useEffect(() => {
    if (debouncedQuery.trim()) {
      searchUsers(debouncedQuery.trim());
    } else {
      useUserStore.setState({ searchedUsers: [] });
    }
  }, [debouncedQuery, searchUsers]);


  const handleAddMemberToList = async (userIdToAdd: string) => {
    if (currentMembers.includes(userIdToAdd)) {
      Alert.alert('Already Member', 'This user is already a member of the team.');
      return;
    }
    const result = await addTeamMember(teamId, userIdToAdd, 'member'); 
    if (result) {
      Alert.alert('Success', 'Member added successfully!');
      onClose(); 
    } else {
      Alert.alert('Error', useTeamStore.getState().error || 'Failed to add member.');
    }
  };

  const renderUserItem = ({ item }: { item: SearchableUser }) => {
    const isAlreadyMember = currentMembers.includes(item.id);
    const isSelf = item.id === authUser?.id;

    if (isSelf) return null;

    return (
      <View className="flex-row items-center justify-between p-3 border-b border-gray-100" key={item.id}>
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
            {/* Removed item.email display as it's not in the refined SearchableUser type by default */}
          </View>
        </View>
        {isAlreadyMember ? (
            <View className="flex-row items-center py-2 px-3 bg-green-50 rounded-md space-x-1.5">
                <CheckCircle size={16} className="text-green-600" />
                <Text className="text-green-600 text-xs font-medium">Member</Text>
            </View>
        ) : (
            <TouchableOpacity
              onPress={() => handleAddMemberToList(item.id)}
              disabled={loadingTeamDetails}
              className={`py-2 px-3.5 rounded-md ${loadingTeamDetails ? 'bg-gray-300' : 'bg-sky-500 active:bg-sky-600'}`}
            >
              {loadingTeamDetails ? 
                <ActivityIndicator size="small" color="white" /> : 
                <Text className="text-white text-xs font-semibold">Add to Team</Text>
              }
            </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderEmptyState = () => {
    if (loadingSearch) {
      return <ActivityIndicator className="my-6" color="#007AFF" />;
    }
    if (debouncedQuery.trim() && searchedUsers.length === 0) {
      return <Text className="text-center text-gray-500 my-6 px-4">No users found matching "{debouncedQuery}".</Text>;
    }
    if (!debouncedQuery.trim()) {
        return (
            <View className="items-center my-6 p-4">
                 <Search size={32} className="text-gray-300 mb-3"/>
                 <Text className="text-center text-gray-500">
                    Start typing to search for users by display name.
                 </Text>
            </View>
        );
    }
    return null;
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <SafeAreaView className="flex-1 justify-center items-center bg-black/60 p-4" edges={['top', 'bottom']}>
        <View className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[85vh] flex flex-col">
          <View className="flex-row justify-between items-center p-4 border-b border-gray-200">
            <Text className="text-xl font-bold text-gray-800">Add New Member</Text>
            <TouchableOpacity onPress={onClose} className="p-1 active:bg-gray-100 rounded-full">
              <X size={24} className="text-gray-500" />
            </TouchableOpacity>
          </View>

          <View className="p-4">
            <View className="flex-row items-center border border-gray-300 rounded-lg p-0.5 bg-gray-50 focus-within:border-sky-500">
              <View className="pl-2.5 pr-1.5">
                <Search size={20} className="text-gray-400" />
              </View>
              <TextInput
                placeholder="Search by display name..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                className="flex-1 text-base h-11 text-gray-800 py-2"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>
          
          <FlatList
            data={searchedUsers}
            keyExtractor={(item) => item.id}
            renderItem={renderUserItem}
            ListEmptyComponent={renderEmptyState}
            className="flex-1" 
            contentContainerClassName="pb-4"
            keyboardShouldPersistTaps="handled"
          />
        </View>
      </SafeAreaView>
    </Modal>
  );
};

export default AddMemberModal;