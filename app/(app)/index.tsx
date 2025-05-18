import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  SafeAreaView,
  Modal,
  Animated,
  NativeScrollEvent,
  StatusBar
} from 'react-native';
import { useRouter } from 'expo-router';
import { useNewsStore } from 'store/newsStore';
import { useEventStore } from 'store/eventStore';
import { useMediaStore } from 'store/mediaStore';
import { useUserStore } from 'store/userStore';

import MediaPostList from '@components/home/MediaPostList';
import MediaPostUpload from '@components/home/MediaPostUpload';
import { InfoMessage } from '@components/ui/InfoMessage';

import { Plus, X } from 'lucide-react-native';
import NewsFeed from '@components/home/NewsPost';
import AllEvents from '@components/home/AllEvents';

type Tab = 'Events' | 'News' | 'Media';

const HomeScreen: React.FC = () => {
  const router = useRouter();
  const scrollY = useRef(new Animated.Value(0)).current;
  const lastScrollY = useRef(0);

  const tabBarHeight = 44;

  const { fetchNewsArticles, subscribeToNewsArticles, loadingNews, error: newsError } = useNewsStore();
  const { fetchEvents, subscribeToEvents, loadingEvents, error: eventError } = useEventStore();
  const { fetchMediaPosts, loadingMedia, error: mediaError } = useMediaStore();
  const { fetchAuthUser, authUser, loading: loadingUser, error: userError } = useUserStore();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('Events');
  const [isUploadModalVisible, setUploadModalVisible] = useState(false);
  const [isTabBarVisible, setIsTabBarVisible] = useState(true);

  const tabBarTranslateY = scrollY.interpolate({
    inputRange: [0, 10, 50],
    outputRange: [0, 0, -tabBarHeight],
    extrapolate: 'clamp',
  });

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    {
      useNativeDriver: true,
      listener: (event) => {
        const currentScrollY = (event.nativeEvent as NativeScrollEvent).contentOffset.y;
        if (currentScrollY < lastScrollY.current || currentScrollY <= 0) {
          setIsTabBarVisible(true);
        } else if (currentScrollY > lastScrollY.current && currentScrollY > 10) {
          setIsTabBarVisible(false);
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
    setIsTabBarVisible(true);
    await loadAllData();
    setIsRefreshing(false);
  }, [loadAllData]);

  if (loadingNews || loadingEvents || loadingMedia || loadingUser) {
    return <InfoMessage message="Loading..." type="loading" />;
  }

  if (newsError || eventError || mediaError || userError) {
    return (
      <InfoMessage
        message="Error loading data"
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
      case 'Events':
        return <AllEvents />;
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
      <StatusBar barStyle="dark-content" />
      
      <Animated.View 
        style={{ 
          transform: [{ translateY: isTabBarVisible ? 0 : -tabBarHeight }],
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          backgroundColor: 'white',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.1,
          shadowRadius: 2,
          elevation: 3,
        }}
      >
        <View className="flex-row justify-around bg-white border-b border-gray-200">
          <TouchableOpacity
            className={`flex-1 items-center py-3 ${activeTab === 'Events' ? 'border-b-2 border-[#007AFF]' : ''}`}
            onPress={() => setActiveTab('Events')}
          >
            <Text className={`text-sm ${activeTab === 'Events' ? 'font-bold text-[#007AFF]' : 'text-gray-600'}`}>Events</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className={`flex-1 items-center py-3 ${activeTab === 'News' ? 'border-b-2 border-[#007AFF]' : ''}`}
            onPress={() => setActiveTab('News')}
          >
            <Text className={`text-sm ${activeTab === 'News' ? 'font-bold text-[#007AFF]' : 'text-gray-600'}`}>News</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className={`flex-1 items-center py-3 ${activeTab === 'Media' ? 'border-b-2 border-[#007AFF]' : ''}`}
            onPress={() => setActiveTab('Media')}
          >
            <Text className={`text-sm ${activeTab === 'Media' ? 'font-bold text-[#007AFF]' : 'text-gray-600'}`}>Media</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      <Animated.ScrollView
        className="flex-1 bg-gray-100"
        contentContainerStyle={{ paddingTop: tabBarHeight }}
        scrollEventThrottle={16}
        onScroll={handleScroll}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={["#007AFF"]}
            tintColor="#007AFF"
            progressViewOffset={tabBarHeight}
          />
        }
      >
        {renderTabContent()}
        <View className="h-20" /> 
      </Animated.ScrollView>

      {authUser && (
        <TouchableOpacity
          className="absolute bottom-6 right-6 w-14 h-14 bg-[#007AFF] rounded-full items-center justify-center"
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: 0.2,
            shadowRadius: 4,
            elevation: 5,
          }}
          onPress={() => setUploadModalVisible(true)}
        >
          <Plus size={24} color="#fff" />
        </TouchableOpacity>
      )}

      <Modal
        animationType="slide"
        transparent={true}
        visible={isUploadModalVisible}
        onRequestClose={() => setUploadModalVisible(false)}
      >
        <View className="flex-1 justify-end items-center bg-black/50">
          <View className="w-full max-h-[90%] bg-white rounded-t-2xl">
            <View className="w-12 h-1 bg-gray-300 rounded-full mx-auto mt-2 mb-4" />
            <View className="px-5 py-3 border-b border-gray-200 mb-2">
              <View className="flex-row justify-between items-center">
                <Text className="text-xl font-bold text-gray-800">Upload Media</Text>
                <TouchableOpacity onPress={() => setUploadModalVisible(false)} className="p-2">
                  <X size={24} color="#666" />
                </TouchableOpacity>
              </View>
            </View>
            <ScrollView className="flex-1 px-5">
              {authUser && <MediaPostUpload currentUserId={authUser.id} />}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default HomeScreen;
