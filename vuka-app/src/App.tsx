import { useApp } from './store/appStore';
import { AppShell } from './components/AppShell';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Toast } from './components/Toast';
import { Onboarding } from './features/onboarding/Onboarding';
import { WorkerHome } from './features/worker/WorkerHome';
import { JobsFeed } from './features/worker/JobsFeed';
import { GigDetail } from './features/worker/GigDetail';
import { FormalDetail } from './features/worker/FormalDetail';
import { CvLadder } from './features/worker/CvLadder';
import { WorkerProfile } from './features/worker/WorkerProfile';
import { EmployerHome } from './features/employer/EmployerHome';
import { Talent } from './features/employer/Talent';
import { WorkerDetail } from './features/employer/WorkerDetail';
import { PostJob } from './features/employer/PostJob';
import { EmployerProfile } from './features/employer/EmployerProfile';

function BootScreen() {
  return (
    <div className="min-h-screen grid place-items-center bg-surface-2 text-center px-6">
      <div>
        <div className="w-16 h-16 mx-auto rounded-[20px] grid place-items-center text-white text-3xl animate-pop" style={{ background: 'linear-gradient(135deg,var(--gj-navy),#123e69)' }} aria-hidden="true">V</div>
        <p className="mt-4 text-muted text-sm font-semibold">Loading Vuka Uzenzele…</p>
      </div>
    </div>
  );
}

export function App() {
  const { state, navigate } = useApp();

  if (state.status === 'booting') return <BootScreen />;
  if (state.status === 'anon') return <Onboarding />;

  const id = state.nav.id ?? '';
  const screen = state.nav.screen;

  let content: React.ReactNode;
  if (state.role === 'worker') {
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
      default: content = <EmployerHome />;
    }
  }

  return (
    <>
      <AppShell>
        <ErrorBoundary key={`${state.role}:${screen}:${id}`} onReset={() => navigate('home')}>
          {content}
        </ErrorBoundary>
      </AppShell>
      <Toast />
    </>
  );
}
