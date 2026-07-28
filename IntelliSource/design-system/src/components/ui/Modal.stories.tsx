import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Button } from './Button';
import { TextArea } from './FormField';
import { Drawer, Modal } from './Modal';

const meta: Meta<typeof Modal> = {
  title: 'UI/C14 Modal & Drawer',
  component: Modal,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof Modal>;

function ConfirmDemo() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="danger" onClick={() => setOpen(true)}>Withdraw RFx</Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Withdraw RFQ-2026-014?"
        destructive
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button variant="danger" onClick={() => setOpen(false)}>Withdraw</Button>
          </>
        }
      >
        <p className="text-gj-text-muted">
          All 12 invited suppliers will be notified within 5 minutes. This action is audited and cannot be undone.
        </p>
        <TextArea label="Reason (minimum 10 characters)" required placeholder="Why is this event being withdrawn?" />
      </Modal>
    </>
  );
}

function DrawerDemo() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="default" onClick={() => setOpen(true)}>View audit entry</Button>
      <Drawer open={open} onClose={() => setOpen(false)} title="Audit entry #48291">
        <dl className="space-y-gj-2 text-gj-small">
          <div><dt className="font-semibold text-gj-navy">Action</dt><dd className="m-0 text-gj-text-muted">StatusChange: PendingReview → Published</dd></div>
          <div><dt className="font-semibold text-gj-navy">Actor</dt><dd className="m-0 text-gj-text-muted">thandi.m@customer.co.za</dd></div>
          <div><dt className="font-semibold text-gj-navy">Timestamp</dt><dd className="m-0 font-gj-mono text-gj-mono">2026-07-24T09:14:03Z</dd></div>
        </dl>
      </Drawer>
    </>
  );
}

export const DestructiveConfirm: Story = { render: () => <ConfirmDemo /> };
export const DetailDrawer: Story = { render: () => <DrawerDemo /> };
export const DarkMode: Story = {
  render: () => (
    <div data-theme="dark" className="bg-gj-bg p-gj-6 rounded-card">
      <ConfirmDemo />
    </div>
  ),
};
