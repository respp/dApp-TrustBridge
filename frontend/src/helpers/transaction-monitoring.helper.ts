import { PoolActivity, ActivityType, TransactionDetails } from '@/@types/activity.entity';

export interface StellarTransaction {
  id: string;
  hash: string;
  ledger: number;
  created_at: string;
  source_account: string;
  operations: StellarOperation[];
  fee_paid: string;
  result_code: string;
  result_meta: any;
}

export interface StellarOperation {
  id: string;
  type: string;
  source_account?: string;
  asset_code?: string;
  asset_issuer?: string;
  amount?: string;
  from?: string;
  to?: string;
}

export interface BlendProtocolEvent {
  type: string;
  poolId: string;
  user: string;
  asset: string;
  amount: string;
  timestamp: string;
  transactionHash: string;
  blockNumber: number;
}

export class TransactionMonitoringHelper {
  private static readonly STELLAR_EXPLORER_BASE = 'https://stellar.expert/explorer/testnet/tx';
  private static readonly BLEND_EVENT_TYPES = {
    SUPPLY: ['supply', 'deposit', 'lend'],
    BORROW: ['borrow', 'withdraw_borrow'],
    REPAY: ['repay', 'repay_borrow'],
    LIQUIDATION: ['liquidation', 'liquidate'],
    WITHDRAWAL: ['withdraw', 'redeem']
  };

  /**
   * Parse Stellar transaction and convert to PoolActivity
   */
  static parseStellarTransaction(
    tx: StellarTransaction,
    poolId?: string
  ): PoolActivity | null {
    try {
      const activityType = this.determineActivityType(tx);
      if (!activityType) return null;

      const operation = this.getRelevantOperation(tx, activityType);
      if (!operation) return null;

      return {
        id: tx.id,
        type: activityType,
        user: operation.source_account || tx.source_account,
        asset: operation.asset_code || 'XLM',
        amount: operation.amount || '0',
        timestamp: new Date(tx.created_at),
        transactionHash: tx.hash,
        blockNumber: tx.ledger,
        explorerUrl: `${this.STELLAR_EXPLORER_BASE}/${tx.hash}`,
        healthFactor: this.calculateHealthFactor(tx, operation)
      };
    } catch (error) {
      console.error('Error parsing Stellar transaction:', error);
      return null;
    }
  }

  /**
   * Parse Blend Protocol event and convert to PoolActivity
   */
  static parseBlendEvent(event: BlendProtocolEvent): PoolActivity {
    return {
      id: `${event.transactionHash}-${event.type}`,
      type: this.mapBlendEventType(event.type),
      user: event.user,
      asset: event.asset,
      amount: event.amount,
      timestamp: new Date(event.timestamp),
      transactionHash: event.transactionHash,
      blockNumber: event.blockNumber,
      explorerUrl: `${this.STELLAR_EXPLORER_BASE}/${event.transactionHash}`
    };
  }

  /**
   * Determine activity type from Stellar transaction
   */
  private static determineActivityType(tx: StellarTransaction): ActivityType | null {
    const operations = tx.operations;
    
    for (const op of operations) {
      const opType = op.type.toLowerCase();
      
      if (this.BLEND_EVENT_TYPES.SUPPLY.some(type => opType.includes(type))) {
        return ActivityType.SUPPLY;
      }
      if (this.BLEND_EVENT_TYPES.BORROW.some(type => opType.includes(type))) {
        return ActivityType.BORROW;
      }
      if (this.BLEND_EVENT_TYPES.REPAY.some(type => opType.includes(type))) {
        return ActivityType.REPAY;
      }
      if (this.BLEND_EVENT_TYPES.LIQUIDATION.some(type => opType.includes(type))) {
        return ActivityType.LIQUIDATION;
      }
      if (this.BLEND_EVENT_TYPES.WITHDRAWAL.some(type => opType.includes(type))) {
        return ActivityType.WITHDRAWAL;
      }
    }
    
    return null;
  }

  /**
   * Get the most relevant operation from transaction
   */
  private static getRelevantOperation(
    tx: StellarTransaction,
    activityType: ActivityType
  ): StellarOperation | null {
    const operations = tx.operations;
    
    // For most activity types, return the first operation
    // For liquidations, look for specific liquidation operations
    if (activityType === ActivityType.LIQUIDATION) {
      return operations.find(op => 
        op.type.toLowerCase().includes('liquidation') ||
        op.type.toLowerCase().includes('liquidate')
      ) || operations[0];
    }
    
    return operations[0] || null;
  }

