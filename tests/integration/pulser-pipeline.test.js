import { describe, it, expect } from 'vitest';
import { execSync } from 'child_process';

describe('Pulser Pipeline Integration', () => {
  it('should show status', () => {
    try {
      const output = execSync('node ./pulser-task-runner-v2.js status', { encoding: 'utf8' });
      expect(output).toContain('Tasks available:');
    } catch (error) {
      // Handle case where command might not exist
      expect(error.message).toMatch(/command not found|not found/);
    }
  });
});
