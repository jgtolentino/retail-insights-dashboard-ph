#!/usr/bin/env tsx

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

interface ChangelogEntry {
  hash: string;
  shortHash: string;
  message: string;
  date: string;
  author: string;
  visuals: string[];
}

class VisualChangelogGenerator {
  private changelogPath = './VISUAL_CHANGELOG.md';
  private visualDocsPath = './visual-docs';
  
  generateChangelog() {
    console.log('📝 Generating visual changelog...');
    
    try {
      const commits = this.getRecentCommits();
      const entries: ChangelogEntry[] = [];
      
      for (const commit of commits) {
        if (this.isTaskCompletion(commit.message)) {
          entries.push({
            ...commit,
            visuals: this.findVisualsForCommit(commit.hash)
          });
        }
      }
      
      this.writeChangelog(entries);
      console.log(`✅ Visual changelog generated: ${this.changelogPath}`);
      
    } catch (error) {
      console.error('❌ Error generating changelog:', error);
      throw error;
    }
  }
  
  private getRecentCommits(): Omit<ChangelogEntry, 'visuals'>[] {
    try {
      const log = execSync('git log --pretty=format:"%H|%h|%s|%ad|%an" --date=short -50')
        .toString()
        .split('\n')
        .filter(line => line.trim())
        .map(line => {
          const [hash, shortHash, message, date, author] = line.split('|');
          return { hash, shortHash, message, date, author };
        });
      
      return log;
    } catch (error) {
      console.warn('⚠️ Could not get git log, using empty array');
      return [];
    }
  }
  
  private isTaskCompletion(message: string): boolean {
    return /feat:|fix:|DONE:|✅|closes #\d+|📸|visual|screenshot/i.test(message);
  }
  
  private findVisualsForCommit(hash: string): string[] {
    const visuals: string[] = [];
    
    // Check if there's a specific directory for this commit
    const commitVisualDir = path.join(this.visualDocsPath, hash);
    if (fs.existsSync(commitVisualDir)) {
      const files = fs.readdirSync(commitVisualDir)
        .filter(f => f.endsWith('.png'))
        .map(f => path.join(commitVisualDir, f));
      visuals.push(...files);
    }
    
    // Check main visual docs directory for recent files
    if (fs.existsSync(this.visualDocsPath)) {
      try {
        const commitDate = execSync(`git show -s --format=%ct ${hash}`).toString().trim();
        const commitTimestamp = parseInt(commitDate) * 1000;
        
        const files = fs.readdirSync(this.visualDocsPath)
          .filter(f => f.endsWith('.png'))
          .map(f => {
            const filePath = path.join(this.visualDocsPath, f);
            const stats = fs.statSync(filePath);
            return { path: filePath, mtime: stats.mtime.getTime() };
          })
          .filter(f => Math.abs(f.mtime - commitTimestamp) < 24 * 60 * 60 * 1000) // Within 24 hours
          .map(f => f.path);
        
        visuals.push(...files);
      } catch {
        // If we can't get commit date, just include recent files
      }
    }
    
    // Remove duplicates and return relative paths
    return [...new Set(visuals)].map(v => path.relative('.', v));
  }
  
  private writeChangelog(entries: ChangelogEntry[]) {
    const timestamp = new Date().toISOString().split('T')[0];
    
    let changelog = `# 📸 Visual Changelog\n\n`;
    changelog += `*Generated on ${timestamp}*\n\n`;
    changelog += `This document tracks visual changes to the Retail Insights Dashboard with screenshots for each completed task.\n\n`;
    
    if (entries.length === 0) {
      changelog += `## No Visual Documentation Found\n\n`;
      changelog += `No commits with visual documentation markers found. Use these commit prefixes to generate visual docs:\n\n`;
      changelog += `- \`feat: ✅\` - New feature completed\n`;
      changelog += `- \`fix: DONE\` - Bug fix completed\n`;
      changelog += `- \`closes #123\` - Issue resolved\n`;
      changelog += `- \`📸\` - Visual update\n\n`;
    } else {
      changelog += `## Recent Changes\n\n`;
      
      for (const entry of entries) {
        changelog += `### ${entry.date} - ${entry.message}\n\n`;
        changelog += `**Commit:** [\`${entry.shortHash}\`](../../commit/${entry.hash}) by ${entry.author}\n\n`;
        
        if (entry.visuals.length > 0) {
          changelog += `<details>\n`;
          changelog += `<summary>📸 View Screenshots (${entry.visuals.length} images)</summary>\n\n`;
          
          entry.visuals.forEach((visual, index) => {
            const filename = path.basename(visual, '.png');
            const displayName = filename.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            changelog += `#### ${displayName}\n\n`;
            changelog += `![${displayName}](${visual})\n\n`;
          });
          
          changelog += `</details>\n\n`;
        } else {
          changelog += `*No visual documentation available for this commit.*\n\n`;
        }
        
        changelog += `---\n\n`;
      }
    }
    
    changelog += `## How Visual Documentation Works\n\n`;
    changelog += `Visual documentation is automatically generated when commits include certain keywords:\n\n`;
    changelog += `- **Task Completion**: \`feat:\`, \`fix:\`, \`DONE:\`, \`✅\`\n`;
    changelog += `- **Issue Resolution**: \`closes #123\`, \`fixes #456\`\n`;
    changelog += `- **Visual Updates**: \`📸\`, \`visual\`, \`screenshot\`\n\n`;
    changelog += `Screenshots are captured automatically by:\n`;
    changelog += `1. GitHub Actions on PR creation/updates\n`;
    changelog += `2. Git hooks on task completion commits\n`;
    changelog += `3. Manual capture with \`npm run capture:visuals\`\n\n`;
    
    changelog += `---\n*Generated by automated visual documentation system*\n`;
    
    fs.writeFileSync(this.changelogPath, changelog);
  }
}

// Run if called directly
if (require.main === module) {
  const generator = new VisualChangelogGenerator();
  generator.generateChangelog().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { VisualChangelogGenerator };