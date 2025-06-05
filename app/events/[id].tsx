import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, ScrollView, ActivityIndicator, Alert, TouchableOpacity, StatusBar, Platform, Image } from 'react-native';
import { useLocalSearchParams, useNavigation, Stack, useRouter } from 'expo-router';
import { useEventStore, EventWithTeams } from 'store/eventStore';
import { useUserStore } from 'store/userStore';
import { useTeamStore, TeamRow } from 'store/teamStore';
import RegistrationList from '@components/events/RegistrationList';
import UpdateEventForm from '@components/events/UpdateEventForm'; 
import { Calendar, MapPin, ChevronRight, Edit3, Trash2, Info } from 'lucide-react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

const EventDetailScreen = () => {
  const { id: eventIdParam } = useLocalSearchParams<{ id: string }>();
  const navigation = useNavigation();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { 
    getEventById, 
    fetchRegistrationsByEventId, 
    registerTeamForEvent, 
    unregisterTeamFromEvent,
    deleteEvent,
    registrations: eventRegistrationsFromStore,
    loadingEvents: isLoadingEventDetails, 
    error: eventStoreError 
  } = useEventStore();

  const { authUser, loading: isLoadingAuthUser } = useUserStore();
  const { userTeams, fetchUserTeams, loadingTeams: isLoadingUserTeams } = useTeamStore();

  const [currentEvent, setCurrentEvent] = useState<EventWithTeams | null>(null);
  const [currentEventRegistrations, setCurrentEventRegistrations] = useState<any[]>([]);
  const [isProcessingRegistration, setIsProcessingRegistration] = useState<string | null>(null);
  const [isEditingEvent, setIsEditingEvent] = useState(false);

  const isCurrentUserEventCreator = authUser?.id === currentEvent?.created_by_profile_id;

  const getDynamicEventStyling = (eventType?: string | null) => {
    let heroBgClass = 'bg-[#30D158]'; 
    let heroTextClass = 'text-white';
    let heroAccentClass = 'text-white/80'; 
    let heroIconColor = '#FFFFFF';
    let statusPillBgClass = 'bg-white/25'; 
    let statusPillTextClass = 'text-white';
    let generalAccentColorClass = 'text-green-600';

    switch (eventType) {
      case 'Match': 
        heroBgClass = 'bg-[#0A84FF]'; 
        generalAccentColorClass = 'text-blue-600';
        break;
      case 'Tournament': 
        heroBgClass = 'bg-[#5E5CE6]';
        generalAccentColorClass = 'text-purple-600';
        break;
      case 'Meeting': 
        heroBgClass = 'bg-[#FF9F0A]';
        generalAccentColorClass = 'text-orange-600';
        break;
      default: 
        heroBgClass = 'bg-[#30D158]';
        generalAccentColorClass = 'text-green-600';
        break;
    }
    return { heroBgClass, heroTextClass, heroAccentClass, heroIconColor, statusPillBgClass, statusPillTextClass, generalAccentColorClass };
  };
  
  const { heroBgClass, heroTextClass, heroAccentClass, heroIconColor, statusPillBgClass, statusPillTextClass, generalAccentColorClass } = getDynamicEventStyling(currentEvent?.event_type);

  const loadEventAndRegistrations = useCallback(async () => {
    if (eventIdParam) {
      const fetchedEvent = await getEventById(eventIdParam);
      if (fetchedEvent) {
        setCurrentEvent(fetchedEvent);
        const fetchedRegistrations = await fetchRegistrationsByEventId(eventIdParam);
        setCurrentEventRegistrations(fetchedRegistrations);
      } else {
        Alert.alert('Error', 'Event not found.');
        if (navigation.canGoBack()) navigation.goBack();
      }
    }
  }, [eventIdParam, getEventById, fetchRegistrationsByEventId, navigation]);

  useEffect(() => {
    loadEventAndRegistrations();
  }, [loadEventAndRegistrations]);

  useEffect(() => {
    if (authUser?.id) {
      fetchUserTeams(authUser.id);
    }
  }, [authUser, fetchUserTeams]);
  
  useEffect(() => {
    if (eventIdParam) {
        setCurrentEventRegistrations(eventRegistrationsFromStore.filter(reg => reg.event_id === eventIdParam));
    }
  }, [eventRegistrationsFromStore, eventIdParam]);

  const formatDateRange = (start?: string, end?: string) => {
    if (!start) return 'Date & Time Undetermined';
    const startDate = new Date(start);
    const optionsDate: Intl.DateTimeFormatOptions = { month: 'long', day: 'numeric', year: 'numeric' };
    const optionsTime: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit', hour12: true };
    let formattedString = `${startDate.toLocaleDateString('en-US', optionsDate)} at ${startDate.toLocaleTimeString('en-US', optionsTime)}`;
    if (end) {
      const endDate = new Date(end);
      if (startDate.toDateString() === endDate.toDateString()) {
        formattedString = `${startDate.toLocaleDateString('en-US', optionsDate)}\n${startDate.toLocaleTimeString('en-US', optionsTime)} - ${endDate.toLocaleTimeString('en-US', optionsTime)}`;
      } else {
        formattedString = `${startDate.toLocaleDateString('en-US', optionsDate)}, ${startDate.toLocaleTimeString('en-US', optionsTime)}\n-\n${endDate.toLocaleDateString('en-US', optionsDate)}, ${endDate.toLocaleTimeString('en-US', optionsTime)}`;
      }
    }
    return formattedString;
  };

  const handleRegisterTeam = async (teamToRegister: TeamRow) => {
    if (!eventIdParam || !authUser) return;
    setIsProcessingRegistration(teamToRegister.id);
    const result = await registerTeamForEvent({ event_id: eventIdParam, team_id: teamToRegister.id, status: 'confirmed' });
    const currentError = useEventStore.getState().error;
    if (result && !currentError) {
      Alert.alert('Success', `${teamToRegister.name} registered.`);
      const updatedRegistrations = await fetchRegistrationsByEventId(eventIdParam);
      setCurrentEventRegistrations(updatedRegistrations);
    } else {
      Alert.alert('Error', currentError || 'Failed to register team. Please try again.');
    }
    setIsProcessingRegistration(null);
  };

  const handleUnregisterTeam = async (teamToUnregister: TeamRow) => {
    if (!eventIdParam) return;
    const registration = currentEventRegistrations.find(reg => reg.team_id === teamToUnregister.id && reg.event_id === eventIdParam);
    if (!registration?.id) { Alert.alert('Error', 'Registration details not found.'); return; }
    Alert.alert("Confirm Unregistration", `Unregister ${teamToUnregister.name}?`, [
        { text: "Cancel", style: "cancel" },
        { text: "Unregister", style: "destructive", onPress: async () => {
            setIsProcessingRegistration(teamToUnregister.id);
            await unregisterTeamFromEvent(registration.id!);
            const currentError = useEventStore.getState().error; 
            if (currentError) {
                 Alert.alert('Error', currentError || 'Failed to unregister team.');
            } else {
                Alert.alert('Success', `${teamToUnregister.name} unregistered.`);
                const updatedRegistrations = await fetchRegistrationsByEventId(eventIdParam);
                setCurrentEventRegistrations(updatedRegistrations);
            }
            setIsProcessingRegistration(null);
        }}
    ]);
  };

  const handleUpdateSuccess = () => {
    setIsEditingEvent(false);
    loadEventAndRegistrations(); 
  };

  const handleDeleteEventPress = () => {
    if (!currentEvent?.id) return;
    Alert.alert("Delete Event Permanently", "This action cannot be undone.", [
        { text: "Cancel", style: "cancel" },
        { text: "Delete Permanently", style: "destructive", onPress: async () => {
            await deleteEvent(currentEvent.id);
            const currentError = useEventStore.getState().error;
            if (currentError) {
              Alert.alert("Error", currentError || "Failed to delete event.");
            } else {
              Alert.alert("Success", "Event deleted successfully.");
              if (navigation.canGoBack()) navigation.goBack(); else router.replace('/(app)/events'); 
            }
        }}
    ]);
  };
  
  const eventDataError = useEventStore(state => state.error);

  if (isLoadingEventDetails || isLoadingAuthUser || (eventIdParam && !currentEvent && !eventDataError)) {
    return <View className="flex-1 justify-center items-center bg-white"><ActivityIndicator/></View>;
  }
  if (eventDataError && !currentEvent) { 
    return <View className="flex-1 justify-center items-center p-6 bg-white"><Text className="text-red-600 text-lg text-center">Error: {eventDataError}</Text></View>;
  }
  if (!currentEvent) {
    return <View className="flex-1 justify-center items-center p-6 bg-white"><Text className="text-gray-700 text-lg">Event data is unavailable.</Text></View>;
  }

  const HeroInfoItem: React.FC<{icon: React.ElementType, content: string | React.ReactNode, iconColorProp?: string}> = ({ icon: Icon, content, iconColorProp }) => (
    <View className="flex-row items-start py-2">
      <Icon size={20} color={iconColorProp || heroIconColor} className="mr-3.5 mt-1 opacity-80" />
      {typeof content === 'string' ? <Text className={`text-base ${heroTextClass} opacity-90 flex-1 leading-snug`}>{content}</Text> : content}
    </View>
  );

  return (
    <View className="flex-1 bg-white">
      <StatusBar barStyle={heroIconColor === '#FFFFFF' ? "light-content" : "dark-content"} />
      <Stack.Screen 
        options={{ 
            title: isEditingEvent ? 'Edit Event' : '', 
            headerTransparent: !isEditingEvent, 
            headerShadowVisible: isEditingEvent, 
            headerStyle: { backgroundColor: isEditingEvent ? '#F3F4F6' : 'transparent' }, // Light gray for edit header
            headerTintColor: isEditingEvent ? '#1F2937' : heroIconColor, // Dark text for edit header
            headerRight: () => (
                isCurrentUserEventCreator && !isEditingEvent ? (
                    <TouchableOpacity onPress={() => setIsEditingEvent(true)} className="mr-4 p-1">
                        <Edit3 size={24} color={heroIconColor} />
                    </TouchableOpacity>
                ) : null
            )
        }} 
      />

      {isEditingEvent && currentEvent ? (
        <SafeAreaView className="flex-1 bg-gray-100" edges={['bottom', 'left', 'right']}>
          <UpdateEventForm event={currentEvent} onSuccess={handleUpdateSuccess} onCancel={() => setIsEditingEvent(false)} />
        </SafeAreaView>
      ) : (
        <View 
          className="flex-1"
        >
          <View className={`${heroBgClass} px-5 pb-8`} style={{ paddingTop: insets.top + (Platform.OS === 'ios' ? 40 : 56) }}>
            <Text className={`text-3xl font-bold ${heroTextClass} mb-2 tracking-tight`}>{currentEvent.title}</Text>
            <Text className={`text-xl ${heroAccentClass} font-normal mb-5`}>{currentEvent.event_type}</Text>
            {currentEvent.status && (
              <View className={`self-start ${statusPillBgClass} px-3 py-1 rounded-full mb-6`}>
                <Text className={`${statusPillTextClass} text-xs font-semibold uppercase tracking-wider`}>{currentEvent.status}</Text>
              </View>
            )}
            <HeroInfoItem icon={Calendar} content={formatDateRange(currentEvent.start_time || undefined, currentEvent.end_time || undefined)} />
            <HeroInfoItem icon={MapPin} content={
              <View>
                <Text className={`text-base ${heroTextClass} opacity-90`}>{currentEvent.location_name || 'Location TBD'}</Text>
                {currentEvent.location_name && currentEvent.location_address && 
                  <Text className={`text-sm ${heroAccentClass} opacity-70`}>{currentEvent.location_address}</Text>
                }
              </View>
            }/>
          </View>
          
          {currentEvent.description && (
              <View className="bg-white p-5 border-b border-gray-200">
                  <View className="flex-row items-center mb-2 space-x-2">
                      <Info size={20} className={generalAccentColorClass}/>
                      <Text className={`text-lg font-semibold ${generalAccentColorClass}`}>About this Event</Text>
                  </View>
                  <Text className="text-gray-700 text-base leading-relaxed">{currentEvent.description}</Text>
              </View>
          )}

          {isCurrentUserEventCreator && !isEditingEvent && (
             <View className="bg-white border-b border-gray-200">
                <TouchableOpacity
                    className="flex-row justify-between items-center p-4 active:bg-gray-50"
                    onPress={handleDeleteEventPress}
                >
                    <View className="flex-row items-center space-x-3">
                        <Trash2 size={20} className="text-red-500"/>
                        <Text className="text-base text-red-500 font-medium">Delete Event</Text>
                    </View>
                    <ChevronRight size={20} className="text-gray-400" />
                </TouchableOpacity>
             </View>
          )}

          <View className="mt-0">
            <Text className="text-sm font-medium text-gray-500 px-4 pt-5 pb-3 bg-gray-50 border-b border-gray-200">
                Team Registration
            </Text>
            {isLoadingAuthUser || isLoadingUserTeams ? (
              <View className="p-6 items-center bg-white border-b border-gray-200"><ActivityIndicator color={generalAccentColorClass}/></View>
            ) : authUser ? (
              userTeams && userTeams.length > 0 ? (
                userTeams.map((team, index) => {
                  const isRegistered = currentEventRegistrations.some(reg => reg.team_id === team.id);
                  const isProcessingThisTeam = isProcessingRegistration === team.id;
                  return (
                    <View key={team.id} className={`flex-row items-center bg-white p-4 space-x-3 border-b border-gray-200`}>
                      {team.logo_url ? 
                          <Image source={{uri: team.logo_url}} className="w-10 h-10 rounded-full bg-gray-200"/> :
                          <View className="w-10 h-10 rounded-full bg-gray-300 items-center justify-center">
                              <Text className="text-gray-600 font-bold">{team.name?.charAt(0).toUpperCase()}</Text>
                          </View>
                      }
                      <Text className="text-base text-gray-800 flex-1" numberOfLines={1}>{team.name}</Text>
                      {isProcessingThisTeam ? (
                        <View className="w-28 items-center"><ActivityIndicator color={generalAccentColorClass}/></View>
                      ) : isRegistered ? (
                        <TouchableOpacity onPress={() => handleUnregisterTeam(team)} className="bg-red-100 py-2 px-3.5 rounded-md active:bg-red-200 w-28 items-center">
                          <Text className="text-red-600 text-sm font-semibold">Unregister</Text>
                        </TouchableOpacity>
                      ) : (
                        <TouchableOpacity onPress={() => handleRegisterTeam(team)} className="bg-green-100 py-2 px-3.5 rounded-md active:bg-green-200 w-28 items-center">
                          <Text className="text-green-700 text-sm font-semibold">Register</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  );
                })
              ) : (
                <Text className="text-gray-600 bg-white px-4 py-6 text-center border-b border-gray-200">You have no teams. Create or join one first.</Text>
              )
            ) : (
              <Text className="text-gray-600 bg-white px-4 py-6 text-center border-b border-gray-200">Please log in to manage team registrations.</Text>
            )}
          </View>

          <View className="mt-0">
            <Text className="text-sm font-medium text-gray-500 px-4 pt-5 pb-3 bg-gray-50 border-b border-gray-200">
                Participating Teams
            </Text>
            <View className="bg-white overflow-hidden">
              {eventIdParam ? (
                <RegistrationList eventId={eventIdParam} />
              ) : (
                <View className="p-6"><Text className="text-gray-600 text-center">Registrations list unavailable.</Text></View>
              )}
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

export default EventDetailScreen;