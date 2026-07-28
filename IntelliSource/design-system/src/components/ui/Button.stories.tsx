import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';

const meta: Meta<typeof Button> = {
  title: 'UI/C01 Button',
  component: Button,
  tags: ['autodocs'],
  argTypes: {
    variant: { control: 'select', options: ['primary', 'default', 'outline', 'danger', 'ghost'] },
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
  },
};
export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story = { args: { variant: 'primary', children: 'Submit for review' } };
export const Default: Story = { args: { variant: 'default', children: 'Cancel' } };
export const Danger: Story = { args: { variant: 'danger', children: 'Withdraw RFx' } };
export const Ghost: Story = { args: { variant: 'ghost', children: 'Back' } };
export const Outline: Story = {
  args: { variant: 'outline', children: 'Contact us' },
  decorators: [(S) => <div className="bg-gj-navy p-gj-6 rounded-card"><S /></div>],
};
export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-gj-4">
      <Button variant="primary" size="sm">Small</Button>
      <Button variant="primary" size="md">Medium</Button>
      <Button variant="primary" size="lg">Large</Button>
    </div>
  ),
};
export const Loading: Story = { args: { variant: 'primary', isLoading: true, children: 'Publishing…' } };
export const Disabled: Story = { args: { variant: 'primary', disabled: true, children: 'Submit for review' } };
export const DarkMode: Story = {
  args: { variant: 'primary', children: 'Submit for review' },
  decorators: [(S) => <div data-theme="dark" className="bg-gj-bg p-gj-6 rounded-card"><S /></div>],
};
