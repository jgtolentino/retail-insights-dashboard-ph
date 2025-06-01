# Pulser-Enabled Project Boilerplate

This template provides a complete project structure with Pulser integration for rapid project initialization and standardized development workflows.

## Quick Start

```bash
# Clone this boilerplate
git clone <boilerplate-repo-url> my-new-project
cd my-new-project

# Initialize Pulser
npm install -g pulser-cli
pulser init --template=boilerplate

# Set up development environment
pulser invoke MayaPlan initialize-project
pulser invoke BasherExec setup-development
```

## Project Structure

```
project-root/
├── pulser.yaml                 # Main Pulser configuration
├── pulser_agents/              # Agent definitions
│   ├── basher_exec.yaml
│   ├── caca.yaml
│   ├── maya_plan.yaml
│   ├── claudia.yaml
│   └── patcha.yaml
├── .qa/                        # Quality assurance
│   ├── quality-gates.yml
│   ├── acceptance-template.md
│   └── test-plans/
├── .github/                    # CI/CD workflows
│   └── workflows/
│       ├── pulser-pipeline.yml
│       ├── pulser-release.yml
│       └── pulser-hotfix.yml
├── docs/                       # Documentation
│   ├── DEVELOPMENT.md
│   ├── DEPLOYMENT.md
│   └── API.md
├── src/                        # Source code
├── tests/                      # Test suites
├── scripts/                    # Build/deployment scripts
└── templates/                  # Code templates
```

## Core Configuration Files

### 1. Main Pulser Configuration

**pulser.yaml**

```yaml
version: '2.1.0'
name: '{{ PROJECT_NAME }}'
description: '{{ PROJECT_DESCRIPTION }}'
repository: '{{ REPOSITORY_URL }}'

# Agent Configuration
agents:
  BasherExec: pulser_agents/basher_exec.yaml
  Caca: pulser_agents/caca.yaml
  MayaPlan: pulser_agents/maya_plan.yaml
  Claudia: pulser_agents/claudia.yaml
  Patcha: pulser_agents/patcha.yaml

# Standard Task Definitions
tasks:
  # Development Tasks
  install:
    description: 'Install project dependencies'
    command: 'npm ci'
    retry: true
    max_retries: 3
    self_heal: true
    timeout: 300

  dev:
    description: 'Start development server'
    command: 'npm run dev'
    retry: false
    dependencies: ['install']
    background: true

  # Build Tasks
  build:
    description: 'Build for production'
    command: 'npm run build'
    retry: true
    max_retries: 2
    self_heal: true
    dependencies: ['install', 'lint', 'test']
    artifacts:
      - 'dist/'
      - 'build/'

  # Quality Tasks
  lint:
    description: 'Run linting and formatting'
    command: 'npm run lint && npm run format'
    retry: true
    max_retries: 3
    self_heal: true
    dependencies: ['install']

  type-check:
    description: 'TypeScript type checking'
    command: 'npm run type-check'
    retry: true
    max_retries: 2
    self_heal: true
    dependencies: ['install']

  test:
    description: 'Run test suite'
    command: 'npm test'
    retry: true
    max_retries: 2
    self_heal: false
    dependencies: ['install']
    coverage: true

  test-e2e:
    description: 'Run end-to-end tests'
    command: 'npm run test:e2e'
    retry: true
    max_retries: 1
    dependencies: ['build']

  # Security Tasks
  audit:
    description: 'Security dependency audit'
    command: 'npm audit --audit-level moderate'
    retry: false
    dependencies: ['install']

  # Deployment Tasks
  deploy-staging:
    description: 'Deploy to staging environment'
    command: 'npm run deploy:staging'
    retry: true
    max_retries: 1
    dependencies: ['build', 'test', 'audit']

  deploy-production:
    description: 'Deploy to production environment'
    command: 'npm run deploy:production'
    retry: false
    dependencies: ['deploy-staging']
    manual_approval: true

# Environment Configurations
environments:
  development:
    auto_fix: true
    self_heal: true
    strict_mode: false
    debug: true

  staging:
    auto_fix: true
    self_heal: true
    strict_mode: true
    debug: false

  production:
    auto_fix: false
    self_heal: false
    strict_mode: true
    manual_approval: true
    debug: false

# Quality Gates
quality_gates:
  code_coverage: 80
  lint_score: 9.0
  type_errors: 0
  security_vulnerabilities: 0
  performance_budget: true
  accessibility_score: 90

# Monitoring and Alerts
monitoring:
  health_checks: true
  performance_tracking: true
  error_reporting: true

notifications:
  slack_webhook: '{{ SLACK_WEBHOOK_URL }}'
  email_alerts: ['{{ TEAM_EMAIL }}']
  failure_escalation: true
```

