import { logger } from './logger';

/**
 * Safely creates a Date object with validation
 */
export function safeCreateDate(dateInput: string | number | Date): Date | null {
  try {
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) {
      logger.warn('Invalid date input:', dateInput);
      return null;
    }
    return date;
  } catch (error) {
    logger.error('Error creating date:', error);
    return null;
  }
}

/**
 * Safely formats a date to ISO string
 */
export function safeToISOString(dateInput: string | number | Date): string | null {
  const date = safeCreateDate(dateInput);
  if (!date) return null;
  return date.toISOString();
}

/**
 * Safely formats a date to YYYY-MM-DD
 */
export function safeToYYYYMMDD(dateInput: string | number | Date): string | null {
  const date = safeCreateDate(dateInput);
  if (!date) return null;
  return date.toISOString().split('T')[0];
}

/**
 * Safely formats a date to local string
 */
export function safeToLocaleString(dateInput: string | number | Date): string | null {
  const date = safeCreateDate(dateInput);
  if (!date) return null;
  return date.toLocaleString();
}

/**
 * Safely gets the start of a week
 */
export function safeGetWeekStart(dateInput: string | number | Date): Date | null {
  const date = safeCreateDate(dateInput);
  if (!date) return null;
  
  const weekStart = new Date(date);
  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(date.getDate() - date.getDay());
  return weekStart;
}

/**
 * Safely gets the end of a week
 */
export function safeGetWeekEnd(dateInput: string | number | Date): Date | null {
  const date = safeCreateDate(dateInput);
  if (!date) return null;
  
  const weekEnd = new Date(date);
  weekEnd.setHours(23, 59, 59, 999);
  weekEnd.setDate(date.getDate() + (6 - date.getDay()));
  return weekEnd;
}

/**
 * Safely gets the start of a month
 */
export function safeGetMonthStart(dateInput: string | number | Date): Date | null {
  const date = safeCreateDate(dateInput);
  if (!date) return null;
  
  const monthStart = new Date(date);
  monthStart.setHours(0, 0, 0, 0);
  monthStart.setDate(1);
  return monthStart;
}

/**
 * Safely gets the end of a month
 */
export function safeGetMonthEnd(dateInput: string | number | Date): Date | null {
  const date = safeCreateDate(dateInput);
  if (!date) return null;
  
  const monthEnd = new Date(date);
  monthEnd.setHours(23, 59, 59, 999);
  monthEnd.setMonth(date.getMonth() + 1);
  monthEnd.setDate(0);
  return monthEnd;
} 