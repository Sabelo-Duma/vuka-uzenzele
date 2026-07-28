import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';
import { CountdownChip } from './CountdownChip';
import { DataTable, type DataTableColumn } from './DataTable';
import { EmptyState } from './EmptyState';
import { StatusBadge, type RfxStatus } from './StatusBadge';

interface Row {
  number: string;
  title: string;
  type: string;
  status: RfxStatus;
  due: string;
  responses: number;
}

const rows: Row[] = [
  { number: 'RFQ-2026-014', title: 'Supply of 200 laptops — Durban', type: 'RFQ', status: 'Published', due: '2026-08-01T15:00:00Z', responses: 5 },
  { number: 'RFP-2026-009', title: 'Managed print services', type: 'RFP', status: 'PendingApproval', due: '2026-08-14T15:00:00Z', responses: 0 },
  { number: 'RFI-2026-006', title: 'Cloud security tooling landscape', type: 'RFI', status: 'Evaluating', due: '2026-07-20T15:00:00Z', responses: 9 },
  { number: 'RFQ-2026-013', title: 'Office furniture — Midrand', type: 'RFQ', status: 'Awarded', due: '2026-07-05T15:00:00Z', responses: 7 },
];

const NOW = new Date('2026-07-24T12:00:00Z');

const columns: Array<DataTableColumn<Row>> = [
  { key: 'number', header: 'Number', sortable: true, render: (r) => <span className="font-gj-mono text-gj-mono">{r.number}</span> },
  { key: 'title', header: 'Title', sortable: true, render: (r) => r.title },
  { key: 'type', header: 'Type', hideOnMobile: true, render: (r) => r.type },
  { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
  { key: 'due', header: 'Closes', hideOnMobile: true, render: (r) => <CountdownChip closesAt={r.due} now={NOW} /> },
  { key: 'responses', header: 'Responses', numeric: true, render: (r) => r.responses },
  { key: 'actions', header: 'Actions', render: () => <Button size="sm" variant="ghost">Open</Button> },
];

const meta: Meta<typeof DataTable<Row>> = {
  title: 'UI/C05 DataTable',
  component: DataTable<Row>,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof DataTable<Row>>;

export const Default: Story = {
  args: { columns, rows, rowKey: (r: Row) => r.number, caption: 'Sourcing pipeline', sortKey: 'number', sortDirection: 'asc', onSort: () => {} },
};
export const Loading: Story = {
  args: { columns, rows: [], rowKey: (r: Row) => r.number, caption: 'Sourcing pipeline', isLoading: true },
};
export const ErrorState: Story = {
  args: {
    columns, rows: [], rowKey: (r: Row) => r.number, caption: 'Sourcing pipeline',
    error: 'Could not load the pipeline (ERR-20260724-00051).', onRetry: () => {},
  },
};
export const Empty: Story = {
  args: {
    columns, rows: [], rowKey: (r: Row) => r.number, caption: 'Sourcing pipeline',
    emptyState: <EmptyState title="No sourcing events yet" description="Create your first RFx to get started." action={<Button variant="primary">New RFx</Button>} />,
  },
};
export const LiveUpdateHighlight: Story = {
  args: {
    columns, rows, rowKey: (r: Row) => r.number, caption: 'Sourcing pipeline',
    highlightedRowKeys: new Set(['RFQ-2026-014']),
  },
};
export const DarkMode: Story = {
  args: { columns, rows, rowKey: (r: Row) => r.number, caption: 'Sourcing pipeline' },
  decorators: [(S) => <div data-theme="dark" className="bg-gj-bg p-gj-6 rounded-card"><S /></div>],
};
