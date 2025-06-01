import React from 'react';
import { useBackendStatus } from '@/hooks/useBackendStatus';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertTriangle, XCircle, Clock } from 'lucide-react';

export const StatusBanner = () => {
  const { data, isLoading, error } = useBackendStatus();

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 rounded-md bg-blue-50 p-3 text-blue-800 shadow-sm">
        <Clock className="h-4 w-4 animate-spin" />
        <span>Checking system health...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 rounded-md bg-red-50 p-3 text-red-800 shadow-sm">
        <XCircle className="h-4 w-4" />
        <span>Backend unreachable</span>
        <Badge variant="destructive" className="ml-auto">
          OFFLINE
        </Badge>
      </div>
    );
  }

  const getStatusIcon = () => {
    switch (data?.status) {
      case 'OK':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'DEGRADED':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      default:
        return <XCircle className="h-4 w-4 text-red-600" />;
    }
  };

  const getStatusColor = () => {
    switch (data?.status) {
      case 'OK':
        return 'bg-green-50 text-green-800 border-green-200';
      case 'DEGRADED':
        return 'bg-yellow-50 text-yellow-800 border-yellow-200';
      default:
        return 'bg-red-50 text-red-800 border-red-200';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div className={`flex items-center gap-3 rounded-md border p-3 shadow-sm ${getStatusColor()}`}>
      {getStatusIcon()}

      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium">System Status: {data?.status}</span>
          {data?.qaResults && (
            <Badge variant="outline" className="text-xs">
              QA: {data.qaResults.passRate}% ({data.qaResults.totalTests} tests)
            </Badge>
          )}
        </div>

        <div className="text-xs opacity-75">
          Last checked: {data?.timestamp ? formatTimestamp(data.timestamp) : 'Unknown'}
          {data?.notes && ` • ${data.notes}`}
        </div>
      </div>

      <Badge variant={data?.status === 'OK' ? 'default' : 'destructive'} className="ml-auto">
        {data?.status === 'OK' ? 'HEALTHY' : data?.status}
      </Badge>
    </div>
  );
};
