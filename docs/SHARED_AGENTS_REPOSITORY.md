# Shared Pulser Agents Repository Structure

## Overview

This document outlines the structure and organization of shared Pulser agents for cross-project reusability. The shared repository enables teams to leverage standardized agent configurations, reducing setup time and ensuring consistency across projects.

## Repository Information

- **Main Project**: https://github.com/jgtolentino/retail-insights-dashboard-ph.git
- **Shared Agents Repo**: https://github.com/jgtolentino/pulser-agents-shared.git (to be created)
- **Registry URL**: https://registry.pulser.dev/agents/jgtolentino (conceptual)

## Repository Structure

```
pulser-agents-shared/
├── README.md
├── CHANGELOG.md
├── LICENSE
├── agents/
│   ├── core/                    # Core essential agents
│   │   ├── basher-exec/
│   │   │   ├── v1.0.0/
│   │   │   │   ├── agent.yaml
│   │   │   │   ├── README.md
│   │   │   │   └── examples/
│   │   │   ├── v1.1.0/
│   │   │   └── latest -> v1.1.0
│   │   ├── caca/
│   │   ├── maya-plan/
│   │   ├── claudia/
│   │   └── patcha/
│   ├── specialized/             # Project-specific agents
│   │   ├── retail-analytics/
│   │   ├── web-development/
│   │   ├── data-processing/
│   │   └── mobile-development/
│   ├── experimental/            # Beta/testing agents
│   │   ├── ai-assistant/
│   │   ├── auto-deployment/
│   │   └── security-scanner/
│   └── deprecated/              # Legacy agents
├── templates/                   # Agent templates
│   ├── basic-agent-template.yaml
│   ├── security-agent-template.yaml
│   └── analysis-agent-template.yaml
├── schemas/                     # Validation schemas
│   ├── agent-schema.json
│   ├── config-schema.json
│   └── capability-schema.json
├── docs/                        # Documentation
│   ├── AGENT_DEVELOPMENT.md
│   ├── CONTRIBUTION_GUIDE.md
│   ├── SECURITY_GUIDELINES.md
│   └── VERSION_MANAGEMENT.md
├── tests/                       # Agent testing
│   ├── integration/
│   ├── unit/
│   └── fixtures/
└── scripts/                     # Management scripts
    ├── validate-agent.sh
    ├── publish-agent.sh
    └── migrate-version.sh
```

## Core Agent Configurations

### 1. BasherExec Agent (v1.1.0)

**agents/core/basher-exec/v1.1.0/agent.yaml**

```yaml
agent: BasherExec
version: '1.1.0'
description: 'Universal command execution and system operations agent'
author: 'Pulser Core Team'
license: 'MIT'
compatibility:
  pulser_version: '>=2.0.0'
  node_version: '>=16.0.0'

capabilities:
  - command_execution
  - file_system_operations
  - environment_management
  - process_control
  - package_management

configuration:
  safety_rules:
    validate_commands: true
    require_confirmation_for:
      - rm
      - delete
      - drop
      - truncate
      - format
    timeout_seconds: 600
    max_concurrent_processes: 5

  allowed_operations:
    - npm_operations: true
    - yarn_operations: true
    - git_operations: true
    - file_operations: true
    - docker_operations: false # requires explicit enable

  forbidden_operations:
    - system_modification: true
    - user_management: true
    - network_configuration: true
    - kernel_operations: true

  environment_setup:
    package_managers:
      - npm
      - yarn
      - pnpm
    runtime_environments:
      - node
      - python
      - java

execution_patterns:
  install_dependencies:
    patterns:
      - 'npm install'
      - 'npm ci'
      - 'yarn install'
      - 'pnpm install'
    retry_logic: true
    max_retries: 3

  build_operations:
    patterns:
      - 'npm run build'
      - 'yarn build'
      - 'make build'
    artifact_handling: true
    cleanup_on_failure: true

  test_execution:
    patterns:
      - 'npm test'
      - 'npm run test:*'
      - 'pytest'
      - 'mvn test'
    report_generation: true
    coverage_tracking: true

security:
  sandbox_mode: true
  resource_limits:
    memory: '2GB'
    cpu: '80%'
    disk: '10GB'
  audit_logging: true

examples:
  basic_usage: |
    pulser invoke BasherExec install
    pulser invoke BasherExec build
    pulser invoke BasherExec test

  advanced_usage: |
    pulser invoke BasherExec --config="custom.yaml" deploy
    pulser invoke BasherExec --timeout=900 long-running-task
```

### 2. Caca Agent (v1.1.0)

**agents/core/caca/v1.1.0/agent.yaml**

