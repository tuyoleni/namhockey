// src/components/teams/AddMemberModal.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Modal, TextInput, TouchableOpacity, FlatList, ActivityIndicator, Alert, Image } from 'react-native';
import { useTeamStore } from '../../store/teamStore';
import { useUserStore, Profile } from '../../store/userStore'; // For searching users
import { X, Search, UserPlus, CheckCircle } from 'lucide-react-native'; // Changed import

interface AddMemberModalProps {
  isVisible: boolean;
  onClose: () => void;
  teamId: string;
  currentMembers: string[]; // Array of user_ids already in the team
}

// Changed to pick only known Profile fields and add email separately
type SearchableUser = Pick<Profile, 'id' | 'display_name' | 'username' | 'profile_picture'> & {
  email?: string | null; // email is now optional and explicitly typed here
};


const AddMemberModal: React.FC<AddMemberModalProps> = ({ isVisible, onClose, teamId, currentMembers }) => {
  const { addTeamMember, loadingTeamDetails } = useTeamStore(); // loadingTeamDetails can be generic loading state
  const { fetchUser, profile: currentUserProfile, authUser } = useUserStore(); // Use `profile` if it contains a list of all users, or implement search

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchableUser[]>([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [allUsers, setAllUsers] = useState<SearchableUser[]>([]); // Placeholder for all users


  // THIS IS A PLACEHOLDER/SIMPLIFIED SEARCH.
  // In a real app, you'd ideally have a backend endpoint to search users
  // or fetch all users if the number is small and filter client-side.
  // For now, we'll simulate fetching a few users or filtering a static list.
  useEffect(() => {
    const loadAllUsers = async () => {
        // This is a simplified approach. Ideally, your `userStore` or a dedicated service
        // would provide a way to search users by query (displayName, email).
        // For this example, let's assume you might fetch a list of users
        // (not scalable for many users) or you have a specific search function.

        // If you had a userStore.searchUsers(query) function:
        // const users = await userStore.searchUsers(''); // Fetch some initial users or all
        // setAllUsers(users as SearchableUser[]);

        // --- SIMULATED USER FETCH ---
        // Replace this with actual user fetching/searching logic
        setLoadingSearch(true);
        // Simulate fetching a few users. You'd replace this with a call to your userStore.
        // For example, if userStore had a `WorkspaceAllUsers` (not scalable for large DBs):
        // const { data: usersData, error } = await supabase.from('profiles').select('id, display_name, username, profile_picture, email');
        // if (usersData) setAllUsers(usersData as SearchableUser[]);
        // else console.error("Failed to fetch users for search", error)
        // For demonstration, using a timeout and dummy data:
        setTimeout(() => {
             const dummyUsers: SearchableUser[] = [
                // You would fetch these from Supabase profiles table
                // { id: 'user1-uuid', display_name: 'Alice Wonderland', username: 'alice', profile_picture: null, email: 'alice@example.com' },
                // { id: 'user2-uuid', display_name: 'Bob The Builder', username: 'bob', profile_picture: null, email: 'bob@example.com' },
                // { id: 'user3-uuid', display_name: 'Charlie Chaplin', username: 'charlie', profile_picture: null, email: 'charlie@example.com'},
            ];
            // If you had current user from authUser, you might fetch their profile details
            // to make it available for search or pre-populate allUsers
            // For now, ensure allUsers is an empty array or populated appropriately.
            // If you have a fetchAllUsers method in your userStore:
            // const users = await userStore.fetchAllUsers(); setAllUsers(users);
            setAllUsers([]); // Start with empty or fetch appropriately
            setLoadingSearch(false);
        }, 500);
        // --- END SIMULATION ---
    };
    if (isVisible) {
        loadAllUsers();
    }
  }, [isVisible]);


  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    setLoadingSearch(true);
    const lowerCaseQuery = query.toLowerCase();
    const filteredUsers = allUsers.filter(user => {
      const displayNameMatch = user.display_name && typeof user.display_name === 'string' && user.display_name.toLowerCase().includes(lowerCaseQuery);
      const usernameMatch = user.username && typeof user.username === 'string' && user.username.toLowerCase().includes(lowerCaseQuery);
      const emailMatch = user.email && typeof user.email === 'string' && user.email.toLowerCase().includes(lowerCaseQuery);
      
      return (displayNameMatch || usernameMatch || emailMatch) &&
             user.id !== authUser?.id;
    });
    setSearchResults(filteredUsers);
    setLoadingSearch(false);
  }, [allUsers, authUser]);


  const handleAddMember = async (userId: string) => {
    if (currentMembers.includes(userId)) {
      Alert.alert('Already Member', 'This user is already a member of the team.');
      return;
    }
    const result = await addTeamMember(teamId, userId, 'member'); // Default role 'member'
    if (result) {
      Alert.alert('Success', 'Member added successfully!');
      // Optionally, update searchResults or clear them
      setSearchResults(prevResults => prevResults.filter(user => user.id !== userId));
      // Consider closing modal or allowing more additions
    } else {
      Alert.alert('Error', 'Failed to add member.');
    }
  };

  const renderUserItem = ({ item }: { item: SearchableUser }) => {
    const isAlreadyMember = currentMembers.includes(item.id);
    const isSelf = item.id === authUser?.id; // Prevent adding self again if somehow shown

    if (isSelf) return null; // Don't show current user in results to be added

    return (
      <View className="flex-row items-center justify-between p-3 border-b border-gray-200">
        <View className="flex-row items-center flex-1 mr-2">
          {item.profile_picture ? (
            <Image source={{ uri: item.profile_picture }} className="w-10 h-10 rounded-full mr-3 bg-gray-200" />
          ) : (
            <View className="w-10 h-10 rounded-full mr-3 bg-gray-300 justify-center items-center">
                <UserPlus size={20} color="gray" /> {/* Changed Icon */}
            </View>
          )}
          <View className="flex-1">
            <Text className="text-base font-medium text-gray-800" numberOfLines={1}>{item.display_name || item.username || ''}</Text>
            {/* Ensure item.email is a string or empty string for Text component */}
            <Text className="text-sm text-gray-500" numberOfLines={1}>{(item.email && typeof item.email === 'string') ? item.email : ''}</Text>
          </View>
        </View>
        {isAlreadyMember ? (
            <View className="flex-row items-center p-2 bg-green-100 rounded-md">
                <CheckCircle size={18} color="green" /> {/* Changed Icon */}
                <Text className="text-green-700 text-xs ml-1">Member</Text>
            </View>
        ) : (
            <TouchableOpacity
            onPress={() => handleAddMember(item.id)}
            disabled={loadingTeamDetails}
            className={`py-2 px-3 rounded-md ${loadingTeamDetails ? 'bg-gray-300' : 'bg-blue-500'}`}
            >
            {loadingTeamDetails ? <ActivityIndicator size="small" color="white" /> : <Text className="text-white text-xs font-semibold">Add</Text>}
            </TouchableOpacity>
        )}
      </View>
    );
  };


  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-center items-center bg-black/50 p-4">
        <View className="bg-white p-5 rounded-xl shadow-xl w-full max-w-lg max-h-[80vh]">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-xl font-bold text-gray-800">Add New Member</Text>
            <TouchableOpacity onPress={onClose} className="p-1">
              <X size={28} color="gray" /> {/* Changed Icon */}
            </TouchableOpacity>
          </View>

          <View className="flex-row items-center border border-gray-300 rounded-lg p-2 mb-4">
            <Search size={20} color="gray" className="mr-2" /> {/* Changed Icon */}
            <TextInput
              placeholder="Search by name, username, or email..."
              value={searchQuery}
              onChangeText={handleSearch}
              className="flex-1 text-base h-10"
              autoCapitalize="none"
            />
          </View>

          {loadingSearch && <ActivityIndicator className="my-4" />}

          {!loadingSearch && searchQuery.trim() && searchResults.length === 0 && (
            <Text className="text-center text-gray-500 my-4">No users found matching "{searchQuery}".</Text>
          )}
          {!loadingSearch && allUsers.length === 0 && !searchQuery.trim() && (
            <Text className="text-center text-gray-500 my-4">
                Start typing to search for users.
                {/* (Note: User search currently uses placeholder data or requires a full user list. Implement backend search for production.) */}
            </Text>
          )}

          <FlatList
            data={searchResults}
            keyExtractor={(item) => item.id}
            renderItem={renderUserItem}
            ListEmptyComponent={
                !loadingSearch && searchQuery.trim() ? (
                    <Text className="text-center text-gray-500 py-4">No users found.</Text>
                ) : null
            }
          />
        </View>
      </View>
    </Modal>
  );
};

export default AddMemberModal;