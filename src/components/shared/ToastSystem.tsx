import React from 'react';
import { cn } from '@/lib/utils';
import { useErrorStore, useErrorSelectors } from '@/stores/errorStore';

// Toast component
interface ToastProps {
  error: {
    id: string;
    message: string;
    type: 'error' | 'warning' | 'info' | 'success';
    action?: {
      label: string;
      handler: () => void;
    };
    dismissible?: boolean;
  };
  onRemove: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({ error, onRemove }) => {
  const { id, message, type, action, dismissible = true } = error;

  const typeStyles = {
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    success: 'bg-green-50 border-green-200 text-green-800',
  };

  const iconStyles = {
    error: 'text-red-400',
    warning: 'text-yellow-400',
    info: 'text-blue-400',
    success: 'text-green-400',
  };

  const icons = {
    error: (
      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
          clipRule="evenodd"
        />
      </svg>
    ),
    warning: (
      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
          clipRule="evenodd"
        />
      </svg>
    ),
    info: (
      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
          clipRule="evenodd"
        />
      </svg>
    ),
    success: (
      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
          clipRule="evenodd"
        />
      </svg>
    ),
  };

  return (
    <div
      className={cn(
        'flex w-full max-w-sm items-start rounded-lg border p-4 shadow-lg',
        'transform transition-all duration-300 ease-in-out',
        'animate-slide-in',
        typeStyles[type]
      )}
      role="alert"
      aria-live="assertive"
    >
      <div className={cn('flex-shrink-0', iconStyles[type])}>{icons[type]}</div>

      <div className="ml-3 flex-1">
        <p className="text-sm font-medium">{message}</p>

        {action && (
          <div className="mt-2">
            <button
              onClick={() => {
                action.handler();
                onRemove(id);
              }}
              className="text-sm font-medium underline hover:no-underline"
            >
              {action.label}
            </button>
          </div>
        )}
      </div>

      {dismissible && (
        <button
          onClick={() => onRemove(id)}
          className="ml-4 flex-shrink-0 text-gray-400 hover:text-gray-600"
          aria-label="Dismiss notification"
        >
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      )}
    </div>
  );
};

// Toast container
export const ToastContainer: React.FC = () => {
  const errors = useErrorSelectors.errors();
  const { removeError } = useErrorStore();

  if (errors.length === 0) return null;

  return (
    <div className="fixed right-4 top-4 z-[var(--z-toast)] space-y-2" aria-label="Notifications">
      {errors.map(error => (
        <Toast key={error.id} error={error} onRemove={removeError} />
      ))}
    </div>
  );
};

// Hook for showing toasts
export const useToast = () => {
  const { addError, addSuccess, addNetworkError, addValidationError } = useErrorStore();

  return {
    showError: (
      message: string,
      options?: {
        code?: string;
        action?: { label: string; handler: () => void };
        autoClose?: number;
      }
    ) => {
      addError({
        message,
        type: 'error',
        code: options?.code,
        action: options?.action,
        autoClose: options?.autoClose,
      });
    },

    showWarning: (message: string, autoClose?: number) => {
      addError({
        message,
        type: 'warning',
        autoClose: autoClose ?? 5000,
      });
    },

    showInfo: (message: string, autoClose?: number) => {
      addError({
        message,
        type: 'info',
        autoClose: autoClose ?? 4000,
      });
    },

    showSuccess: (message: string, autoClose?: number) => {
      addSuccess(message, autoClose);
    },

    showNetworkError: (message?: string) => {
      addNetworkError(message);
    },

    showValidationError: (field: string, message: string) => {
      addValidationError(field, message);
    },
  };
};