  /**
   * Map Blend Protocol event type to ActivityType
   */
  private static mapBlendEventType(eventType: string): ActivityType {
    const type = eventType.toLowerCase();
    
    if (this.BLEND_EVENT_TYPES.SUPPLY.some(t => type.includes(t))) {
      return ActivityType.SUPPLY;
    }
    if (this.BLEND_EVENT_TYPES.BORROW.some(t => type.includes(t))) {
      return ActivityType.BORROW;
    }
    if (this.BLEND_EVENT_TYPES.REPAY.some(t => type.includes(t))) {
      return ActivityType.REPAY;
    }
    if (this.BLEND_EVENT_TYPES.LIQUIDATION.some(t => type.includes(t))) {
      return ActivityType.LIQUIDATION;
    }
    if (this.BLEND_EVENT_TYPES.WITHDRAWAL.some(t => type.includes(t))) {
      return ActivityType.WITHDRAWAL;
    }
    
    return ActivityType.SUPPLY; // Default fallback
  }

  /**
   * Calculate health factor for transaction
   */
  private static calculateHealthFactor(
    tx: StellarTransaction,
    operation: StellarOperation
  ): number | undefined {
    // This would integrate with the existing health factor calculation
    // For now, return undefined as it requires pool state
    return undefined;
  }

  /**
   * Format amount for display
   */
  static formatAmount(amount: string, asset: string): string {
    const numAmount = parseFloat(amount);
    
    if (asset === 'XLM') {
      return `${numAmount.toFixed(7)} XLM`;
    }
    if (asset === 'USDC') {
      return `${numAmount.toFixed(2)} USDC`;
    }
    if (asset === 'TBRG') {
      return `${numAmount.toFixed(4)} TBRG`;
    }
    
    return `${numAmount.toFixed(6)} ${asset}`;
  }

  /**
   * Format timestamp for display
   */
  static formatTimestamp(timestamp: Date): string {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    
    return timestamp.toLocaleDateString();
  }

  /**
   * Get activity icon based on type
   */
  static getActivityIcon(type: ActivityType): string {
    const icons = {
      [ActivityType.SUPPLY]: '📈',
      [ActivityType.BORROW]: '📉',
      [ActivityType.REPAY]: '💰',
      [ActivityType.LIQUIDATION]: '⚠️',
      [ActivityType.WITHDRAWAL]: '🔄'
    };
    
    return icons[type] || '📊';
  }

  /**
   * Get activity color based on type
   */
  static getActivityColor(type: ActivityType): string {
    const colors = {
      [ActivityType.SUPPLY]: 'text-green-600',
      [ActivityType.BORROW]: 'text-blue-600',
      [ActivityType.REPAY]: 'text-purple-600',
      [ActivityType.LIQUIDATION]: 'text-red-600',
      [ActivityType.WITHDRAWAL]: 'text-orange-600'
    };
    
    return colors[type] || 'text-gray-600';
  }

  /**
   * Validate transaction hash
   */
  static isValidTransactionHash(hash: string): boolean {
    // Stellar transaction hashes are 64 characters long and hexadecimal
    return /^[a-fA-F0-9]{64}$/.test(hash);
  }

  /**
   * Get transaction details from Stellar network
   */
  static async getTransactionDetails(hash: string): Promise<TransactionDetails | null> {
    try {
      // This would integrate with Stellar SDK to fetch transaction details
      // For now, return a mock structure
      return {
        hash,
        blockNumber: 0,
        gasUsed: '0',
        gasPrice: '0',
        from: '',
        to: '',
        value: '0',
        status: 'confirmed',
        confirmations: 1
      };
    } catch (error) {
      console.error('Error fetching transaction details:', error);
      return null;
    }
  }

  /**
   * Filter activities based on criteria
   */
  static filterActivities(
    activities: PoolActivity[],
    filters: {
      type?: ActivityType;
      asset?: string;
      user?: string;
      dateFrom?: Date;
      dateTo?: Date;
      search?: string;
    }
  ): PoolActivity[] {
    return activities.filter(activity => {
      if (filters.type && activity.type !== filters.type) return false;
      if (filters.asset && activity.asset !== filters.asset) return false;
      if (filters.user && activity.user !== filters.user) return false;
      if (filters.dateFrom && activity.timestamp < filters.dateFrom) return false;
      if (filters.dateTo && activity.timestamp > filters.dateTo) return false;
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        return (
          activity.asset.toLowerCase().includes(searchLower) ||
          activity.amount.toLowerCase().includes(searchLower) ||
          activity.transactionHash.toLowerCase().includes(searchLower)
        );
      }
      return true;
    });
  }
}
