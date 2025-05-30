import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  SafeAreaView,
  Animated,
  NativeScrollEvent,
  StatusBar,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import Modal from 'react-native-modal';
import { useRouter } from 'expo-router';
import { useNewsStore } from 'store/newsStore';
import { useEventStore } from 'store/eventStore';
import { useMediaStore } from 'store/mediaStore';
import { useUserStore } from 'store/userStore';

import MediaPostList from '@components/home/MediaPostList';
import MediaPostUpload from '@components/home/MediaPostUpload';
import { InfoMessage } from '@components/ui/InfoMessage';
import NewsFeed from '@components/home/NewsPost';
import AllEvents from '@components/home/AllEvents';

import { Plus, X } from 'lucide-react-native';

type ActiveHomeTab = 'Events' | 'News' | 'Media';

const TAB_BAR_HEIGHT = 44;

const HomeScreen: React.FC = () => {
  const router = useRouter();
  const scrollOffsetY = useRef(new Animated.Value(0)).current;
  const lastScrollOffsetY = useRef(0);

  const { 
    fetchNewsArticles,
    subscribeToNewsArticles,
    loadingNews,
    error: newsError
  } = useNewsStore();

  const { 
    fetchEvents,
    subscribeToEvents,
    loadingEvents,
    error: eventError
  } = useEventStore();

  const { 
    loadAllMediaPosts: fetchMedia, 
    isLoadingMedia, 
    operationError: mediaError 
  } = useMediaStore();
  
  const { 
    fetchAuthUser,
    authUser,
    loading: loadingUser,
    error: userError
  } = useUserStore();

  const [isScreenRefreshing, setIsScreenRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<ActiveHomeTab>('Events');
  const [isCreatePostModalOpen, setIsCreatePostModalOpen] = useState(false);
  const [isTopTabBarVisible, setIsTopTabBarVisible] = useState(true);

  const handlePageScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollOffsetY } } }],
    {
      useNativeDriver: true,
      listener: (event) => {
        const currentScrollY = (event.nativeEvent as NativeScrollEvent).contentOffset.y;
        if (currentScrollY < lastScrollOffsetY.current || currentScrollY <= 0) {
          setIsTopTabBarVisible(true);
        } else if (currentScrollY > lastScrollOffsetY.current && currentScrollY > 10) {
          setIsTopTabBarVisible(false);
        }
        lastScrollOffsetY.current = currentScrollY;
      }
    }
  );

  const refreshAllScreenData = useCallback(async () => {
    await Promise.all([
      fetchNewsArticles(),
      fetchEvents(),
      fetchMedia(),
      fetchAuthUser(),
    ]);
  }, [fetchNewsArticles, fetchEvents, fetchMedia, fetchAuthUser]);

  useEffect(() => {
    refreshAllScreenData();
    const unsubscribeNewsFeed = subscribeToNewsArticles();
    const unsubscribeEventsFeed = subscribeToEvents();
    return () => {
      unsubscribeNewsFeed();
      unsubscribeEventsFeed();
    };
  }, [refreshAllScreenData, subscribeToNewsArticles, subscribeToEvents]);

  useEffect(() => {
    if (!loadingUser && !authUser) {
      router.replace('/(auth)/login');
    }
  }, [loadingUser, authUser, router]);

  const handleScreenRefresh = useCallback(async () => {
    setIsScreenRefreshing(true);
    setIsTopTabBarVisible(true); 
    await refreshAllScreenData();
    setIsScreenRefreshing(false);
  }, [refreshAllScreenData]);

  if (loadingNews || loadingEvents || isLoadingMedia || loadingUser) {
    return <InfoMessage message="Loading..." type="loading" />;
  }

  const combinedError = [newsError, eventError, mediaError, userError].filter(Boolean).join('\n');
  if (combinedError) {
    return <InfoMessage message="Error loading data" type="error" details={combinedError} />;
  }

  if (!authUser && !loadingUser) {
    return null; 
  }

  const renderActiveTabContent = () => {
    switch (selectedTab) {
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

  const needsScrollViewWrapper = selectedTab !== 'News';

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" />

      <Animated.View
        className="absolute top-0 left-0 right-0 z-50 bg-white shadow-sm"
        style={{ transform: [{ translateY: isTopTabBarVisible ? 0 : -TAB_BAR_HEIGHT }] }}
      >
        <View className="flex-row justify-around border-b border-gray-200">
          {(['Events', 'News', 'Media'] as ActiveHomeTab[]).map(tabName => (
            <TouchableOpacity
              key={tabName}
              className={`flex-1 items-center py-3 ${selectedTab === tabName ? 'border-b-2 border-sky-500' : ''}`}
              onPress={() => setSelectedTab(tabName)}
            >
              <Text className={`text-sm ${selectedTab === tabName ? 'font-semibold text-sky-600' : 'text-gray-600'}`}>
                {tabName}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </Animated.View>

      {needsScrollViewWrapper ? (
        <Animated.ScrollView
          className="flex-1 bg-gray-100"
          contentContainerStyle={{ paddingTop: TAB_BAR_HEIGHT }}
          scrollEventThrottle={16}
          onScroll={handlePageScroll}
          refreshControl={
            <RefreshControl
              refreshing={isScreenRefreshing}
              onRefresh={handleScreenRefresh}
              colors={["#007AFF"]}
              tintColor="#007AFF"
              progressViewOffset={TAB_BAR_HEIGHT}
            />
          }
        >
          {renderActiveTabContent()}
          <View className="h-24" />
        </Animated.ScrollView>
      ) : (
        <View style={{paddingTop: TAB_BAR_HEIGHT}} className="flex-1 bg-gray-100">
          {renderActiveTabContent()}
        </View>
      )}

      {authUser && (
        <TouchableOpacity
          className="absolute bottom-6 right-6 w-14 h-14 bg-sky-500 rounded-full items-center justify-center shadow-lg"
          onPress={() => setIsCreatePostModalOpen(true)}
        >
          <Plus size={24} color="white" />
        </TouchableOpacity>
      )}

      <Modal
        isVisible={isCreatePostModalOpen}
        onBackdropPress={() => setIsCreatePostModalOpen(false)}
        onSwipeComplete={() => setIsCreatePostModalOpen(false)}
        swipeDirection={['down']}
        animationIn="slideInUp"
        animationOut="slideOutDown"
        backdropColor="black"
        backdropOpacity={0.65}
        style={{ justifyContent: 'flex-end', margin: 0 }}
        useNativeDriverForBackdrop
        propagateSwipe // Allows scrolling within modal content if swipe is not caught by modal itself
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="w-full"
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0} 
        >
          <SafeAreaView className="w-full max-h-[90vh]">
            <View className="w-full bg-gray-50 rounded-t-2xl shadow-xl overflow-hidden">
              <View className="flex-row justify-between items-center px-5 py-[15px] bg-white border-b border-gray-200">
                <Text className="text-xl font-bold text-gray-800">Create New Media Post</Text>
                <TouchableOpacity 
                  onPress={() => setIsCreatePostModalOpen(false)} 
                  className="p-2 rounded-full active:bg-gray-100"
                >
                  <X size={20} color="#4B5263" />
                </TouchableOpacity>
              </View>
              
              <View className="max-h-[calc(0.9*100vh-80px)]"> 
                {authUser && <MediaPostUpload loggedInUserId={authUser.id} />}
              </View>
            </View>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
};

export default HomeScreen;