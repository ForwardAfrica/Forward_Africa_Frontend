import React from 'react';
import { AlertCircle, X, CheckCircle, Info, AlertTriangle } from 'lucide-react';

export interface ErrorDisplayProps {
  error: string | null;
  type?: 'error' | 'success' | 'warning' | 'info';
  onClose?: () => void;
  showIcon?: boolean;
  className?: string;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  type = 'error',
  onClose,
  showIcon = true,
  className = ''
}) => {
  if (!error) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-400" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-400" />;
      case 'info':
        return <Info className="h-5 w-5 text-blue-400" />;
      default:
        return <AlertCircle className="h-5 w-5 text-red-400" />;
    }
  };

  const getContainerClasses = () => {
    const baseClasses = 'rounded-xl p-4 border transition-all duration-200';

    switch (type) {
      case 'success':
        return `${baseClasses} bg-green-500/10 border-green-500/20 text-green-400 ${className}`;
      case 'warning':
        return `${baseClasses} bg-yellow-500/10 border-yellow-500/20 text-yellow-400 ${className}`;
      case 'info':
        return `${baseClasses} bg-blue-500/10 border-blue-500/20 text-blue-400 ${className}`;
      default:
        return `${baseClasses} bg-red-500/10 border-red-500/20 text-red-400 ${className}`;
    }
  };

  return (
    <div className={getContainerClasses()}>
      <div className="flex items-start space-x-3">
        {showIcon && (
          <div className="flex-shrink-0 mt-0.5">
            {getIcon()}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium leading-5">
            {error}
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="flex-shrink-0 ml-2 p-1 rounded-md hover:bg-gray-700/50 transition-colors duration-200"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorDisplay;