# Version Bumping and Git Conflict Resolution Guide

## Overview

This guide provides comprehensive procedures for version management and Git conflict resolution when using Pulser as your deployment platform. It covers semantic versioning, automated version bumping, and handling complex merge conflicts.

## Table of Contents

1. [Semantic Versioning Strategy](#semantic-versioning-strategy)
2. [Automated Version Bumping](#automated-version-bumping)
3. [Git Conflict Resolution](#git-conflict-resolution)
4. [Common Conflict Scenarios](#common-conflict-scenarios)
5. [Pulser Agents for Version Management](#pulser-agents-for-version-management)
6. [Best Practices](#best-practices)

## Semantic Versioning Strategy

### Version Format: MAJOR.MINOR.PATCH

```
1.2.3
│ │ └── PATCH: Bug fixes, minor updates
│ └──── MINOR: New features, backward compatible
└────── MAJOR: Breaking changes
```

### When to Increment Each Version

#### Patch Version (x.x.X)

Increment when you make backward-compatible bug fixes:

- Fix typos in documentation
- Fix bugs that don't change API
- Performance improvements
- Security patches that don't break compatibility

```bash
# Example: 1.2.3 → 1.2.4
pulser invoke MayaPlan bump-version --type=patch
```

#### Minor Version (x.X.0)

Increment when you add functionality in a backward-compatible manner:

- New features that don't break existing APIs
- New optional parameters
- Deprecation warnings (without removing features)
- New components or modules

```bash
# Example: 1.2.4 → 1.3.0
pulser invoke MayaPlan bump-version --type=minor
```

#### Major Version (X.0.0)

Increment when you make incompatible API changes:

- Breaking changes to public APIs
- Removal of deprecated features
- Major architectural changes
- Changes that require user migration

```bash
# Example: 1.3.0 → 2.0.0
pulser invoke MayaPlan bump-version --type=major
```

### Prerelease Versions

For testing and preview releases:

```bash
# Beta release: 1.3.0-beta.1
pulser invoke MayaPlan bump-version --type=prerelease --tag=beta

# Alpha release: 2.0.0-alpha.1
pulser invoke MayaPlan bump-version --type=prerelease --tag=alpha

# Release candidate: 2.0.0-rc.1
pulser invoke MayaPlan bump-version --type=prerelease --tag=rc
```

## Automated Version Bumping

### 1. Pulser Version Bump Workflow

```bash
# Analyze commits to determine version bump type
pulser invoke Caca analyze-commits --since=last-release

# Plan version bump based on analysis
pulser invoke MayaPlan plan-version-bump

# Execute version bump
pulser invoke BasherExec bump-version
```

### 2. Automated Version Files Update

**Files typically updated during version bump:**

- `package.json`
- `package-lock.json`
- `CHANGELOG.md`
- Version constants in source code
- API documentation
- Docker tags
- Helm charts

**Pulser configuration for version management:**

```yaml
# pulser.yaml
version_management:
  files_to_update:
    - path: 'package.json'
      pattern: '"version": ".*"'

    - path: 'package-lock.json'
      pattern: '"version": ".*"'

    - path: 'src/constants/version.ts'
      pattern: 'export const VERSION = ".*"'

    - path: 'docker-compose.yml'
      pattern: 'image: myapp:.*'

    - path: 'helm/Chart.yaml'
      pattern: 'version: .*'

  changelog:
    format: 'keep-a-changelog'
    sections:
      - Added
      - Changed
      - Deprecated
      - Removed
      - Fixed
      - Security
```

### 3. Version Bump Script

```javascript
// scripts/bump-version.js
const fs = require('fs');
const { execSync } = require('child_process');

async function bumpVersion(type) {
  // Update package.json
  execSync(`npm version ${type} --no-git-tag-version`);

  // Get new version
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const newVersion = pkg.version;

  // Update other files
  const updates = [
    {
      file: 'src/constants/version.ts',
      content: `export const VERSION = "${newVersion}";`,
    },
    {
      file: 'docker-compose.yml',
      regex: /image: myapp:.*/g,
      replacement: `image: myapp:${newVersion}`,
    },
  ];

  updates.forEach(update => {
    if (update.content) {
      fs.writeFileSync(update.file, update.content);
    } else if (update.regex) {
      const content = fs.readFileSync(update.file, 'utf8');
      fs.writeFileSync(update.file, content.replace(update.regex, update.replacement));
    }
  });

  console.log(`✅ Version bumped to ${newVersion}`);
  return newVersion;
}
```

## Git Conflict Resolution

### 1. Common Conflict Types

#### Package Lock Conflicts

**Scenario**: Multiple branches modify dependencies

```bash
# Typical conflict in package-lock.json
<<<<<<< HEAD
  "version": "1.2.3",
  "resolved": "https://registry.npmjs.org/package/-/package-1.2.3.tgz",
=======
  "version": "1.2.4",
  "resolved": "https://registry.npmjs.org/package/-/package-1.2.4.tgz",
>>>>>>> feature-branch
```

**Resolution with Pulser:**

```bash
# Let Pulser handle package-lock conflicts
pulser invoke Patcha resolve-package-lock-conflicts

# Or manually regenerate
rm package-lock.json
pulser invoke BasherExec install
```

#### Version File Conflicts

**Scenario**: Version bumped in multiple branches

```bash
# Resolve version conflicts intelligently
pulser invoke Claudia resolve-version-conflicts \
  --strategy=highest \
  --files="package.json,src/constants/version.ts"
```

#### Schema Migration Conflicts

**Scenario**: Database schema changes in parallel branches

```sql
-- Branch A adds column
ALTER TABLE users ADD COLUMN last_login TIMESTAMP;

-- Branch B adds different column
ALTER TABLE users ADD COLUMN preferences JSONB;
```

**Resolution:**

```bash
# Analyze and merge schema changes
pulser invoke MayaPlan merge-schema-migrations \
  --source=feature-a \
  --target=feature-b \
  --output=merged-migration.sql
```

### 2. Pulser Conflict Resolution Workflow

```bash
# Step 1: Detect conflicts
pulser invoke Caca detect-merge-conflicts

# Step 2: Analyze conflict complexity
pulser invoke MayaPlan analyze-conflicts --output=json

# Step 3: Auto-resolve simple conflicts
pulser invoke Patcha auto-resolve-conflicts --safe-only

# Step 4: Manual resolution for complex conflicts
pulser invoke Claudia guide-conflict-resolution

# Step 5: Validate resolution
pulser invoke BasherExec test:conflict-validation
```

### 3. Advanced Conflict Resolution Strategies

#### Strategy 1: Theirs/Ours for Specific Files

```bash
# Always use 'theirs' for generated files
git checkout --theirs package-lock.json
git add package-lock.json

# Always use 'ours' for changelog
git checkout --ours CHANGELOG.md
git add CHANGELOG.md
```

#### Strategy 2: Three-Way Merge with Pulser

```yaml
# .pulser/merge-config.yaml
merge_strategies:
  package-lock.json:
    strategy: 'regenerate'
    command: 'npm install'

  '*.generated.ts':
    strategy: 'regenerate'
    command: 'npm run generate'

  CHANGELOG.md:
    strategy: 'combine'
    order: 'chronological'

  'version.ts':
    strategy: 'interactive'
    prompt: true
```

#### Strategy 3: Semantic Merge

```bash
# Use semantic understanding for code conflicts
pulser invoke Caca semantic-merge \
  --language=typescript \
  --base=main \
  --head=feature-branch
```

## Common Conflict Scenarios

### 1. Release Branch Conflicts

**Scenario**: Hotfix applied to production while develop has moved ahead

```bash
# Create merge strategy
pulser invoke MayaPlan plan-release-merge \
  --hotfix=hotfix/critical-fix \
  --develop=develop \
  --main=main

# Execute merge plan
pulser invoke BasherExec execute-merge-plan
```

### 2. Feature Branch Rebase

**Scenario**: Long-running feature branch needs updates from main

```bash
# Safe rebase with Pulser
pulser invoke MayaPlan rebase-safely \
  --branch=feature/large-refactor \
  --onto=main \
  --conflict-strategy=auto-resolve
```

### 3. Dependency Update Conflicts

**Scenario**: Multiple branches update different dependencies

```javascript
// Pulser resolution script
{
  "resolution_rules": {
    "dependencies": {
      "strategy": "merge-unique",
      "conflict_resolution": "latest-version",
      "validation": "install-and-test"
    },
    "devDependencies": {
      "strategy": "merge-all",
      "deduplication": true
    }
  }
}
```

## Pulser Agents for Version Management

### 1. MayaPlan - Version Strategy

```yaml
# Version planning capabilities
capabilities:
  - analyze_commit_history
  - determine_version_bump_type
  - plan_release_strategy
  - coordinate_multi_branch_releases

commands:
  plan-release:
    description: 'Plan next release based on changes'
    analyze:
      - commit_messages
      - changed_files
      - breaking_changes
      - feature_additions
```

### 2. Caca - Change Analysis

```yaml
# Change analysis for versioning
analysis_patterns:
  breaking_changes:
    - 'BREAKING CHANGE:'
    - 'BREAKING:'
    - 'BC:'
    - '!:' # Conventional commits

  features:
    - 'feat:'
    - 'feature:'
    - 'add:'

  fixes:
    - 'fix:'
    - 'bugfix:'
    - 'patch:'
```

### 3. Patcha - Automated Resolution

```yaml
# Conflict resolution patterns
auto_resolvable:
  - package_lock_conflicts
  - simple_version_bumps
  - whitespace_conflicts
  - import_order_conflicts

resolution_strategies:
  package_lock:
    method: 'regenerate'
    validation: 'npm ci'

  version_constants:
    method: 'use_highest'
    validation: 'build'
```

### 4. Claudia - Intelligent Routing

```yaml
# Conflict complexity routing
routing_rules:
  simple_conflicts:
    handler: 'Patcha'
    auto_resolve: true

  complex_conflicts:
    handler: 'Human'
    guidance: 'MayaPlan'

  critical_conflicts:
    handler: 'Emergency'
    escalation: true
```

## Best Practices

### 1. Version Bump Checklist

```markdown
## Pre-Version Bump Checklist

- [ ] All tests passing
- [ ] Changelog updated
- [ ] Documentation current
- [ ] Breaking changes documented
- [ ] Migration guide prepared (if major)
- [ ] Dependencies updated
- [ ] Security audit passed
```

### 2. Conflict Prevention

```bash
# Regular sync with main branch
pulser invoke MayaPlan sync-branch-daily

# Pre-merge conflict check
pulser invoke Caca pre-merge-check --target=main

# Feature flag conflicts
pulser invoke Claudia check-feature-flags
```

### 3. Emergency Procedures

```bash
# Conflict during release
pulser invoke MayaPlan emergency-conflict-resolution \
  --priority=high \
  --deadline=1h

# Rollback bad merge
pulser invoke BasherExec git-rollback \
  --to=last-known-good \
  --preserve-history
```

### 4. Team Workflows

```yaml
# .pulser/team-config.yaml
conflict_resolution:
  owners:
    'package*.json': ['@dev-ops']
    'src/': ['@frontend-team']
    'api/': ['@backend-team']

  escalation:
    timeout: 30m
    default_resolver: 'tech-lead'

  automation:
    auto_resolve_threshold: 0.8 # 80% confidence
    require_review: true
```

## Version Lifecycle Example

```bash
# 1. Start feature branch
git checkout -b feature/new-dashboard
pulser invoke MayaPlan track-feature --name=new-dashboard

# 2. Development with regular syncs
pulser invoke Claudia daily-sync --auto-resolve

# 3. Pre-merge preparation
pulser invoke Caca pre-merge-analysis
pulser invoke Patcha fix-conflicts

# 4. Merge and version bump
git checkout main
git merge feature/new-dashboard
pulser invoke MayaPlan bump-version --analyze-commits

# 5. Release
pulser invoke BasherExec release --version=auto

# 6. Post-release
pulser invoke MayaPlan prepare-next-cycle
```

## Troubleshooting

### Common Issues and Solutions

| Issue                          | Cause                  | Solution                   |
| ------------------------------ | ---------------------- | -------------------------- |
| Package-lock conflicts persist | Different npm versions | Standardize npm version    |
| Version mismatch after merge   | Manual version edits   | Use Pulser for all bumps   |
| Schema conflicts               | Parallel migrations    | Use numbered migrations    |
| Lost changes after resolve     | Wrong merge strategy   | Use Pulser conflict backup |

### Debug Commands

```bash
# Show conflict analysis
pulser invoke Caca show-conflicts --verbose

# Test merge result
pulser invoke BasherExec test-merge --dry-run

# Verify version consistency
pulser invoke MayaPlan verify-versions --all-files
```

---

**Maintained by**: Platform Engineering Team  
**Last Updated**: January 6, 2025  
**Pulser Version**: 2.1.0
