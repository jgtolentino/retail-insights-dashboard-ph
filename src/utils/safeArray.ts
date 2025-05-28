/**
 * Safely converts any value to an array, handling undefined/null cases
 */
export const safeArrayFrom = <T>(value: any): T[] => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (value instanceof Set) return safeArrayFrom(value ?? []);
  if (typeof value?.[Symbol.iterator] === 'function') {
    try {
      return safeArrayFrom(value ?? []);
    } catch {
      return [];
    }
  }
  return [];
};

/**
 * Safely splits a string by comma, filtering out empty values
 */
export const safeSplit = (value: string | null | undefined): string[] => {
  if (!value) return [];
  return value.split(',').filter(Boolean);
};

/**
 * Safely joins an array to string, handling undefined arrays
 */
export const safeJoin = (arr: any[] | undefined | null, separator = ','): string => {
  if (!arr || !Array.isArray(arr)) return '';
  return (arr ?? []).filter(Boolean).join(separator);
};