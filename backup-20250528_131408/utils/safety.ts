/**
 * Global safety utilities to prevent runtime errors from undefined/null values
 * Use these instead of direct array operations when dealing with potentially undefined data
 */

/**
 * Safely convert any value to an array
 */
export function safeArray<T>(value: any): T[] {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (value instanceof Set || value instanceof Map) return Array.from(value);
  if (typeof value?.[Symbol.iterator] === 'function') {
    try {
      return Array.from(value || []);
    } catch (error) {
      console.warn('Failed to convert to array:', value, error);
      return [];
    }
  }
  return [];
}

/**
 * Safe array operations
 */
export const safe = {
  /**
   * Safely convert to array using Array.from
   */
  arrayFrom: safeArray,
  
  /**
   * Safely spread values into array
   */
  spread: <T>(value: any): T[] => {
    return safeArray(value);
  },
  
  /**
   * Safely call forEach on a value
   */
  forEach: <T>(value: any, fn: (item: T, index: number, array: T[]) => void): void => {
    safeArray<T>(value).forEach(fn);
  },
  
  /**
   * Safely call map on a value
   */
  map: <T, R>(value: any, fn: (item: T, index: number, array: T[]) => R): R[] => {
    return safeArray<T>(value).map(fn);
  },
  
  /**
   * Safely call filter on a value
   */
  filter: <T>(value: any, fn: (item: T, index: number, array: T[]) => boolean): T[] => {
    return safeArray<T>(value).filter(fn);
  },
  
  /**
   * Safely check if array includes a value
   */
  includes: <T>(array: any, searchElement: T): boolean => {
    return safeArray<T>(array).includes(searchElement);
  },
  
  /**
   * Safely get array length
   */
  length: (value: any): number => {
    return safeArray(value).length;
  },
  
  /**
   * Safely join array elements
   */
  join: (value: any, separator = ','): string => {
    return safeArray(value).filter(Boolean).join(separator);
  },
  
  /**
   * Safely access array index
   */
  at: <T>(value: any, index: number): T | undefined => {
    const arr = safeArray<T>(value);
    return arr[index];
  },
  
  /**
   * Safely slice array
   */
  slice: <T>(value: any, start?: number, end?: number): T[] => {
    return safeArray<T>(value).slice(start, end);
  }
};

/**
 * Create a safe wrapper for any object with array methods
 */
export function makeSafe<T extends Record<string, any>>(obj: T): T {
  const safeObj = { ...obj };
  
  Object.keys(safeObj).forEach(key => {
    const value = safeObj[key];
    if (Array.isArray(value) || value instanceof Set || value instanceof Map) {
      // Already safe
      return;
    }
    
    // If it's supposed to be an array but might be undefined
    if (key.includes('Array') || key.includes('List') || key.includes('Items') || 
        key.startsWith('selected') || key.endsWith('s')) {
      Object.defineProperty(safeObj, key, {
        get() {
          return safeArray(obj[key]);
        },
        set(newValue) {
          obj[key] = newValue;
        }
      });
    }
  });
  
  return safeObj;
}

/**
 * Type guard to check if value is safely iterable
 */
export function isIterable<T>(value: any): value is Iterable<T> {
  return value != null && typeof value[Symbol.iterator] === 'function';
}

/**
 * Type guard to check if value is an array
 */
export function isArray<T>(value: any): value is T[] {
  return Array.isArray(value);
}

/**
 * Type guard to check if value is a Set
 */
export function isSet<T>(value: any): value is Set<T> {
  return value instanceof Set;
}

/**
 * Convert filter arrays to Sets safely
 */
export function toSet<T>(value: any): Set<T> {
  if (value instanceof Set) return value;
  return new Set(safeArray<T>(value));
}

/**
 * Convert Sets to arrays safely
 */
export function fromSet<T>(value: any): T[] {
  if (!value) return [];
  if (value instanceof Set) return Array.from(value || []);
  return safeArray<T>(value);
}