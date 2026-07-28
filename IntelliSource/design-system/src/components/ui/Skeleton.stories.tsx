import type { Meta, StoryObj } from '@storybook/react';
import { Skeleton } from './Skeleton';

const meta: Meta<typeof Skeleton> = {
  title: 'UI/C19 Skeleton',
  component: Skeleton,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof Skeleton>;

export const Line: Story = { args: { variant: 'line', width: '60%' } };
export const TableRows: Story = { args: { variant: 'tableRows', count: 8 } };
export const KpiCard: Story = { args: { variant: 'kpiCard' }, decorators: [(S) => <div className="max-w-xs"><S /></div>] };
export const ChatBubbles: Story = { args: { variant: 'chatBubble' }, decorators: [(S) => <div className="max-w-md"><S /></div>] };
export const DarkMode: Story = {
  args: { variant: 'tableRows', count: 4 },
  decorators: [(S) => <div data-theme="dark" className="bg-gj-bg p-gj-6 rounded-card"><S /></div>],
};
