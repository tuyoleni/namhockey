import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Platform,
} from 'react-native';
import Modal from 'react-native-modal';
import { useRouter } from 'expo-router';
import { Calendar, MapPin, Clock, Repeat, MoreHorizontal } from 'lucide-react-native';
import { EventWithTeams } from 'store/eventStore';
import { useUserStore } from 'store/userStore';

interface EventItemProps {
  event: EventWithTeams;
  onPress?: (event: EventWithTeams) => void;
  onDelete?: (eventId: string) => void;
  onUpdate?: (event: EventWithTeams) => void;
}

const EventItem: React.FC<EventItemProps> = ({
  event,
  onPress,
  onDelete,
  onUpdate,
}) => {
  const router = useRouter();
  const { authUser } = useUserStore();
  const isCreator = authUser?.id === event.created_by_profile_id;
  const [isMenuVisible, setMenuVisible] = useState(false);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).format(date);
  };

  const startTime = event.start_time ? formatDate(event.start_time) : 'N/A';
  const endTime = event.end_time ? formatDate(event.end_time) : 'N/A';
  const createdAt = event.created_at ? formatDate(event.created_at) : 'N/A';
  const updatedAt = event.updated_at ? formatDate(event.updated_at) : 'N/A';
  
  const canViewRegistrations = event.event_type === 'Tournament' || event.event_type === 'Meeting';
  const showTeamInfo = event.event_type === 'Match' || event.event_type === 'Tournament';
  const showMenuButton = canViewRegistrations || (isCreator && onUpdate) || (isCreator && onDelete);

  const getCardStyle = () => {
    switch (event.event_type) {
      case 'Match': return 'bg-[#0A84FF]';
      case 'Tournament': return 'bg-[#5E5CE6]';
      case 'Meeting': return 'bg-[#FF9F0A]';
      default: return 'bg-[#30D158]';
    }
  };

  const getTextColor = () => 'text-white';

  const handleMenuTrigger = () => setMenuVisible(true);

  const executeMenuAction = (action?: () => void) => {
    action?.();
    setMenuVisible(false);
  };

  const navigateToEventDetails = () => {
    router.push(`/events/${event.id}`);
  };

  return (
    <TouchableOpacity
      className={`${getCardStyle()} rounded-2xl mx-4 my-3 overflow-hidden`}
      style={{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
      }}
      onPress={() => onPress ? onPress(event) : navigateToEventDetails()}
      activeOpacity={0.9}
    >
      <View className="p-4">
        <View className="flex-row justify-between items-start mb-4">
          <View className="flex-1 mr-2">
            <Text className={`text-xl font-bold ${getTextColor()}`} numberOfLines={2}>
              {event.title}
            </Text>
            <View className="flex-row items-center mt-2">
              <View className="h-3 w-3 rounded-full mr-2 bg-white" />
              <Text className={`text-sm font-medium ${getTextColor()} opacity-90`}>
                {event.status} • {event.event_type}
              </Text>
            </View>
          </View>
          
          {showMenuButton && (
            <TouchableOpacity 
              onPress={handleMenuTrigger} 
              className="p-2 -mt-1 -mr-1 bg-white/20 backdrop-blur-md rounded-full"
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.15,
                shadowRadius: 3,
                elevation: 2,
              }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <MoreHorizontal size={18} color="#FFFFFF" />
            </TouchableOpacity>
          )}
        </View>
        
        <View className="bg-white/20 backdrop-blur-md rounded-xl p-4 mb-3">
          <View className="flex-row items-center mb-3">
            <Calendar size={16} color="#FFFFFF" strokeWidth={2.5} />
            <Text className={`text-sm font-medium ${getTextColor()} ml-3`}>
              {startTime} {endTime !== 'N/A' && `- ${endTime}`}
            </Text>
          </View>
          <View className="flex-row items-center mb-3">
            <MapPin size={16} color="#FFFFFF" strokeWidth={2.5} />
            <Text className={`text-sm font-medium ${getTextColor()} ml-3`} numberOfLines={1}>
              {event.location_name || 'Unknown Location'}
            </Text>
          </View>
          {event.location_address && (
            <Text className={`text-sm ${getTextColor()} ml-8 mb-3 opacity-90`} numberOfLines={1}>
              {event.location_address}
            </Text>
          )}
        </View>

        {showTeamInfo && (event.home_team || event.away_team) && (
          <View className="bg-white rounded-xl p-4 mb-3">
            <View className="flex-row items-center">
              <View className="flex-1 flex-row items-center">
                {event.home_team?.logo_url ? (
                  <Image source={{ uri: event.home_team.logo_url }} className="w-12 h-12 rounded-full bg-gray-100" />
                ) : (
                  <View className="w-12 h-12 rounded-full bg-gray-200 items-center justify-center">
                    <Text className="text-base font-bold text-gray-500">{event.home_team?.name?.charAt(0) || 'H'}</Text>
                  </View>
                )}
                <View className="ml-3 flex-1">
                  <Text className="text-sm font-bold text-gray-800" numberOfLines={1}>{event.home_team?.name || 'Home Team'}</Text>
                  {event.home_team_score !== null && <Text className="text-2xl font-bold text-gray-800 mt-1">{event.home_team_score}</Text>}
                </View>
              </View>
              <View className="px-3"><Text className="text-sm font-bold text-gray-500">VS</Text></View>
              <View className="flex-1 flex-row items-center justify-end">
                <View className="mr-3 flex-1 items-end">
                  <Text className="text-sm font-bold text-gray-800 text-right" numberOfLines={1}>{event.away_team?.name || 'Away Team'}</Text>
                  {event.away_team_score !== null && <Text className="text-2xl font-bold text-gray-800 mt-1">{event.away_team_score}</Text>}
                </View>
                {event.away_team?.logo_url ? (
                  <Image source={{ uri: event.away_team.logo_url }} className="w-12 h-12 rounded-full bg-gray-100" />
                ) : (
                  <View className="w-12 h-12 rounded-full bg-gray-200 items-center justify-center">
                    <Text className="text-base font-bold text-gray-500">{event.away_team?.name?.charAt(0) || 'A'}</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        )}

        {event.description && (
          <View className="bg-white/20 backdrop-blur-md rounded-xl p-4 mb-3">
            <Text className={`text-sm leading-5 ${getTextColor()}`} numberOfLines={2}>{event.description}</Text>
          </View>
        )}
        
        <View className="mt-2">
          <View className="flex-row items-center">
            <Clock size={12} color="#FFFFFF" strokeWidth={2.5} />
            <Text className={`text-xs ${getTextColor()} ml-2 opacity-80`}>Created {createdAt}</Text>
          </View>
          {event.created_at !== event.updated_at && updatedAt !== 'N/A' && (
            <View className="flex-row items-center mt-1">
              <Repeat size={12} color="#FFFFFF" strokeWidth={2.5} />
              <Text className={`text-xs ${getTextColor()} ml-2 opacity-80`}>Updated {updatedAt}</Text>
            </View>
          )}
        </View>
      </View>

      <Modal
        isVisible={isMenuVisible}
        animationIn="slideInUp"
        animationOut="slideOutDown"
        backdropOpacity={0.5}
        onBackdropPress={() => setMenuVisible(false)}
        onSwipeComplete={() => setMenuVisible(false)}
        swipeDirection={['down']}
        style={{ justifyContent: 'flex-end', margin: 0 }}
        useNativeDriverForBackdrop
      >
        <View className={`bg-white rounded-t-2xl ${Platform.OS === 'ios' ? 'pb-8' : 'pb-4'}`}>
          <View className="w-12 h-1.5 bg-gray-300 rounded-full self-center mt-3 mb-5" />
          
          {canViewRegistrations && (
            <TouchableOpacity
              className="py-4 border-b border-gray-100 items-center"
              onPress={() => executeMenuAction(navigateToEventDetails)}
            >
              <Text className="text-base font-medium text-blue-500">View Details & Registrations</Text>
            </TouchableOpacity>
          )}
          
          {isCreator && onUpdate && (
            <TouchableOpacity
              className="py-4 border-b border-gray-100 items-center"
              onPress={() => executeMenuAction(() => onUpdate(event))}
            >
              <Text className="text-base font-medium text-blue-500">Edit Event</Text>
            </TouchableOpacity>
          )}
          
          {isCreator && onDelete && (
            <TouchableOpacity
              className="py-4 border-b border-gray-100 items-center"
              onPress={() => executeMenuAction(() => onDelete(event.id))}
            >
              <Text className="text-base font-medium text-red-500">Delete Event</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            className="mt-4 mx-4 py-4 items-center bg-gray-100 rounded-xl active:bg-gray-200"
            onPress={() => executeMenuAction()}
          >
            <Text className="text-base font-bold text-blue-500">Cancel</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </TouchableOpacity>
  );
};

export default EventItem;