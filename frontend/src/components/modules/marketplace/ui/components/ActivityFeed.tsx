'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ActivityFeedProps, ActivityFilters, ActivityType } from '@/@types/activity.entity';
import { usePoolActivity } from '@/hooks/usePoolActivity';
import { ActivityItem } from './ActivityItem';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  RefreshCw, 
  Filter, 
  Search, 
  X, 
  Wifi, 
  WifiOff, 
  AlertCircle,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';

export const ActivityFeed: React.FC<ActivityFeedProps> = ({
  poolId,
  filters: initialFilters = {},
  autoRefresh = true,
  refreshInterval = 30000,
  onActivityClick
}) => {
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<ActivityType | 'all'>('all');
  const [selectedAsset, setSelectedAsset] = useState<string>('all');
  const [showUserOnly, setShowUserOnly] = useState(false);

  const { state, actions } = usePoolActivity({
    poolId,
    autoRefresh,
    refreshInterval,
    initialFilters
  });

  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && state.pagination.hasMore && !state.loading) {
          actions.loadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [state.pagination.hasMore, state.loading, actions]);

  // Apply filters
  const applyFilters = () => {
    const filters: ActivityFilters = {
      ...initialFilters,
      search: searchQuery || undefined,
      type: selectedType !== 'all' ? selectedType : undefined,
      asset: selectedAsset !== 'all' ? selectedAsset : undefined,
    };

    actions.setFilters(filters);
  };

  // Handle filter changes
  useEffect(() => {
    const timeoutId = setTimeout(applyFilters, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, selectedType, selectedAsset]);

  const handleActivityClick = (activity: any) => {
    onActivityClick?.(activity);
  };

  const handleRefresh = () => {
    actions.refresh();
  };

  const handleRetry = () => {
    actions.retry();
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedType('all');
    setSelectedAsset('all');
    setShowUserOnly(false);
    actions.clearFilters();
  };

  const activityTypes = [
    { value: 'all', label: 'All Activities' },
    { value: ActivityType.SUPPLY, label: 'Supply' },
    { value: ActivityType.BORROW, label: 'Borrow' },
    { value: ActivityType.REPAY, label: 'Repay' },
    { value: ActivityType.LIQUIDATION, label: 'Liquidation' },
    { value: ActivityType.WITHDRAWAL, label: 'Withdrawal' }
  ];

  const assetTypes = [
    { value: 'all', label: 'All Assets' },
    { value: 'USDC', label: 'USDC' },
    { value: 'XLM', label: 'XLM' },
    { value: 'TBRG', label: 'TBRG' }
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <h3 className="text-lg font-semibold">Pool Activity</h3>
          <Badge variant="outline" className="text-xs">
            {state.activities.length} activities
          </Badge>
          {state.realTimeEnabled && (
            <Badge variant="secondary" className="text-xs flex items-center">
              <Wifi className="w-3 h-3 mr-1" />
              Live
            </Badge>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={state.loading}
          >
            <RefreshCw className={cn("w-4 h-4 mr-2", state.loading && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <Card className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search activities..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Activity Type</label>
              <Select value={selectedType} onValueChange={(value) => setSelectedType(value as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {activityTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Asset</label>
              <Select value={selectedAsset} onValueChange={setSelectedAsset}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {assetTypes.map((asset) => (
                    <SelectItem key={asset.value} value={asset.value}>
                      {asset.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Actions</label>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearFilters}
                >
                  <X className="w-4 h-4 mr-2" />
                  Clear
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Error State */}
      {state.error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>{state.error}</span>
            <Button variant="outline" size="sm" onClick={handleRetry}>
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Loading State */}
      {state.loading && state.activities.length === 0 && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="p-4">
              <div className="flex items-center space-x-3">
                <Skeleton className="w-8 h-8 rounded" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-4 w-20" />
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Activities List */}
      {state.activities.length > 0 && (
        <div className="space-y-3">
          {state.activities.map((activity) => (
            <ActivityItem
              key={activity.id}
              activity={activity}
              onExpand={handleActivityClick}
              onViewExplorer={(hash) => {
                if (activity.explorerUrl) {
                  window.open(activity.explorerUrl, '_blank');
                }
              }}
            />
          ))}
        </div>
      )}

      {/* Load More */}
      {state.pagination.hasMore && (
        <div ref={loadMoreRef} className="flex justify-center py-4">
          {state.loading ? (
            <div className="flex items-center space-x-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm text-gray-500">Loading more activities...</span>
            </div>
          ) : (
            <Button
              variant="outline"
              onClick={actions.loadMore}
              disabled={state.loading}
            >
              Load More
            </Button>
          )}
        </div>
      )}

      {/* Empty State */}
      {!state.loading && state.activities.length === 0 && !state.error && (
        <Card className="p-8 text-center">
          <div className="text-gray-500">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-lg font-medium mb-2">No activities found</h3>
            <p className="text-sm">
              {Object.keys(state.filters).length > 0
                ? 'Try adjusting your filters to see more activities.'
                : 'Pool activities will appear here once transactions are made.'}
            </p>
          </div>
        </Card>
      )}

      {/* Real-time Status */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center space-x-2">
          {state.realTimeEnabled ? (
            <>
              <Wifi className="w-3 h-3" />
              <span>Real-time updates enabled</span>
            </>
          ) : (
            <>
              <WifiOff className="w-3 h-3" />
              <span>Real-time updates disabled</span>
            </>
          )}
        </div>
        <div className="flex items-center space-x-4">
          <span>Page {state.pagination.page} of {Math.ceil(state.pagination.total / 20)}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={actions.toggleRealTime}
            className="text-xs"
          >
            {state.realTimeEnabled ? 'Disable' : 'Enable'} Live Updates
          </Button>
        </div>
      </div>
    </div>
  );
};
