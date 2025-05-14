import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Platform,
} from 'react-native';
import Modal from 'react-native-modal';
import { Calendar, MapPin, Clock, Info, Repeat, MoreHorizontal } from 'lucide-react-native';
import { EventWithTeams } from 'store/eventStore';
import { useUserStore } from 'store/userStore';

interface EventItemProps {
  event: EventWithTeams;
  onPress?: (event: EventWithTeams) => void;
  onDelete?: (eventId: string) => void;
  onUpdate?: (event: EventWithTeams) => void;
  onViewRegistrations?: (eventId: string) => void;
}

const EventItem: React.FC<EventItemProps> = ({
  event,
  onPress,
  onDelete,
  onUpdate,
  onViewRegistrations,
}) => {
  const { authUser } = useUserStore();
  const isCreator = authUser?.id === event.created_by_profile_id;
  const [isMenuVisible, setMenuVisible] = useState(false);

  // Format dates in Apple-style
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
  
  const showRegistrationsButton = event.event_type === 'Tournament' || event.event_type === 'Meeting';
  const showTeamInfo = event.event_type === 'Match' || event.event_type === 'Tournament';
  const showMenuButton = (showRegistrationsButton && onViewRegistrations) || (isCreator && onUpdate) || (isCreator && onDelete);

  // Get card style based on event type
  const getCardStyle = () => {
    switch (event.event_type) {
      case 'Match':
        return 'bg-[#0A84FF]'; // Vibrant blue background for matches (Apple blue)
      case 'Tournament':
        return 'bg-[#5E5CE6]'; // Vibrant purple background for tournaments (Apple purple)
      case 'Meeting':
        return 'bg-[#FF9F0A]'; // Vibrant orange background for meetings (Apple orange)
      default:
        return 'bg-[#30D158]'; // Vibrant green for other types (Apple green)
    }
  };

  // Get text color based on event type (for dark backgrounds)
  const getTextColor = () => {
    return 'text-white';
  };

  // Get status color
  const getStatusColor = () => {
    switch (event.status?.toLowerCase()) {
      case 'upcoming':
        return '#34C759'; // Apple green
      case 'live':
        return '#FF3B30'; // Apple red
      case 'completed':
        return '#8E8E93'; // Apple gray
      default:
        return '#8E8E93'; // Default gray
    }
  };

  const handleMenuPress = () => {
    setMenuVisible(true);
  };

  const handleMenuItemPress = (action?: () => void) => {
    action?.();
    setMenuVisible(false);
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
      onPress={() => onPress?.(event)}
      activeOpacity={0.9}
    >
      {/* Card Content */}
      <View className="p-4">
        {/* Header with Title and Type */}
        <View className="flex-row justify-between items-start mb-4">
          <View className="flex-1 mr-2">
            <Text className={`text-xl font-bold ${getTextColor()}`} numberOfLines={2}>
              {event.title}
            </Text>
            
            <View className="flex-row items-center mt-2">
              <View 
                className="h-3 w-3 rounded-full mr-2"
                style={{ backgroundColor: '#FFFFFF' }}
              />
              <Text className={`text-sm font-medium ${getTextColor()} opacity-90`}>
                {event.status} • {event.event_type}
              </Text>
            </View>
          </View>
          
          {showMenuButton && (
            <TouchableOpacity 
              onPress={handleMenuPress} 
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
        
        {/* Event Details */}
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

        {/* Team Information for Match/Tournament */}
        {showTeamInfo && (event.home_team || event.away_team) && (
          <View className="bg-white rounded-xl p-4 mb-3">
            <View className="flex-row items-center">
              {/* Home Team */}
              <View className="flex-1 flex-row items-center">
                {event.home_team?.logo_url ? (
                  <Image 
                    source={{ uri: event.home_team.logo_url }} 
                    className="w-12 h-12 rounded-full bg-[#F2F2F7]"
                  />
                ) : (
                  <View className="w-12 h-12 rounded-full bg-[#E5E5EA] items-center justify-center">
                    <Text className="text-base font-bold text-[#636366]">
                      {event.home_team?.name?.charAt(0) || 'H'}
                    </Text>
                  </View>
                )}
                <View className="ml-3 flex-1">
                  <Text className="text-sm font-bold text-[#1D1D1F]" numberOfLines={1}>
                    {event.home_team?.name || 'Home Team'}
                  </Text>
                  {event.home_team_score !== null && (
                    <Text className="text-2xl font-bold text-[#1D1D1F] mt-1">
                      {event.home_team_score}
                    </Text>
                  )}
                </View>
              </View>
              
              {/* VS Divider */}
              <View className="px-3">
                <Text className="text-sm font-bold text-[#636366]">VS</Text>
              </View>
              
              {/* Away Team */}
              <View className="flex-1 flex-row items-center justify-end">
                <View className="mr-3 flex-1 items-end">
                  <Text className="text-sm font-bold text-[#1D1D1F] text-right" numberOfLines={1}>
                    {event.away_team?.name || 'Away Team'}
                  </Text>
                  {event.away_team_score !== null && (
                    <Text className="text-2xl font-bold text-[#1D1D1F] mt-1">
                      {event.away_team_score}
                    </Text>
                  )}
                </View>
                {event.away_team?.logo_url ? (
                  <Image 
                    source={{ uri: event.away_team.logo_url }} 
                    className="w-12 h-12 rounded-full bg-[#F2F2F7]"
                  />
                ) : (
                  <View className="w-12 h-12 rounded-full bg-[#E5E5EA] items-center justify-center">
                    <Text className="text-base font-bold text-[#636366]">
                      {event.away_team?.name?.charAt(0) || 'A'}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        )}

        {/* Description */}
        {event.description && (
          <View className="bg-white/20 backdrop-blur-md rounded-xl p-4 mb-3">
            <Text className={`text-sm leading-5 ${getTextColor()}`} numberOfLines={2}>
              {event.description}
            </Text>
          </View>
        )}
        
        {/* Meta Information */}
        <View className="mt-2">
          <View className="flex-row items-center">
            <Clock size={12} color="#FFFFFF" strokeWidth={2.5} />
            <Text className={`text-xs ${getTextColor()} ml-2 opacity-80`}>
              Created {createdAt}
            </Text>
          </View>
          
          {event.created_at !== event.updated_at && (
            <View className="flex-row items-center mt-1">
              <Repeat size={12} color="#FFFFFF" strokeWidth={2.5} />
              <Text className={`text-xs ${getTextColor()} ml-2 opacity-80`}>
                Updated {updatedAt}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Action Menu Modal */}
      <Modal
        isVisible={isMenuVisible}
        animationIn="slideInUp"
        animationOut="slideOutDown"
        backdropOpacity={0.5}
        onBackdropPress={() => setMenuVisible(false)}
        onSwipeComplete={() => setMenuVisible(false)}
        swipeDirection={['down']}
        style={{ justifyContent: 'flex-end', margin: 0 }}
      >
        <View className={`
          bg-white rounded-t-2xl
          ${Platform.OS === 'ios' ? 'pb-8' : 'pb-4'}
        `}>
          <View className="w-12 h-1.5 bg-[#E5E5EA] rounded-full mx-auto mt-3 mb-5" />
          
          {showRegistrationsButton && onViewRegistrations && (
            <TouchableOpacity
              className="py-4 border-b border-[#F5F5F7] items-center"
              onPress={() => handleMenuItemPress(() => onViewRegistrations(event.id))}
            >
              <Text className="text-base font-medium text-[#007AFF]">View Registrations</Text>
            </TouchableOpacity>
          )}
          
          {isCreator && onUpdate && (
            <TouchableOpacity
              className="py-4 border-b border-[#F5F5F7] items-center"
              onPress={() => handleMenuItemPress(() => onUpdate(event))}
            >
              <Text className="text-base font-medium text-[#007AFF]">Edit</Text>
            </TouchableOpacity>
          )}
          
          {isCreator && onDelete && (
            <TouchableOpacity
              className="py-4 border-b border-[#F5F5F7] items-center"
              onPress={() => handleMenuItemPress(() => onDelete(event.id))}
            >
              <Text className="text-base font-medium text-[#FF3B30]">Delete</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            className="mt-4 mx-4 py-4 items-center bg-[#F5F5F7] rounded-xl"
            onPress={() => handleMenuItemPress()}
          >
            <Text className="text-base font-bold text-[#007AFF]">Cancel</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </TouchableOpacity>
  );
};

export default EventItem;