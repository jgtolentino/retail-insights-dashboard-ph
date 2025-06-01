# Changelog

All notable changes to Pulser will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-06-01

### Added

- Initial release of Pulser AI-powered task runner
- **BasherExec Agent** - Shell command execution with structured output
- **Caca Agent** - Intelligent error analysis with regex pattern matching
- **MayaPlan Agent** - AI-powered feature planning for React/TypeScript projects
- **Claudia Agent** - GitHub PR comment integration with Octokit
- Agent-based architecture with YAML configuration
- Composite task support for CI/CD pipelines
- Debug logging with `PULSER_LOG_LEVEL=debug`
- Comprehensive test suite with Vitest
- NPM package with global CLI installation
- React/TypeScript project structure awareness

### Features

- Task execution with intelligent error handling
- AI-generated implementation plans with dependency tracking
- Automatic GitHub PR comment posting
- Enhanced error suggestions for common development issues
- Support for TypeScript, React Hooks, Tailwind CSS, ESLint patterns
- Command-line shortcuts: `pulser plan "feature"`, `pulser post-plan`
- Environment variable configuration
- Cross-platform compatibility (Node.js 18+)

### Error Patterns Supported

- Command not found (exit code 127)
- Node.js module resolution errors
- Network connectivity issues (ENOTFOUND, ECONNREFUSED)
- TypeScript `any` type warnings
- React Hooks rule violations
- Build tool configuration errors (Tailwind, ESLint)
- Syntax errors and permission issues
- Port conflicts and Git repository errors

### Agent Capabilities

- **BasherExec**: Execute any shell command with stdout/stderr/exitCode capture
- **Caca**: 10+ error pattern categories with actionable fix suggestions
- **MayaPlan**: Generate 3-7 subtasks per feature with proper React conventions
- **Claudia**: Format and post Markdown checklists to GitHub PRs

### Documentation

- Complete README with usage examples
- Agent development guide
- Testing framework documentation
- Configuration reference
- Contributing guidelines

### Testing

- Unit tests for all agents
- Integration tests for full pipeline
- Mocked GitHub API testing
- Error pattern validation
- Cross-platform compatibility tests

## [Unreleased]

### Planned

- Plugin system for custom agents
- VS Code extension integration
- Slack/Discord notification support
- Advanced dependency analysis
- Performance metrics and reporting
- CI/CD platform integrations (GitHub Actions, GitLab CI)
- Multi-language support beyond React/TypeScript
