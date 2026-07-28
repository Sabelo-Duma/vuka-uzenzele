import type { Meta, StoryObj } from '@storybook/react';
import { SelectField, TextArea, TextInput } from './FormField';

const meta: Meta<typeof TextInput> = {
  title: 'UI/C02 FormField',
  component: TextInput,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof TextInput>;

export const Default: Story = {
  args: { label: 'RFx title', placeholder: 'e.g. Supply of 200 laptops', required: true },
};
export const WithHint: Story = {
  args: { label: 'Central mailbox', placeholder: 'tenders@supplier.co.za', hint: 'Invitations are sent to this address.' },
};
export const ErrorState: Story = {
  args: { label: 'Response due date', error: 'Due date must be after the bidding start date.', required: true },
};
export const Validating: Story = {
  args: { label: 'Supplier registration number', isValidating: true, defaultValue: '2019/123456/07' },
};
export const Disabled: Story = {
  args: { label: 'RFx number', defaultValue: 'RFx-2026-014', disabled: true },
};
export const Select: Story = {
  render: () => (
    <SelectField
      label="Sourcing method"
      required
      placeholder="Select method…"
      options={[
        { value: 'rfq', label: 'RFQ — Request for Quotation' },
        { value: 'rfp', label: 'RFP — Request for Proposal' },
        { value: 'rfi', label: 'RFI — Request for Information' },
      ]}
    />
  ),
};
export const TextAreaStory: Story = {
  name: 'TextArea',
  render: () => <TextArea label="Requirement / objective" placeholder="Describe what you need…" required />,
};
export const DarkMode: Story = {
  args: { label: 'RFx title', placeholder: 'e.g. Supply of 200 laptops', error: 'Title is required.' },
  decorators: [(S) => <div data-theme="dark" className="bg-gj-bg p-gj-6 rounded-card"><S /></div>],
};
