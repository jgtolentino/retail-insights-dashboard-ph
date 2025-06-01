# Pulser - AI-Powered Task Runner

Pulser is an intelligent task runner and workflow automation tool designed for React/TypeScript projects. It combines traditional task execution with AI-powered planning, error analysis, and GitHub integration.

## Features

- 🤖 **AI Task Planning** - Break down features into actionable subtasks
- 🔧 **Intelligent Error Analysis** - Get specific, actionable fix suggestions
- 🐙 **GitHub Integration** - Post AI-generated plans directly to PRs
- ⚡ **Agent-Based Architecture** - Modular system with specialized agents
- 🎯 **React/TypeScript Optimized** - Built for modern web development

## Quick Start

### Installation

```bash
npm install -g @retail-insights/pulser
```

### Basic Usage

```bash
# Initialize in your project
pulser inspect

# Run tasks
pulser run build-css
pulser run lint
pulser run test
pulser run ci

# AI planning
pulser plan "Add responsive navigation menu"

# GitHub integration (requires GITHUB_TOKEN)
export GITHUB_TOKEN=your_token
pulser post-plan 123 "$(pulser plan 'Add filter panel')"
```

## Core Agents

### BasherExec

Executes shell commands with structured output

```bash
pulser invoke --agent BasherExec --function run --args '{"cmd":"npm test"}'
```

### Caca

Intelligent error analysis with pattern matching

```bash
pulser invoke --agent Caca --function suggest --args '{"taskName":"build","stderr":"command not found: tailwindcss","exitCode":127}'
```

### MayaPlan

AI-powered feature planning for React projects

```bash
pulser invoke --agent MayaPlan --function planFeature --args '{"feature":"Add user authentication","repoPath":"."}'
```

### Claudia

GitHub PR comment integration

```bash
pulser invoke --agent Claudia --function postPlan --args '{"prNumber":123,"planTasks":[...],"owner":"org","repo":"repo"}'
```

## Configuration

Create a `pulser.yaml` in your project root:

```yaml
name: my-project
version: 1.0.0

environment:
  required:
    - node
    - npm
    - tailwindcss

agents:
  BasherExec: pulser_agents/basher_exec.yaml
  Caca: pulser_agents/caca.yaml
  MayaPlan: pulser_agents/maya_plan.yaml
  Claudia: pulser_agents/claudia.yaml

tasks:
  build-css:
    description: 'Compile Tailwind CSS'
    run: |
      response=$(pulser invoke --agent BasherExec --function run \
        --args '{"cmd":"npx tailwindcss -i src/index.css -o dist/output.css --minify"}')
      # Error handling with Caca suggestions

  lint:
    description: 'Run ESLint'
    run: |
      response=$(pulser invoke --agent BasherExec --function run \
        --args '{"cmd":"npx eslint \"src/**/*.{js,jsx,ts,tsx}\""}')

composite_tasks:
  ci:
    description: 'build → lint → test'
    steps:
      - build-css
      - lint
      - test
```

## Error Analysis

Caca provides intelligent error suggestions based on patterns:

- **Command not found** → Installation suggestions
- **Module resolution** → npm install commands
- **Network issues** → Connection troubleshooting
- **TypeScript errors** → Type improvement suggestions
- **React Hooks** → Hook usage corrections
- **Build tools** → Configuration fixes

## AI Planning

MayaPlan generates structured task breakdowns following React/TypeScript conventions:

```json
{
  "tasks": [
    {
      "name": "Create FilterPanel component",
      "filePaths": ["src/components/FilterPanel.tsx"],
      "type": "code",
      "deps": []
    },
    {
      "name": "Add filter types",
      "filePaths": ["src/types/filters.ts"],
      "type": "code",
      "deps": []
    },
    {
      "name": "Write FilterPanel tests",
      "filePaths": ["src/components/__tests__/FilterPanel.test.tsx"],
      "type": "test",
      "deps": ["Create FilterPanel component"]
    }
  ]
}
```

## GitHub Integration

Set up GitHub token and post plans to PRs:

```bash
export GITHUB_TOKEN=ghp_xxxxx
export GITHUB_OWNER=your-org
export GITHUB_REPO=your-repo

# Generate and post plan
PLAN=$(pulser plan "Add dark mode toggle")
pulser post-plan 123 "$PLAN"
```

## Environment Variables

- `GITHUB_TOKEN` - GitHub personal access token for PR comments
- `PULSER_LOG_LEVEL=debug` - Enable debug logging
- `GITHUB_OWNER` - Default GitHub organization/user
- `GITHUB_REPO` - Default GitHub repository

## Development

### Testing

```bash
npm test              # Run all tests
npm run test:agents   # Test individual agents
npm run test:integration # Test full pipeline
```

### Agent Development

Create custom agents by adding YAML configs in `pulser_agents/`:

```yaml
agent: MyAgent
description: 'Custom agent description'
input_schema:
  - param1: string
  - param2: number
output_schema:
  - result: string
prompt_template: |
  You are MyAgent. Process {{param1}} and {{param2}}.
  Return: {"result": "processed value"}
```

## Project Structure

```
pulser/
├── pulser                    # Main executable
├── pulser-simple.js         # Core task runner
├── pulser.yaml              # Configuration
├── pulser_agents/           # Agent definitions
│   ├── basher_exec.yaml
│   ├── caca.yaml
│   ├── maya_plan.yaml
│   └── claudia.yaml
└── tests/                   # Test suite
    ├── agents/              # Agent tests
    └── integration/         # Pipeline tests
```

## Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Add tests: `npm run test:agents`
4. Commit changes: `git commit -m 'Add amazing feature'`
5. Push to branch: `git push origin feature/amazing-feature`
6. Open Pull Request

## License

MIT © Retail Insights Team
