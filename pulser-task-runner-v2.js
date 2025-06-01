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

// Load agent configuration
function loadAgent(agentPath) {
  try {
    const fullPath = path.join(process.cwd(), agentPath);
    const agentConfig = yaml.load(fs.readFileSync(fullPath, 'utf8'));
    log(`Loaded agent: ${agentConfig.agent}`);
    return agentConfig;
  } catch (error) {
    console.error(`Error loading agent ${agentPath}: ${error.message}`);
    return null;
  }
}

// Mock agent execution (in real implementation, would connect to actual agent system)
async function invokeAgent(agentName, functionName, args, config) {
  log(`Invoking ${agentName}.${functionName} with args: ${JSON.stringify(args)}`);
  
  // For now, simulate agent behavior
  switch (agentName) {
    case 'BasherExec':
      return executeCommand(args.cmd);
    
    case 'Caca':
      return suggestFix(args.taskName, args.stderr);
    
    case 'MayaPlan':
      return generatePlan(args.feature, args.repoPath);
    
    case 'Claudia':
      return postToGitHub(args.prNumber, args.planTasks);
    
    default:
      console.error(`Unknown agent: ${agentName}`);
      return { error: `Unknown agent: ${agentName}` };
  }
}

// BasherExec implementation
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

// Caca implementation
async function suggestFix(taskName, stderr) {
  // Simple pattern matching for common errors
  const suggestions = {
    'command not found': 'Install the missing command or check your PATH',
    'ENOTFOUND': 'Check your network connection or DNS settings',
    'Cannot find module': 'Run npm install to install missing dependencies',
    'Unexpected any': 'Add proper TypeScript types instead of using "any"',
    'React Hook': 'Review React Hooks rules: hooks must be called at the top level',
    'tailwindcss': 'Ensure Tailwind CSS is installed: npm install -D tailwindcss'
  };

  for (const [pattern, suggestion] of Object.entries(suggestions)) {
    if (stderr.includes(pattern)) {
      return { suggestion };
    }
  }

  return { suggestion: 'Check the error message and consult the documentation' };
}

// MayaPlan implementation
async function generatePlan(feature, repoPath) {
  // Mock AI planning - in real implementation would analyze code
  return {
    tasks: [
      {
        name: `Create component for ${feature}`,
        filePaths: ['src/components/NewFeature.tsx'],
        type: 'code',
        deps: []
      },
      {
        name: `Add tests for ${feature}`,
        filePaths: ['src/components/__tests__/NewFeature.test.tsx'],
        type: 'test',
        deps: ['Create component']
      },
      {
        name: `Update documentation for ${feature}`,
        filePaths: ['README.md'],
        type: 'docs',
        deps: ['Create component']
      }
    ]
  };
}

// Claudia implementation
async function postToGitHub(prNumber, planTasks) {
  // Mock GitHub posting - in real implementation would use GitHub API
  log(`Would post to PR #${prNumber}: ${planTasks.length} tasks`);
  return {
    commentUrl: `https://github.com/owner/repo/pull/${prNumber}#issuecomment-123456`
  };
}

// Parse and execute task commands
async function executeTaskCommand(command, config) {
  // Handle pulser invoke commands
  const invokeMatch = command.match(/pulser invoke --agent (\w+) --function (\w+)\s*--args '(.+?)'/);
  if (invokeMatch) {
    const [, agentName, functionName, argsJson] = invokeMatch;
    try {
      const args = JSON.parse(argsJson);
      return await invokeAgent(agentName, functionName, args, config);
    } catch (error) {
      console.error(`Error parsing agent args: ${error.message}`);
      return { error: error.message };
    }
  }

  // For other commands, execute directly
  return await executeCommand(command);
}

