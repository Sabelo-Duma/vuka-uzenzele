import { useApp } from './store/appStore';
import { AppShell } from './components/AppShell';
import { SunMark } from './components/SunMark';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Toast } from './components/Toast';
import { Onboarding } from './features/onboarding/Onboarding';
import { WorkerHome } from './features/worker/WorkerHome';
import { JobsFeed } from './features/worker/JobsFeed';
import { GigDetail } from './features/worker/GigDetail';
import { FormalDetail } from './features/worker/FormalDetail';
import { CvLadder } from './features/worker/CvLadder';
import { WorkerProfile } from './features/worker/WorkerProfile';
import { CelebrationSheet } from './features/worker/CelebrationSheet';
import { EmployerHome } from './features/employer/EmployerHome';
import { Talent } from './features/employer/Talent';
import { WorkerDetail } from './features/employer/WorkerDetail';
import { PostJob } from './features/employer/PostJob';
import { MyJobs } from './features/employer/MyJobs';
import { Applicants } from './features/employer/Applicants';
import { EmployerProfile } from './features/employer/EmployerProfile';
import { Messages, ChatThread } from './features/chat/Chat';
import { PublicCv } from './features/public/PublicCv';

/** Public share route: /cv/:id renders a read-only CV without auth. */
function publicCvId(): string | null {
  if (typeof window === 'undefined') return null;
  const m = window.location.pathname.match(/^\/cv\/(.+)$/);
  return m ? decodeURIComponent(m[1]) : null;
}

function BootScreen() {
  return (
    <div className="min-h-screen grid place-items-center bg-surface-2 text-center px-6">
      <div>
        <SunMark size={64} variant="tile" className="mx-auto animate-pop" />
        <p className="mt-4 text-dim text-small font-semibold">Loading Vuka Uzenzele…</p>
      </div>
    </div>
  );
}

function ErrorBanner({ msg, onRetry, onDismiss }: { msg: string; onRetry: () => void; onDismiss: () => void }) {
  return (
    <div role="alert" className="mb-3 flex items-center gap-3 rounded-2xl border border-danger bg-danger-soft px-3.5 py-2.5">
      <span className="text-lead shrink-0" aria-hidden="true">⚠️</span>
      <span className="flex-1 text-small text-ink leading-snug">{msg}</span>
      <button onClick={onRetry} className="shrink-0 rounded-pill bg-ink text-canvas text-small font-bold px-3 py-1.5 active:scale-95">Retry</button>
      <button onClick={onDismiss} aria-label="Dismiss" className="shrink-0 text-faint hover:text-ink px-1">✕</button>
    </div>
  );
}

export function App() {
  const { state, navigate, reloadData, clearError } = useApp();

  const cvId = publicCvId();
  if (cvId) return <PublicCv id={cvId} />;

  if (state.status === 'booting') return <BootScreen />;
  if (state.status === 'anon') return <Onboarding />;

  const id = state.nav.id ?? '';
  const screen = state.nav.screen;

  let content: React.ReactNode;
  if (screen === 'messages') {
    content = <Messages />;
  } else if (screen === 'chat') {
    content = <ChatThread id={id} />;
  } else if (state.role === 'worker') {
    switch (screen) {
      case 'jobs': content = <JobsFeed />; break;
      case 'cv': content = <CvLadder />; break;
      case 'me': content = <WorkerProfile />; break;
      case 'gigDetail': content = <GigDetail id={id} />; break;
      case 'formalDetail': content = <FormalDetail id={id} />; break;
      default: content = <WorkerHome />;
    }
  } else {
    switch (screen) {
      case 'talent': content = <Talent />; break;
      case 'post': content = <PostJob />; break;
      case 'me': content = <EmployerProfile />; break;
      case 'workerDetail': content = <WorkerDetail id={id} />; break;
      case 'hires': content = <MyJobs />; break;
      case 'applicants': content = <Applicants id={id} />; break;
      default: content = <EmployerHome />;
    }
  }

  return (
    <>
      <AppShell>
        {state.error && <ErrorBanner msg={state.error} onRetry={reloadData} onDismiss={clearError} />}
        <ErrorBoundary key={`${state.role}:${screen}:${id}`} onReset={() => navigate('home')}>
          {content}
        </ErrorBoundary>
      </AppShell>
      {/* Fires the moment an employer's confirmation lands, wherever the worker is. */}
      <CelebrationSheet />
      <Toast />
    </>
  );
}