### 2. Agent Configurations

**pulser_agents/basher_exec.yaml**

```yaml
agent: BasherExec
description: 'Command execution and system operations for {{ PROJECT_NAME }}'

capabilities:
  - npm/yarn package management
  - File system operations
  - Environment setup
  - Process management
  - Deployment automation

safety_rules:
  validate_commands: true
  require_confirmation_for:
    - rm
    - delete
    - drop
    - truncate
  timeout_seconds: 600
  allowed_directories:
    - './src'
    - './tests'
    - './scripts'
    - './dist'
    - './build'
  forbidden_operations:
    - system_modification
    - user_management
    - network_configuration

environment_setup:
  node_version: '{{ NODE_VERSION }}'
  npm_registry: '{{ NPM_REGISTRY }}'
  package_manager: 'npm'

pre_execution_checks:
  - verify_node_version
  - check_disk_space
  - validate_permissions
  - confirm_git_status

post_execution_actions:
  - cleanup_temp_files
  - update_logs
  - report_metrics
```

**pulser_agents/caca.yaml**

```yaml
agent: Caca
description: 'Code analysis and quality assurance for {{ PROJECT_NAME }}'

analysis_tools:
  eslint:
    config: 'eslint.config.js'
    rules_level: 'error'
    auto_fix: true

  prettier:
    config: '.prettierrc'
    auto_format: true

  typescript:
    config: 'tsconfig.json'
    strict_mode: true

  stylelint:
    config: '.stylelintrc'
    auto_fix: true

  security_scanner:
    tool: 'npm_audit'
    severity_threshold: 'moderate'

quality_thresholds:
  coverage_minimum: 80
  complexity_max: 10
  maintainability_min: 7
  duplication_max: 3

fix_patterns:
  auto_fixable:
    - code_formatting
    - import_sorting
    - unused_imports
    - simple_lint_errors

  manual_review_required:
    - logic_errors
    - security_vulnerabilities
    - architectural_changes
    - breaking_changes

reporting:
  format: 'json'
  include_suggestions: true
  generate_reports: true
  export_metrics: true
```

**pulser_agents/maya_plan.yaml**

```yaml
agent: MayaPlan
description: 'Strategic planning and orchestration for {{ PROJECT_NAME }}'

planning_capabilities:
  - Task dependency analysis
  - Resource allocation
  - Timeline optimization
  - Risk assessment
  - Parallel execution planning

strategies:
  development:
    focus: 'speed'
    parallelization: true
    fail_fast: false

  testing:
    focus: 'thoroughness'
    parallelization: true
    fail_fast: true

  deployment:
    focus: 'reliability'
    parallelization: false
    fail_fast: true

resource_management:
  max_concurrent_tasks: 4
  memory_threshold: '80%'
  cpu_threshold: '75%'

risk_mitigation:
  backup_strategies: true
  rollback_plans: true
  dependency_isolation: true

optimization_rules:
  - cache_dependencies
  - reuse_artifacts
  - minimize_redundancy
  - optimize_critical_path
```

**pulser_agents/claudia.yaml**

```yaml
agent: Claudia
description: 'Smart routing and decision making for {{ PROJECT_NAME }}'

routing_capabilities:
  - Context-aware task routing
  - Agent load balancing
  - Workflow optimization
  - Error handling coordination

decision_matrix:
  simple_tasks:
    route_to: 'BasherExec'
    criteria: ['single_command', 'no_dependencies']

  analysis_tasks:
    route_to: 'Caca'
    criteria: ['code_review', 'quality_check']

  complex_workflows:
    route_to: 'MayaPlan'
    criteria: ['multiple_steps', 'dependencies']

  error_recovery:
    route_to: 'Patcha'
    criteria: ['failed_task', 'auto_fixable']

context_awareness:
  environment_detection: true
  git_branch_awareness: true
  time_based_routing: true
  load_based_routing: true

coordination_rules:
  - avoid_conflicts
  - respect_dependencies
  - optimize_resource_usage
  - maintain_state_consistency
```

**pulser_agents/patcha.yaml**

