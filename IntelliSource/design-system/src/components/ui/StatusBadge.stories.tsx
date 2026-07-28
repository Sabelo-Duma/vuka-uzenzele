import type { Meta, StoryObj } from '@storybook/react';
import { AckBadge, StatusBadge, type RfxStatus } from './StatusBadge';

const all: RfxStatus[] = [
  'Draft', 'PendingReview', 'PendingApproval', 'Published', 'Closed',
  'Evaluating', 'AwardPendingApproval', 'Awarded', 'Unsuccessful',
  'Rejected', 'Withdrawn', 'Sealed',
];

const meta: Meta<typeof StatusBadge> = {
  title: 'UI/C03 StatusBadge',
  component: StatusBadge,
  tags: ['autodocs'],
  argTypes: { status: { control: 'select', options: all } },
};
export default meta;
type Story = StoryObj<typeof StatusBadge>;

export const Default: Story = { args: { status: 'Published' } };
export const Sealed: Story = { args: { status: 'Sealed', title: 'Sealed until 2026-08-01 17:00 SAST' } };
export const AllStatuses: Story = {
  render: () => (
    <div className="flex flex-wrap gap-gj-2">
      {all.map((s) => <StatusBadge key={s} status={s} />)}
    </div>
  ),
};
export const Acknowledgement: Story = {
  render: () => (
    <div className="flex gap-gj-2">
      <AckBadge acknowledged />
      <AckBadge acknowledged={false} />
    </div>
  ),
};
export const DarkMode: Story = {
  render: () => (
    <div data-theme="dark" className="bg-gj-bg p-gj-6 rounded-card flex flex-wrap gap-gj-2">
      {all.map((s) => <StatusBadge key={s} status={s} />)}
    </div>
  ),
};
