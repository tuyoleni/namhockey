import React, { useState } from 'react';
import { Text, View, ActivityIndicator, useWindowDimensions, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TabView, TabBar, SceneMap } from 'react-native-tab-view';
import { useRouter } from 'expo-router';

import {
	useHomeScreenData,
	EventWithTeams,
	NewsArticleWithAuthor,
} from 'hooks/useHomeScreenData';

import { EventCard } from '@components/cards/EventCard';
import { ResultCard } from '@components/cards/ResultCard';
import { NewsCard } from '@components/cards/NewsCard';

const UpcomingMatchesRoute = ({ events, loading, onPress }: any) => (
	<View className="flex-1">
		{loading ? (
			<ActivityIndicator/>
		) : events.length > 0 ? (
			<FlatList
				data={events}
				renderItem={({ item }: any) => (
					<EventCard
						title={item.title || 'Event'}
						home_team_name={item.home_team?.name || 'Home Team'}
						away_team_name={item.away_team?.name || 'Away Team'}
						start_time={item.start_time}
						location_name={item.location_name || ''}
						onPress={() => onPress(item.id)}
					/>
				)}
				keyExtractor={(item) => `${item.id}`}
				contentContainerStyle={{ padding: 16 }}
			/>
		) : (
			<Text className="text-center mt-6 text-gray-500 text-base">No upcoming matches available.</Text>
		)}
	</View>
);

const LiveMatchesRoute = ({ results, loading, onPress }: any) => (
	<View className="flex-1">
		{loading ? (
			<ActivityIndicator/>
		) : results.length > 0 ? (
			<FlatList
				data={results}
				renderItem={({ item }: any) => (
					<ResultCard
						title={item.title || 'Match Result'}
						home_team_name={item.home_team?.name || 'Home Team'}
						away_team_name={item.away_team?.name || 'Away Team'}
						home_team_score={item.home_team_score ?? 0}
						away_team_score={item.away_team_score ?? 0}
						start_time={item.start_time}
						location_name={item.location_name || ''}
						onPress={() => onPress(item.id)}
					/>
				)}
				keyExtractor={(item) => `${item.id}`}
				contentContainerStyle={{ padding: 16 }}
			/>
		) : (
			<Text className="text-center mt-6 text-gray-500 text-base">No live matches available.</Text>
		)}
	</View>
);

const NewsRoute = ({ news, loading, onPress }: any) => (
	<View className="flex-1">
		{loading ? (
			<ActivityIndicator className="mt-6" />
		) : news.length > 0 ? (
			<FlatList
				data={news}
				renderItem={({ item }: any) => (
					<NewsCard
						title={item.title}
						published_at={item.published_at || ''}
						onPress={() => onPress(item.id)}
					/>
				)}
				keyExtractor={(item) => `${item.id}`}
				contentContainerStyle={{ padding: 16 }}
			/>
		) : (
			<Text className="text-center mt-6 text-gray-500 text-base">No news available.</Text>
		)}
	</View>
);

export default function HomeScreen() {
	const layout = useWindowDimensions();
	const router = useRouter();

	const {
		upcomingEvents,
		recentResults,
		latestNews,
		loadingEvents,
		loadingResults,
		loadingNews,
	} = useHomeScreenData();

	const [index, setIndex] = useState(0);
	const [routes] = useState([
		{ key: 'upcoming', title: 'Upcoming' },
		{ key: 'live', title: 'Live' },
		{ key: 'news', title: 'News' },
	]);

	const renderScene = ({ route }: any) => {
		switch (route.key) {
			case 'upcoming':
				return (
					<UpcomingMatchesRoute
						events={upcomingEvents}
						loading={loadingEvents}
						onPress={(id: string) => router.push(`/event/${id}`)}
					/>
				);
			case 'live':
				return (
					<LiveMatchesRoute
						results={recentResults}
						loading={loadingResults}
						onPress={(id: string) => router.push(`/event/${id}?view=result`)}
					/>
				);
			case 'news':
				return (
					<NewsRoute
						news={latestNews}
						loading={loadingNews}
						onPress={(id: string) => router.push(`/news/${id}`)}
					/>
				);
			default:
				return null;
		}
	};

	return (
		<SafeAreaView className="flex-1 bg-gray-100">
			<TabView
				navigationState={{ index, routes }}
				renderScene={renderScene}
				onIndexChange={setIndex}
				initialLayout={{ width: layout.width }}
				renderTabBar={(props) => (
          <TabBar
          {...props}
          indicatorStyle={{ backgroundColor: '#2563eb' }}
          style={{ backgroundColor: '#f3f4f6' }}
        />        
				)}
			/>
		</SafeAreaView>
	);
}
