import type { Meta, StoryObj } from '@storybook/react';
import { FileUpload } from './FileUpload';

const meta: Meta<typeof FileUpload> = {
  title: 'UI/C08 FileUpload',
  component: FileUpload,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof FileUpload>;

const constraints = 'PDF, DOCX, XLSX, PPTX, CSV, PNG, JPG, ZIP — max 50MB per file';

export const Empty: Story = { args: { constraintsLabel: constraints, items: [] } };
export const Mixed: Story = {
  args: {
    constraintsLabel: constraints,
    items: [
      { id: '1', name: 'technical-specification.pdf', sizeLabel: '2.4 MB', status: 'clean' },
      { id: '2', name: 'pricing-schedule.xlsx', sizeLabel: '840 KB', status: 'uploading', progress: 62 },
      { id: '3', name: 'company-profile.docx', sizeLabel: '5.1 MB', status: 'scanning' },
      { id: '4', name: 'bbbee-certificate.pdf', sizeLabel: '1.2 MB', status: 'paused' },
      { id: '5', name: 'macro-tool.xlsm', sizeLabel: '3.3 MB', status: 'infected', reason: 'virus detected' },
      { id: '6', name: 'site-photos.zip', sizeLabel: '48.9 MB', status: 'failed', reason: 'Connection lost' },
    ],
    onRetry: () => {},
    onResume: () => {},
    onRemove: () => {},
  },
};
export const Disabled: Story = { args: { constraintsLabel: constraints, items: [], disabled: true } };
export const DarkMode: Story = {
  args: {
    constraintsLabel: constraints,
    items: [
      { id: '1', name: 'technical-specification.pdf', sizeLabel: '2.4 MB', status: 'clean' },
      { id: '2', name: 'pricing-schedule.xlsx', sizeLabel: '840 KB', status: 'uploading', progress: 35 },
    ],
  },
  decorators: [(S) => <div data-theme="dark" className="bg-gj-bg p-gj-6 rounded-card"><S /></div>],
};
