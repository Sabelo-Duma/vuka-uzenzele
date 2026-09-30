import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Icon } from './Icon';
import { tr } from '../i18n';

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
        <div className="inline-grid place-items-center w-14 h-14 rounded-2xl bg-surface-2 border border-line text-dim mb-3" aria-hidden="true"><Icon name="alert" size={26} /></div>
        <h2 className="font-display text-ink text-lead font-bold m-0">{tr('common.error.title')}</h2>
        <p className="text-dim text-small leading-relaxed mt-2 mb-5">
          {tr('common.error.body')}
        </p>
        <button onClick={this.reset} className="inline-flex items-center justify-center rounded-pill bg-brand-solid text-brand-on font-bold text-small px-6 py-3">
          {tr('common.error.backHome')}
        </button>
      </div>
    );
  }
}
