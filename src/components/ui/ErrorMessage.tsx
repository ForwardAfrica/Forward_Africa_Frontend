import React from 'react';
import { AlertTriangle, X, CheckCircle, Info } from 'lucide-react';

interface ErrorMessageProps {
  title?: string;
  message: string;
  type?: 'error' | 'warning' | 'info' | 'success';
  onClose?: () => void;
  actions?: React.ReactNode;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({
  title,
  message,
  type = 'error',
  onClose,
  actions
}) => {
  const getStyles = () => {
    switch (type) {
      case 'warning':
        return {
          container: 'bg-yellow-500/10 border-yellow-500/20',
          icon: <AlertTriangle className="h-5 w-5 text-yellow-500" />,
          title: 'text-yellow-400',
          message: 'text-yellow-300'
        };
      case 'info':
        return {
          container: 'bg-blue-500/10 border-blue-500/20',
          icon: <Info className="h-5 w-5 text-blue-500" />,
          title: 'text-blue-400',
          message: 'text-blue-300'
        };
      case 'success':
        return {
          container: 'bg-green-500/10 border-green-500/20',
          icon: <CheckCircle className="h-5 w-5 text-green-500" />,
          title: 'text-green-400',
          message: 'text-green-300'
        };
      default:
        return {
          container: 'bg-red-500/10 border-red-500/20',
          icon: <AlertTriangle className="h-5 w-5 text-red-500" />,
          title: 'text-red-400',
          message: 'text-red-300'
        };
    }
  };

  const styles = getStyles();

  return (
    <div className={`border rounded-lg p-4 ${styles.container}`}>
      <div className="flex items-start">
        <div className="mr-3 mt-0.5 flex-shrink-0">
          {styles.icon}
        </div>
        <div className="flex-1">
          {title && <h4 className={`font-medium ${styles.title}`}>{title}</h4>}
          <p className={`text-sm mt-1 ${styles.message}`}>{message}</p>
          {actions && (
            <div className="mt-3">
              {actions}
            </div>
          )}
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="ml-3 text-gray-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorMessage;