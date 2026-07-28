import type { Meta, StoryObj } from '@storybook/react';
import { DEFAULT_RFX_STEPS, LifecycleStepper } from './LifecycleStepper';

const meta: Meta<typeof LifecycleStepper> = {
  title: 'UI/C06 LifecycleStepper',
  component: LifecycleStepper,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof LifecycleStepper>;

export const Default: Story = { args: { steps: DEFAULT_RFX_STEPS } };
export const RfqShortPath: Story = {
  args: {
    steps: [
      { label: 'Draft', state: 'completed' },
      { label: 'Review', state: 'completed' },
      { label: 'Approval', state: 'skipped', note: 'Approval skipped — RFQ short path' },
      { label: 'Published', state: 'current' },
      { label: 'Closed', state: 'future' },
      { label: 'Evaluation', state: 'future' },
      { label: 'Award', state: 'future' },
    ],
  },
};
export const Vertical: Story = { args: { steps: DEFAULT_RFX_STEPS, vertical: true } };
export const DarkMode: Story = {
  args: { steps: DEFAULT_RFX_STEPS },
  decorators: [(S) => <div data-theme="dark" className="bg-gj-bg p-gj-6 rounded-card"><S /></div>],
};
