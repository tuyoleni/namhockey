import React, { useEffect, useState, useCallback, useRef } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  ActivityIndicator, 
  RefreshControl, 
  TouchableOpacity, 
  SafeAreaView, 
  Modal,
  Animated,
  Platform,
  NativeScrollEvent
} from 'react-native';
import { useRouter } from 'expo-router';
import { useNewsStore } from 'store/newsStore';
import { useEventStore } from 'store/eventStore';
import { useMediaStore } from 'store/mediaStore';
import { useUserStore } from 'store/userStore';

// Import components
import NewsFeed from '@components/home/NewsFeed';
import MediaPostList from '@components/home/MediaPostList';
import UpcomingMatches from '@components/home/UpcomingMatches';
import RecentMatches from '@components/home/RecentMatches';
import MediaPostUpload from '@components/home/MediaPostUpload';

import { Plus, X } from 'lucide-react-native';

// Define tab types
type Tab = 'Matches & Events' | 'News' | 'Media';

// Reusable component for displaying loading, error, or no data messages
const InfoMessage: React.FC<{ message: string; type?: 'loading' | 'error' | 'no-data'; details?: string }> = ({
  message,
  type = 'no-data',
  details,
}) => {
  let textClasses = '';
  let containerClasses = 'flex-1 justify-center items-center p-5';

  switch (type) {
    case 'loading':
      textClasses = 'mt-2.5 text-base text-gray-600';
      break;
    case 'error':
      textClasses = 'mt-2.5 text-base text-red-600 text-center';
      containerClasses = 'flex-1 justify-center items-center p-5 bg-gray-100';
      break;
    case 'no-data':
    default:
      textClasses = 'mt-2.5 text-base text-gray-700 text-center';
      break;
  }

  return (
    <View className={containerClasses}>
      {type === 'loading' && <ActivityIndicator size="large" color="#007AFF" />}
      {type === 'error' && <Text className="mt-2.5 text-lg font-bold text-red-600 text-center mb-2">Error loading data:</Text>}
      <Text className={textClasses}>{details && typeof details === 'string' ? details : message}</Text>
    </View>
  );
};

