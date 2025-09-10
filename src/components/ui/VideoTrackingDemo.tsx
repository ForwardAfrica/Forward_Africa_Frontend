import React, { useState } from 'react';
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
  Zap,
  Settings,
  RotateCcw,
  BarChart3,
  Users,
  Target
} from 'lucide-react';

const VideoTrackingDemo: React.FC = () => {
  const [activeTab, setActiveTab] = useState('features');
  const [demoProgress, setDemoProgress] = useState(45);
  const [isConnected, setIsConnected] = useState(true);
  const [isActive, setIsActive] = useState(true);

  const features = [
    {
      id: 'granular',
      title: 'Second-level Granular Tracking',
      description: 'Track video progress every 30 seconds with detailed analytics',
      icon: <BarChart3 className="h-6 w-6" />,
      details: [
        '30-second interval tracking',
        'User engagement metrics',
        'Drop-off point analysis',
        'Watch time patterns'
      ]
    },
    {
      id: 'sync',
      title: 'Cross-Device Synchronization',
      description: 'Seamlessly sync video progress across multiple devices',
      icon: <Users className="h-6 w-6" />,
      details: [
        'Real-time WebSocket communication',
        'Automatic device detection',
        'Progress synchronization',
        'Play state coordination'
      ]
    },
    {
      id: 'resume',
      title: 'Smart Resume Functionality',
      description: 'Intelligent resume with 10-second buffer for context',
      icon: <RotateCcw className="h-6 w-6" />,
      details: [
        '10-second buffer time',
        'Context-aware resuming',
        'Multiple device support',
        'Automatic resume points'
      ]
    },
    {
      id: 'visualization',
      title: 'Real-time Progress Visualization',
      description: 'Live progress tracking with engagement indicators',
      icon: <TrendingUp className="h-6 w-6" />,
      details: [
        'Live progress updates',
        'Activity status tracking',
        'Device information display',
        'Connection status monitoring'
      ]
    }
  ];

  const analytics = {
    totalViews: 1247,
    averageCompletionRate: 78.5,
    averageWatchTime: 1420,
    engagementRate: 85.2,
    deviceUsage: {
      desktop: 65,
      mobile: 25,
      tablet: 10
    },
    dropOffPoints: [120, 300, 450, 780],
    sessionData: [
      { time: 0, engagement: 100 },
      { time: 30, engagement: 95 },
      { time: 60, engagement: 88 },
      { time: 90, engagement: 92 },
      { time: 120, engagement: 75 },
      { time: 150, engagement: 85 },
      { time: 180, engagement: 90 }
    ]
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Advanced Video Tracking Features
        </h1>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
          Experience the next generation of video learning with granular tracking,
          cross-device synchronization, smart resume functionality, and real-time progress visualization.
        </p>
      </div>

      {/* Feature Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-8">
        <button
          onClick={() => setActiveTab('features')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'features'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Features Overview
        </button>
        <button
          onClick={() => setActiveTab('demo')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'demo'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Live Demo
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'analytics'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Analytics
        </button>
      </div>

      {/* Features Overview */}
      {activeTab === 'features' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((feature) => (
            <div key={feature.id} className="bg-white rounded-lg p-6 shadow-sm border">
              <div className="flex items-center mb-4">
                <div className="text-blue-600 mr-3">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900">
                  {feature.title}
                </h3>
              </div>
              <p className="text-gray-600 mb-4">
                {feature.description}
              </p>
              <ul className="space-y-2">
                {feature.details.map((detail, index) => (
                  <li key={index} className="flex items-center text-sm text-gray-700">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                    {detail}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {/* Live Demo */}
      {activeTab === 'demo' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Video Player Simulation */}
          <div className="lg:col-span-2">
            <div className="bg-black rounded-lg aspect-video relative overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-white">
                  <Play className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">Video Player Demo</p>
                  <p className="text-sm text-gray-400 mt-2">
                    Advanced tracking features enabled
                  </p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                <div className="w-full bg-gray-600 h-1 rounded-full overflow-hidden">
                  <div
                    className="bg-blue-500 h-full transition-all duration-300"
                    style={{ width: `${demoProgress}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-white text-sm mt-2">
                  <span>2:15 / 5:30</span>
                  <span>{demoProgress.toFixed(1)}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Real-time Progress Panel */}
          <div className="bg-gray-800 rounded-lg p-4 text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-blue-400" />
                <h3 className="font-semibold text-sm">Live Progress</h3>
              </div>

              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1">
                  {isConnected ? (
                    <Wifi className="h-4 w-4 text-green-400" />
                  ) : (
                    <WifiOff className="h-4 w-4 text-red-400" />
                  )}
                  <span className="text-xs text-gray-400">
                    {isConnected ? 'Synced' : 'Offline'}
                  </span>
                </div>

                <div className="flex items-center space-x-1">
                  <Activity className={`h-4 w-4 ${isActive ? 'text-green-400' : 'text-yellow-400'}`} />
                  <span className="text-xs text-gray-400">
                    {isActive ? 'Active' : 'Idle'}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-gray-400">
                  <span>Progress</span>
                  <span>{demoProgress.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${demoProgress}%` }}
                  ></div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-gray-700 rounded p-2">
                  <div className="flex items-center space-x-1 text-gray-400 mb-1">
                    <Clock className="h-3 w-3" />
                    <span>Session Time</span>
                  </div>
                  <div className="text-white font-medium">2:15</div>
                </div>

                <div className="bg-gray-700 rounded p-2">
                  <div className="flex items-center space-x-1 text-gray-400 mb-1">
                    <Eye className="h-3 w-3" />
                    <span>Remaining</span>
                  </div>
                  <div className="text-white font-medium">3:15</div>
                </div>
              </div>

              <div className="bg-gray-700 rounded p-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1 text-gray-400">
                    <Zap className="h-3 w-3" />
                    <span className="text-xs">Playback Speed</span>
                  </div>
                  <span className="text-white font-medium text-xs">1.0x</span>
                </div>
              </div>

              <div className="bg-gray-700 rounded p-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Monitor className="h-4 w-4" />
                    <span className="text-xs text-gray-400">Desktop</span>
                  </div>
                  <span className="text-xs text-gray-400">Chrome</span>
                </div>
              </div>
            </div>

            {/* Demo Controls */}
            <div className="mt-4 pt-4 border-t border-gray-700">
              <div className="flex space-x-2">
                <button
                  onClick={() => setDemoProgress(Math.max(0, demoProgress - 10))}
                  className="flex-1 bg-gray-700 text-white py-2 px-3 rounded text-xs hover:bg-gray-600 transition-colors"
                >
                  -10%
                </button>
                <button
                  onClick={() => setDemoProgress(Math.min(100, demoProgress + 10))}
                  className="flex-1 bg-gray-700 text-white py-2 px-3 rounded text-xs hover:bg-gray-600 transition-colors"
                >
                  +10%
                </button>
              </div>
              <div className="flex space-x-2 mt-2">
                <button
                  onClick={() => setIsConnected(!isConnected)}
                  className="flex-1 bg-gray-700 text-white py-2 px-3 rounded text-xs hover:bg-gray-600 transition-colors"
                >
                  Toggle Sync
                </button>
                <button
                  onClick={() => setIsActive(!isActive)}
                  className="flex-1 bg-gray-700 text-white py-2 px-3 rounded text-xs hover:bg-gray-600 transition-colors"
                >
                  Toggle Active
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Analytics */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <div className="flex items-center">
                <div className="text-blue-600 mr-3">
                  <Eye className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Views</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.totalViews.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <div className="flex items-center">
                <div className="text-green-600 mr-3">
                  <Target className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Completion Rate</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.averageCompletionRate}%</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <div className="flex items-center">
                <div className="text-purple-600 mr-3">
                  <Clock className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Avg Watch Time</p>
                  <p className="text-2xl font-bold text-gray-900">{Math.floor(analytics.averageWatchTime / 60)}m</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <div className="flex items-center">
                <div className="text-orange-600 mr-3">
                  <TrendingUp className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Engagement</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.engagementRate}%</p>
                </div>
              </div>
            </div>
          </div>

          {/* Device Usage */}
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Device Usage</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-3">
                <Monitor className="h-8 w-8 text-blue-600" />
                <div className="flex-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Desktop</span>
                    <span className="font-medium">{analytics.deviceUsage.desktop}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${analytics.deviceUsage.desktop}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Smartphone className="h-8 w-8 text-green-600" />
                <div className="flex-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Mobile</span>
                    <span className="font-medium">{analytics.deviceUsage.mobile}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                    <div
                      className="bg-green-600 h-2 rounded-full"
                      style={{ width: `${analytics.deviceUsage.mobile}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Tablet className="h-8 w-8 text-purple-600" />
                <div className="flex-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tablet</span>
                    <span className="font-medium">{analytics.deviceUsage.tablet}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                    <div
                      className="bg-purple-600 h-2 rounded-full"
                      style={{ width: `${analytics.deviceUsage.tablet}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Engagement Heatmap */}
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Engagement Heatmap</h3>
            <div className="grid grid-cols-7 gap-1">
              {analytics.sessionData.map((data, index) => (
                <div key={index} className="text-center">
                  <div
                    className="w-full h-8 rounded"
                    style={{
                      backgroundColor: `rgba(59, 130, 246, ${data.engagement / 100})`
                    }}
                  ></div>
                  <p className="text-xs text-gray-600 mt-1">{Math.floor(data.time / 60)}m</p>
                </div>
              ))}
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-2">
              <span>Low Engagement</span>
              <span>High Engagement</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoTrackingDemo;