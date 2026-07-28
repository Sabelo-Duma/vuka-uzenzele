import type { Meta, StoryObj } from '@storybook/react';
import { EnvelopeCard } from './EnvelopeCard';

const meta: Meta<typeof EnvelopeCard> = {
  title: 'UI/C09 EnvelopeCard',
  component: EnvelopeCard,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof EnvelopeCard>;

const docs = (
  <ul className="m-0 list-none space-y-gj-2 p-0">
    <li className="flex justify-between rounded-card border border-gj-border px-gj-4 py-gj-2 text-gj-small">
      <span>technical-response.pdf</span><span className="font-gj-mono text-gj-mono text-gj-text-muted">sha256 ✓ 9f2a…c41d</span>
    </li>
    <li className="flex justify-between rounded-card border border-gj-border px-gj-4 py-gj-2 text-gj-small">
      <span>compliance-certificates.zip</span><span className="font-gj-mono text-gj-mono text-gj-text-muted">sha256 ✓ 77b0…e8aa</span>
    </li>
  </ul>
);

export const TechnicalSealed: Story = {
  args: { envelope: 'Technical', sealed: true, sealedCaption: 'Opens automatically for assigned evaluators when the RFx closes (2026-08-01 17:00 SAST).' },
};
export const TechnicalOpen: Story = {
  args: { envelope: 'Technical', sealed: false, children: docs },
};
export const CommercialGateNotMet: Story = {
  args: {
    envelope: 'Commercial', sealed: true,
    onRequestOpen: () => {},
    openDisabledReason: 'Technical gate not met — 2 of 3 evaluators still scoring.',
  },
};
export const CommercialReadyToOpen: Story = {
  args: {
    envelope: 'Commercial', sealed: true,
    sealedCaption: 'Requires the audited "Open commercial envelope" ceremony with a typed reason.',
    onRequestOpen: () => {},
  },
};
export const SideBySide: Story = {
  render: () => (
    <div className="grid gap-gj-4 tablet:grid-cols-2">
      <EnvelopeCard envelope="Technical" sealed={false}>{docs}</EnvelopeCard>
      <EnvelopeCard envelope="Commercial" sealed onRequestOpen={() => {}} openDisabledReason="Technical gate not met." />
    </div>
  ),
};
export const DarkMode: Story = {
  args: { envelope: 'Commercial', sealed: true, onRequestOpen: () => {} },
  decorators: [(S) => <div data-theme="dark" className="bg-gj-bg p-gj-6 rounded-card"><S /></div>],
};
