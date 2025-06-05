import React, { useEffect } from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity, Image } from 'react-native';
import { useEventStore } from 'store/eventStore';
import { useUserStore } from 'store/userStore'; // To get currentUserId
import { Tables } from 'database.types';
import { AlertTriangleIcon, ListXIcon, XCircleIcon } from 'lucide-react-native';

export type EventRegistrationRowWithTeam = Tables<'event_registrations'> & {
  teams?: {
    id: string;
    name: string;
    logo_url?: string | null;
    manager_id?: string | null; // Ensure manager_id is part of the fetched team data
  } | null;
};

interface RegistrationItemProps {
  registration: EventRegistrationRowWithTeam;
  onUnregister: (registrationId: string) => void;
  currentUserId: string | null;
}

const RegistrationItem: React.FC<RegistrationItemProps> = ({ registration, onUnregister, currentUserId }) => {
  const teamName = registration.teams?.name || `Team ID: ${registration.team_id.substring(0, 6)}`;
  const teamLogo = registration.teams?.logo_url;
  const teamManagerId = registration.teams?.manager_id;

  const canUnregister = currentUserId === teamManagerId; // User can unregister if they are the team manager

  const registrationDate = registration.registration_date
    ? new Date(registration.registration_date).toLocaleDateString()
    : 'N/A';

  return (
    <View className="flex-row items-center justify-between bg-white p-4 border-b border-gray-200">
      <View className="flex-row items-center flex-1 space-x-3 mr-2">
        {teamLogo ? (
          <Image source={{ uri: teamLogo }} className="w-10 h-10 rounded-md bg-gray-200" />
        ) : (
          <View className="w-10 h-10 rounded-md bg-gray-300 items-center justify-center">
            <Text className="text-gray-600 font-semibold">{teamName.charAt(0).toUpperCase()}</Text>
          </View>
        )}
        <View className="flex-1">
          <Text className="text-base font-semibold text-gray-800" numberOfLines={1} ellipsizeMode="tail">{teamName}</Text>
          <Text className="text-xs text-gray-600">Registered: {registrationDate}</Text>
          {registration.status && (
            <Text className="text-xs text-gray-600 italic">Status: {registration.status}</Text>
          )}
        </View>
      </View>

      {canUnregister && onUnregister && ( // Show button only if user is the manager
        <TouchableOpacity
          onPress={() => onUnregister(registration.id)}
          className="bg-red-500 py-1.5 px-3 rounded-md active:bg-red-600 flex-row items-center space-x-1"
        >
          <XCircleIcon size={14} color="white" />
          <Text className="text-white text-xs font-medium">Unregister</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

interface RegistrationListProps {
  eventId: string;
}

const RegistrationList: React.FC<RegistrationListProps> = ({ eventId }) => {
  const {
    registrations,
    loadingRegistrations,
    error,
    fetchRegistrationsByEventId,
    subscribeToEventRegistrations,
    unregisterTeamFromEvent,
  } = useEventStore();

  const { authUser } = useUserStore(); // Get the current authenticated user
  const currentUserId = authUser?.id || null;

  const eventRegistrations = registrations.filter(reg => reg.event_id === eventId);

  useEffect(() => {
    if (!eventId) {
      return;
    }
    fetchRegistrationsByEventId(eventId);
    const unsubscribe = subscribeToEventRegistrations(eventId);
    return () => {
      unsubscribe();
    };
  }, [eventId, fetchRegistrationsByEventId, subscribeToEventRegistrations]);

  const handleUnregister = async (registrationId: string) => {
    await unregisterTeamFromEvent(registrationId);
  };

  if (loadingRegistrations) {
    return (
      <View className="flex-1 justify-center items-center py-8">
        <ActivityIndicator size="large" color="#007AFF" />
        <Text className="mt-3 text-gray-600 text-base">Loading Registrations...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 justify-center items-center py-8 bg-red-50 p-4 rounded-lg mx-4">
        <AlertTriangleIcon size={32} color="#D9534F" className="mb-2"/>
        <Text className="text-red-700 font-semibold text-lg">Error Loading Registrations</Text>
        <Text className="text-red-600 text-center mt-1">{error}</Text>
        <TouchableOpacity
          onPress={() => fetchRegistrationsByEventId(eventId)}
          className="mt-4 bg-red-500 py-2 px-4 rounded-md active:bg-red-600"
        >
          <Text className="text-white font-semibold">Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (eventRegistrations.length === 0) {
    return (
      <View className="flex-1 justify-center items-center py-8 bg-gray-50 p-4 rounded-lg mx-4">
        <ListXIcon size={32} color="#6B7280" className="mb-2"/>
        <Text className="text-gray-700 text-lg">No Registrations Yet</Text>
        <Text className="text-gray-500 text-center mt-1">Be the first to register for this event!</Text>
      </View>
    );
  }

  return (
    <View className="mt-4">
      <Text className="text-xs font-semibold text-gray-500 uppercase px-4 mb-2 tracking-wider">
        Registered Teams ({eventRegistrations.length})
      </Text>
      <View className="bg-white border-y border-gray-200 rounded-lg overflow-hidden mx-2 shadow-sm">
        <FlatList
          data={eventRegistrations}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <RegistrationItem
              registration={item}
              onUnregister={handleUnregister}
              currentUserId={currentUserId} // Pass currentUserId
            />
          )}
          contentContainerStyle={{ paddingBottom: 8 }}
        />
      </View>
    </View>
  );
};

export default React.memo(RegistrationList);
