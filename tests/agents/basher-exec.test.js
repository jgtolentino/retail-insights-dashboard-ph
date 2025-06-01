import { describe, test, expect } from 'vitest';
import { spawn } from 'child_process';

// Import our task runner functions (in real implementation would be properly exported)
async function executeCommand(cmd) {
  return new Promise((resolve) => {
    const child = spawn('sh', ['-c', cmd], {
      stdio: ['inherit', 'pipe', 'pipe'],
      env: { ...process.env }
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      resolve({
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        exitCode: code || 0
      });
    });

    child.on('error', (err) => {
      resolve({
        stdout: '',
        stderr: err.message,
        exitCode: 1
      });
    });
  });
}

describe('BasherExec Agent', () => {
  test('should execute successful command', async () => {
    const result = await executeCommand('echo "test"');
    
    expect(result).toMatchObject({
      stdout: 'test',
      stderr: '',
      exitCode: 0
    });
  });

  test('should handle failed command', async () => {
    const result = await executeCommand('nonexistent-command');
    
    expect(result.exitCode).not.toBe(0);
    expect(result.stderr).toContain('command not found');
  });

  test('should capture stderr for failing command', async () => {
    const result = await executeCommand('ls /nonexistent/directory');
    
    expect(result.exitCode).not.toBe(0);
    expect(result.stderr).toContain('No such file or directory');
  });

  test('should handle command with both stdout and stderr', async () => {
    const result = await executeCommand('echo "output" && echo "error" >&2');
    
    expect(result.stdout).toContain('output');
    expect(result.stderr).toContain('error');
    expect(result.exitCode).toBe(0);
  });

  test('should handle multiline output', async () => {
    const result = await executeCommand('printf "line1\\nline2\\nline3"');
    
    expect(result.stdout).toBe('line1\nline2\nline3');
    expect(result.exitCode).toBe(0);
  });
});