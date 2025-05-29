#!/usr/bin/env tsx

import { chromium, Page, Browser } from 'playwright';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

interface TaskConfig {
  route: string;
  name: string;
  actions?: (page: Page) => Promise<void>;
  waitFor?: string;
  fullPage?: boolean;
  description?: string;
}

class VisualDocumentationGenerator {
  private baseUrl = process.env.BASE_URL || 'http://localhost:4173';
  private outputDir = './visual-docs';
  private browser: Browser | null = null;
  
  constructor() {
    // Create output directory
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  async captureVisuals() {
    console.log('🚀 Starting visual documentation capture...');
    
    try {
      this.browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      
      const context = await this.browser.newContext({
        viewport: { width: 1920, height: 1080 },
        deviceScaleFactor: 1
      });
      
      const page = await context.newPage();

      // Get commit message to determine what to capture
      const commitMessage = process.env.COMMIT_MESSAGE || this.getLastCommitMessage();
      const tasks = this.getTasksFromCommit(commitMessage);
      
      console.log(`📝 Commit message: ${commitMessage}`);
      console.log(`📋 Found ${tasks.length} tasks to capture`);
      
      // Wait for application to be ready
      await this.waitForApplication(page);
      
      // Capture each task
      for (const task of tasks) {
        await this.captureTask(page, task);
      }
      
      // Generate markdown documentation
      await this.generateMarkdown(tasks, commitMessage);
      
      console.log('✅ Visual documentation capture completed!');
      
    } catch (error) {
      console.error('❌ Error during visual capture:', error);
      throw error;
    } finally {
      if (this.browser) {
        await this.browser.close();
      }
    }
  }

  private getLastCommitMessage(): string {
    try {
      return execSync('git log -1 --pretty=%B').toString().trim();
    } catch {
      return 'Manual capture';
    }
  }

  private getTasksFromCommit(message: string): TaskConfig[] {
    const tasks: TaskConfig[] = [];
    const lowerMessage = message.toLowerCase();
    
    // Always capture dashboard overview
    tasks.push({
      route: '/',
      name: 'Dashboard Overview',
      description: 'Main dashboard with KPIs and transaction trends',
      waitFor: '[data-testid="transaction-counter"], .transaction-counter, .bg-blue-50',
      fullPage: true
    });
    
    // Brand analysis updates
    if (lowerMessage.includes('brand') || lowerMessage.includes('hierarchical')) {
      tasks.push({
        route: '/',
        name: 'Brand Revenue Analysis - Hierarchical View',
        description: 'New hierarchical brand visualization with category drill-down',
        waitFor: '.pie-chart, canvas',
        actions: async (page) => {
          // Try to click hierarchical view if toggle exists
          const hierarchicalBtn = page.locator('button:has-text("Hierarchical")');
          if (await hierarchicalBtn.count() > 0) {
            await hierarchicalBtn.click();
            await page.waitForTimeout(2000);
          }
        }
      });
      
      tasks.push({
        route: '/',
        name: 'Brand Revenue Analysis - Filtered View', 
        description: 'Smart filtering system with TBWA client highlighting',
        waitFor: '.pie-chart, canvas',
        actions: async (page) => {
          // Switch to filtered view
          const filteredBtn = page.locator('button:has-text("Filtered")');
          if (await filteredBtn.count() > 0) {
            await filteredBtn.click();
            await page.waitForTimeout(1000);
            
            // Click TBWA Clients filter
            const tbwaBtn = page.locator('button:has-text("TBWA Clients")');
            if (await tbwaBtn.count() > 0) {
              await tbwaBtn.click();
              await page.waitForTimeout(2000);
            }
          }
        }
      });
    }
    
    // Consumer insights
    if (lowerMessage.includes('consumer') || lowerMessage.includes('insight') || lowerMessage.includes('demographics')) {
      tasks.push({
        route: '/consumer-insights',
        name: 'Consumer Insights',
        description: 'Demographics and behavior analysis',
        waitFor: 'canvas, .age-distribution',
        fullPage: true
      });
    }
    
    // Product mix and trends
    if (lowerMessage.includes('product') || lowerMessage.includes('substitution') || lowerMessage.includes('pareto')) {
      tasks.push({
        route: '/product-mix',
        name: 'Product Mix Analysis',
        description: 'Product performance and substitution patterns',
        waitFor: 'canvas, .pareto-chart',
        fullPage: true
      });
    }
    
    // Trends analysis
    if (lowerMessage.includes('trend') || lowerMessage.includes('time') || lowerMessage.includes('chart')) {
      tasks.push({
        route: '/trends',
        name: 'Trends Explorer',
        description: 'Advanced trend analysis with multiple metrics',
        waitFor: 'canvas, .trends-chart',
        fullPage: true
      });
    }
    
    // Settings page
    if (lowerMessage.includes('setting') || lowerMessage.includes('config')) {
      tasks.push({
        route: '/settings',
        name: 'Settings Configuration',
        description: 'Dashboard settings and feature flags',
        waitFor: '.settings-form, form',
        fullPage: true
      });
    }
    
    // If no specific pages identified, capture key pages
    if (tasks.length === 1) { // Only dashboard overview
      tasks.push(
        {
          route: '/brands',
          name: 'Brands Page',
          description: 'Brand analytics and performance tracking',
          waitFor: 'canvas',
          fullPage: true
        },
        {
          route: '/product-mix',
          name: 'Product Mix Page',
          description: 'Product performance analysis',
          waitFor: 'canvas',
          fullPage: true
        }
      );
    }
    
    return tasks;
  }

  private async waitForApplication(page: Page) {
    console.log('⏳ Waiting for application to load...');
    
    try {
      // Simple approach that worked before - just wait for DOM to load
      await page.goto(this.baseUrl, { 
        waitUntil: 'domcontentloaded',
        timeout: 30000 
      });
      
      // Wait for React to mount (fixed time that worked before)
      await page.waitForTimeout(5000);
      
      // Force body visibility just in case
      await page.evaluate(() => {
        document.body.style.display = 'block';
        document.body.style.visibility = 'visible';
        document.body.style.opacity = '1';
      });
      
      console.log('✅ Ready to capture (simplified wait)');
      
    } catch (error) {
      console.log('⚠️ Simple wait failed, but proceeding anyway...', error.message);
      
      // Take debug screenshot
      try {
        await page.screenshot({ 
          path: path.join(this.outputDir, 'debug-simple-wait.png'),
          fullPage: true 
        });
        console.log('📸 Debug screenshot saved');
      } catch {}
    }
  }

  private async captureTask(page: Page, task: TaskConfig) {
    console.log(`📸 Capturing: ${task.name}`);
    
    try {
      // Navigate to the route
      if (task.route !== '/') {
        await page.goto(`${this.baseUrl}${task.route}`, { 
          waitUntil: 'networkidle',
          timeout: 30000 
        });
      }
      
      // Wait for specific content
      if (task.waitFor) {
        try {
          await page.waitForSelector(task.waitFor, { timeout: 10000 });
        } catch {
          console.warn(`⚠️ Warning: ${task.waitFor} not found for ${task.name}`);
        }
      }
      
      // Extra wait for animations and data loading
      await page.waitForTimeout(3000);
      
      // Execute any custom actions
      if (task.actions) {
        await task.actions(page);
        await page.waitForTimeout(2000); // Wait for action effects
      }
      
      // Capture main screenshot
      const filename = `${task.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}.png`;
      await page.screenshot({
        path: path.join(this.outputDir, filename),
        fullPage: task.fullPage ?? false,
        clip: task.fullPage ? undefined : { x: 0, y: 0, width: 1920, height: 1080 }
      });
      
      console.log(`✅ Captured: ${filename}`);
      
      // Capture specific components if they exist
      await this.captureComponents(page, task.name);
      
    } catch (error) {
      console.error(`❌ Failed to capture ${task.name}:`, error);
    }
  }

  private async captureComponents(page: Page, taskName: string) {
    const components = [
      { selector: '[data-testid="transaction-counter"], .transaction-counter', name: 'transaction-counter' },
      { selector: '.kpi-cards, [class*="grid"][class*="cols-5"]', name: 'kpi-metrics' },
      { selector: 'canvas:first-of-type', name: 'primary-chart' },
      { selector: '.pie-chart, .recharts-pie-chart', name: 'pie-chart' },
      { selector: '.bar-chart, .recharts-bar-chart', name: 'bar-chart' },
      { selector: '.line-chart, .recharts-line-chart', name: 'line-chart' }
    ];
    
    for (const component of components) {
      try {
        const element = await page.locator(component.selector).first();
        if (await element.isVisible()) {
          const componentFilename = `${taskName.toLowerCase().replace(/\s+/g, '-')}-${component.name}.png`;
          await element.screenshot({
            path: path.join(this.outputDir, componentFilename)
          });
          console.log(`  └─ Component captured: ${component.name}`);
        }
      } catch {
        // Component not found or not visible, skip silently
      }
    }
  }

  private async generateMarkdown(tasks: TaskConfig[], commitMessage: string) {
    const timestamp = new Date().toISOString();
    const commit = process.env.GITHUB_SHA || this.getCommitHash();
    
    let markdown = `# Visual Documentation\n\n`;
    markdown += `**Generated:** ${timestamp}\n`;
    markdown += `**Commit:** \`${commit}\`\n`;
    markdown += `**Message:** ${commitMessage}\n\n`;
    
    markdown += `## 📱 Screenshots\n\n`;
    
    for (const task of tasks) {
      const filename = `${task.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}.png`;
      const filePath = path.join(this.outputDir, filename);
      
      if (fs.existsSync(filePath)) {
        markdown += `### ${task.name}\n\n`;
        if (task.description) {
          markdown += `${task.description}\n\n`;
        }
        markdown += `![${task.name}](./${filename})\n\n`;
        
        // Add component screenshots if they exist
        const componentFiles = fs.readdirSync(this.outputDir)
          .filter(f => f.startsWith(filename.replace('.png', '-')) && f !== filename);
        
        if (componentFiles.length > 0) {
          markdown += `<details>\n<summary>Component Details</summary>\n\n`;
          componentFiles.forEach(compFile => {
            const compName = compFile.replace(filename.replace('.png', '-'), '').replace('.png', '');
            markdown += `#### ${compName.replace(/-/g, ' ')}\n![${compName}](./${compFile})\n\n`;
          });
          markdown += `</details>\n\n`;
        }
      }
    }
    
    markdown += `---\n*Generated by automated visual documentation system*\n`;
    
    fs.writeFileSync(path.join(this.outputDir, 'README.md'), markdown);
    console.log('📝 Generated README.md');
  }

  private getCommitHash(): string {
    try {
      return execSync('git rev-parse HEAD').toString().trim().substring(0, 7);
    } catch {
      return 'unknown';
    }
  }
}

// Run the capture if called directly
if (require.main === module) {
  const generator = new VisualDocumentationGenerator();
  generator.captureVisuals().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { VisualDocumentationGenerator };