const HomeScreen: React.FC = () => {
  const router = useRouter();
  const scrollY = useRef(new Animated.Value(0)).current;
  const lastScrollY = useRef(0);
  
  // Calculate heights for animation
  const headerHeight = Platform.OS === 'ios' ? 90 : 80; // Height of welcome header
  const tabBarHeight = 44; // Height of tab bar
  const totalHeaderHeight = headerHeight + tabBarHeight; // Combined height

  const { fetchNewsArticles, subscribeToNewsArticles, loadingNews, error: newsError, newsArticles } = useNewsStore();
  const { fetchEvents, subscribeToEvents, loadingEvents, error: eventError, events } = useEventStore();
  const { fetchMediaPosts, loadingMedia, error: mediaError, mediaPosts } = useMediaStore();
  const { fetchAuthUser, authUser, loading: loadingUser, error: userError } = useUserStore();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('Matches & Events');
  const [showUpcomingMatches, setShowUpcomingMatches] = useState(true);
  const [isUploadModalVisible, setUploadModalVisible] = useState(false);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);

  // Calculate header translation based on visibility state
  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, 10, 50],
    outputRange: [0, 0, -totalHeaderHeight],
    extrapolate: 'clamp',
  });

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    { 
      useNativeDriver: true,
      listener: (event) => {
        const currentScrollY = (event.nativeEvent as NativeScrollEvent).contentOffset.y;
        
        // Show header when scrolling up, hide when scrolling down
        if (currentScrollY < lastScrollY.current || currentScrollY <= 0) {
          setIsHeaderVisible(true);
        } else if (currentScrollY > lastScrollY.current && currentScrollY > 10) {
          setIsHeaderVisible(false);
        }
        
        lastScrollY.current = currentScrollY;
      }
    }
  );

  const loadAllData = useCallback(async () => {
    await Promise.all([
      fetchNewsArticles(),
      fetchEvents(),
      fetchMediaPosts(),
      fetchAuthUser(),
    ]);
  }, [fetchNewsArticles, fetchEvents, fetchMediaPosts, fetchAuthUser]);

  useEffect(() => {
    loadAllData();

    const unsubscribeNews = subscribeToNewsArticles();
    const unsubscribeEvents = subscribeToEvents();

    return () => {
      unsubscribeNews();
      unsubscribeEvents();
    };
  }, [loadAllData, subscribeToNewsArticles, subscribeToEvents]);

  useEffect(() => {
    if (!loadingUser && !authUser) {
      router.replace('/(auth)/login');
    }
  }, [loadingUser, authUser, router]);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    setIsHeaderVisible(true); // Always show header when refreshing
    await loadAllData();
    setIsRefreshing(false);
  }, [loadAllData]);

  if (loadingNews || loadingEvents || loadingMedia || loadingUser) {
    return <InfoMessage message="Loading data..." type="loading" />;
  }

  if (newsError || eventError || mediaError || userError) {
    return (
      <InfoMessage
        message="Error loading data:"
        type="error"
        details={
          [newsError, eventError, mediaError, userError].filter(Boolean).join('\n')
        }
      />
    );
  }

  if (!authUser && !loadingUser) {
    return null;
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'Matches & Events':
        return (
          <>
            <View className="flex-row bg-gray-200 rounded-lg mx-4 my-2.5 overflow-hidden">
              <TouchableOpacity
                className={`flex-1 py-2.5 items-center justify-center ${showUpcomingMatches ? 'bg-[#007AFF]' : ''}`}
                onPress={() => setShowUpcomingMatches(true)}
              >
                <Text className={`text-base ${showUpcomingMatches ? 'text-white font-semibold' : 'text-gray-800'}`}>Upcoming</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className={`flex-1 py-2.5 items-center justify-center ${!showUpcomingMatches ? 'bg-[#007AFF]' : ''}`}
                onPress={() => setShowUpcomingMatches(false)}
              >
                <Text className={`text-base ${!showUpcomingMatches ? 'text-white font-semibold' : 'text-gray-800'}`}>Recent</Text>
              </TouchableOpacity>
            </View>
            {showUpcomingMatches ? <UpcomingMatches /> : <RecentMatches />}
          </>
        );
      case 'News':
        return <NewsFeed />;
      case 'Media':
        return <MediaPostList />;
      default:
        return null;
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Animated Header + Tab Bar Container */}
      <Animated.View 
        style={{ 
          transform: [{ translateY: isHeaderVisible ? 0 : -totalHeaderHeight }],
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          backgroundColor: 'white',
        }}
      >
        
        <View className="flex-row justify-around bg-white py-2 border-b border-gray-200">
          <TouchableOpacity
            className={`flex-1 items-center py-2 ${activeTab === 'Matches & Events' ? 'border-b-2 border-[#007AFF]' : ''}`}
            onPress={() => setActiveTab('Matches & Events')}
          >
            <Text className={`text-sm ${activeTab === 'Matches & Events' ? 'font-bold text-[#007AFF]' : 'text-gray-600'}`}>Matches</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className={`flex-1 items-center py-2 ${activeTab === 'News' ? 'border-b-2 border-[#007AFF]' : ''}`}
            onPress={() => setActiveTab('News')}
          >
            <Text className={`text-sm ${activeTab === 'News' ? 'font-bold text-[#007AFF]' : 'text-gray-600'}`}>News</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className={`flex-1 items-center py-2 ${activeTab === 'Media' ? 'border-b-2 border-[#007AFF]' : ''}`}
            onPress={() => setActiveTab('Media')}
          >
            <Text className={`text-sm ${activeTab === 'Media' ? 'font-bold text-[#007AFF]' : 'text-gray-600'}`}>Media</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Content with padding to account for header and tab bar */}
      <Animated.ScrollView
        className="flex-1 bg-gray-100"
        contentContainerStyle={{ paddingTop: totalHeaderHeight }} // Add padding for header + tab bar
        scrollEventThrottle={16}
        onScroll={handleScroll}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={["#007AFF"]}
            tintColor="#007AFF"
            progressViewOffset={totalHeaderHeight}
          />
        }
      >
        {renderTabContent()}
        <View className="h-20" /> {/* Bottom padding for FAB */}
      </Animated.ScrollView>

      {/* Floating Action Button for Upload */}
      {authUser && (
        <TouchableOpacity
          className="absolute bottom-6 right-6 w-14 h-14 bg-blue-600 rounded-full items-center justify-center shadow-lg shadow-gray-500 elevation-5"
          onPress={() => setUploadModalVisible(true)}
        >
          <Plus size={28} color="#fff" />
        </TouchableOpacity>
      )}

      {/* Media Upload Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isUploadModalVisible}
        onRequestClose={() => setUploadModalVisible(false)}
      >
        <View className="flex-1 justify-end items-center bg-black/50">
          <View className="w-full max-h-[90%] bg-white rounded-t-lg p-5">
            <View className="flex-row justify-between items-center mb-4 pb-2 border-b border-gray-200">
              <Text className="text-xl font-bold text-gray-800">Upload Media</Text>
              <TouchableOpacity onPress={() => setUploadModalVisible(false)} className="p-2">
                <X size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView className="flex-1">
              {authUser && <MediaPostUpload currentUserId={authUser.id} />}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default HomeScreen;