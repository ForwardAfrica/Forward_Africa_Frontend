import React, { useState, useEffect } from 'react';
import {
  Play,
  Pause,
  Clock,
  Activity,
  Wifi,
  WifiOff,
  Smartphone,
  Monitor,
  Tablet,
  TrendingUp,
  Eye,
  Zap
} from 'lucide-react';
import { RealTimeProgressData } from '../../types';

interface RealTimeProgressProps {
  data: RealTimeProgressData | null;
  isConnected: boolean;
  className?: string;
}

const RealTimeProgress: React.FC<RealTimeProgressProps> = ({
  data,
  isConnected,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Set client flag on mount to prevent hydration issues
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Update timestamp every second
  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdate(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  if (!data || !isClient) {
    return null;
  }

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType) {
      case 'mobile':
        return <Smartphone className="h-4 w-4" />;
      case 'tablet':
        return <Tablet className="h-4 w-4" />;
      default:
        return <Monitor className="h-4 w-4" />;
    }
  };

  const getActivityColor = (isActive: boolean) => {
    return isActive ? 'text-green-400' : 'text-yellow-400';
  };

  const getConnectionColor = (isConnected: boolean) => {
    return isConnected ? 'text-green-400' : 'text-red-400';
  };

  return (
    <div className={`bg-gray-800 rounded-lg p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <TrendingUp className="h-5 w-5 text-blue-400" />
          <h3 className="text-white font-semibold text-sm">Live Progress</h3>
        </div>

        <div className="flex items-center space-x-2">
          {/* Connection Status */}
          <div className="flex items-center space-x-1">
            {isConnected ? (
              <Wifi className={`h-4 w-4 ${getConnectionColor(true)}`} />
            ) : (
              <WifiOff className={`h-4 w-4 ${getConnectionColor(false)}`} />
            )}
            <span className="text-xs text-gray-400">
              {isConnected ? 'Synced' : 'Offline'}
            </span>
          </div>

          {/* Activity Status */}
          <div className="flex items-center space-x-1">
            <Activity className={`h-4 w-4 ${getActivityColor(data.isActive)}`} />
            <span className="text-xs text-gray-400">
              {data.isActive ? 'Active' : 'Idle'}
            </span>
          </div>

          {/* Expand/Collapse */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <span className="text-xs">{isExpanded ? '−' : '+'}</span>
          </button>
        </div>
      </div>

      {/* Main Progress Display */}
      <div className="space-y-3">
        {/* Progress Bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-gray-400">
            <span>Progress</span>
            <span>{data.progress.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${data.progress}%` }}
            ></div>
          </div>
        </div>

        {/* Time Information */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="bg-gray-700 rounded p-2">
            <div className="flex items-center space-x-1 text-gray-400 mb-1">
              <Clock className="h-3 w-3" />
              <span>Session Time</span>
            </div>
            <div className="text-white font-medium">
              {formatTime(data.sessionTimeWatched)}
            </div>
          </div>

          <div className="bg-gray-700 rounded p-2">
            <div className="flex items-center space-x-1 text-gray-400 mb-1">
              <Eye className="h-3 w-3" />
              <span>Remaining</span>
            </div>
            <div className="text-white font-medium">
              {formatTime(data.timeRemaining)}
            </div>
          </div>
        </div>

        {/* Playback Speed */}
        <div className="bg-gray-700 rounded p-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1 text-gray-400">
              <Zap className="h-3 w-3" />
              <span className="text-xs">Playback Speed</span>
            </div>
            <span className="text-white font-medium text-xs">
              {data.playbackSpeed}x
            </span>
          </div>
        </div>

        {/* Device Information */}
        <div className="bg-gray-700 rounded p-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {getDeviceIcon(data.deviceInfo.deviceType)}
              <span className="text-xs text-gray-400">
                {data.deviceInfo.deviceType.charAt(0).toUpperCase() + data.deviceInfo.deviceType.slice(1)}
              </span>
            </div>
            <span className="text-xs text-gray-400">
              {data.deviceInfo.browser}
            </span>
          </div>
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-gray-700 space-y-3">
          {/* Device Sync Status */}
          <div className="bg-gray-700 rounded p-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400">Primary Device</span>
              <span className={`font-medium ${data.deviceInfo.isPrimary ? 'text-green-400' : 'text-yellow-400'}`}>
                {data.deviceInfo.isPrimary ? 'Yes' : 'No'}
              </span>
            </div>
          </div>

          {/* Last Activity */}
          <div className="bg-gray-700 rounded p-2">
            <div className="text-xs text-gray-400 mb-1">Last Activity</div>
            <div className="text-white text-xs">
              {new Date(data.lastActivity).toLocaleTimeString()}
            </div>
          </div>

          {/* Total Time Watched */}
          <div className="bg-gray-700 rounded p-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400">Total Time Watched</span>
              <span className="text-white font-medium">
                {formatTime(data.totalTimeWatched)}
              </span>
            </div>
          </div>

          {/* Update Time */}
          <div className="text-center text-xs text-gray-500">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </div>
        </div>
      )}
    </div>
  );
};

export default RealTimeProgress;