import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { TextInput } from './FormField';
import { Wizard, type WizardStep } from './Wizard';

const steps: WizardStep[] = [
  { id: 'details', label: 'Details' },
  { id: 'documents', label: 'Documents' },
  { id: 'criteria', label: 'Criteria', hasErrors: true },
  { id: 'suppliers', label: 'Suppliers' },
  { id: 'review', label: 'Review' },
];

const meta: Meta<typeof Wizard> = {
  title: 'UI/C20 Wizard',
  component: Wizard,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
};
export default meta;
type Story = StoryObj<typeof Wizard>;

function Demo({ withErrors = false, submitting = false }: { withErrors?: boolean; submitting?: boolean }) {
  const [current, setCurrent] = useState(withErrors ? 'criteria' : 'details');
  const idx = steps.findIndex((s) => s.id === current);
  return (
    <Wizard
      steps={steps}
      currentStepId={current}
      onStepSelect={setCurrent}
      autosave={{ state: submitting ? 'saving' : 'saved', lastSavedLabel: '12:04:31' }}
      errorSummary={withErrors ? [
        { label: 'Criteria weights must total exactly 100% (currently 85%)', fieldId: 'weights' },
        { label: 'Technical capability is missing a scale', fieldId: 'scale-c1' },
      ] : undefined}
      onBack={() => setCurrent(steps[Math.max(0, idx - 1)].id)}
      onNext={() => setCurrent(steps[Math.min(steps.length - 1, idx + 1)].id)}
      finalAction={{ label: 'Submit for review', onClick: () => {} }}
      isSubmitting={submitting}
    >
      <div className="max-w-lg space-y-gj-4">
        <TextInput label="RFx title" required placeholder="e.g. Supply of 200 laptops — Durban" />
        <TextInput label="Central mailbox" placeholder="tenders@customer.co.za" />
      </div>
    </Wizard>
  );
}

export const Default: Story = { render: () => <Demo /> };
export const WithErrorSummary: Story = { render: () => <Demo withErrors /> };
export const Submitting: Story = { render: () => <Demo submitting /> };
export const OfflineAutosave: Story = {
  render: () => (
    <Wizard
      steps={steps}
      currentStepId="documents"
      autosave={{ state: 'offline' }}
      onBack={() => {}}
      onNext={() => {}}
      children={<p className="text-gj-text-muted">Changes are queued and will sync when the connection returns.</p>}
    />
  ),
};
export const DarkMode: Story = {
  render: () => <div data-theme="dark" className="bg-gj-bg p-gj-4 rounded-card"><Demo /></div>,
};
