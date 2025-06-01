import { describe, it, expect } from 'vitest';

describe('Simple Math Tests', () => {
  it('should add two numbers correctly', () => {
    expect(1 + 1).toBe(2);
  });

  it('should subtract two numbers correctly', () => {
    expect(5 - 3).toBe(2);
  });

  it('should multiply two numbers correctly', () => {
    expect(3 * 4).toBe(12);
  });

  it('should handle array operations', () => {
    const arr = [1, 2, 3];
    expect(arr.length).toBe(3);
    expect(arr.includes(2)).toBe(true);
  });
});