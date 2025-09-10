import React from 'react';
import { Bell, X, Check } from 'lucide-react';

export interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  type: 'info' | 'success' | 'warning';
}

interface NotificationsDropdownProps {
  notifications: Notification[];
  onClose: () => void;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
}

const NotificationsDropdown: React.FC<NotificationsDropdownProps> = ({
  notifications,
  onClose,
  onMarkAsRead,
  onMarkAllAsRead,
}) => {
  return (
    <div className="absolute right-0 mt-2 w-80 bg-gray-800 rounded-lg shadow-lg overflow-hidden border border-gray-700">
      {/* Header */}
      <div className="p-4 border-b border-gray-700 flex items-center justify-between">
        <div className="flex items-center">
          <Bell className="h-5 w-5 text-red-500 mr-2" />
          <h3 className="text-white font-medium">Notifications</h3>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Notifications List */}
      <div className="max-h-96 overflow-y-auto">
        {notifications.length > 0 ? (
          <>
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 border-b border-gray-700 hover:bg-gray-700/50 transition-colors ${
                  !notification.read ? 'bg-gray-700/20' : ''
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className="text-white font-medium">{notification.title}</h4>
                  <button
                    onClick={() => onMarkAsRead(notification.id)}
                    className={`text-gray-400 hover:text-white transition-colors ${
                      notification.read ? 'hidden' : ''
                    }`}
                  >
                    <Check className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-gray-400 text-sm mb-2">{notification.message}</p>
                <span className="text-gray-500 text-xs">
                  {notification.timestamp.toLocaleDateString()} at{' '}
                  {notification.timestamp.toLocaleTimeString()}
                </span>
              </div>
            ))}
            <div className="p-3 bg-gray-800 border-t border-gray-700">
              <button
                onClick={onMarkAllAsRead}
                className="w-full text-center text-sm text-red-500 hover:text-red-400 transition-colors"
              >
                Mark all as read
              </button>
            </div>
          </>
        ) : (
          <div className="p-4 text-center text-gray-400">
            No new notifications
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsDropdown;