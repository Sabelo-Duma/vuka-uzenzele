import type { Meta, StoryObj } from '@storybook/react';
import { ScoreMatrix, type Criterion, type SupplierColumn } from './ScoreMatrix';

const criteria: Criterion[] = [
  { id: 'c1', name: 'Technical capability', weightPercent: 40, scaleMax: 10 },
  { id: 'c2', name: 'Delivery timeline', weightPercent: 20, scaleMax: 10 },
  { id: 'c3', name: 'Warranty & support', weightPercent: 15, scaleMax: 10 },
  { id: 'c4', name: 'Local footprint', weightPercent: 25, scaleMax: 10 },
];
const suppliers: SupplierColumn[] = [
  { id: 's1', name: 'TechServe SA' },
  { id: 's2', name: 'Ubuntu IT' },
  { id: 's3', name: 'CapeCompute' },
];

const meta: Meta<typeof ScoreMatrix> = {
  title: 'UI/C10 ScoreMatrix',
  component: ScoreMatrix,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof ScoreMatrix>;

export const Scoring: Story = {
  args: {
    criteria, suppliers,
    cells: {
      c1: { s1: { value: 8 }, s2: { value: 7.5, saving: true }, s3: { aiSuggested: 6.5 } },
      c2: { s1: { value: 9, outlier: true }, s2: { aiSuggested: 7 }, s3: {} },
      c3: { s1: {}, s2: { value: 8 }, s3: { error: 'Could not save — retry.' } },
      c4: { s1: { value: 6 }, s2: {}, s3: { aiSuggested: 8 } },
    },
    onScoreChange: () => {}, onApplyAiSuggestion: () => {},
  },
};
export const CoiGate: Story = { args: { criteria, suppliers, cells: {}, coiGate: true, onDeclareCoi: () => {} } };
export const ReadOnlyConsolidated: Story = {
  args: {
    criteria, suppliers, readOnly: true,
    cells: {
      c1: { s1: { value: 8 }, s2: { value: 7.5 }, s3: { value: 6.5 } },
      c2: { s1: { value: 9, outlier: true }, s2: { value: 7 }, s3: { value: 7 } },
      c3: { s1: { value: 7 }, s2: { value: 8 }, s3: { value: 6 } },
      c4: { s1: { value: 6 }, s2: { value: 9 }, s3: { value: 8 } },
    },
    totals: { s1: 74.5, s2: 78.25, s3: 68.75 },
  },
};
export const DarkMode: Story = {
  args: { criteria: criteria.slice(0, 2), suppliers, cells: { c1: { s1: { value: 8 }, s2: { aiSuggested: 7 }, s3: {} }, c2: { s1: {}, s2: {}, s3: { value: 6 } } } },
  decorators: [(S) => <div data-theme="dark" className="bg-gj-bg p-gj-6 rounded-card"><S /></div>],
};
