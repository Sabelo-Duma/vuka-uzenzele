import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';
import { EmptyState } from './EmptyState';

const meta: Meta<typeof EmptyState> = {
  title: 'UI/C13 EmptyState',
  component: EmptyState,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof EmptyState>;

export const Dashboard: Story = {
  args: {
    title: 'No sourcing events yet',
    description: 'Create your first RFx or convert an approved intake to get started.',
    action: <Button variant="primary">New RFx</Button>,
    secondaryAction: <Button variant="ghost">Start from an intake</Button>,
  },
};
export const Triage: Story = {
  args: { title: 'No intakes awaiting triage', description: 'New plain-language requests will appear here.' },
};
export const Evaluation: Story = {
  args: {
    title: 'No submissions received',
    description: 'You can close this event as unsuccessful or extend the deadline via a change request.',
    action: <Button variant="default">Extend deadline</Button>,
    secondaryAction: <Button variant="ghost">Close as unsuccessful</Button>,
  },
};
export const AuditSearch: Story = {
  args: {
    title: 'No entries match your filters',
    description: 'Try widening the date range or clearing filters.',
    action: <Button variant="default">Clear filters</Button>,
  },
};
export const DarkMode: Story = {
  args: {
    title: 'No sourcing events yet',
    description: 'Create your first RFx or convert an approved intake to get started.',
    action: <Button variant="primary">New RFx</Button>,
  },
  decorators: [(S) => <div data-theme="dark" className="bg-gj-bg rounded-card"><S /></div>],
};
