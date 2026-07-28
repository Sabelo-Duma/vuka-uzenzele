import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props { children: ReactNode; onReset?: () => void; }
interface State { hasError: boolean; }

/**
 * Route-level error boundary with a recovery-oriented fallback
 * (what happened / what to do), per the BMAD error-message standard.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // In production this would report to monitoring.
    console.error('Vuka screen error:', error, info);
  }

  reset = () => {
    this.setState({ hasError: false });
    this.props.onReset?.();
  };

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="p-8 text-center" role="alert">
        <div className="text-5xl mb-3" aria-hidden="true">😕</div>
        <h2 className="text-navy text-lg font-bold m-0">This screen ran into a problem</h2>
        <p className="text-muted text-sm leading-relaxed mt-2 mb-5">
          Something on this page didn't load correctly. Your saved profile is safe. Go back to the home screen and try again.
        </p>
        <button onClick={this.reset} className="inline-flex items-center justify-center rounded-pill bg-red text-white font-bold text-sm px-6 py-3">
          Back to home
        </button>
      </div>
    );
  }
}