```yaml
agent: Patcha
description: 'Self-healing automation for {{ PROJECT_NAME }}'

healing_capabilities:
  - Dependency conflict resolution
  - Configuration file repair
  - Build process recovery
  - Test environment fixes

safety_protocols:
  max_fix_attempts: 3
  backup_before_fix: true
  require_approval_for:
    - production_fixes
    - data_modifications
    - security_changes

  forbidden_actions:
    - system_level_changes
    - user_data_modification
    - security_policy_changes

auto_fix_patterns:
  dependency_issues:
    - npm_install_failures
    - version_conflicts
    - missing_packages

  configuration_errors:
    - malformed_json
    - missing_env_variables
    - invalid_paths

  build_failures:
    - compilation_errors
    - asset_optimization_issues
    - output_directory_problems

learning_system:
  track_fix_success: true
  improve_patterns: true
  share_knowledge: true

escalation_rules:
  - max_attempts_exceeded
  - critical_system_error
  - security_vulnerability_detected
  - human_intervention_required
```

## Quality Assurance Configuration

**.qa/quality-gates.yml**

```yaml
quality_gates:
  code_quality:
    eslint_score: >= 9.0
    typescript_errors: 0
    test_coverage: >= 80%
    complexity_score: <= 10
    duplication: <= 3%

  security:
    vulnerability_scan: pass
    dependency_audit: pass
    secrets_scan: pass
    license_compliance: pass

  performance:
    build_time: <= 5min
    bundle_size: <= 2MB
    lighthouse_score: >= 90
    core_web_vitals: pass

  functionality:
    unit_tests: pass
    integration_tests: pass
    e2e_tests: pass
    accessibility_tests: pass

  documentation:
    api_docs: up_to_date
    readme: updated
    changelog: current
    deployment_guide: accurate

# Gate Enforcement
enforcement:
  blocking_gates:
    - typescript_errors
    - critical_vulnerabilities
    - failing_tests

  warning_gates:
    - coverage_below_threshold
    - performance_regression
    - documentation_outdated

  bypass_conditions:
    - emergency_deployment
    - hotfix_branch
    - manual_override_approved
```

## CI/CD Pipeline Templates

**.github/workflows/pulser-pipeline.yml**

```yaml
name: Pulser CI/CD Pipeline

on:
  push:
    branches: [main, develop, feature/*]
  pull_request:
    branches: [main, develop]

env:
  PULSER_VERSION: '2.1.0'
  NODE_VERSION: '18'

jobs:
  pulser-quality-gates:
    name: Quality Gates
    runs-on: ubuntu-latest

    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install Pulser CLI
        run: npm install -g pulser-cli@${{ env.PULSER_VERSION }}

      - name: Initialize Pulser
        run: pulser init --project="${{ github.repository }}"

      - name: Run Quality Analysis
        run: |
          pulser invoke Caca full-analysis
          pulser invoke Patcha auto-fix-safe

      - name: Execute Test Suite
        run: |
          pulser invoke BasherExec install
          pulser invoke BasherExec test

      - name: Build Application
        run: pulser invoke BasherExec build

      - name: Security Audit
        run: pulser invoke BasherExec audit

      - name: Upload Test Reports
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: test-reports
          path: |
            coverage/
            test-results/
            .pulser/reports/

  pulser-deployment:
    name: Deployment
    needs: pulser-quality-gates
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'

    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Setup Pulser
        run: |
          npm install -g pulser-cli@${{ env.PULSER_VERSION }}
          pulser init

      - name: Deploy to Staging
        run: pulser invoke BasherExec deploy-staging

      - name: Validate Staging Deployment
        run: pulser invoke Claudia validate-deployment

      - name: Deploy to Production
        if: success()
        run: pulser invoke BasherExec deploy-production
        env:
          DEPLOYMENT_KEY: ${{ secrets.DEPLOYMENT_KEY }}
```

## Package.json Template

**package.json**

```json
{
  "name": "{{ PROJECT_NAME }}",
  "version": "1.0.0",
  "description": "{{ PROJECT_DESCRIPTION }}",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest",
    "test:e2e": "playwright test",
    "test:watch": "vitest --watch",
    "coverage": "vitest --coverage",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "lint:fix": "eslint . --ext ts,tsx --fix",
    "format": "prettier --write \"src/**/*.{ts,tsx,js,jsx,json,css,md}\"",
    "format:check": "prettier --check \"src/**/*.{ts,tsx,js,jsx,json,css,md}\"",
    "type-check": "tsc --noEmit",
    "audit": "npm audit --audit-level moderate",
    "deploy:staging": "echo 'Configure staging deployment'",
    "deploy:production": "echo 'Configure production deployment'",
    "pulser:init": "pulser init",
    "pulser:test": "pulser invoke BasherExec test",
    "pulser:build": "pulser invoke BasherExec build",
    "pulser:deploy": "pulser invoke MayaPlan deploy-strategy"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.66",
    "@types/react-dom": "^18.2.22",
    "@typescript-eslint/eslint-plugin": "^7.2.0",
    "@typescript-eslint/parser": "^7.2.0",
    "@vitejs/plugin-react": "^4.2.1",
    "eslint": "^8.57.0",
    "eslint-plugin-react-hooks": "^4.6.0",
    "eslint-plugin-react-refresh": "^0.4.6",
    "prettier": "^3.0.0",
    "typescript": "^5.2.2",
    "vite": "^5.2.0",
    "vitest": "^1.4.0",
    "@playwright/test": "^1.42.0",
    "pulser-cli": "^2.1.0"
  },
  "pulser": {
    "version": "2.1.0",
    "agents_directory": "pulser_agents",
    "config_file": "pulser.yaml",
    "auto_init": true
  }
}
```

