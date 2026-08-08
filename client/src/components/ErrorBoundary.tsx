import { Component, type ReactNode, type ErrorInfo } from 'react';
import Icon from './Icon';

interface Props { children: ReactNode; }
interface State { hasError: boolean; error: Error | null; }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Kept out of production bundles; the fallback UI is what users see.
    if (import.meta.env.DEV) {
      console.error('ErrorBoundary caught:', error, info.componentStack);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-background p-lg">
          <div className="w-full max-w-md rounded-lg border border-surface-container-high bg-surface-container-lowest p-xl text-center shadow-lg">
            <div className="mx-auto mb-md grid h-16 w-16 place-items-center rounded-full bg-error-container text-error">
              <Icon name="triangle-alert" size={30} />
            </div>
            <h1 className="mb-2xs text-xl font-semibold text-on-surface">Something went wrong</h1>
            <p className="mb-lg text-sm text-on-surface-variant">{this.state.error?.message || 'An unexpected error occurred.'}</p>
            <button onClick={() => { this.setState({ hasError: false, error: null }); window.location.href = '/'; }}
              className="rounded-md bg-primary px-lg py-xs text-sm font-semibold text-on-primary transition-colors duration-fast hover:bg-primary-container hover:text-on-primary-container">
              Return to Home
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
