import type { Meta, StoryObj } from '@storybook/react';
import { ThemeProvider, ThemeToggle } from '../../providers/theme';
import { AppHeader, NotificationBell } from './AppHeader';

const logo = (
  <span className="flex h-10 items-center text-[22px] font-bold text-white">
    Gijima<span className="text-gj-red">.</span>
    <span className="ml-2 hidden font-thin text-white/80 tablet:inline">IntelliSource</span>
  </span>
);

const nav = [
  { label: 'Dashboard', href: '#', active: true },
  { label: 'Intakes', href: '#' },
  { label: 'Sourcing', href: '#' },
  { label: 'Evaluations', href: '#' },
  { label: 'Audit', href: '#' },
  { label: 'Admin', href: '#' },
];

const meta: Meta<typeof AppHeader> = {
  title: 'UI/C18 AppHeader',
  component: AppHeader,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
};
export default meta;
type Story = StoryObj<typeof AppHeader>;

export const Internal: Story = {
  render: () => (
    <ThemeProvider>
      <AppHeader
        logo={logo}
        nav={nav}
        actions={
          <>
            <NotificationBell count={3} />
            <ThemeToggle className="border-white/30 text-white/80 hover:bg-white/10" />
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-gj-small font-semibold text-white">TM</span>
          </>
        }
      />
    </ThemeProvider>
  ),
};
export const SupplierPortal: Story = {
  render: () => (
    <ThemeProvider>
      <AppHeader
        variant="supplier"
        timezoneNote="All times in SAST (UTC+2)"
        logo={logo}
        nav={[
          { label: 'My invitations', href: '#', active: true },
          { label: 'Help', href: '#' },
        ]}
        actions={<span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-gj-small font-semibold text-white">AS</span>}
      />
    </ThemeProvider>
  ),
};
export const DarkMode: Story = {
  render: () => (
    <div data-theme="dark">
      <ThemeProvider>
        <AppHeader logo={logo} nav={nav} actions={<NotificationBell count={12} />} />
      </ThemeProvider>
    </div>
  ),
};
