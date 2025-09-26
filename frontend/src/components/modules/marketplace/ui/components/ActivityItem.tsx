'use client';

import React, { useState } from 'react';
import { PoolActivity, ActivityItemProps } from '@/@types/activity.entity';
import { TransactionMonitoringHelper } from '@/helpers/transaction-monitoring.helper';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, ChevronDown, ChevronUp, Clock, User, Hash } from 'lucide-react';
import { cn } from '@/lib/utils';

export const ActivityItem: React.FC<ActivityItemProps> = ({
  activity,
  showDetails = false,
  onExpand,
  onViewExplorer
}) => {
  const [isExpanded, setIsExpanded] = useState(showDetails);

  const handleExpand = () => {
    setIsExpanded(!isExpanded);
    onExpand?.(activity);
  };

  const handleViewExplorer = (e: React.MouseEvent) => {
    e.stopPropagation();
    onViewExplorer?.(activity.transactionHash);
  };

  const formatAmount = (amount: string, asset: string) => {
    return TransactionMonitoringHelper.formatAmount(amount, asset);
  };

  const formatTimestamp = (timestamp: Date) => {
    return TransactionMonitoringHelper.formatTimestamp(timestamp);
  };

  const getActivityIcon = (type: string) => {
    return TransactionMonitoringHelper.getActivityIcon(type as any);
  };

  const getActivityColor = (type: string) => {
    return TransactionMonitoringHelper.getActivityColor(type as any);
  };

  const getActivityLabel = (type: string) => {
    const labels = {
      supply: 'Supply',
      borrow: 'Borrow',
      repay: 'Repay',
      liquidation: 'Liquidation',
      withdrawal: 'Withdrawal'
    };
    return labels[type as keyof typeof labels] || type;
  };

  return (
    <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={handleExpand}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="text-2xl">{getActivityIcon(activity.type)}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <span className={cn("font-medium", getActivityColor(activity.type))}>
                {getActivityLabel(activity.type)}
              </span>
              <Badge variant="outline" className="text-xs">
                {activity.asset}
              </Badge>
            </div>
            <div className="text-sm text-gray-600 mt-1">
              {formatAmount(activity.amount, activity.asset)}
              {activity.usdValue && (
                <span className="ml-2 text-gray-500">
                  (${activity.usdValue.toFixed(2)})
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <div className="text-right">
            <div className="text-sm text-gray-500 flex items-center">
              <Clock className="w-3 h-3 mr-1" />
              {formatTimestamp(activity.timestamp)}
            </div>
            <div className="text-xs text-gray-400 flex items-center mt-1">
              <User className="w-3 h-3 mr-1" />
              {activity.user.slice(0, 8)}...{activity.user.slice(-4)}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleViewExplorer}
            className="p-1"
          >
            <ExternalLink className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleExpand}
            className="p-1"
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center text-sm">
                <Hash className="w-4 h-4 mr-2 text-gray-400" />
                <span className="text-gray-600">Transaction:</span>
                <code className="ml-2 text-xs bg-gray-100 px-2 py-1 rounded">
                  {activity.transactionHash.slice(0, 16)}...{activity.transactionHash.slice(-8)}
                </code>
              </div>
              <div className="flex items-center text-sm">
                <Clock className="w-4 h-4 mr-2 text-gray-400" />
                <span className="text-gray-600">Block:</span>
                <span className="ml-2 text-gray-800">{activity.blockNumber}</span>
              </div>
              {activity.healthFactor && (
                <div className="flex items-center text-sm">
                  <span className="text-gray-600">Health Factor:</span>
                  <span className={cn(
                    "ml-2 font-medium",
                    activity.healthFactor < 1.5 ? "text-red-600" : "text-green-600"
                  )}>
                    {activity.healthFactor.toFixed(2)}
                  </span>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <div className="flex items-center text-sm">
                <User className="w-4 h-4 mr-2 text-gray-400" />
                <span className="text-gray-600">User:</span>
                <code className="ml-2 text-xs bg-gray-100 px-2 py-1 rounded">
                  {activity.user}
                </code>
              </div>
              <div className="flex items-center text-sm">
                <span className="text-gray-600">Amount:</span>
                <span className="ml-2 font-medium">
                  {formatAmount(activity.amount, activity.asset)}
                </span>
              </div>
              <div className="flex items-center text-sm">
                <span className="text-gray-600">Time:</span>
                <span className="ml-2">
                  {activity.timestamp.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
          
          <div className="mt-4 flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleViewExplorer}
              className="flex items-center"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              View on Explorer
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigator.clipboard.writeText(activity.transactionHash)}
            >
              Copy Hash
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
};
