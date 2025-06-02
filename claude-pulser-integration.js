#!/usr/bin/env node

/**
 * Claude-Pulser Integration Script
 * Direct integration with Claude Code for the retail-insights-dashboard-ph project
 * No external API keys required - uses Claude Code directly
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

class ClaudePulserIntegration {
  constructor() {
    this.projectRoot = process.cwd();
    this.pulserConfig = this.loadPulserConfig();
  }

  loadPulserConfig() {
    try {
      const configPath = path.join(this.projectRoot, 'pulser.yaml');
      return fs.readFileSync(configPath, 'utf8');
    } catch (error) {
      console.error('❌ Could not load pulser.yaml config');
      process.exit(1);
    }
  }

  // Quick analysis of current React errors
  async analyzeReactErrors() {
    console.log('🔍 Analyzing React errors with Claude...');
    
    try {
      const result = execSync('node pulser-task-runner.js run claude:analyze', {
        encoding: 'utf8',
        cwd: this.projectRoot
      });
      
      console.log('✅ Claude Analysis Complete:');
      console.log(result);
      
      return { success: true, output: result };
    } catch (error) {
      console.error('❌ Analysis failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  // Optimize performance issues
  async optimizePerformance() {
    console.log('⚡ Running Claude performance optimization...');
    
    try {
      const result = execSync('node pulser-task-runner.js run claude:optimize', {
        encoding: 'utf8',
        cwd: this.projectRoot
      });
      
      console.log('✅ Optimization Analysis Complete:');
      console.log(result);
      
      return { success: true, output: result };
    } catch (error) {
      console.error('❌ Optimization failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  // Generate new components
  async generateComponent(componentName, componentType = 'chart') {
    console.log(`🎨 Generating ${componentType} component: ${componentName}`);
    
    try {
      const env = {
        ...process.env,
        COMPONENT_NAME: componentName,
        COMPONENT_TYPE: componentType
      };
      
      const result = execSync('node pulser-task-runner.js run claude:generate', {
        encoding: 'utf8',
        cwd: this.projectRoot,
        env
      });
      
      console.log('✅ Component Generation Complete:');
      console.log(result);
      
      return { success: true, output: result };
    } catch (error) {
      console.error('❌ Generation failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  // Comprehensive review for deployment
  async reviewForDeployment() {
    console.log('📋 Running comprehensive Claude review...');
    
    try {
      const result = execSync('node pulser-task-runner.js run claude:review', {
        encoding: 'utf8',
        cwd: this.projectRoot
      });
      
      console.log('✅ Deployment Review Complete:');
      console.log(result);
      
      return { success: true, output: result };
    } catch (error) {
      console.error('❌ Review failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  // Interactive mode
  async runInteractive() {
    console.log(`
🤖 Claude-Pulser Integration
============================

Available Operations:
1. Analyze React errors and issues
2. Optimize performance 
3. Generate new component
4. Review for deployment
5. Exit

Choose an option (1-5):`);

    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    rl.question('Selection: ', async (answer) => {
      switch (answer.trim()) {
        case '1':
          await this.analyzeReactErrors();
          break;
        case '2':
          await this.optimizePerformance();
          break;
        case '3':
          rl.question('Component name: ', async (name) => {
            rl.question('Component type (chart/widget/map): ', async (type) => {
              await this.generateComponent(name, type || 'chart');
              rl.close();
            });
          });
          return;
        case '4':
          await this.reviewForDeployment();
          break;
        case '5':
          console.log('👋 Goodbye!');
          process.exit(0);
        default:
          console.log('❌ Invalid selection');
      }
      
      rl.close();
    });
  }

  // Status check
  checkStatus() {
    console.log('📊 Claude-Pulser Integration Status:');
    console.log('=====================================');
    
    // Check if pulser.yaml exists and has ClaudeDirect agent
    const hasClaudeAgent = this.pulserConfig.includes('ClaudeDirect');
    console.log(`✅ Claude agent configured: ${hasClaudeAgent ? 'YES' : 'NO'}`);
    
    // Check if claude agent file exists
    const agentFile = path.join(this.projectRoot, 'pulser_agents/claude_direct.yaml');
    const hasAgentFile = fs.existsSync(agentFile);
    console.log(`✅ Agent file exists: ${hasAgentFile ? 'YES' : 'NO'}`);
    
    // Check available tasks
    const claudeTasks = this.pulserConfig.match(/claude:\w+/g) || [];
    console.log(`✅ Claude tasks available: ${claudeTasks.length} (${claudeTasks.join(', ')})`);
    
    // Check project structure
    const srcExists = fs.existsSync(path.join(this.projectRoot, 'src'));
    console.log(`✅ Project structure: ${srcExists ? 'VALID' : 'MISSING'}`);
    
    console.log('\n🚀 Ready to use Claude integration!');
  }
}

// CLI usage
const args = process.argv.slice(2);
const integration = new ClaudePulserIntegration();

if (args.length === 0) {
  integration.checkStatus();
  process.exit(0);
}

switch (args[0]) {
  case 'analyze':
    integration.analyzeReactErrors();
    break;
  case 'optimize':
    integration.optimizePerformance();
    break;
  case 'generate':
    const componentName = args[1] || 'NewComponent';
    const componentType = args[2] || 'chart';
    integration.generateComponent(componentName, componentType);
    break;
  case 'review':
    integration.reviewForDeployment();
    break;
  case 'interactive':
    integration.runInteractive();
    break;
  case 'status':
    integration.checkStatus();
    break;
  default:
    console.log(`
Usage: node claude-pulser-integration.js [command]

Commands:
  analyze          - Analyze React errors and issues
  optimize         - Get performance optimization suggestions  
  generate [name] [type] - Generate new component
  review           - Comprehensive deployment review
  interactive      - Interactive mode
  status           - Check integration status
  
Examples:
  node claude-pulser-integration.js analyze
  node claude-pulser-integration.js generate SalesChart chart
  node claude-pulser-integration.js interactive
`);
}