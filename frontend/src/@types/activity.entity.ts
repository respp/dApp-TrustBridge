export enum ActivityType {
  SUPPLY = 'supply',
  BORROW = 'borrow',
  REPAY = 'repay',
  LIQUIDATION = 'liquidation',
  WITHDRAWAL = 'withdrawal'
}

export interface PoolActivity {
  id: string;
  type: ActivityType;
  user: string;
  asset: string;
  amount: string;
  timestamp: Date;
  transactionHash: string;
  blockNumber?: number;
  explorerUrl?: string;
  usdValue?: number;
  healthFactor?: number;
}

export interface ActivityFilters {
  type?: ActivityType;
  asset?: string;
  user?: string;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
}

export interface ActivityPagination {
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

export interface ActivityFeedState {
  activities: PoolActivity[];
  loading: boolean;
  error: string | null;
  filters: ActivityFilters;
  pagination: ActivityPagination;
  realTimeEnabled: boolean;
}

export interface TransactionDetails {
  hash: string;
  blockNumber: number;
  gasUsed: string;
  gasPrice: string;
  from: string;
  to: string;
  value: string;
  status: 'pending' | 'confirmed' | 'failed';
  confirmations: number;
}

export interface ActivityIconProps {
  type: ActivityType;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export interface ActivityItemProps {
  activity: PoolActivity;
  showDetails?: boolean;
  onExpand?: (activity: PoolActivity) => void;
  onViewExplorer?: (hash: string) => void;
}

export interface ActivityFeedProps {
  poolId?: string;
  filters?: ActivityFilters;
  autoRefresh?: boolean;
  refreshInterval?: number;
  onActivityClick?: (activity: PoolActivity) => void;
}
