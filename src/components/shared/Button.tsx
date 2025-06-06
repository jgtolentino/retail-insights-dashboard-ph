import React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'client';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

const buttonVariants = {
  primary: [
    'bg-[var(--color-primary)] text-white',
    'hover:bg-[var(--color-primary-hover)]',
    'focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2',
    'disabled:bg-[var(--color-gray-300)] disabled:text-[var(--color-gray-500)]',
  ].join(' '),

  secondary: [
    'bg-[var(--color-secondary)] text-white',
    'hover:bg-[var(--color-secondary-hover)]',
    'focus:ring-2 focus:ring-[var(--color-secondary)] focus:ring-offset-2',
    'disabled:bg-[var(--color-gray-300)] disabled:text-[var(--color-gray-500)]',
  ].join(' '),

  outline: [
    'border border-[var(--color-border-primary)] bg-transparent',
    'text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)]',
    'focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2',
    'disabled:border-[var(--color-gray-200)] disabled:text-[var(--color-gray-400)]',
  ].join(' '),

  ghost: [
    'bg-transparent text-[var(--color-text-primary)]',
    'hover:bg-[var(--color-bg-secondary)]',
    'focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2',
    'disabled:text-[var(--color-gray-400)]',
  ].join(' '),

  destructive: [
    'bg-[var(--color-error)] text-white',
    'hover:bg-[var(--color-error-hover)]',
    'focus:ring-2 focus:ring-[var(--color-error)] focus:ring-offset-2',
    'disabled:bg-[var(--color-gray-300)] disabled:text-[var(--color-gray-500)]',
  ].join(' '),

  client: [
    'bg-[var(--color-client-primary)] text-white',
    'hover:bg-[#e55a4d]',
    'focus:ring-2 focus:ring-[var(--color-client-primary)] focus:ring-offset-2',
    'disabled:bg-[var(--color-gray-300)] disabled:text-[var(--color-gray-500)]',
  ].join(' '),
};

const buttonSizes = {
  sm: 'px-3 py-1.5 text-sm font-medium min-h-[32px]',
  md: 'px-4 py-2 text-sm font-medium min-h-[40px]',
  lg: 'px-6 py-3 text-base font-medium min-h-[48px]',
  xl: 'px-8 py-4 text-lg font-semibold min-h-[56px]',
};

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      loading = false,
      icon,
      iconPosition = 'left',
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        className={cn(
          // Base styles
          'inline-flex items-center justify-center gap-2',
          'rounded-[var(--radius-lg)] font-medium',
          'duration-[var(--transition-fast)] transition-all',
          'focus:outline-none focus:ring-offset-white',
          'disabled:cursor-not-allowed disabled:opacity-50',
          // Variant styles
          buttonVariants[variant],
          // Size styles
          buttonSizes[size],
          className
        )}
        disabled={isDisabled}
        {...props}
      >
        {loading && (
          <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
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
        )}

        {!loading && icon && iconPosition === 'left' && icon}

        {children}

        {!loading && icon && iconPosition === 'right' && icon}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button };
