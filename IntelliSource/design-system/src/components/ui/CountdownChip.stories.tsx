import type { Meta, StoryObj } from '@storybook/react';
import { CountdownChip } from './CountdownChip';

const NOW = new Date('2026-07-24T12:00:00Z');

const meta: Meta<typeof CountdownChip> = {
  title: 'UI/C07 CountdownChip',
  component: CountdownChip,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof CountdownChip>;

export const MoreThanADay: Story = {
  args: { closesAt: new Date('2026-07-27T16:12:33Z'), now: NOW },
};
export const UnderTwentyFourHours: Story = {
  args: { closesAt: new Date('2026-07-25T09:30:00Z'), now: NOW },
};
export const UnderOneHour: Story = {
  args: { closesAt: new Date('2026-07-24T12:42:10Z'), now: NOW },
};
export const Closed: Story = {
  args: { closesAt: new Date('2026-07-20T17:00:00Z'), now: NOW },
};
export const DarkMode: Story = {
  render: () => (
    <div data-theme="dark" className="bg-gj-bg p-gj-6 rounded-card flex flex-wrap gap-gj-2">
      <CountdownChip closesAt={new Date('2026-07-27T16:00:00Z')} now={NOW} />
      <CountdownChip closesAt={new Date('2026-07-25T09:30:00Z')} now={NOW} />
      <CountdownChip closesAt={new Date('2026-07-24T12:42:10Z')} now={NOW} />
      <CountdownChip closesAt={new Date('2026-07-20T17:00:00Z')} now={NOW} />
    </div>
  ),
};
