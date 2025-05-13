import React, { useState } from 'react';
import { View, Text, StyleSheet, Button, Modal, TouchableOpacity } from 'react-native';

import { PlusCircle } from 'lucide-react-native';
import AddEventForm from '@components/events/AddEventForm';
import EventList from '@components/events/EventList';
import RegisterTeamForm from '@components/events/RegisterTeamForm';
import RegistrationList from '@components/events/RegistrationList';
import UpdateEventForm from '@components/events/UpdateEventForm';
import { EventWithTeams } from 'store/eventStore';

const EventScreen: React.FC = () => {
  const [isAddModalVisible, setAddModalVisible] = useState(false);
  const [isUpdateModalVisible, setUpdateModalVisible] = useState(false);
  const [selectedEventToUpdate, setSelectedEventToUpdate] = useState<EventWithTeams | null>(null);
  const [isRegistrationsModalVisible, setRegistrationsModalVisible] = useState(false);
  const [selectedEventIdForRegistrations, setSelectedEventIdForRegistrations] = useState<string | null>(null);
  const [isRegisterTeamModalVisible, setRegisterTeamModalVisible] = useState(false);
  const [selectedEventIdForRegistration, setSelectedEventIdForRegistration] = useState<string | null>(null);


  const handleAddPress = () => {
    setAddModalVisible(true);
  };

  const handleAddSuccess = () => {
    setAddModalVisible(false);
    // EventList will automatically update due to subscription
  };

  const handleUpdatePress = (event: EventWithTeams) => {
    setSelectedEventToUpdate(event);
    setUpdateModalVisible(true);
  };

  const handleUpdateSuccess = () => {
    setUpdateModalVisible(false);
    setSelectedEventToUpdate(null);
    // EventList will automatically update due to subscription
  };

  const handleDeleteEvent = (eventId: string) => {
    // The DeleteEventButton component handles the actual deletion and confirmation
    // The EventList will update automatically via subscription
  };

  const handleViewRegistrationsPress = (eventId: string) => {
    setSelectedEventIdForRegistrations(eventId);
    setRegistrationsModalVisible(true);
  };

  const handleRegisterTeamPress = (eventId: string) => {
    setSelectedEventIdForRegistration(eventId);
    setRegisterTeamModalVisible(true);
  };

   const handleRegisterTeamSuccess = () => {
     setRegisterTeamModalVisible(false);
     setSelectedEventIdForRegistration(null);
     // RegistrationList will update automatically via subscription
   }


  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.heading}>Events</Text>
        <TouchableOpacity onPress={handleAddPress} style={styles.addButton}>
           <PlusCircle size={30} color="#007bff" />
        </TouchableOpacity>
      </View>


      {/* Event List */}
      <EventList
        onUpdateEvent={handleUpdatePress}
        onDeleteEvent={handleDeleteEvent} // Pass the handler to the list/item
        onViewRegistrations={handleViewRegistrationsPress}
        // onEventPress could navigate to a detail screen if needed
      />

      {/* Add Event Modal */}
      <Modal
        visible={isAddModalVisible}
        animationType="slide"
        onRequestClose={() => setAddModalVisible(false)}
      >
        <View style={styles.modalContainer}>
           <AddEventForm onSuccess={handleAddSuccess} onCancel={() => setAddModalVisible(false)} />
        </View>
      </Modal>

      {/* Update Event Modal */}
      <Modal
        visible={isUpdateModalVisible}
        animationType="slide"
        onRequestClose={() => setUpdateModalVisible(false)}
      >
         <View style={styles.modalContainer}>
            {selectedEventToUpdate && (
              <UpdateEventForm event={selectedEventToUpdate} onSuccess={handleUpdateSuccess} onCancel={() => setUpdateModalVisible(false)} />
            )}
         </View>
      </Modal>

       {/* View Registrations Modal */}
      <Modal
        visible={isRegistrationsModalVisible}
        animationType="slide"
        onRequestClose={() => setRegistrationsModalVisible(false)}
      >
         <View style={styles.modalContainer}>
            <Text style={styles.modalHeading}>Registrations</Text>
            {selectedEventIdForRegistrations && (
              <>
                <RegistrationList eventId={selectedEventIdForRegistrations} />
                 <Button title="Register Team" onPress={() => handleRegisterTeamPress(selectedEventIdForRegistrations)} />
              </>
            )}
            <Button title="Close" onPress={() => setRegistrationsModalVisible(false)} />
         </View>
      </Modal>

       {/* Register Team Modal */}
       <Modal
        visible={isRegisterTeamModalVisible}
        animationType="slide"
        onRequestClose={() => setRegisterTeamModalVisible(false)}
      >
         <View style={styles.modalContainer}>
            {selectedEventIdForRegistration && (
               <RegisterTeamForm eventId={selectedEventIdForRegistration} onSuccess={handleRegisterTeamSuccess} onCancel={() => setRegisterTeamModalVisible(false)} />
            )}
         </View>
      </Modal>


    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
    paddingTop: 20, // Add some padding at the top
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  heading: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  addButton: {
    padding: 5,
  },
  modalContainer: {
    flex: 1,
    paddingTop: 50, // Adjust as needed for status bar
    paddingHorizontal: 20,
    backgroundColor: '#fff',
  },
  modalHeading: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
});

export default EventScreen;
