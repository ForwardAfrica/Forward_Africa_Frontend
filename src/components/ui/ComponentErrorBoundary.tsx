import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, X } from 'lucide-react';
import Button from './Button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  componentName?: string;
  showRetry?: boolean;
  showDetails?: boolean;
  className?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  showDetails: boolean;
}

class ComponentErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    showDetails: false
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`ComponentErrorBoundary caught an error in ${this.props.componentName || 'unknown component'}:`, error, errorInfo);

    // Log error to monitoring service
    this.logError(error, errorInfo);

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    this.setState({ errorInfo });
  }

  private logError = (error: Error, errorInfo: ErrorInfo) => {
    const errorData = {
      timestamp: new Date().toISOString(),
      componentName: this.props.componentName || 'unknown',
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      errorInfo: {
        componentStack: errorInfo.componentStack
      },
      url: window.location.href
    };

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.group(`🚨 Component Error: ${this.props.componentName || 'Unknown'}`);
      console.log('Error:', errorData.error);
      console.log('Component Stack:', errorData.errorInfo.componentStack);
      console.log('URL:', errorData.url);
      console.groupEnd();
    }

    // Store error for debugging
    try {
      const existingErrors = JSON.parse(localStorage.getItem('componentErrors') || '[]');
      existingErrors.unshift(errorData);
      localStorage.setItem('componentErrors', JSON.stringify(existingErrors.slice(0, 100)));
    } catch (error) {
      console.error('Failed to store component error:', error);
    }
  };

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      showDetails: false
    });
  };

  private toggleDetails = () => {
    this.setState(prev => ({ showDetails: !prev.showDetails }));
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className={`bg-red-500/10 border border-red-500/20 rounded-lg p-4 ${this.props.className || ''}`}>
          {/* Error Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-red-400 mr-2 flex-shrink-0" />
              <div>
                <h3 className="text-red-400 font-medium">
                  {this.props.componentName ? `${this.props.componentName} Error` : 'Component Error'}
                </h3>
                <p className="text-red-300 text-sm">
                  {this.state.error?.message || 'An unexpected error occurred'}
                </p>
              </div>
            </div>
            {this.props.showDetails && (
              <Button
                variant="ghost"
                size="sm"
                onClick={this.toggleDetails}
                className="text-red-400 hover:text-red-300"
              >
                {this.state.showDetails ? <X className="h-4 w-4" /> : 'Details'}
              </Button>
            )}
          </div>

          {/* Error Details */}
          {this.props.showDetails && this.state.showDetails && (
            <div className="mt-3 pt-3 border-t border-red-500/20">
              <div className="bg-red-500/5 rounded p-3 text-xs font-mono overflow-auto max-h-32">
                <div className="text-red-400 mb-1">Stack Trace:</div>
                <pre className="whitespace-pre-wrap text-red-300">
                  {this.state.error?.stack}
                </pre>
                {this.state.errorInfo && (
                  <>
                    <div className="text-red-400 mb-1 mt-2">Component Stack:</div>
                    <pre className="whitespace-pre-wrap text-red-300">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {this.props.showRetry && (
            <div className="mt-3 flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={this.handleRetry}
                className="text-red-400 border-red-400 hover:bg-red-400 hover:text-white"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Retry
              </Button>
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

// Higher-order component for easier usage
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) => {
  const WrappedComponent = (props: P) => (
    <ComponentErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ComponentErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
};

// Hook for functional components
export const useErrorBoundary = (componentName?: string) => {
  const handleError = (error: Error, errorInfo: ErrorInfo) => {
    console.error(`Error in ${componentName || 'component'}:`, error, errorInfo);

    // You can add additional error handling logic here
    // For example, sending to an error reporting service
  };

  return { handleError };
};

export default ComponentErrorBoundary;