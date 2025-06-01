import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';

// Helper to run pulser commands
async function runPulser(args, options = {}) {
  return new Promise((resolve) => {
    const child = spawn('node', ['pulser-simple.js', ...args], {
      stdio: ['inherit', 'pipe', 'pipe'],
      env: { ...process.env, ...options.env },
      cwd: process.cwd()
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

describe('Pulser Integration Tests', () => {
  test('should show status correctly', async () => {
    const result = await runPulser(['status']);
    
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('Pulser Task Runner Status');
    expect(result.stdout).toContain('retail-insights-dashboard v1.0.0');
    expect(result.stdout).toContain('Tasks available: 6');
    expect(result.stdout).toContain('Agents loaded: 4');
  });

  test('should inspect configuration correctly', async () => {
    const result = await runPulser(['inspect']);
    
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('Configuration loaded successfully');
    expect(result.stdout).toContain('Name: retail-insights-dashboard');
    expect(result.stdout).toContain('Tasks: build-css, lint, test, deploy, plan, post-plan');
    expect(result.stdout).toContain('Agents: BasherExec, Caca, MayaPlan, Claudia');
  });

  test('should invoke BasherExec agent directly', async () => {
    const result = await runPulser([
      'invoke', 
      '--agent', 'BasherExec', 
      '--function', 'run', 
      '--args', '{"cmd":"echo test-output"}'
    ]);
    
    expect(result.exitCode).toBe(0);
    
    const output = JSON.parse(result.stdout);
    expect(output).toMatchObject({
      stdout: 'test-output',
      stderr: '',
      exitCode: 0
    });
  });

  test('should invoke Caca agent for error analysis', async () => {
    const result = await runPulser([
      'invoke',
      '--agent', 'Caca',
      '--function', 'suggest',
      '--args', '{"taskName":"test","stderr":"command not found: nonexistent","exitCode":127}'
    ]);
    
    expect(result.exitCode).toBe(0);
    
    const output = JSON.parse(result.stdout);
    expect(output).toMatchObject({
      suggestion: expect.stringContaining('Install missing command'),
      category: 'dependency',
      severity: 'high'
    });
  });

  test('should generate AI plan with MayaPlan', async () => {
    const result = await runPulser([
      'invoke',
      '--agent', 'MayaPlan',
      '--function', 'planFeature',
      '--args', '{"feature":"Add search functionality","repoPath":"."}'
    ]);
    
    expect(result.exitCode).toBe(0);
    
    const output = JSON.parse(result.stdout);
    expect(output.tasks).toBeDefined();
    expect(Array.isArray(output.tasks)).toBe(true);
    expect(output.tasks.length).toBeGreaterThan(0);
    
    // Check task structure
    output.tasks.forEach(task => {
      expect(task).toHaveProperty('name');
      expect(task).toHaveProperty('filePaths');
      expect(task).toHaveProperty('type');
      expect(task).toHaveProperty('deps');
      expect(['code', 'test', 'docs', 'ci']).toContain(task.type);
    });
  });

  test('should run build-css task successfully', async () => {
    const result = await runPulser(['run', 'build-css']);
    
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('✔ [build-css] completed');
    
    // Check that output file was created
    const outputExists = await fs.access('dist/output.css').then(() => true).catch(() => false);
    expect(outputExists).toBe(true);
  });

  test('should handle task failure with Caca suggestion', async () => {
    // Create a temporary broken task by running a nonexistent command
    const result = await runPulser([
      'invoke',
      '--agent', 'BasherExec',
      '--function', 'run',
      '--args', '{"cmd":"nonexistent-test-command"}'
    ]);
    
    expect(result.exitCode).toBe(0); // invoke should succeed
    
    const output = JSON.parse(result.stdout);
    expect(output.exitCode).not.toBe(0);
    expect(output.stderr).toContain('command not found');
  });

  test('should run shortcut commands', async () => {
    const planResult = await runPulser(['plan', 'Add user authentication']);
    
    expect(planResult.exitCode).toBe(0);
    expect(planResult.stdout).toContain('✔ [plan] completed');
    
    // Should also contain JSON output
    expect(planResult.stdout).toContain('"tasks"');
    expect(planResult.stdout).toContain('"name"');
    expect(planResult.stdout).toContain('"filePaths"');
  });

  test('should handle invalid commands gracefully', async () => {
    const result = await runPulser(['invalid-command']);
    
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('Usage: pulser <command> [options]');
    expect(result.stdout).toContain('Commands:');
  });

  test('should handle missing task gracefully', async () => {
    const result = await runPulser(['run', 'nonexistent-task']);
    
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain('Task \'nonexistent-task\' not found');
  });

  test('should validate agent invocation parameters', async () => {
    // Missing required parameters
    const result = await runPulser(['invoke', '--agent', 'BasherExec']);
    
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain('Usage: pulser invoke --agent <agent> --function <function> --args <json>');
  });

  test('should handle malformed JSON gracefully', async () => {
    const result = await runPulser([
      'invoke',
      '--agent', 'BasherExec',
      '--function', 'run',
      '--args', '{invalid-json}'
    ]);
    
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain('Error invoking agent');
  });
});

describe('Pulser Debug Mode', () => {
  test('should show debug output when enabled', async () => {
    const result = await runPulser(['status'], {
      env: { PULSER_LOG_LEVEL: 'debug' }
    });
    
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('🔍 [DEBUG]');
    expect(result.stdout).toContain('Parsed pulser.yaml');
  });

  test('should not show debug output when disabled', async () => {
    const result = await runPulser(['status']);
    
    expect(result.exitCode).toBe(0);
    expect(result.stdout).not.toContain('🔍 [DEBUG]');
  });
});