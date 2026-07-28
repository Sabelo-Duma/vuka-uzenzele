import type { Meta, StoryObj } from '@storybook/react';
import { Banner, InlineError, Toast } from './Feedback';

const meta: Meta<typeof Toast> = {
  title: 'UI/C12 Feedback',
  component: Toast,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof Toast>;

export const SuccessToast: Story = {
  args: { tone: 'success', message: 'RFx-2026-014 published — invitations dispatched to 12 suppliers.', onDismiss: () => {} },
};
export const ErrorToast: Story = {
  args: {
    tone: 'danger',
    message: "Couldn't save your changes — retrying (2/3)…",
    actionLabel: 'Retry now',
    onAction: () => {},
    onDismiss: () => {},
    errorId: 'ERR-20260724-00042',
  },
};
export const InfoBanner: Story = {
  render: () => (
    <Banner tone="info" onDismiss={() => {}}>
      This RFx changed while you were viewing — <a href="#diff" className="text-gj-link underline">review changes</a>.
    </Banner>
  ),
};
export const AiDegradedBanner: Story = {
  render: () => (
    <Banner tone="ai">AI assist unavailable — manual mode active. All sourcing actions remain available.</Banner>
  ),
};
export const OfflineBanner: Story = {
  render: () => (
    <Banner tone="warning">You are offline — changes are queued and will sync when the connection returns.</Banner>
  ),
};
export const FieldError: Story = {
  render: () => <InlineError message="Comments are required when rejecting." />,
};
export const DarkMode: Story = {
  render: () => (
    <div data-theme="dark" className="bg-gj-bg p-gj-6 rounded-card space-y-gj-3">
      <Toast tone="danger" message="Upload failed for pricing.xlsx." actionLabel="Retry" onAction={() => {}} errorId="ERR-20260724-00043" />
      <Banner tone="ai">AI assist unavailable — manual mode active.</Banner>
    </div>
  ),
};
