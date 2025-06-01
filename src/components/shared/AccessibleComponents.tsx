import React from 'react';
import { cn } from '@/lib/utils';

// Skip to main content link for screen readers
export const SkipToContent: React.FC = () => (
  <a
    href="#main-content"
    className="sr-only z-[var(--z-tooltip)] rounded-md bg-[var(--color-primary)] px-4 py-2 font-medium text-white transition-all focus:not-sr-only focus:absolute focus:left-4 focus:top-4"
  >
    Skip to main content
  </a>
);

// Accessible heading component with proper hierarchy
interface AccessibleHeadingProps {
  level: 1 | 2 | 3 | 4 | 5 | 6;
  children: React.ReactNode;
  className?: string;
  id?: string;
}

export const AccessibleHeading: React.FC<AccessibleHeadingProps> = ({
  level,
  children,
  className,
  id,
}) => {
  const Tag = `h${level}` as keyof JSX.IntrinsicElements;

  const baseClasses = {
    1: 'text-3xl font-bold text-[var(--color-text-primary)]',
    2: 'text-2xl font-semibold text-[var(--color-text-primary)]',
    3: 'text-xl font-semibold text-[var(--color-text-primary)]',
    4: 'text-lg font-medium text-[var(--color-text-primary)]',
    5: 'text-base font-medium text-[var(--color-text-primary)]',
    6: 'text-sm font-medium text-[var(--color-text-secondary)]',
  };

  return (
    <Tag id={id} className={cn(baseClasses[level], className)}>
      {children}
    </Tag>
  );
};

// Accessible form components
interface AccessibleInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helperText?: string;
  required?: boolean;
}

export const AccessibleInput: React.FC<AccessibleInputProps> = ({
  label,
  error,
  helperText,
  required,
  id,
  className,
  ...props
}) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
  const errorId = error ? `${inputId}-error` : undefined;
  const helperId = helperText ? `${inputId}-helper` : undefined;

  return (
    <div className="space-y-2">
      <label
        htmlFor={inputId}
        className="block text-sm font-medium text-[var(--color-text-primary)]"
      >
        {label}
        {required && (
          <span className="ml-1 text-[var(--color-error)]" aria-label="required">
            *
          </span>
        )}
      </label>

      <input
        id={inputId}
        className={cn(
          'w-full rounded-md border px-3 py-2',
          'border-[var(--color-border-primary)]',
          'focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]',
          'disabled:cursor-not-allowed disabled:bg-[var(--color-gray-100)]',
          error && 'border-[var(--color-error)] focus:ring-[var(--color-error)]',
          className
        )}
        aria-describedby={cn(helperId, errorId)}
        aria-invalid={error ? 'true' : 'false'}
        required={required}
        {...props}
      />

      {helperText && (
        <p id={helperId} className="text-sm text-[var(--color-text-secondary)]">
          {helperText}
        </p>
      )}

      {error && (
        <p
          id={errorId}
          className="text-sm text-[var(--color-error)]"
          role="alert"
          aria-live="polite"
        >
          {error}
        </p>
      )}
    </div>
  );
};

// Accessible button with loading state
interface AccessibleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  loadingText?: string;
  children: React.ReactNode;
}

export const AccessibleButton: React.FC<AccessibleButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  loadingText = 'Loading...',
  children,
  disabled,
  className,
  ...props
}) => {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-md font-medium',
        'focus:outline-none focus:ring-2 focus:ring-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'transition-colors duration-200',
        {
          'px-3 py-1.5 text-sm': size === 'sm',
          'px-4 py-2 text-sm': size === 'md',
          'px-6 py-3 text-base': size === 'lg',
        },
        {
          'bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] focus:ring-[var(--color-primary)]':
            variant === 'primary',
          'bg-[var(--color-secondary)] text-white hover:bg-[var(--color-secondary-hover)] focus:ring-[var(--color-secondary)]':
            variant === 'secondary',
          'border border-[var(--color-border-primary)] bg-white text-[var(--color-text-primary)] hover:bg-[var(--color-gray-50)] focus:ring-[var(--color-primary)]':
            variant === 'outline',
          'text-[var(--color-text-primary)] hover:bg-[var(--color-gray-100)] focus:ring-[var(--color-primary)]':
            variant === 'ghost',
        },
        className
      )}
      disabled={disabled || loading}
      aria-disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <>
          <svg
            className="-ml-1 mr-2 h-4 w-4 animate-spin"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span className="sr-only">{loadingText}</span>
        </>
      )}
      {loading ? loadingText : children}
    </button>
  );
};

// Accessible modal/dialog
interface AccessibleModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}

export const AccessibleModal: React.FC<AccessibleModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  className,
}) => {
  const modalRef = React.useRef<HTMLDivElement>(null);
  const titleId = `modal-title-${Math.random().toString(36).substr(2, 9)}`;

  // Trap focus within modal
  React.useEffect(() => {
    if (!isOpen) return;

    const modal = modalRef.current;
    if (!modal) return;

    const focusableElements = modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement?.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement?.focus();
          }
        }
      }
    };

    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleTabKey);
    document.addEventListener('keydown', handleEscapeKey);
    firstElement?.focus();

    return () => {
      document.removeEventListener('keydown', handleTabKey);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[var(--z-modal)] overflow-y-auto"
      aria-labelledby={titleId}
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="flex min-h-screen items-center justify-center p-4">
        <div
          ref={modalRef}
          className={cn(
            'relative w-full max-w-md rounded-lg bg-white p-6 shadow-xl',
            'transform transition-all',
            className
          )}
          onClick={e => e.stopPropagation()}
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 id={titleId} className="text-lg font-semibold text-[var(--color-text-primary)]">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
              aria-label="Close modal"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
};

// Accessible table with screen reader support
interface AccessibleTableProps {
  caption?: string;
  headers: string[];
  rows: (string | number | React.ReactNode)[][];
  className?: string;
}

export const AccessibleTable: React.FC<AccessibleTableProps> = ({
  caption,
  headers,
  rows,
  className,
}) => {
  return (
    <div className="overflow-x-auto">
      <table className={cn('min-w-full divide-y divide-[var(--color-border-primary)]', className)}>
        {caption && (
          <caption className="mb-4 text-sm text-[var(--color-text-secondary)]">{caption}</caption>
        )}
        <thead className="bg-[var(--color-bg-secondary)]">
          <tr>
            {headers.map((header, index) => (
              <th
                key={index}
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--color-text-secondary)]"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--color-border-primary)] bg-white">
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex} className="hover:bg-[var(--color-bg-secondary)]">
              {row.map((cell, cellIndex) => (
                <td
                  key={cellIndex}
                  className="whitespace-nowrap px-6 py-4 text-sm text-[var(--color-text-primary)]"
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Screen reader only content
export const ScreenReaderOnly: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="sr-only">{children}</span>
);

// Live region for announcements
export const LiveRegion: React.FC<{
  children: React.ReactNode;
  politeness?: 'polite' | 'assertive';
}> = ({ children, politeness = 'polite' }) => (
  <div aria-live={politeness} aria-atomic="true" className="sr-only">
    {children}
  </div>
);
