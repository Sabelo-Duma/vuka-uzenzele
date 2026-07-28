import type { Meta, StoryObj } from '@storybook/react';
import { ChartCard, KpiCard } from './KpiCard';

const meta: Meta<typeof KpiCard> = {
  title: 'UI/C17 KpiCard & ChartCard',
  component: KpiCard,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof KpiCard>;

export const Default: Story = {
  args: { label: 'Avg cycle time (90 days)', value: '18.4 days', delta: { direction: 'down', text: '31% vs baseline', positiveIsGood: false } },
};
export const KpiRow: Story = {
  render: () => (
    <div className="grid gap-gj-4 tablet:grid-cols-4">
      <KpiCard label="Open events" value="24" />
      <KpiCard label="Closing ≤ 7 days" value="6" delta={{ direction: 'up', text: '2 more than last week', positiveIsGood: false }} />
      <KpiCard label="Response rate" value="78%" delta={{ direction: 'up', text: '5 pts' }} />
      <KpiCard label="My pending approvals" value="3" />
    </div>
  ),
};
export const Loading: Story = { args: { label: 'Open events', isLoading: true } };
export const ErrorState: Story = { args: { label: 'Response rate', error: 'Could not load.', onRetry: () => {} } };
export const Chart: Story = {
  render: () => (
    <ChartCard
      title="Pipeline by status"
      onExportCsv={() => {}}
      onExportPdf={() => {}}
      chart={
        <div className="flex h-40 items-end gap-gj-3">
          {[
            { label: 'Draft', h: 40, cls: 'bg-gj-text-subtle' },
            { label: 'Review', h: 25, cls: 'bg-gj-warning-fill' },
            { label: 'Published', h: 80, cls: 'bg-gj-info' },
            { label: 'Evaluating', h: 55, cls: 'bg-gj-navy' },
            { label: 'Awarded', h: 35, cls: 'bg-gj-success-fill' },
          ].map((b) => (
            <div key={b.label} className="flex flex-1 flex-col items-center gap-gj-1">
              <div className={`w-full rounded-t-card ${b.cls}`} style={{ height: `${b.h}%` }} />
              <span className="text-[11px] uppercase text-gj-text-muted">{b.label}</span>
            </div>
          ))}
        </div>
      }
      renderTable={() => (
        <table className="w-full text-gj-small">
          <thead><tr><th className="text-left">Status</th><th className="text-right">Events</th></tr></thead>
          <tbody>
            <tr><td>Draft</td><td className="text-right">8</td></tr>
            <tr><td>Review</td><td className="text-right">5</td></tr>
            <tr><td>Published</td><td className="text-right">16</td></tr>
            <tr><td>Evaluating</td><td className="text-right">11</td></tr>
            <tr><td>Awarded</td><td className="text-right">7</td></tr>
          </tbody>
        </table>
      )}
    />
  ),
};
export const DarkMode: Story = {
  render: () => (
    <div data-theme="dark" className="bg-gj-bg p-gj-6 rounded-card grid gap-gj-4 tablet:grid-cols-2">
      <KpiCard label="Open events" value="24" delta={{ direction: 'up', text: '3' }} />
      <KpiCard label="Response rate" value="78%" delta={{ direction: 'down', text: '2 pts' }} />
    </div>
  ),
};
