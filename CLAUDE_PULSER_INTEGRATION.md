# Claude-Pulser Integration

Direct integration of Claude Code capabilities into the Pulser agent system for the retail-insights-dashboard-ph project.

## 🚀 Features

- **No External APIs**: Uses Claude Code directly, no API keys required
- **Project-Aware**: Understands React/TypeScript/Vite project structure
- **Integrated Workflow**: Works with existing Pulser agents (Caca, Patcha, etc.)
- **Production Ready**: Focuses on deployment readiness and error fixing

## 📋 Available Operations

### 1. Code Analysis

```bash
node claude-pulser-integration.js analyze
# Or via Pulser directly:
node pulser-task-runner.js run claude:analyze
```

Analyzes React components for:

- Performance issues
- Security vulnerabilities
- Best practice violations
- TypeScript type safety

### 2. Performance Optimization

```bash
node claude-pulser-integration.js optimize
# Or via Pulser:
node pulser-task-runner.js run claude:optimize
```

Identifies and suggests fixes for:

- React re-render issues
- Bundle size optimization
- Memory leaks
- State management improvements

### 3. Component Generation

```bash
node claude-pulser-integration.js generate SalesChart chart
# Or via Pulser with env vars:
COMPONENT_NAME="SalesChart" COMPONENT_TYPE="chart" node pulser-task-runner.js run claude:generate
```

Generates new React components following project patterns:

- TypeScript interfaces
- Proper hook usage
- Tailwind styling
- shadcn/ui integration

### 4. Deployment Review

```bash
node claude-pulser-integration.js review
# Or via Pulser:
node pulser-task-runner.js run claude:review
```

Comprehensive production readiness check:

- Security audit
- Performance validation
- Accessibility compliance
- Code quality assessment

### 5. Interactive Mode

```bash
node claude-pulser-integration.js interactive
```

Provides an interactive CLI for all operations.

## 🔧 Integration with Existing Agents

### With Caca (Error Analysis)

When Claude finds issues, they're automatically forwarded to Caca for additional context and automated fix suggestions.

### With Patcha (Auto-Fix)

Claude-generated fixes can be automatically applied using Patcha's execution engine.

### With Pulser Workflows

Claude tasks integrate seamlessly into existing Pulser composite workflows:

```yaml
composite_tasks:
  qa-claude-enhanced:
    description: 'Enhanced QA with Claude analysis'
    steps:
      - lint
      - test
      - claude:analyze
      - claude:optimize
      - claude:review
```

## 🎯 Use Cases

### 1. Pre-Deployment QA

```bash
# Run comprehensive Claude review before deployment
node pulser-task-runner.js run claude:review
```

### 2. Performance Debugging

```bash
# Analyze performance issues in specific components
TARGET_COMPONENT="src/hooks/useSalesByBrand.ts" node pulser-task-runner.js run claude:optimize
```

### 3. Code Generation

```bash
# Generate new dashboard components
node claude-pulser-integration.js generate ProfitChart chart
```

### 4. React Error Fixing

```bash
# Fix getSnapshot and infinite loop issues
ISSUE_CONTEXT="getSnapshot infinite loop" node pulser-task-runner.js run claude:fix
```

## 📊 Status Check

Run status check to verify integration:

```bash
node claude-pulser-integration.js status
```

Expected output:

```
📊 Claude-Pulser Integration Status:
=====================================
✅ Claude agent configured: YES
✅ Agent file exists: YES
✅ Claude tasks available: 5 (claude:analyze, claude:optimize, claude:fix, claude:review, claude:generate)
✅ Project structure: VALID

🚀 Ready to use Claude integration!
```

## 🔄 Workflow Examples

### Fix React Errors Workflow

1. `claude:analyze` - Identify React issues
2. `claude:fix` - Generate fixes
3. `patcha:apply` - Auto-apply fixes
4. `test` - Verify fixes work

### New Feature Workflow

1. `claude:generate` - Create component
2. `claude:review` - Quality check
3. `claude:optimize` - Performance tune
4. `test` - Validate functionality

### Pre-Deployment Workflow

1. `claude:analyze` - Final code audit
2. `claude:optimize` - Performance check
3. `claude:review` - Security & quality
4. `deploy-safe` - Deploy with confidence

## 🛠 Troubleshooting

### Common Issues

**Agent not found:**

```bash
# Verify agent file exists
ls -la pulser_agents/claude_direct.yaml
```

**Task execution fails:**

```bash
# Check Pulser configuration
node pulser-task-runner.js list-tasks | grep claude
```

**Module import errors:**

```bash
# Ensure Node.js ES modules are supported
node --version # Requires Node 14+
```

## 🎉 Integration Complete

The Claude-Pulser integration is now active and ready to enhance your development workflow with intelligent code analysis, optimization, and generation capabilities - all powered directly by Claude Code without requiring external APIs or additional setup.
