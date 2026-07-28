import type { Meta, StoryObj } from '@storybook/react';
import { AIBadge, AIPanel, ConfidenceChip } from './AIPanel';

const meta: Meta<typeof AIPanel> = {
  title: 'UI/C04 AIPanel',
  component: AIPanel,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof AIPanel>;

const sample = (
  <p>
    The supplier shall deliver 200 mid-range laptops (Intel i5/16GB/512GB or equivalent) to the Durban
    office by 30 October 2026, including asset tagging and 3-year on-site warranty.
  </p>
);

export const Default: Story = {
  args: {
    title: 'Scope of work',
    confidence: 'High',
    children: sample,
    onConfirm: () => {},
    onEdit: () => {},
    onDiscard: () => {},
    onRegenerate: () => {},
  },
};
export const Loading: Story = { args: { title: 'Scope of work', isLoading: true } };
export const ErrorFallback: Story = {
  args: {
    title: 'Scope of work',
    error: 'AI unavailable — you can retry or continue manually. The sourcing process is never blocked.',
    onRegenerate: () => {},
    onManualFallback: () => {},
  },
};
export const Confirmed: Story = {
  args: { title: 'Scope of work', confirmed: true, children: sample },
};
export const Badges: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-gj-2">
      <AIBadge />
      <AIBadge label="AI-suggested" />
      <ConfidenceChip level="High" />
      <ConfidenceChip level="Medium" />
      <ConfidenceChip level="Low" />
    </div>
  ),
};
export const DarkMode: Story = {
  args: { title: 'Scope of work', confidence: 'Medium', children: sample, onConfirm: () => {}, onEdit: () => {} },
  decorators: [(S) => <div data-theme="dark" className="bg-gj-bg p-gj-6 rounded-card"><S /></div>],
};
