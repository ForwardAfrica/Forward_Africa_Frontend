import React, { useEffect } from 'react';
import { Check, X } from 'lucide-react';

interface SuccessToastProps {
  message: string;
  isVisible: boolean;
  onClose: () => void;
  duration?: number;
}

const SuccessToast: React.FC<SuccessToastProps> = ({
  message,
  isVisible,
  onClose,
  duration = 3000
}) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  if (!isVisible) return null;

  return (
    <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right-2">
      <div className="bg-green-600 text-white px-6 py-4 rounded-lg shadow-lg border border-green-500 flex items-center space-x-3">
        <div className="bg-green-500 p-1 rounded-full">
          <Check className="h-4 w-4" />
        </div>
        <span className="font-medium">{message}</span>
        <button
          onClick={onClose}
          className="ml-2 text-green-200 hover:text-white transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default SuccessToast;