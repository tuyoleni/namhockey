import React from 'react';
import { View, Text, FlatList, ActivityIndicator } from 'react-native';
import { useEventStore, EventWithTeams } from 'store/eventStore';
import { format } from 'date-fns';
import { minimalStyles } from './minimalStyles';

const LiveMatches: React.FC = () => {
  const { events, loadingEvents, error: eventError } = useEventStore();

  const liveEvents = events.filter(event => event.status === 'live');

  if (loadingEvents) {
    return (
      <View style={minimalStyles.centered}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={minimalStyles.loadingText}>Loading live matches...</Text>
      </View>
    );
  }

  if (eventError) {
    return (
      <View style={minimalStyles.contentWrapper}>
        {/* Removed section title here, as it's handled in HomeScreen */}
        <Text style={minimalStyles.errorText}>Error loading live matches: {eventError}</Text>
      </View>
    );
  }

  if (liveEvents.length === 0) {
    return (
      <View style={minimalStyles.contentWrapper}>
        {/* Removed section title here */}
        <Text style={minimalStyles.noDataText}>No live matches currently.</Text>
      </View>
    );
  }

  return (
    <View style={minimalStyles.contentWrapper}>
      {/* Removed section title here */}
      <FlatList
        data={liveEvents}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          // Using Tailwind classes for item styling within the list
          <View className="py-3 border-b border-gray-200 last:border-b-0">
            <Text className="text-base font-semibold text-gray-900">{item.title}</Text>
            <Text className="text-sm text-gray-700">{item.location_name}</Text>
            {item.home_team || item.away_team ? (
              <View className="flex-row items-center mt-1">
                {item.home_team && <Text className="text-sm font-medium">{item.home_team.name}</Text>}
                {(item.home_team || item.away_team) && <Text className="mx-1 text-sm text-gray-600">vs</Text>}
                {item.away_team && <Text className="text-sm font-medium">{item.away_team.name}</Text>}
                {(item.home_team_score !== null || item.away_team_score !== null) && (
                  <Text className="ml-2 text-sm font-bold text-blue-600">
                    {item.home_team_score !== null ? item.home_team_score : '-'} - {item.away_team_score !== null ? item.away_team_score : '-'}
                  </Text>
                )}
              </View>
            ) : null}
             <Text className="text-xs text-gray-500 mt-1">Started: {item.start_time ? format(new Date(item.start_time), 'HH:mm') : 'N/A'}</Text>
          </View>
        )}
        scrollEnabled={false} // Disable scrolling within the FlatList
      />
    </View>
  );
};

export default LiveMatches;
