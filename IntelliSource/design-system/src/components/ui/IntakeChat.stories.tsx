import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';
import { IntakeChat, type ChatMessage } from './IntakeChat';

const meta: Meta<typeof IntakeChat> = {
  title: 'UI/C15 IntakeChat',
  component: IntakeChat,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof IntakeChat>;

const messages: ChatMessage[] = [
  { id: '1', role: 'user', content: 'We need 200 mid-range laptops for the Durban office by October.' },
  {
    id: '2',
    role: 'assistant',
    content: (
      <div className="space-y-gj-2">
        <p className="m-0">Got it — a few quick questions to complete the specification:</p>
        <ol className="m-0 list-decimal pl-5 text-gj-small">
          <li>Any preferred specification (CPU/RAM/storage)?</li>
          <li>Is there an approved budget range?</li>
          <li>Delivery to a single site or multiple?</li>
        </ol>
      </div>
    ),
  },
  { id: '3', role: 'user', content: 'i5/16GB/512GB. Budget ±R3m. Single site: 14 Umgeni Rd.' },
  {
    id: '4',
    role: 'assistant',
    content: (
      <div className="space-y-gj-2">
        <p className="m-0">Here's your draft specification:</p>
        <div className="rounded-card border border-gj-border bg-gj-bg p-gj-3 text-gj-small">
          <strong>INT-2026-031 · IT Hardware</strong>
          <ul className="m-0 mt-gj-1 list-disc pl-5">
            <li>200 × laptop, i5/16GB/512GB, 3-yr warranty</li>
            <li>Delivery: 14 Umgeni Rd, Durban — by 30 Oct 2026</li>
            <li>Budget estimate: R3.0m</li>
          </ul>
        </div>
        <div className="flex gap-gj-2">
          <Button size="sm" variant="primary">Looks right — submit</Button>
          <Button size="sm" variant="ghost">Edit sections</Button>
        </div>
      </div>
    ),
  },
];

export const Conversation: Story = { args: { messages, onSend: () => {}, onAttach: () => {} } };
export const Typing: Story = { args: { messages: messages.slice(0, 3), isTyping: true, onSend: () => {} } };
export const DegradedFallback: Story = { args: { messages: messages.slice(0, 1), degraded: true, onSend: () => {} } };
export const EmptyStart: Story = { args: { messages: [], onSend: () => {}, onAttach: () => {} } };
export const DarkMode: Story = {
  args: { messages, onSend: () => {} },
  decorators: [(S) => <div data-theme="dark" className="bg-gj-bg p-gj-4 rounded-card"><S /></div>],
};
