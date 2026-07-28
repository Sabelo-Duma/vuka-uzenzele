import type { ChangeEvent } from 'react';
import { useRef } from 'react';
import { cx } from '../../utils/cx';
import { Button } from './Button';
import { IconAlert, IconCheck, IconFile, IconShield, IconUpload } from './icons';

/** C08 FileUpload — dashed dropzone, per-file rows with progress/scan states, resumable errors. */
export type FileStatus = 'uploading' | 'scanning' | 'clean' | 'infected' | 'failed' | 'paused';

export interface UploadItem {
  id: string;
  name: string;
  sizeLabel: string;
  status: FileStatus;
  /** 0–100 while uploading. */
  progress?: number;
  /** Reason for infected/failed. */
  reason?: string;
}

export interface FileUploadProps {
  /** e.g. "PDF, DOCX, XLSX, PNG — max 50MB per file". */
  constraintsLabel: string;
  items: UploadItem[];
  onFilesSelected?: (files: FileList) => void;
  onRetry?: (id: string) => void;
  onResume?: (id: string) => void;
  onRemove?: (id: string) => void;
  disabled?: boolean;
  accept?: string;
  multiple?: boolean;
  className?: string;
}

function StatusCell({ item, onRetry, onResume }: { item: UploadItem; onRetry?: (id: string) => void; onResume?: (id: string) => void }) {
  switch (item.status) {
    case 'uploading':
      return (
        <div className="flex w-40 items-center gap-gj-2" aria-label={`Uploading ${item.progress ?? 0}%`}>
          <div className="h-1 flex-1 overflow-hidden rounded-chip bg-gj-bg-hover">
            <div className="h-full bg-gj-navy transition-all duration-gj-fast ease-gj" style={{ width: `${item.progress ?? 0}%` }} />
          </div>
          <span data-numeric className="text-gj-small text-gj-text-muted">{item.progress ?? 0}%</span>
        </div>
      );
    case 'scanning':
      return <span className="inline-flex items-center gap-gj-1 text-gj-small text-gj-text-muted"><IconShield size={14} /> Scanning…</span>;
    case 'clean':
      return <span className="inline-flex items-center gap-gj-1 text-gj-small text-gj-success"><IconCheck size={14} /> Clean</span>;
    case 'infected':
      return (
        <span className="inline-flex items-center gap-gj-1 text-gj-small text-gj-danger" role="alert">
          <IconAlert size={14} /> Rejected — {item.reason ?? 'virus detected'}
        </span>
      );
    case 'failed':
      return (
        <span className="inline-flex items-center gap-gj-2 text-gj-small text-gj-danger">
          <IconAlert size={14} /> {item.reason ?? 'Upload failed'}
          {onRetry && <Button size="sm" variant="default" onClick={() => onRetry(item.id)}>Retry</Button>}
        </span>
      );
    case 'paused':
      return (
        <span className="inline-flex items-center gap-gj-2 text-gj-small text-gj-warning">
          Interrupted
          {onResume && <Button size="sm" variant="default" onClick={() => onResume(item.id)}>Resume</Button>}
        </span>
      );
  }
}

export function FileUpload({
  constraintsLabel, items, onFilesSelected, onRetry, onResume, onRemove,
  disabled, accept, multiple = true, className,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) onFilesSelected?.(e.target.files);
    e.target.value = '';
  };

  return (
    <div className={className}>
      <div
        className={cx(
          'flex flex-col items-center justify-center gap-gj-2 rounded-card border-2 border-dashed border-gj-border-strong p-gj-7 text-center',
          disabled && 'opacity-50',
        )}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          if (!disabled && e.dataTransfer.files.length > 0) onFilesSelected?.(e.dataTransfer.files);
        }}
      >
        <span className="text-gj-navy" aria-hidden="true"><IconUpload size={32} /></span>
        <p className="m-0 text-gj-base text-gj-text">
          Drop files here or{' '}
          <button
            type="button"
            disabled={disabled}
            onClick={() => inputRef.current?.click()}
            className="text-gj-link underline hover:text-gj-heading-dark disabled:cursor-not-allowed"
          >
            browse
          </button>
        </p>
        <p className="m-0 text-gj-small text-gj-text-muted">{constraintsLabel}</p>
        <input ref={inputRef} type="file" accept={accept} multiple={multiple} onChange={handleChange} className="gj-sr-only" aria-label="Choose files to upload" tabIndex={-1} />
      </div>

      {items.length > 0 && (
        <ul className="m-0 mt-gj-3 list-none space-y-gj-2 p-0" aria-live="polite">
          {items.map((item) => (
            <li key={item.id} className="flex flex-wrap items-center gap-gj-3 rounded-card border border-gj-border px-gj-4 py-gj-3">
              <span className="text-gj-text-muted" aria-hidden="true"><IconFile size={18} /></span>
              <span className="min-w-0 flex-1 truncate text-gj-small text-gj-text">{item.name}</span>
              <span data-numeric className="text-gj-small text-gj-text-muted">{item.sizeLabel}</span>
              <StatusCell item={item} onRetry={onRetry} onResume={onResume} />
              {onRemove && item.status !== 'uploading' && (
                <button type="button" onClick={() => onRemove(item.id)} aria-label={`Remove ${item.name}`}
                  className="rounded-pill px-2 py-1 text-gj-small text-gj-text-muted hover:bg-gj-bg-hover hover:text-gj-danger">
                  Remove
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