```yaml
agent: Caca
version: '1.1.0'
description: 'Comprehensive code analysis and quality assurance agent'
author: 'Pulser Core Team'
license: 'MIT'

capabilities:
  - static_code_analysis
  - quality_metrics
  - security_scanning
  - dependency_analysis
  - performance_profiling
  - documentation_analysis

analysis_tools:
  javascript_typescript:
    - eslint
    - prettier
    - typescript_compiler
    - jshint

  css_styling:
    - stylelint
    - postcss
    - sass_lint

  security:
    - npm_audit
    - snyk
    - sonarjs
    - bandit

  performance:
    - lighthouse
    - webpack_analyzer
    - bundle_analyzer

  general:
    - sonarqube
    - codeclimate
    - codeql

quality_thresholds:
  default:
    coverage_minimum: 80
    complexity_max: 10
    maintainability_min: 7.0
    duplication_max: 3.0

  strict:
    coverage_minimum: 90
    complexity_max: 8
    maintainability_min: 8.0
    duplication_max: 2.0

  relaxed:
    coverage_minimum: 70
    complexity_max: 15
    maintainability_min: 6.0
    duplication_max: 5.0

fix_patterns:
  auto_fixable:
    - code_formatting
    - import_sorting
    - unused_imports
    - simple_lint_errors
    - trailing_whitespace
    - missing_semicolons

  semi_auto_fixable:
    - deprecated_api_usage
    - simple_refactoring
    - basic_performance_issues

  manual_review_required:
    - logic_errors
    - security_vulnerabilities
    - architectural_changes
    - breaking_changes

reporting:
  formats:
    - json
    - xml
    - html
    - markdown
  include_suggestions: true
  generate_diff: true
  export_metrics: true

integration:
  git_hooks: true
  ci_cd_compatible: true
  ide_plugins: true
```

### 3. Specialized Agents

**agents/specialized/retail-analytics/v1.0.0/agent.yaml**

```yaml
agent: RetailAnalytics
version: '1.0.0'
description: 'Specialized agent for retail dashboard analytics and data processing'
author: 'TBWA Team'
license: 'MIT'
extends: 'core/caca/v1.1.0'

specialized_capabilities:
  - supabase_query_optimization
  - dashboard_performance_analysis
  - data_pipeline_validation
  - retail_metrics_calculation
  - filter_performance_optimization

retail_specific_tools:
  database:
    - supabase_analyzer
    - query_performance_monitor
    - rls_policy_validator

  analytics:
    - kpi_calculator
    - trend_analyzer
    - cohort_analyzer

  visualization:
    - chart_performance_monitor
    - responsive_design_validator
    - accessibility_checker

quality_gates:
  database_performance:
    query_time_max: 2000 # milliseconds
    connection_pool_usage: 80
    rls_policy_coverage: 100

  dashboard_performance:
    initial_load_time: 3000
    chart_render_time: 1000
    filter_response_time: 500

  data_quality:
    data_completeness: 95
    data_accuracy: 99
    data_freshness: 24 # hours

examples:
  usage: |
    pulser invoke RetailAnalytics validate-dashboard-performance
    pulser invoke RetailAnalytics optimize-supabase-queries
    pulser invoke RetailAnalytics generate-analytics-report
```

## Agent Development Guidelines

### 1. Agent Specification Template

**templates/basic-agent-template.yaml**

```yaml
agent: '{{ AGENT_NAME }}'
version: '{{ VERSION }}'
description: '{{ DESCRIPTION }}'
author: '{{ AUTHOR }}'
license: '{{ LICENSE }}'

# Pulser compatibility requirements
compatibility:
  pulser_version: '{{ MIN_PULSER_VERSION }}'
  node_version: '{{ MIN_NODE_VERSION }}'

# Core capabilities this agent provides
capabilities:
  - '{{ CAPABILITY_1 }}'
  - '{{ CAPABILITY_2 }}'

# Configuration options
configuration:
  # Agent-specific settings
  settings:
    setting_1: '{{ DEFAULT_VALUE }}'
    setting_2: '{{ DEFAULT_VALUE }}'

  # Safety and security rules
  safety_rules:
    validate_inputs: true
    timeout_seconds: 300
    max_retries: 3

# Examples of how to use this agent
examples:
  basic: |
    pulser invoke {{ AGENT_NAME }} basic-command

  advanced: |
    pulser invoke {{ AGENT_NAME }} --config="custom.yaml" advanced-command

# Testing configuration
tests:
  unit_tests: true
  integration_tests: true
  performance_tests: false

# Documentation requirements
documentation:
  readme_required: true
  examples_required: true
  changelog_required: true
```

### 2. Version Management

**docs/VERSION_MANAGEMENT.md**

```markdown
# Agent Version Management

## Semantic Versioning

Agents follow semantic versioning (MAJOR.MINOR.PATCH):

- **MAJOR**: Breaking changes to agent interface
- **MINOR**: New capabilities, backward compatible
- **PATCH**: Bug fixes, security updates

## Version Directory Structure
```

agents/core/agent-name/
├── v1.0.0/ # Initial release
├── v1.0.1/ # Patch update
├── v1.1.0/ # Minor update
├── v2.0.0/ # Major update
└── latest -> v1.1.0 # Symlink to latest stable

````

## Publishing New Versions

