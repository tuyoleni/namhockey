import React from 'react';
import { View, Text, FlatList, ActivityIndicator } from 'react-native';
import { useEventStore, EventWithTeams } from 'store/eventStore';
import { format } from 'date-fns';

const LiveMatches: React.FC = () => {
  const { events, loadingEvents, error: eventError } = useEventStore();

  const liveEvents = events.filter(event => event.status === 'live');

  if (loadingEvents) {
    return (
      <View className="flex-1 justify-center items-center p-4">
        <ActivityIndicator size="large" color="#007bff" />
        <Text className="mt-2 text-gray-700">Loading live matches...</Text>
      </View>
    );
  }

  if (eventError) {
    return (
      <View className="mb-4 bg-white p-4 mx-4 rounded-lg">
        <Text className="text-xl font-bold mb-2 text-gray-800">Live Matches</Text>
        <Text className="text-red-600 text-sm text-center">Error loading live matches: {eventError}</Text>
      </View>
    );
  }

  if (liveEvents.length === 0) {
    return (
      <View className="mb-4 bg-white p-4 mx-4 rounded-lg">
        <Text className="text-xl font-bold mb-2 text-gray-800">Live Matches</Text>
        <Text className="text-gray-500 text-sm text-center">No live matches currently.</Text>
      </View>
    );
  }

  return (
    <View className="mb-4 bg-white p-4 mx-4 rounded-lg">
      <Text className="text-xl font-bold mb-2 text-gray-800">Live Matches</Text>
      <FlatList
        data={liveEvents}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
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
        scrollEnabled={false}
      />
    </View>
  );
};

export default LiveMatches;
