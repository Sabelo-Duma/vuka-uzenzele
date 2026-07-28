import type { FormEvent, ReactNode } from 'react';
import { useRef, useState } from 'react';
import { cx } from '../../utils/cx';
import { AIBadge } from './AIPanel';
import { Banner } from './Feedback';
import { IconPaperclip, IconSend } from './icons';

/** C15 IntakeChat — conversational intake; user navy-right, assistant left with AIBadge; manual fallback never dead-ends. */
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: ReactNode;
}

export interface IntakeChatProps {
  messages: ChatMessage[];
  /** Assistant is generating (3-dot indicator; static text under reduced motion). */
  isTyping?: boolean;
  /** AI degraded → banner + manual form link; composer stays usable. */
  degraded?: boolean;
  manualFormHref?: string;
  onSend?: (text: string) => void;
  onAttach?: () => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function IntakeChat({
  messages, isTyping, degraded, manualFormHref = '#manual',
  onSend, onAttach, placeholder = 'Describe what you need…', disabled, className,
}: IntakeChatProps) {
  const [draft, setDraft] = useState('');
  const listRef = useRef<HTMLDivElement>(null);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (text.length === 0) return;
    onSend?.(text);
    setDraft('');
  };

  return (
    <div className={cx('flex h-full min-h-[320px] flex-col rounded-card border border-gj-border bg-gj-bg', className)}>
      {degraded && (
        <Banner tone="ai" className="rounded-t-card">
          AI assist unavailable — <a className="text-gj-link underline" href={manualFormHref}>use the standard form</a>. Your request can still be submitted.
        </Banner>
      )}

      <div
        ref={listRef}
        aria-live="polite"
        aria-label="Intake conversation"
        className="flex-1 space-y-gj-4 overflow-y-auto p-gj-5"
      >
        {messages.map((m) => (
          <div key={m.id} className={cx('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}>
            <div
              className={cx(
                'max-w-[85%] rounded-card px-gj-4 py-gj-3 text-gj-base',
                m.role === 'user'
                  ? 'bg-gj-navy text-white'
                  : 'border border-gj-border bg-gj-bg-light text-gj-text',
              )}
            >
              {m.role === 'assistant' && (
                <div className="mb-gj-2"><AIBadge label="Assistant" /></div>
              )}
              {m.content}
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start" role="status" aria-label="Assistant is typing">
            <div className="rounded-card border border-gj-border bg-gj-bg-light px-gj-4 py-gj-3">
              <span className="motion-safe:hidden text-gj-small text-gj-text-muted">Typing…</span>
              <span className="hidden motion-safe:inline-flex gap-1" aria-hidden="true">
                {[0, 150, 300].map((delay) => (
                  <span
                    key={delay}
                    className="h-2 w-2 rounded-full bg-gj-text-subtle animate-gj-pulse-soft"
                    style={{ animationDelay: `${delay}ms` }}
                  />
                ))}
              </span>
            </div>
          </div>
        )}
      </div>

      <form onSubmit={submit} className="flex items-end gap-gj-2 border-t border-gj-border p-gj-4">
        {onAttach && (
          <button
            type="button"
            onClick={onAttach}
            disabled={disabled}
            aria-label="Attach files"
            className="flex h-10 w-10 items-center justify-center rounded-pill border border-gj-border text-gj-text-muted hover:bg-gj-bg-hover disabled:opacity-40"
          >
            <IconPaperclip size={16} />
          </button>
        )}
        <label className="gj-sr-only" htmlFor="gj-intake-composer">Describe your need</label>
        <textarea
          id="gj-intake-composer"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              submit(e);
            }
          }}
          placeholder={placeholder}
          disabled={disabled}
          rows={2}
          className="min-h-[44px] flex-1 resize-none rounded-textarea border border-gj-border bg-transparent px-gj-4 py-gj-2 text-gj-small text-gj-text outline-none placeholder:text-gj-text-subtle focus:border-gj-border-strong disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={disabled || draft.trim().length === 0}
          aria-label="Send message"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-gj-red text-white transition-colors duration-gj-brand ease-gj hover:bg-gj-red-hover disabled:opacity-40"
        >
          <IconSend size={16} />
        </button>
      </form>
    </div>
  );
}
