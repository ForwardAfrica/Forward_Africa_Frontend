import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class AnalyticsErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Analytics Error Boundary caught an error:', error, errorInfo);

    // Log the error but don't break the app
    this.setState({ hasError: false });
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      console.warn('Analytics error occurred, continuing without analytics');
      return this.props.children;
    }

    return this.props.children;
  }
}

export default AnalyticsErrorBoundary;