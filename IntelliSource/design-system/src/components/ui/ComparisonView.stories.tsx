import type { Meta, StoryObj } from '@storybook/react';
import { CitationRef, ComparisonView, CompletenessChip } from './ComparisonView';

const meta: Meta<typeof ComparisonView> = {
  title: 'UI/C11 ComparisonView',
  component: ComparisonView,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof ComparisonView>;

export const Default: Story = {
  args: {
    suppliers: [
      { id: 's1', name: 'TechServe SA', rank: 2, weightedTotal: 74.5 },
      { id: 's2', name: 'Ubuntu IT', rank: 1, weightedTotal: 78.25 },
      { id: 's3', name: 'CapeCompute', rank: 3, weightedTotal: 68.75 },
    ],
    sections: [
      {
        title: 'Completeness',
        rows: [
          {
            label: 'Required documents',
            cells: {
              s1: <CompletenessChip ok label="All present" />,
              s2: <CompletenessChip ok label="All present" />,
              s3: <CompletenessChip ok={false} label="Tax cert expired" />,
            },
          },
        ],
      },
      {
        title: 'Technical (weighted)',
        rows: [
          { label: 'Technical capability (40%)', cells: { s1: '8.0', s2: '7.5', s3: '6.5' } },
          { label: 'Delivery timeline (20%)', cells: { s1: '9.0', s2: '7.0', s3: '7.0' } },
        ],
      },
      {
        title: 'Commercial (opened 2026-08-02 09:14)',
        rows: [
          { label: 'Total bid (ZAR, incl. VAT)', cells: { s1: 'R 2 840 000', s2: 'R 2 615 400', s3: 'R 2 990 000' } },
          {
            label: 'AI summary note',
            cells: {
              s2: (
                <span>
                  Strongest warranty terms; local assembly in Durban <CitationRef n={1} onOpen={() => {}} />
                </span>
              ),
            },
          },
        ],
      },
    ],
  },
};
export const DarkMode: Story = {
  args: { ...Default.args },
  decorators: [(S) => <div data-theme="dark" className="bg-gj-bg p-gj-4 rounded-card"><S /></div>],
};