// Execute a task
async function runTask(taskName, config, taskArgs = {}) {
  const task = config.tasks[taskName];
  if (!task) {
    console.error(`Task '${taskName}' not found`);
    process.exit(1);
  }

  console.log(`🔧 Running task: ${taskName}`);
  log(`Task description: ${task.description}`);
  
  // Replace template variables in the run command
  let runCommand = task.run.trim();
  for (const [key, value] of Object.entries(taskArgs)) {
    runCommand = runCommand.replace(new RegExp(`{{${key}}}`, 'g'), value);
  }
  
  // Execute the run command line by line
  const lines = runCommand.split('\n').filter(line => line.trim());
  let lastResult = null;
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine || trimmedLine.startsWith('#')) continue;
    
    // Handle variable assignments
    if (trimmedLine.includes('=$(')) {
      const varMatch = trimmedLine.match(/^(\w+)=\$\((.*)\)$/);
      if (varMatch) {
        const [, varName, cmd] = varMatch;
        lastResult = await executeTaskCommand(cmd, config);
        // Store in environment for subsequent commands
        process.env[`_PULSER_${varName}`] = JSON.stringify(lastResult);
        continue;
      }
    }
    
    // Handle echo with jq
    if (trimmedLine.startsWith('echo "$') && trimmedLine.includes('| jq')) {
      const varMatch = trimmedLine.match(/echo "\$(\w+)"/);
      if (varMatch) {
        const varName = varMatch[1];
        const varValue = process.env[`_PULSER_${varName}`];
        if (varValue) {
          const data = JSON.parse(varValue);
          const jqMatch = trimmedLine.match(/jq -r '(.+?)'/);
          if (jqMatch) {
            const jqPath = jqMatch[1];
            // Simple jq simulation
            if (jqPath === '.exitCode') console.log(data.exitCode);
            else if (jqPath === '.stderr') console.log(data.stderr);
            else if (jqPath === '.stdout') console.log(data.stdout);
            else if (jqPath === '.suggestion') console.log(data.suggestion);
            else if (jqPath === '.commentUrl') console.log(data.commentUrl);
            else if (jqPath === '.') console.log(JSON.stringify(data, null, 2));
          }
        }
        continue;
      }
    }
    
    // Handle exit codes
    if (trimmedLine.startsWith('exit ')) {
      const exitCode = parseInt(trimmedLine.split(' ')[1]);
      if (!isNaN(exitCode) && exitCode !== 0) {
        process.exit(exitCode);
      }
      continue;
    }
    
    // Handle conditional blocks
    if (trimmedLine.startsWith('if [')) {
      // Simple parsing for our specific case
      const exitCodeCheck = trimmedLine.match(/\[ "\$(\w+)" -ne 0 \]/);
      if (exitCodeCheck) {
        const varName = exitCodeCheck[1];
        const varValue = process.env[`_PULSER_${varName}`];
        if (varValue && parseInt(varValue) !== 0) {
          // Execute until 'fi'
          let i = lines.indexOf(line) + 1;
          while (i < lines.length && !lines[i].trim().startsWith('fi')) {
            const ifLine = lines[i].trim();
            if (ifLine.startsWith('echo')) {
              console.log(ifLine.replace(/^echo\s+"?|"?$/g, '').replace(/\$(\w+)/g, (m, v) => {
                const val = process.env[`_PULSER_${v}`];
                return val ? JSON.parse(val) : m;
              }));
            }
            i++;
          }
        }
        continue;
      }
    }
    
    // Skip fi
    if (trimmedLine === 'fi') continue;
    
    // Regular echo
    if (trimmedLine.startsWith('echo ')) {
      console.log(trimmedLine.replace(/^echo\s+"?|"?$/g, ''));
      continue;
    }
  }
  
  console.log(`✔ [${taskName}] completed`);
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

// Handle invoke command
async function handleInvoke(args, config) {
  // Parse invoke arguments
  let agentName, functionName, argsJson;
  
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--agent' && i + 1 < args.length) {
      agentName = args[i + 1];
    } else if (args[i] === '--function' && i + 1 < args.length) {
      functionName = args[i + 1];
    } else if (args[i] === '--args' && i + 1 < args.length) {
      argsJson = args[i + 1];
    }
  }
  
  if (!agentName || !functionName || !argsJson) {
    console.error('Usage: pulser invoke --agent <agent> --function <function> --args <json>');
    process.exit(1);
  }
  
  try {
    const parsedArgs = JSON.parse(argsJson);
    const result = await invokeAgent(agentName, functionName, parsedArgs, config);
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error(`Error invoking agent: ${error.message}`);
    process.exit(1);
  }
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
      console.log(`  Agents: ${Object.keys(config.agents || {}).join(', ')}`);
      break;

    case 'status':
      console.log('Pulser Task Runner Status:');
      console.log(`  Project: ${config.name} v${config.version}`);
      console.log(`  Tasks available: ${Object.keys(config.tasks || {}).length}`);
      console.log(`  Composite tasks: ${Object.keys(config.composite_tasks || {}).length}`);
      console.log(`  Agents loaded: ${Object.keys(config.agents || {}).length}`);
      break;

    case 'run':
      if (!taskName) {
        console.error('Please specify a task name');
        process.exit(1);
      }

      // Parse task arguments
      const taskArgs = {};
      for (let i = 3; i < args.length; i++) {
        if (args[i] === '--args' && i + 1 < args.length) {
          try {
            Object.assign(taskArgs, JSON.parse(args[i + 1]));
          } catch (error) {
            console.error(`Error parsing task args: ${error.message}`);
            process.exit(1);
          }
        }
      }

      // Check if it's a composite task first
      if (config.composite_tasks && config.composite_tasks[taskName]) {
        await runCompositeTask(taskName, config);
      } else if (config.tasks && config.tasks[taskName]) {
        await runTask(taskName, config, taskArgs);
      } else {
        console.error(`Task '${taskName}' not found`);
        process.exit(1);
      }
      break;

    case 'invoke':
      await handleInvoke(args.slice(1), config);
      break;

    case 'plan':
      // Shortcut for planning
      const feature = args[1] || 'New feature';
      await runTask('plan', config, { inputFeature: feature });
      break;

    case 'post-plan':
      // Shortcut for posting plan
      const pr = args[1];
      const planJson = args[2];
      if (!pr || !planJson) {
        console.error('Usage: pulser post-plan <pr-number> <plan-json>');
        process.exit(1);
      }
      await runTask('post-plan', config, { inputPRNumber: pr, inputPlanJson: planJson });
      break;

    default:
      console.log('Usage: pulser <command> [options]');
      console.log('Commands:');
      console.log('  inspect - Inspect pulser.yaml configuration');
      console.log('  status - Show current status');
      console.log('  run <task> - Run a task');
      console.log('  invoke --agent <agent> --function <func> --args <json> - Invoke agent');
      console.log('  plan "<feature>" - Generate AI plan for a feature');
      console.log('  post-plan <pr> <plan-json> - Post plan to GitHub PR');
      break;
  }
}

// Run main
main().catch(console.error);