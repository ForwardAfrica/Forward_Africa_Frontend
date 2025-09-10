import React from 'react';
import { AlertCircle, X, Info } from 'lucide-react';

interface ValidationErrorProps {
  error?: string;
  className?: string;
  showIcon?: boolean;
}

export const ValidationError: React.FC<ValidationErrorProps> = ({
  error,
  className = '',
  showIcon = true
}) => {
  if (!error) return null;

  return (
    <div className={`flex items-start text-red-400 text-sm mt-1 animate-in slide-in-from-top-1 duration-200 ${className}`}>
      {showIcon && <AlertCircle className="h-4 w-4 mr-1 mt-0.5 flex-shrink-0" />}
      <span className="leading-relaxed">{error}</span>
    </div>
  );
};

interface ValidationErrorsListProps {
  errors: Array<{ field: string; message: string; code?: string }>;
  className?: string;
  title?: string;
  onClose?: () => void;
}

export const ValidationErrorsList: React.FC<ValidationErrorsListProps> = ({
  errors,
  className = '',
  title = 'Please fix the following errors:',
  onClose
}) => {
  if (!errors || errors.length === 0) return null;

  return (
    <div className={`bg-red-500/10 border border-red-500/20 rounded-md p-4 animate-in slide-in-from-top-2 duration-300 ${className}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center">
          <AlertCircle className="h-5 w-5 text-red-400 mr-2 flex-shrink-0" />
          <h3 className="text-red-400 font-medium">{title}</h3>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-red-400 hover:text-red-300 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      <ul className="space-y-2">
        {errors.map((error, index) => (
          <li key={index} className="flex items-start">
            <span className="text-red-400 mr-2 mt-1">•</span>
            <div className="flex-1">
              <span className="text-red-300 text-sm leading-relaxed">
                {error.message}
              </span>
              {error.code && (
                <div className="flex items-center mt-1">
                  <Info className="h-3 w-3 text-red-400/60 mr-1" />
                  <span className="text-red-400/60 text-xs">Error code: {error.code}</span>
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

interface FieldValidationErrorProps {
  error?: string;
  fieldName: string;
  className?: string;
}

export const FieldValidationError: React.FC<FieldValidationErrorProps> = ({
  error,
  fieldName,
  className = ''
}) => {
  if (!error) return null;

  return (
    <div className={`mt-1 ${className}`}>
      <ValidationError
        error={`${fieldName}: ${error}`}
        showIcon={false}
        className="text-red-400 text-sm"
      />
    </div>
  );
};