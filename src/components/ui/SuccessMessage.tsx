import React, { useEffect, useState } from 'react';
import { CheckCircle, X } from 'lucide-react';

interface SuccessMessageProps {
  message: string;
  onClose?: () => void;
  autoClose?: boolean;
  autoCloseDelay?: number;
  className?: string;
}

export const SuccessMessage: React.FC<SuccessMessageProps> = ({
  message,
  onClose,
  autoClose = true,
  autoCloseDelay = 5000,
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (autoClose) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        onClose?.();
      }, autoCloseDelay);

      return () => clearTimeout(timer);
    }
  }, [autoClose, autoCloseDelay, onClose]);

  const handleClose = () => {
    setIsVisible(false);
    onClose?.();
  };

  if (!isVisible) return null;

  return (
    <div className={`bg-green-500/10 border border-green-500/20 rounded-md p-4 animate-in slide-in-from-top-2 duration-300 ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="text-green-400 font-medium mb-1">Success!</h3>
            <p className="text-green-300 text-sm">{message}</p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={handleClose}
            className="text-green-400 hover:text-green-300 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
};

interface SuccessMessageListProps {
  messages: Array<{ id: string; message: string }>;
  onRemoveMessage?: (id: string) => void;
  className?: string;
}

export const SuccessMessageList: React.FC<SuccessMessageListProps> = ({
  messages,
  onRemoveMessage,
  className = ''
}) => {
  if (!messages || messages.length === 0) return null;

  return (
    <div className={`space-y-3 ${className}`}>
      {messages.map((msg) => (
        <SuccessMessage
          key={msg.id}
          message={msg.message}
          onClose={() => onRemoveMessage?.(msg.id)}
          autoClose={true}
          autoCloseDelay={4000}
        />
      ))}
    </div>
  );
};