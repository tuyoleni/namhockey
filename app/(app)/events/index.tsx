import AddEventForm from '@components/events/AddEventForm';
import EventList from '@components/events/EventList';
import RegistrationList from '@components/events/RegistrationList';
import UpdateEventForm from '@components/events/UpdateEventForm';
import { PlusCircle } from 'lucide-react-native';
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  Button,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EventWithTeams, useEventStore } from 'store/eventStore';
import { useUserStore } from 'store/userStore';
import { useNavigation } from 'expo-router';

const EventScreen: React.FC = () => {
  const navigation = useNavigation();

  const [isAddModalVisible, setAddModalVisible] = useState(false);
  const [isUpdateModalVisible, setUpdateModalVisible] = useState(false);
  const [selectedEventToUpdate, setSelectedEventToUpdate] = useState<EventWithTeams | null>(null);
  const [isRegistrationsModalVisible, setRegistrationsModalVisible] = useState(false);
  const [selectedEventIdForRegistrations, setSelectedEventIdForRegistrations] = useState<string | null>(null);
  const [isRegisterTeamModalVisible, setRegisterTeamModalVisible] = useState(false);
  const [selectedEventIdForRegistration, setSelectedEventIdForRegistration] = useState<string | null>(null);

  const { deleteEvent, error: eventError } = useEventStore();
  const { authUser, fetchAuthUser, loading: loadingUser, error: userError } = useUserStore();

  useEffect(() => {
    fetchAuthUser();
  }, [fetchAuthUser]);

  const handleAddPress = useCallback(() => {
    if (authUser) {
       setAddModalVisible(true);
    } else {
       Alert.alert('Authentication Required', 'Please log in to add events.');
    }
  }, [authUser]);

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={handleAddPress} className="mr-4" disabled={!authUser}>
          <PlusCircle size={30} color={authUser ? "#007AFF" : "#D1D5DB"} />
        </TouchableOpacity>
      ),
    });
  }, [navigation, authUser, handleAddPress]);

  const handleAddSuccess = () => {
    setAddModalVisible(false);
  };

  const handleUpdatePress = (event: EventWithTeams) => {
    setSelectedEventToUpdate(event);
    setUpdateModalVisible(true);
  };

  const handleUpdateSuccess = () => {
    setUpdateModalVisible(false);
    setSelectedEventToUpdate(null);
  };

  const handleDeleteEvent = (eventId: string) => {
    Alert.alert(
      'Confirm Deletion',
      'Are you sure you want to delete this event?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteEvent(eventId);
             if (eventError) {
                 Alert.alert('Error', eventError || 'Failed to delete event.');
             }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const handleViewRegistrationsPress = (eventId: string) => {
    setSelectedEventIdForRegistrations(eventId);
    setRegistrationsModalVisible(true);
  };

  const handleRegisterTeamPress = (eventId: string) => {
     if (authUser) {
        setSelectedEventIdForRegistration(eventId);
        setRegisterTeamModalVisible(true);
     } else {
        Alert.alert('Authentication Required', 'Please log in to register a team.');
     }
  };

   const handleRegisterTeamSuccess = () => {
     setRegisterTeamModalVisible(false);
     setSelectedEventIdForRegistration(null);
   };

   if (loadingUser) {
       return (
           <View className="flex-1 justify-center items-center bg-gray-100">
               <ActivityIndicator size="large" color="#007AFF"/>
           </View>
       );
   }

   if (userError) {
       return (
           <View className="flex-1 justify-center items-center bg-gray-100 p-5">
               <Text className="text-red-600 text-base text-center">Error loading user: {userError}</Text>
           </View>
       );
   }

    if (!authUser) {
        return (
            <SafeAreaView className="flex-1 justify-center items-center bg-gray-100 p-5">
                <Text className="text-gray-700 text-base text-center">Please log in to view and manage events.</Text>
            </SafeAreaView>
        );
    }

  return (
        <SafeAreaView className="flex-1 bg-gray-100">
          <EventList
            onUpdateEvent={handleUpdatePress}
            onDeleteEvent={handleDeleteEvent}
            onViewRegistrations={handleViewRegistrationsPress}
          />

          <Modal
            visible={isAddModalVisible}
            animationType="slide"
            onRequestClose={() => setAddModalVisible(false)}
          >
             <SafeAreaView className="flex-1 pt-5 px-5 bg-white">
                 {authUser && ( 
                     <AddEventForm
                       onSuccess={handleAddSuccess}
                       currentUserId={authUser.id}
                       onCancel={() => setAddModalVisible(false)}
                     />
                  )}
             </SafeAreaView>
          </Modal>

          <Modal
            visible={isUpdateModalVisible}
            animationType="slide"
            onRequestClose={() => setUpdateModalVisible(false)}
          >
             <SafeAreaView className="flex-1 pt-5 px-5 bg-white">
                {selectedEventToUpdate && (
                  <UpdateEventForm event={selectedEventToUpdate} onSuccess={handleUpdateSuccess} onCancel={() => setUpdateModalVisible(false)} />
                )}
             </SafeAreaView>
          </Modal>

          <Modal
            visible={isRegistrationsModalVisible}
            animationType="slide"
            onRequestClose={() => setRegistrationsModalVisible(false)}
          >
             <SafeAreaView className="flex-1 pt-5 bg-white">
                <View className="px-5">
                    <Text className="text-xl font-bold mb-5 text-center">Registrations</Text>
                </View>
                {selectedEventIdForRegistrations && (
                  <>
                    <RegistrationList eventId={selectedEventIdForRegistrations} />
                    <View className="p-5">
                         <Button
                            title="Register Another Team"
                            onPress={() => {
                                setRegistrationsModalVisible(false); 
                                handleRegisterTeamPress(selectedEventIdForRegistrations!);
                            }}
                            disabled={!authUser}
                            color="#007AFF"
                         />
                    </View>
                  </>
                )}
                <View className="p-5">
                    <Button title="Close" onPress={() => setRegistrationsModalVisible(false)} color="#8E8E93"/>
                </View>
             </SafeAreaView>
          </Modal>

           <Modal
            visible={isRegisterTeamModalVisible}
            animationType="slide"
            transparent={true}
            onRequestClose={() => setRegisterTeamModalVisible(false)}
          >
             <View className="flex-1 justify-center items-center bg-black/50 p-5">
                <View className="bg-white rounded-lg p-5 w-full max-w-md">
                    <Text className="text-lg font-bold mb-5 text-center">Register Team</Text>
                    <Button title="Close" onPress={() => setRegisterTeamModalVisible(false)} color="#8E8E93"/>
                </View>
             </View>
          </Modal>
        </SafeAreaView>
  );
};

export default EventScreen;