## Documentation Templates

**docs/DEVELOPMENT.md**

```markdown
# Development Guide

## Getting Started with Pulser

### Initial Setup

\`\`\`bash

# Clone and setup

git clone {{ REPOSITORY_URL }}
cd {{ PROJECT_NAME }}

# Initialize Pulser

npm run pulser:init
pulser invoke MayaPlan initialize-project
\`\`\`

### Daily Development Workflow

\`\`\`bash

# Start development

pulser invoke BasherExec dev

# Before committing

pulser invoke Claudia validate-commit
\`\`\`

### Quality Checks

\`\`\`bash

# Run all quality gates

pulser invoke Caca full-analysis
pulser invoke Patcha auto-fix-safe
pulser invoke BasherExec test
\`\`\`

## Pulser Agent Usage

### Common Commands

- \`pulser invoke BasherExec install\` - Install dependencies
- \`pulser invoke Caca analyze\` - Code quality analysis
- \`pulser invoke MayaPlan plan-feature\` - Plan feature development
- \`pulser invoke Claudia route-task\` - Smart task routing
- \`pulser invoke Patcha heal-system\` - Auto-fix issues

### Debugging

\`\`\`bash

# Enable debug mode

export PULSER_DEBUG=true
pulser status --verbose
\`\`\`
```

## Customization Guide

### 1. Project-Specific Configuration

Update the following placeholders in all configuration files:

- `{{ PROJECT_NAME }}` - Your project name
- `{{ PROJECT_DESCRIPTION }}` - Project description
- `{{ REPOSITORY_URL }}` - Git repository URL
- `{{ NODE_VERSION }}` - Node.js version
- `{{ COVERAGE_THRESHOLD }}` - Test coverage requirement
- `{{ TEAM_EMAIL }}` - Team notification email

### 2. Adding Custom Agents

Create new agent configurations in `pulser_agents/`:

```yaml
# pulser_agents/custom_agent.yaml
agent: CustomAgent
description: 'Custom functionality for {{ PROJECT_NAME }}'
capabilities:
  - custom_capability_1
  - custom_capability_2
```

### 3. Environment-Specific Overrides

Create environment-specific configurations:

```yaml
# pulser.staging.yaml
extends: pulser.yaml
environments:
  staging:
    custom_setting: value
```

### 4. Team-Specific Workflows

Add custom tasks in `pulser.yaml`:

```yaml
tasks:
  team-standup:
    description: 'Generate standup report'
    command: 'pulser invoke CustomAgent generate-standup'
```

## Migration from Existing Projects

### 1. Gradual Integration

```bash
# Add Pulser to existing project
npm install --save-dev pulser-cli
npx pulser init --existing-project

# Migrate tasks gradually
pulser invoke MayaPlan analyze-existing-workflows
```

### 2. Legacy System Compatibility

Update `pulser.yaml` to include legacy commands:

```yaml
tasks:
  legacy-build:
    description: 'Legacy build process'
    command: 'make build'
    pulser_managed: false
```

## Best Practices

1. **Agent Configuration**

   - Keep agent configs version controlled
   - Use environment-specific overrides
   - Regular agent capability updates

2. **Quality Gates**

   - Start with relaxed thresholds
   - Gradually increase requirements
   - Monitor gate effectiveness

3. **Self-Healing**

   - Test Patcha fixes in development
   - Monitor auto-fix success rates
   - Regular safety protocol reviews

4. **Team Adoption**
   - Gradual migration strategy
   - Training on Pulser workflows
   - Regular feedback and iteration

---

This boilerplate provides a solid foundation for Pulser-enabled projects. Customize the configurations based on your specific needs and team requirements.
