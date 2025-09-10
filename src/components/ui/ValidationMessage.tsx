import React from 'react';
import { Check, X, AlertCircle } from 'lucide-react';

export interface ValidationMessageProps {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  show?: boolean;
  className?: string;
}

const ValidationMessage: React.FC<ValidationMessageProps> = ({
  message,
  type,
  show = true,
  className = ''
}) => {
  if (!show || !message) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <Check className="h-4 w-4 text-green-400" />;
      case 'error':
        return <X className="h-4 w-4 text-red-400" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-400" />;
      case 'info':
        return <AlertCircle className="h-4 w-4 text-blue-400" />;
      default:
        return null;
    }
  };

  const getTextColor = () => {
    switch (type) {
      case 'success':
        return 'text-green-400';
      case 'error':
        return 'text-red-400';
      case 'warning':
        return 'text-yellow-400';
      case 'info':
        return 'text-blue-400';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <div className={`flex items-center space-x-2 text-xs ${getTextColor()} ${className}`}>
      {getIcon()}
      <span>{message}</span>
    </div>
  );
};

export default ValidationMessage;