```bash
# Validate agent configuration
./scripts/validate-agent.sh agents/core/new-agent/v1.0.0/

# Publish to shared repository
./scripts/publish-agent.sh new-agent v1.0.0

# Update latest symlink
ln -sf v1.0.0 agents/core/new-agent/latest
````

````

## Repository Management Scripts

**scripts/validate-agent.sh**
```bash
#!/bin/bash
# Validate agent configuration against schema

AGENT_PATH=$1

if [ -z "$AGENT_PATH" ]; then
    echo "Usage: $0 <agent-path>"
    exit 1
fi

echo "Validating agent at: $AGENT_PATH"

# Check required files
if [ ! -f "$AGENT_PATH/agent.yaml" ]; then
    echo "Error: agent.yaml not found"
    exit 1
fi

if [ ! -f "$AGENT_PATH/README.md" ]; then
    echo "Error: README.md not found"
    exit 1
fi

# Validate YAML syntax
yamllint "$AGENT_PATH/agent.yaml"

# Validate against schema
ajv validate -s schemas/agent-schema.json -d "$AGENT_PATH/agent.yaml"

# Run agent-specific tests if available
if [ -d "$AGENT_PATH/tests" ]; then
    echo "Running agent tests..."
    cd "$AGENT_PATH/tests" && npm test
fi

echo "Agent validation completed successfully"
````

**scripts/publish-agent.sh**

```bash
#!/bin/bash
# Publish agent to shared repository

AGENT_NAME=$1
VERSION=$2

if [ -z "$AGENT_NAME" ] || [ -z "$VERSION" ]; then
    echo "Usage: $0 <agent-name> <version>"
    exit 1
fi

AGENT_PATH="agents/core/$AGENT_NAME/$VERSION"

# Validate before publishing
./scripts/validate-agent.sh "$AGENT_PATH"

# Create release tag
git tag "agent-$AGENT_NAME-$VERSION"

# Push to shared repository
git push origin "agent-$AGENT_NAME-$VERSION"

echo "Agent $AGENT_NAME v$VERSION published successfully"
```

## Usage in Projects

### 1. Referencing Shared Agents

**pulser.yaml**

```yaml
agents:
  BasherExec:
    source: 'shared'
    repository: 'https://github.com/jgtolentino/pulser-agents-shared.git'
    agent: 'core/basher-exec'
    version: 'v1.1.0'

  Caca:
    source: 'shared'
    repository: 'https://github.com/jgtolentino/pulser-agents-shared.git'
    agent: 'core/caca'
    version: 'latest'

  RetailAnalytics:
    source: 'shared'
    repository: 'https://github.com/jgtolentino/pulser-agents-shared.git'
    agent: 'specialized/retail-analytics'
    version: 'v1.0.0'
```

### 2. Local Agent Override

```yaml
agents:
  CustomBasher:
    source: 'local'
    path: 'pulser_agents/custom_basher.yaml'
    extends: 'shared:core/basher-exec:v1.1.0'
```

### 3. Agent Installation

```bash
# Install shared agents
pulser agent install shared:core/basher-exec:v1.1.0
pulser agent install shared:core/caca:latest
pulser agent install shared:specialized/retail-analytics:v1.0.0

# List installed agents
pulser agent list

# Update agents
pulser agent update --all
```

## Contribution Guidelines

### 1. Contributing New Agents

1. Fork the shared repository
2. Create agent using template
3. Implement and test thoroughly
4. Submit pull request with:
   - Agent configuration
   - Comprehensive documentation
   - Test cases
   - Usage examples

### 2. Quality Standards

- **Documentation**: Complete README with examples
- **Testing**: Unit and integration tests
- **Security**: Security review for any system operations
- **Performance**: Performance benchmarks for resource usage
- **Compatibility**: Version compatibility matrix

### 3. Review Process

1. Automated validation via CI/CD
2. Security review for privileged operations
3. Performance testing
4. Community feedback period
5. Core team approval
6. Publication to shared registry

## Security Considerations

### 1. Agent Permissions

```yaml
security:
  permissions:
    file_system: read_write
    network: none
    system_calls: restricted
    environment_variables: read_only

  sandboxing:
    enabled: true
    resource_limits:
      memory: '1GB'
      cpu: '50%'
      disk: '5GB'
```

### 2. Validation Pipeline

- Static analysis of agent code
- Security vulnerability scanning
- Permission audit
- Resource usage analysis
- Malware detection

## Monitoring and Analytics

### 1. Usage Metrics

- Agent download/usage statistics
- Performance metrics collection
- Error rate monitoring
- Success rate tracking

### 2. Health Monitoring

```bash
# Check shared repository health
pulser registry health-check

# Agent performance metrics
pulser agent metrics BasherExec

# System resource usage
pulser system monitor
```

---

**Repository Maintainers:**

- Technical Lead: jgtolentino
- Platform Team: pulser-core@company.com
- Security Team: security@company.com

**Last Updated:** January 6, 2025
**Next Review:** April 6, 2025
