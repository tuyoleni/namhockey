import React from 'react';
import { View, Text, FlatList, ActivityIndicator } from 'react-native';
import { useEventStore } from 'store/eventStore';
import EventItem from '@components/events/EventItem';
import { minimalStyles } from './minimalStyles';

const AllEvents: React.FC = () => {
  const { events, loadingEvents, error: eventError } = useEventStore();

  const sortedEvents = [...events]
    .filter(event => event.event_type === 'Match' || event.event_type === 'Tournament')
    .sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime());

//   if (loadingEvents) {
//     return (
//       <View style={minimalStyles.centered}>
//         <ActivityIndicator />
//         <Text style={minimalStyles.loadingText}>Loading events...</Text>
//       </View>
//     );
//   }

  if (eventError) {
    return (
      <View style={minimalStyles.contentWrapper}>
        <Text style={minimalStyles.errorText}>Error loading events: {eventError}</Text>
      </View>
    );
  }

  if (sortedEvents.length === 0) {
    return (
      <View style={minimalStyles.contentWrapper}>
        {/* <Text style={minimalStyles.noDataText}>No events found.</Text> */}
      </View>
    );
  }

  return (
    <View style={minimalStyles.contentWrapper}>
      <FlatList
        data={sortedEvents}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <EventItem event={item} />}
        scrollEnabled={false}
      />
    </View>
  );
};

export default AllEvents;
