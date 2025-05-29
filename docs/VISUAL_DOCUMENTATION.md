# 📸 Visual Documentation System

Automated screenshot capture and visual documentation for the Retail Insights Dashboard.

## 🎯 Overview

This system automatically captures screenshots when tasks are completed, providing visual feedback for:
- ✅ Feature completions
- 🐛 Bug fixes  
- 📊 UI changes
- 🔧 Dashboard improvements

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup Git Hooks (Automatic Capture)

```bash
npm run setup:visual-hooks
```

### 3. Manual Capture

```bash
# Capture current state
npm run capture:visuals

# Generate visual changelog
npm run docs:changelog
```

## 🔧 How It Works

### Automatic Triggers

Visual documentation is captured when commits contain these keywords:

| Trigger | Example | Description |
|---------|---------|-------------|
| `feat: ✅` | `feat: ✅ implement hierarchical brand view` | New feature completed |
| `fix: DONE` | `fix: DONE - resolve dashboard loading` | Bug fix completed |
| `closes #123` | `feat: closes #123 - add consumer insights` | Issue resolved |
| `📸` | `docs: 📸 update dashboard layout` | Visual update |

### What Gets Captured

1. **Dashboard Overview** - Main dashboard with KPIs
2. **Brand Analysis** - Hierarchical and filtered views
3. **Product Mix** - Pareto charts and substitutions
4. **Consumer Insights** - Demographics and behavior
5. **Trends Explorer** - Time series analysis
6. **Settings** - Configuration pages

### Capture Methods

1. **GitHub Actions** - Automated on PR creation/updates
2. **Git Hooks** - Triggered by commit messages
3. **Manual Scripts** - Run on demand

## 📁 File Structure

```
visual-docs/
├── README.md                    # Generated documentation
├── dashboard-overview.png       # Main dashboard
├── brand-revenue-analysis.png   # Brand visualizations
├── consumer-insights.png        # Demographics
└── ...                         # Additional screenshots
```

## 🛠️ Scripts Reference

### Core Scripts

```bash
# Capture visual documentation
npm run capture:visuals

# Watch for changes and auto-capture
npm run capture:visuals:watch

# Generate visual changelog
npm run docs:changelog

# Setup Git hooks
npm run setup:visual-hooks
```

### Manual Capture Script

```bash
# Run complete manual capture with server setup
./scripts/capture-manual.sh
```

## ⚙️ Configuration

### Environment Variables

```bash
# Base URL for screenshots (defaults to localhost:4173)
BASE_URL=http://localhost:4173

# GitHub token for PR comments
GITHUB_TOKEN=your_token_here

# Commit info (auto-detected)
GITHUB_SHA=commit_hash
COMMIT_MESSAGE="feat: ✅ new feature"
```

### Customizing Captures

Edit `scripts/capture-visuals.ts` to modify:

- **Routes to capture**: Add/remove pages
- **Wait conditions**: Adjust loading waits
- **Actions**: Add click interactions
- **Component captures**: Select specific elements

```typescript
// Example: Add new page capture
{
  route: '/new-page',
  name: 'New Feature Page',
  description: 'Description of new feature',
  waitFor: '.new-feature-selector',
  fullPage: true
}
```

## 🔄 Git Hooks

### Post-Commit Hook

Automatically captures visuals after task completion commits:

```bash
# Triggered by commits like:
git commit -m "feat: ✅ implement new dashboard feature"
git commit -m "fix: DONE - resolve chart rendering issue"
```

### Prepare-Commit-Msg Hook

Adds helpful commit message templates:

```bash
# Reminds you to use visual trigger keywords
# feat: ✅ - New feature completed
# fix: ✅ - Bug fix completed  
# DONE: - Task completed
# closes #123 - Issue resolved
```

## 📊 GitHub Actions Integration

### Workflow Triggers

- **Push to main**: Captures production state
- **Pull Request**: Generates preview screenshots
- **Manual dispatch**: Run captures on demand

### PR Comments

Automatically adds visual documentation to PRs:

```markdown
## 📸 Visual Documentation

**Commit:** `abc1234`
**Message:** feat: ✅ implement hierarchical brand view

### Screenshots

#### Dashboard Overview
![Dashboard Overview](./visual-docs/dashboard-overview.png)

#### Brand Analysis
![Brand Analysis](./visual-docs/brand-analysis.png)
```

## 🎨 Visual Changelog

Generate a comprehensive visual history:

```bash
npm run docs:changelog
```

Creates `VISUAL_CHANGELOG.md` with:
- Timeline of visual changes
- Screenshots for each task completion
- Commit links and author info
- Expandable image galleries

## 🔍 Troubleshooting

### Common Issues

**Playwright not found:**
```bash
npx playwright install chromium
```

**Preview server won't start:**
```bash
npm run build
npm run preview
```

**No screenshots captured:**
- Check commit message includes trigger keywords
- Verify application builds successfully
- Check console for errors in capture script

**Git hooks not working:**
```bash
chmod +x .husky/post-commit
npm run setup:visual-hooks
```

### Debug Mode

Run with verbose logging:

```bash
DEBUG=1 npm run capture:visuals
```

## 📈 Usage Examples

### Feature Development Workflow

1. **Start feature**: `git checkout -b feat/new-dashboard`
2. **Develop**: Make changes to components
3. **Complete task**: `git commit -m "feat: ✅ implement new KPI cards"`
4. **Auto-capture**: Git hook captures screenshots
5. **Create PR**: GitHub Actions adds visual docs to PR
6. **Review**: Team sees visual changes in PR comments

### Bug Fix Workflow

1. **Fix bug**: Resolve chart rendering issue
2. **Commit**: `git commit -m "fix: DONE - resolve pareto chart labels"`
3. **Auto-capture**: Before/after screenshots generated
4. **Verify**: Visual confirmation of fix

### Release Documentation

1. **Generate changelog**: `npm run docs:changelog`
2. **Review changes**: See all visual improvements
3. **Share with stakeholders**: Visual summary of updates

## 🎯 Best Practices

### Commit Messages

✅ **Good:**
```bash
git commit -m "feat: ✅ implement progressive disclosure for brand drill-down"
git commit -m "fix: DONE - resolve mobile responsiveness on consumer insights"
git commit -m "feat: closes #123 - add export functionality to settings"
```

❌ **Bad:**
```bash
git commit -m "update code"
git commit -m "fix bug"
git commit -m "changes"
```

### Screenshot Quality

- Ensure application is fully loaded before capture
- Use consistent viewport sizes (1920x1080)
- Include relevant UI states (loading, error, success)
- Capture both overview and detail views

### Performance

- Limit captures to task completions
- Use fullPage sparingly for performance
- Clean up old visual docs periodically
- Optimize image sizes if needed

## 🔗 Integration Options

### Slack Notifications

Add to capture script:
```typescript
// Send screenshots to Slack channel
await slack.chat.postMessage({
  channel: '#dev-updates',
  text: 'New visual documentation available',
  attachments: screenshots
});
```

### Jira Integration

Link visual docs to tickets:
```typescript
// Comment on Jira issue with screenshots
await jira.addComment(issueKey, {
  body: 'Visual documentation: [see screenshots](link)'
});
```

### Confluence Pages

Auto-update documentation:
```typescript
// Update Confluence page with latest screenshots
await confluence.updatePage(pageId, {
  body: generateConfluenceMarkup(screenshots)
});
```

---

*This visual documentation system ensures every UI change is captured and documented automatically, providing visual context for code reviews and stakeholder communication.*