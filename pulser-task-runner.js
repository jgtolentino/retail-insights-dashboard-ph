#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import yaml from 'js-yaml';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Parse command line arguments
const args = process.argv.slice(2);
const command = args[0];
const taskName = args[1];

// Debug logging
const debug = process.env.PULSER_LOG_LEVEL === 'debug';
const log = (msg) => debug && console.log(`🔍 [DEBUG] ${msg}`);

// Load pulser.yaml
function loadConfig() {
  try {
    const configPath = path.join(process.cwd(), 'pulser.yaml');
    const config = yaml.load(fs.readFileSync(configPath, 'utf8'));
    log(`Parsed pulser.yaml → found ${Object.keys(config.tasks || {}).length} tasks`);
    return config;
  } catch (error) {
    console.error(`Error loading pulser.yaml: ${error.message}`);
    process.exit(1);
  }
}

// Execute a task
async function runTask(taskName, config) {
  const task = config.tasks[taskName];
  if (!task) {
    console.error(`Task '${taskName}' not found`);
    process.exit(1);
  }

  console.log(`🔧 Running task: ${taskName}`);
  log(`Task description: ${task.description}`);
  
  // Parse the run command
  const runCommand = task.run.trim();
  
  // For now, execute the command directly (in real implementation, would parse pulser exec)
  const actualCommand = runCommand.replace(/pulser exec --agent \w+ /, '');
  log(`Spawning: ${actualCommand}`);
  
  return new Promise((resolve, reject) => {
    const child = spawn('sh', ['-c', actualCommand], {
      stdio: 'inherit',
      env: { ...process.env }
    });

    child.on('close', (code) => {
      if (code === 0) {
        console.log(`✔ [${taskName}] completed (exit code 0)`);
        resolve();
      } else {
        console.error(`✖ [${taskName}] failed (exit code: ${code})`);
        reject(new Error(`Task failed with exit code ${code}`));
      }
    });

    child.on('error', (err) => {
      console.error(`✖ [${taskName}] error: ${err.message}`);
      reject(err);
    });
  });
}

// Execute composite task
async function runCompositeTask(taskName, config) {
  const compositeTask = config.composite_tasks[taskName];
  if (!compositeTask) {
    console.error(`Composite task '${taskName}' not found`);
    process.exit(1);
  }

  console.log(`🔧 Running composite task: ${taskName}`);
  log(`Starting composite '${taskName}' with steps [${compositeTask.steps.join(', ')}]`);

  for (const step of compositeTask.steps) {
    try {
      await runTask(step, config);
    } catch (error) {
      console.error(`Composite task '${taskName}' failed at step '${step}'`);
      process.exit(1);
    }
  }

  console.log(`✔ [${taskName}] completed (exit code 0)`);
}

// Main command handler
async function main() {
  const config = loadConfig();

  switch (command) {
    case 'inspect':
      console.log('Configuration loaded successfully:');
      console.log(`  Name: ${config.name}`);
      console.log(`  Version: ${config.version}`);
      console.log(`  Tasks: ${Object.keys(config.tasks || {}).join(', ')}`);
      console.log(`  Composite tasks: ${Object.keys(config.composite_tasks || {}).join(', ')}`);
      break;

    case 'status':
      console.log('Pulser Task Runner Status:');
      console.log(`  Project: ${config.name} v${config.version}`);
      console.log(`  Tasks available: ${Object.keys(config.tasks || {}).length}`);
      console.log(`  Composite tasks: ${Object.keys(config.composite_tasks || {}).length}`);
      break;

    case 'run':
      if (!taskName) {
        console.error('Please specify a task name');
        process.exit(1);
      }

      // Check if it's a composite task first
      if (config.composite_tasks && config.composite_tasks[taskName]) {
        await runCompositeTask(taskName, config);
      } else if (config.tasks && config.tasks[taskName]) {
        await runTask(taskName, config);
      } else {
        console.error(`Task '${taskName}' not found`);
        process.exit(1);
      }
      break;

    default:
      console.log('Usage: pulser-task-runner <command> [options]');
      console.log('Commands:');
      console.log('  inspect - Inspect pulser.yaml configuration');
      console.log('  status - Show current status');
      console.log('  run <task> - Run a task');
      break;
  }
}

// Run main
main().catch(console.error);