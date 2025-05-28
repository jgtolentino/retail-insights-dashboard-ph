# 🔧 Bulk PR Management Guide

This guide provides quick commands to manage multiple pull requests efficiently.

## 📋 Quick Commands

### Using the Custom Script (Recommended)
```bash
# Show current PR status
./scripts/bulk-pr-management.sh status

# List all open PRs
./scripts/bulk-pr-management.sh list

# Close all open PRs (with confirmation)
./scripts/bulk-pr-management.sh close-all

# Merge all open PRs (with confirmation)
./scripts/bulk-pr-management.sh merge-all

# Show help
./scripts/bulk-pr-management.sh help
```

### Using GitHub CLI Directly

#### 1. **Bulk-Close All Open PRs**
```bash
# Get list and close each PR
gh pr list --state open --json number \
  | jq -r '.[].number' \
  | xargs -P4 -I% gh pr close %
```

#### 2. **Bulk-Merge All Open PRs**
```bash
# Merge with squash and delete branches
gh pr list --state open --json number \
  | jq -r '.[].number' \
  | xargs -P4 -I% gh pr merge % --squash --delete-branch --yes
```

#### 3. **List Open PRs with Details**
```bash
# Basic list
gh pr list --state open

# Detailed JSON format
gh pr list --state open --json number,title,author,createdAt
```

## ⚙️ Command Options

### Parallel Processing
- `-P4` runs 4 operations in parallel
- Adjust number based on your preference (e.g., `-P2` for 2 parallel)

### Merge Options
- `--squash` - Squash commits into single commit
- `--merge` - Regular merge
- `--rebase` - Rebase and merge
- `--delete-branch` - Delete source branch after merge
- `--yes` - Skip confirmation prompts

### Filter Options
```bash
# PRs by author
gh pr list --author "@me"

# PRs with specific label
gh pr list --label "bug"

# Draft PRs
gh pr list --draft

# Recent PRs (last 30)
gh pr list --limit 30
```

## 🛡️ Safety Features

### The Custom Script Includes:
- ✅ **Confirmation prompts** before bulk operations
- ✅ **Status checks** before executing commands
- ✅ **Color-coded output** for better visibility
- ✅ **Error handling** for edge cases
- ✅ **Help documentation** built-in

### Best Practices:
1. **Always review** PRs before bulk operations
2. **Use `status` command** to check current state
3. **Test with `list`** before bulk actions
4. **Consider using `--draft`** flag for work-in-progress PRs

## 📊 Current Repository Status

Run this to see your current PR status:
```bash
./scripts/bulk-pr-management.sh status
```

## 🔍 Troubleshooting

### If GitHub CLI isn't working:
```bash
# Check authentication
gh auth status

# Re-authenticate if needed
gh auth login

# Refresh credentials
gh auth refresh
```

### If jq isn't installed:
```bash
# macOS
brew install jq

# Ubuntu/Debian
sudo apt install jq

# Windows (via Chocolatey)
choco install jq
```

---

**💡 Pro Tip:** Use the custom script (`./scripts/bulk-pr-management.sh`) for safer operations with built-in confirmations!