import { Component, ErrorInfo, ReactNode } from 'react';
import { logError } from '../utils/logging';

type ErrorBoundaryProps = {
  fallback?: ReactNode;
  children: ReactNode;
};

type ErrorBoundaryState = {
  hasError: boolean;
};

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    logError({
      message: 'UI render failure',
      context: { componentStack: info.componentStack },
      error,
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div role="alert" className="error-fallback">
            <h3>Something went wrong.</h3>
            <p>Our monitoring has logged the error and the team has been notified.</p>
          </div>
        )
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
