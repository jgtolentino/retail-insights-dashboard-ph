import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

export interface AppError {
  id: string;
  message: string;
  type: 'error' | 'warning' | 'info' | 'success';
  timestamp: number;
  code?: string;
  details?: any;
  action?: {
    label: string;
    handler: () => void;
  };
  dismissible?: boolean;
  autoClose?: number; // milliseconds
}

interface ErrorState {
  errors: AppError[];
  networkStatus: 'online' | 'offline' | 'reconnecting';
  lastSync: number | null;
}

interface ErrorActions {
  addError: (error: Omit<AppError, 'id' | 'timestamp'>) => void;
  removeError: (id: string) => void;
  clearErrors: () => void;
  setNetworkStatus: (status: ErrorState['networkStatus']) => void;
  updateLastSync: () => void;
  
  // Convenience methods
  addNetworkError: (message?: string) => void;
  addValidationError: (field: string, message: string) => void;
  addSuccess: (message: string, autoClose?: number) => void;
}

type ErrorStore = ErrorState & ErrorActions;

const generateId = () => Math.random().toString(36).substr(2, 9);

export const useErrorStore = create<ErrorStore>()(
  subscribeWithSelector((set, get) => ({
    errors: [],
    networkStatus: 'online',
    lastSync: null,

    addError: (error) => {
      const id = generateId();
      const timestamp = Date.now();
      
      const newError: AppError = {
        id,
        timestamp,
        dismissible: true,
        ...error,
      };

      set((state) => ({
        errors: [...state.errors, newError],
      }));

      // Auto-remove after specified time
      if (newError.autoClose) {
        setTimeout(() => {
          get().removeError(id);
        }, newError.autoClose);
      }
    },

    removeError: (id) => {
      set((state) => ({
        errors: state.errors.filter((error) => error.id !== id),
      }));
    },

    clearErrors: () => {
      set({ errors: [] });
    },

    setNetworkStatus: (status) => {
      set({ networkStatus: status });
      
      if (status === 'offline') {
        get().addError({
          message: 'Connection lost. Some features may not work properly.',
          type: 'warning',
          dismissible: false,
        });
      } else if (status === 'online') {
        // Remove offline warnings
        set((state) => ({
          errors: state.errors.filter(
            (error) => !error.message.includes('Connection lost')
          ),
        }));
      }
    },

    updateLastSync: () => {
      set({ lastSync: Date.now() });
    },

    // Convenience methods
    addNetworkError: (message = 'Network request failed. Please check your connection.') => {
      get().addError({
        message,
        type: 'error',
        code: 'NETWORK_ERROR',
        action: {
          label: 'Retry',
          handler: () => window.location.reload(),
        },
      });
    },

    addValidationError: (field, message) => {
      get().addError({
        message: `${field}: ${message}`,
        type: 'error',
        code: 'VALIDATION_ERROR',
        autoClose: 5000,
      });
    },

    addSuccess: (message, autoClose = 3000) => {
      get().addError({
        message,
        type: 'success',
        autoClose,
      });
    },
  }))
);

// Selectors
export const useErrorSelectors = {
  errors: () => useErrorStore((state) => state.errors),
  hasErrors: () => useErrorStore((state) => state.errors.length > 0),
  networkStatus: () => useErrorStore((state) => state.networkStatus),
  isOnline: () => useErrorStore((state) => state.networkStatus === 'online'),
  lastSync: () => useErrorStore((state) => state.lastSync),
};

// Network status monitor
export const setupNetworkMonitoring = () => {
  const { setNetworkStatus } = useErrorStore.getState();

  const updateOnlineStatus = () => {
    setNetworkStatus(navigator.onLine ? 'online' : 'offline');
  };

  window.addEventListener('online', updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);

  // Initial check
  updateOnlineStatus();

  return () => {
    window.removeEventListener('online', updateOnlineStatus);
    window.removeEventListener('offline', updateOnlineStatus);
  };
};

// API error handler
export const handleApiError = (error: any, context?: string) => {
  const { addError, addNetworkError } = useErrorStore.getState();

  if (!navigator.onLine) {
    addNetworkError();
    return;
  }

  if (error?.response) {
    // HTTP error response
    const status = error.response.status;
    const message = error.response.data?.message || error.message;

    switch (status) {
      case 400:
        addError({
          message: `Bad request: ${message}`,
          type: 'error',
          code: 'BAD_REQUEST',
          details: { context, status, data: error.response.data },
        });
        break;
      case 401:
        addError({
          message: 'Authentication required. Please log in again.',
          type: 'error',
          code: 'UNAUTHORIZED',
          action: {
            label: 'Login',
            handler: () => window.location.href = '/login',
          },
        });
        break;
      case 403:
        addError({
          message: 'Access denied. You don\'t have permission for this action.',
          type: 'error',
          code: 'FORBIDDEN',
        });
        break;
      case 404:
        addError({
          message: 'Resource not found.',
          type: 'error',
          code: 'NOT_FOUND',
          details: { context },
        });
        break;
      case 429:
        addError({
          message: 'Too many requests. Please wait a moment and try again.',
          type: 'warning',
          code: 'RATE_LIMITED',
          autoClose: 5000,
        });
        break;
      case 500:
      case 502:
      case 503:
      case 504:
        addError({
          message: 'Server error. Please try again later.',
          type: 'error',
          code: 'SERVER_ERROR',
          details: { context, status },
          action: {
            label: 'Retry',
            handler: () => window.location.reload(),
          },
        });
        break;
      default:
        addError({
          message: `Request failed: ${message}`,
          type: 'error',
          code: 'UNKNOWN_ERROR',
          details: { context, status, message },
        });
    }
  } else if (error?.code === 'NETWORK_ERROR' || error?.message?.includes('Network')) {
    addNetworkError();
  } else {
    // Generic error
    addError({
      message: error?.message || 'An unexpected error occurred',
      type: 'error',
      code: 'GENERIC_ERROR',
      details: { context, error: error?.toString() },
    });
  }
};