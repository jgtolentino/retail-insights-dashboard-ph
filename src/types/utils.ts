// Type guard for number
export const isNumber = (value: unknown): value is number => {
  return typeof value === 'number' && !isNaN(value);
};

// Type guard for array
export const isArray = <T>(value: unknown): value is T[] => {
  return Array.isArray(value);
};

// Type guard for non-empty array
export const isNonEmptyArray = <T>(value: unknown): value is T[] => {
  return Array.isArray(value) && value.length > 0;
};

// Type guard for date string
export const isISODateString = (value: unknown): value is string => {
  if (typeof value !== 'string') return false;
  const date = new Date(value);
  return date instanceof Date && !isNaN(date.getTime());
};

// Type guard for object
export const isObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

// Type guard for non-null object
export const isNonNullObject = <T extends Record<string, unknown>>(
  value: unknown
): value is T => {
  return isObject(value) && Object.keys(value).length > 0;
};

// Type guard for error
export const isError = (value: unknown): value is Error => {
  return value instanceof Error;
};

// Type guard for promise
export const isPromise = <T>(value: unknown): value is Promise<T> => {
  return value instanceof Promise;
};

// Type guard for function
export const isFunction = (value: unknown): value is Function => {
  return typeof value === 'function';
};

// Type guard for string
export const isString = (value: unknown): value is string => {
  return typeof value === 'string';
};

// Type guard for boolean
export const isBoolean = (value: unknown): value is boolean => {
  return typeof value === 'boolean';
};

// Type guard for null
export const isNull = (value: unknown): value is null => {
  return value === null;
};

// Type guard for undefined
export const isUndefined = (value: unknown): value is undefined => {
  return value === undefined;
};

// Type guard for null or undefined
export const isNullOrUndefined = (value: unknown): value is null | undefined => {
  return isNull(value) || isUndefined(value);
};

// Type guard for non-null and non-undefined
export const isNonNullable = <T>(value: T | null | undefined): value is T => {
  return !isNullOrUndefined(value);
}; 