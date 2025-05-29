import AddEventForm from '@components/events/AddEventForm';
import EventList from '@components/events/EventList';
import RegisterTeamForm from '@components/events/RegisterTeamForm';
import RegistrationList from '@components/events/RegistrationList';
import UpdateEventForm from '@components/events/UpdateEventForm';
import { PlusCircle } from 'lucide-react-native';
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
import { useNavigation } from 'expo-router'; // Import useNavigation




const EventScreen: React.FC = () => {
  const navigation = useNavigation(); // Get navigation object

  const [isAddModalVisible, setAddModalVisible] = useState(false);
  const [isUpdateModalVisible, setUpdateModalVisible] = useState(false);
  const [selectedEventToUpdate, setSelectedEventToUpdate] = useState<EventWithTeams | null>(null);
  const [isRegistrationsModalVisible, setRegistrationsModalVisible] = useState(false);
  const [selectedEventIdForRegistrations, setSelectedEventIdForRegistrations] = useState<string | null>(null);
  const [isRegisterTeamModalVisible, setRegisterTeamModalVisible] = useState(false);
  const [selectedEventIdForRegistration, setSelectedEventIdForRegistration] = useState<string | null>(null);


  const { deleteEvent, loadingEvents, error: eventError } = useEventStore();
  const { authUser, fetchAuthUser, loading: loadingUser, error: userError } = useUserStore();

  useEffect(() => {
    fetchAuthUser();
  }, [fetchAuthUser]);

  const handleAddPress = () => {
    if (authUser) {
       setAddModalVisible(true);
    } else {
       Alert.alert('Authentication Required', 'Please log in to add events.');
    }
  };

  // Effect to set header options
  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={handleAddPress} style={{ marginRight: 15 }} disabled={!authUser}>
          <PlusCircle size={30} color={authUser ? "#007AFF" : "#ccc"} />
        </TouchableOpacity>
      ),
    });
  }, [navigation, authUser, handleAddPress]); // Add dependencies

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
   }

   if (loadingUser) {
       return (
           <View className="flex-1 justify-center items-center bg-gray-100">
               <ActivityIndicator />
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
            <View className="flex-1 justify-center items-center bg-gray-100 p-5">
                <Text className="text-gray-700 text-base text-center">Please log in to view and manage events.</Text>
            </View>
        );
    }


  return (
        <View className="flex-1 bg-gray-100">
          <EventList
            onUpdateEvent={handleUpdatePress}
            onDeleteEvent={handleDeleteEvent}
            onViewRegistrations={handleViewRegistrationsPress}
          />

          <Modal
            visible={isAddModalVisible} // Controlled by state
            animationType="slide"
            onRequestClose={() => setAddModalVisible(false)}
          >
             <View className="flex-1 pt-12 px-5 bg-white">
                 {authUser && ( 
                     <AddEventForm
                       onSuccess={handleAddSuccess}
                       currentUserId={authUser.id}
                       onCancel={() => setAddModalVisible(false)}
                     />
                  )}
             </View>
          </Modal>


          <Modal
            visible={isUpdateModalVisible}
            animationType="slide"
            onRequestClose={() => setUpdateModalVisible(false)}
          >
             <View className="flex-1 pt-12 px-5 bg-white">
                {selectedEventToUpdate && (
                  <UpdateEventForm event={selectedEventToUpdate} onSuccess={handleUpdateSuccess} onCancel={() => setUpdateModalVisible(false)} />
                )}
             </View>
          </Modal>

          <Modal
            visible={isRegistrationsModalVisible}
            animationType="slide"
            onRequestClose={() => setRegistrationsModalVisible(false)}
          >
             <View className="flex-1 pt-12 px-5 bg-white">
                <Text className="text-xl font-bold mb-5 text-center">Registrations</Text>
                {selectedEventIdForRegistrations && (
                  <>
                    <RegistrationList eventId={selectedEventIdForRegistrations} />
                     <Button
                        title="Register Team"
                        onPress={() => handleRegisterTeamPress(selectedEventIdForRegistrations!)}
                        disabled={!authUser}
                     />
                  </>
                )}
                <Button title="Close" onPress={() => setRegistrationsModalVisible(false)} />
             </View>
          </Modal>

           <Modal
            visible={isRegisterTeamModalVisible}
            animationType="slide"
            transparent={true}
            onRequestClose={() => setRegisterTeamModalVisible(false)}
          >
             <View className="flex-1 justify-center items-center bg-black/50">
                <View className="bg-white rounded-lg p-5 w-11/12 max-h-4/5">
                   {selectedEventIdForRegistration && authUser && (
                      <RegisterTeamForm
                         eventId={selectedEventIdForRegistration}
                         onSuccess={handleRegisterTeamSuccess}
                         onCancel={() => setRegisterTeamModalVisible(false)}
                      />
                   )}
                </View>
             </View>
          </Modal>
        </View>
  );
};


export default EventScreen;
