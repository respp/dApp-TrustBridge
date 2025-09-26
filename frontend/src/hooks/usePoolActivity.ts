import { useState, useEffect, useCallback, useRef } from 'react';
import { PoolActivity, ActivityFilters, ActivityPagination, ActivityFeedState } from '@/@types/activity.entity';
import { TransactionMonitoringHelper } from '@/helpers/transaction-monitoring.helper';

interface UsePoolActivityOptions {
  poolId?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
  initialFilters?: ActivityFilters;
  pageSize?: number;
}

interface UsePoolActivityReturn {
  state: ActivityFeedState;
  actions: {
    refresh: () => Promise<void>;
    loadMore: () => Promise<void>;
    setFilters: (filters: ActivityFilters) => void;
    clearFilters: () => void;
    toggleRealTime: () => void;
    retry: () => void;
  };
}

export const usePoolActivity = (options: UsePoolActivityOptions = {}): UsePoolActivityReturn => {
  const {
    poolId,
    autoRefresh = true,
    refreshInterval = 30000, // 30 seconds
    initialFilters = {},
    pageSize = 20
  } = options;

  const [state, setState] = useState<ActivityFeedState>({
    activities: [],
    loading: false,
    error: null,
    filters: initialFilters,
    pagination: {
      page: 1,
      limit: pageSize,
      total: 0,
      hasMore: true
    },
    realTimeEnabled: autoRefresh
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const retryCountRef = useRef(0);
  const maxRetries = 3;

  // WebSocket connection for real-time updates
  const connectWebSocket = useCallback(() => {
    if (!poolId || wsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      // This would connect to a real WebSocket endpoint
      // For now, we'll simulate with polling
      console.log('WebSocket connection would be established here');
    } catch (error) {
      console.error('WebSocket connection failed:', error);
      setState(prev => ({ ...prev, error: 'Real-time connection failed' }));
    }
  }, [poolId]);

  // Polling fallback for real-time updates
  const startPolling = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    
    if (state.realTimeEnabled) {
      intervalRef.current = setInterval(() => {
        fetchActivities();
      }, refreshInterval);
    }
  }, [state.realTimeEnabled, refreshInterval]);

  // Fetch activities from API
  const fetchActivities = useCallback(async (page = 1, append = false) => {
    if (state.loading) return;

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Simulate API call - in real implementation, this would call the actual API
      const mockActivities = await simulateFetchActivities(poolId, page, state.filters);
      
      setState(prev => ({
        ...prev,
        activities: append ? [...prev.activities, ...mockActivities] : mockActivities,
        loading: false,
        pagination: {
          ...prev.pagination,
          page,
          total: mockActivities.length * 10, // Mock total
          hasMore: mockActivities.length === pageSize
        }
      }));

      retryCountRef.current = 0;
    } catch (error) {
      console.error('Error fetching activities:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch activities'
      }));
    }
  }, [poolId, state.filters, pageSize]);

  // Load more activities (pagination)
  const loadMore = useCallback(async () => {
    if (state.loading || !state.pagination.hasMore) return;
    
    const nextPage = state.pagination.page + 1;
    await fetchActivities(nextPage, true);
  }, [state.loading, state.pagination, fetchActivities]);

  // Refresh activities
  const refresh = useCallback(async () => {
    await fetchActivities(1, false);
  }, [fetchActivities]);

  // Set filters and refresh
  const setFilters = useCallback((filters: ActivityFilters) => {
    setState(prev => ({ ...prev, filters }));
    // Debounce filter changes
    setTimeout(() => {
      fetchActivities(1, false);
    }, 300);
  }, [fetchActivities]);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setState(prev => ({ ...prev, filters: {} }));
    fetchActivities(1, false);
  }, [fetchActivities]);

  // Toggle real-time updates
  const toggleRealTime = useCallback(() => {
    setState(prev => ({ ...prev, realTimeEnabled: !prev.realTimeEnabled }));
  }, []);

  // Retry failed requests
  const retry = useCallback(async () => {
    if (retryCountRef.current >= maxRetries) {
      setState(prev => ({ ...prev, error: 'Max retries exceeded' }));
      return;
    }

    retryCountRef.current++;
    await fetchActivities(1, false);
  }, [fetchActivities]);

  // Initial load
  useEffect(() => {
    fetchActivities(1, false);
  }, [poolId]);

  // Real-time updates
  useEffect(() => {
    if (state.realTimeEnabled) {
      connectWebSocket();
      startPolling();
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (wsRef.current) wsRef.current.close();
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (wsRef.current) wsRef.current.close();
    };
  }, [state.realTimeEnabled, connectWebSocket, startPolling]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  return {
    state,
    actions: {
      refresh,
      loadMore,
      setFilters,
      clearFilters,
      toggleRealTime,
      retry
    }
  };
};

// Mock function to simulate API calls
async function simulateFetchActivities(
  poolId?: string,
  page = 1,
  filters: ActivityFilters = {}
): Promise<PoolActivity[]> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Generate mock activities
  const mockActivities: PoolActivity[] = [
    {
      id: `activity-${page}-1`,
      type: 'supply' as any,
      user: 'GABC123...XYZ789',
      asset: 'USDC',
      amount: '1000.00',
      timestamp: new Date(Date.now() - Math.random() * 86400000),
      transactionHash: '0x' + Math.random().toString(16).substr(2, 64),
      blockNumber: 12345 + page,
      explorerUrl: 'https://stellar.expert/explorer/testnet/tx/0x123',
      usdValue: 1000.00
    },
    {
      id: `activity-${page}-2`,
      type: 'borrow' as any,
      user: 'GDEF456...UVW012',
      asset: 'XLM',
      amount: '500.00',
      timestamp: new Date(Date.now() - Math.random() * 86400000),
      transactionHash: '0x' + Math.random().toString(16).substr(2, 64),
      blockNumber: 12346 + page,
      explorerUrl: 'https://stellar.expert/explorer/testnet/tx/0x456',
      usdValue: 250.00
    },
    {
      id: `activity-${page}-3`,
      type: 'repay' as any,
      user: 'GHIJ789...RST345',
      asset: 'USDC',
      amount: '250.00',
      timestamp: new Date(Date.now() - Math.random() * 86400000),
      transactionHash: '0x' + Math.random().toString(16).substr(2, 64),
      blockNumber: 12347 + page,
      explorerUrl: 'https://stellar.expert/explorer/testnet/tx/0x789',
      usdValue: 250.00
    }
  ];

  // Apply filters
  return TransactionMonitoringHelper.filterActivities(mockActivities, filters);
}
