import type { Meta, StoryObj } from '@storybook/react';
import { AuditTimeline, type AuditEntry } from './AuditTimeline';

const entries: AuditEntry[] = [
  {
    id: '1', action: 'Award approved', actor: 'pieter.v@customer.co.za', actorKind: 'person',
    timestampUtc: '2026-08-02T14:22:09Z', timestampLocal: '2026-08-02 16:22 SAST',
    details: 'Recommendation AR-2026-014 approved. Outcome letters queued.',
  },
  {
    id: '2', action: 'Executive summary generated', actor: 'AI · Evaluation summary', actorKind: 'ai',
    aiModelInfo: 'model gpt-frontier-2026-05 · prompt a41f9c…', timestampUtc: '2026-08-02T09:31:44Z',
  },
  {
    id: '3', action: 'Commercial envelope opened', actor: 'thandi.m@customer.co.za', actorKind: 'person',
    timestampUtc: '2026-08-02T09:14:03Z', details: 'Reason: technical gate met (3/3 evaluators complete).',
  },
  {
    id: '4', action: 'Status changed', actor: 'System · scheduler', actorKind: 'system',
    timestampUtc: '2026-08-01T15:00:01Z', oldValue: 'Status: Published', newValue: 'Status: Closed',
  },
  {
    id: '5', action: 'Due date extended (CR-2026-021 applied)', actor: 'System · CR engine', actorKind: 'system',
    timestampUtc: '2026-07-28T08:05:12Z', oldValue: 'ResponseDueDate: 2026-07-30T15:00Z', newValue: 'ResponseDueDate: 2026-08-01T15:00Z',
  },
];

const meta: Meta<typeof AuditTimeline> = {
  title: 'UI/C16 AuditTimeline',
  component: AuditTimeline,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof AuditTimeline>;

export const Verified: Story = { args: { entries, chainStatus: 'verified' } };
export const VerificationFailed: Story = { args: { entries: entries.slice(0, 3), chainStatus: 'failed' } };
export const Pending: Story = { args: { entries: entries.slice(0, 2), chainStatus: 'pending' } };
export const DarkMode: Story = {
  args: { entries, chainStatus: 'verified' },
  decorators: [(S) => <div data-theme="dark" className="bg-gj-bg p-gj-6 rounded-card"><S /></div>],
};
