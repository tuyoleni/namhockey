import { useEffect, useCallback } from 'react';
import { useHomeScreenStore } from 'store/homeScreenStore';

export function useHomeScreenData() {
  const upcomingEvents      = useHomeScreenStore(s => s.upcomingEvents);
  const recentResults       = useHomeScreenStore(s => s.recentResults);
  const latestNews          = useHomeScreenStore(s => s.latestNews);
  const loadingEvents       = useHomeScreenStore(s => s.loadingEvents);
  const loadingResults      = useHomeScreenStore(s => s.loadingResults);
  const loadingNews         = useHomeScreenStore(s => s.loadingNews);
  const refreshing          = useHomeScreenStore(s => s.refreshing);

  const fetchUpcomingEvents = useHomeScreenStore(s => s.fetchUpcomingEvents);
  const fetchRecentResults  = useHomeScreenStore(s => s.fetchRecentResults);
  const fetchLatestNews     = useHomeScreenStore(s => s.fetchLatestNews);

  // **NEW**: on mount, load everything once
  useEffect(() => {
    Promise.all([
      fetchUpcomingEvents(),
      fetchRecentResults(),
      fetchLatestNews(),
    ]);
  }, [fetchUpcomingEvents, fetchRecentResults, fetchLatestNews]);

  const onRefresh = useCallback(async () => {
    useHomeScreenStore.setState({ refreshing: true });
    await Promise.all([
      fetchUpcomingEvents(),
      fetchRecentResults(),
      fetchLatestNews(),
    ]);
    useHomeScreenStore.setState({ refreshing: false });
  }, [fetchUpcomingEvents, fetchRecentResults, fetchLatestNews]);

  return {
    upcomingEvents,
    recentResults,
    latestNews,
    loadingEvents,
    loadingResults,
    loadingNews,
    refreshing,
    onRefresh,
  };
}
