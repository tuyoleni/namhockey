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

import { PlusCircle } from 'lucide-react-native';
import { useUserStore } from 'store/userStore';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import AddEventForm from '@components/events/AddEventForm';
import EventList from '@components/events/EventList';
import RegisterTeamForm from '@components/events/RegisterTeamForm';
import RegistrationList from '@components/events/RegistrationList';
import UpdateEventForm from '@components/events/UpdateEventForm';
import { EventWithTeams, useEventStore } from 'store/eventStore';


const EventScreen: React.FC = () => {
  const [isUpdateModalVisible, setUpdateModalVisible] = useState(false);
  const [selectedEventToUpdate, setSelectedEventToUpdate] = useState<EventWithTeams | null>(null);
  const [isRegistrationsModalVisible, setRegistrationsModalVisible] = useState(false);
  const [selectedEventIdForRegistrations, setSelectedEventIdForRegistrations] = useState<string | null>(null);
  const [isRegisterTeamModalVisible, setRegisterTeamModalVisible] = useState(false);
  const [selectedEventIdForRegistration, setSelectedEventIdForRegistration] = useState<string | null>(null);

  const addEventBottomSheetModalRef = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ['25%', '50%', '90%'], []);

  const { deleteEvent, loadingEvents, error: eventError } = useEventStore();
  const { authUser, fetchAuthUser, loading: loadingUser, error: userError } = useUserStore();

  useEffect(() => {
    fetchAuthUser();
  }, [fetchAuthUser]);

  const handlePresentAddEventBottomSheet = useCallback(() => {
     if (authUser) {
        addEventBottomSheetModalRef.current?.present();
     } else {
        Alert.alert('Authentication Required', 'Please log in to add events.');
     }
  }, [authUser]);

   const handleAddEventBottomSheetDismiss = useCallback(() => {
       // Optional: Any logic needed when the bottom sheet is dismissed
   }, []);


  const handleAddSuccess = () => {
    addEventBottomSheetModalRef.current?.dismiss();
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
               <ActivityIndicator size="large" color="#007bff" />
               <Text className="mt-2 text-gray-700">Loading user data...</Text>
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
        <View className="flex-1 bg-gray-100 pt-5">
          <View className="flex-row justify-between items-center px-4 mb-3">
            <Text className="text-2xl font-bold text-black">Events</Text>
            <TouchableOpacity onPress={handlePresentAddEventBottomSheet} className="p-1" disabled={!authUser}>
               <PlusCircle size={30} color={authUser ? "#007bff" : "#ccc"} />
            </TouchableOpacity>
          </View>

          <EventList
            onUpdateEvent={handleUpdatePress}
            onDeleteEvent={handleDeleteEvent}
            onViewRegistrations={handleViewRegistrationsPress}
          />

          <BottomSheetModal
            ref={addEventBottomSheetModalRef}
            index={1}
            snapPoints={snapPoints}
            onDismiss={handleAddEventBottomSheetDismiss}
          >
             {authUser && (
                 <AddEventForm
                   onSuccess={handleAddSuccess}
                   currentUserId={authUser.id}
                 />
              )}
          </BottomSheetModal>


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
                        // Use non-null assertion here as the parent conditional guarantees it's not null
                        onPress={() => handleRegisterTeamPress(selectedEventIdForRegistration!)}
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