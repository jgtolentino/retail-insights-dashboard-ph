# 🔒 Branch Protection Setup Guide for retail-insights-dashboard-ph

This guide will help you lock down your **main** branch to prevent direct pushes and require PR reviews.

## 📍 Quick Links

- **Rulesets Page**: https://github.com/jgtolentino/retail-insights-dashboard-ph/settings/rules
- **General Settings**: https://github.com/jgtolentino/retail-insights-dashboard-ph/settings

## 🛡️ Step 1: Create Branch Protection Ruleset

1. Go to: https://github.com/jgtolentino/retail-insights-dashboard-ph/settings/rules

2. Click **"New ruleset"** → **"New branch ruleset"**

3. Configure the ruleset:

   **Ruleset name**: `Protect main`

   **Enforcement status**: ✅ Active

   **Target branches**:
   - Click "Add target" 
   - Select "Include by pattern"
   - Enter: `main`
   - Add pattern

4. **Configure Rules** (check these boxes):

   ### 🔴 Critical Rules:
   - ✅ **Restrict deletions** - Prevent branch deletion
   - ✅ **Restrict force pushes** - Prevent force pushes
   - ✅ **Restrict creations** - Only allow branch creation via PR
   
   ### 📝 Review Requirements:
   - ✅ **Require a pull request before merging**
     - Required approvals: `1`
     - ✅ Dismiss stale pull request approvals when new commits are pushed
     - ✅ Require review from CODEOWNERS (if you have a CODEOWNERS file)
   
   ### ✅ Status Checks:
   - ✅ **Require status checks to pass**
     - ✅ Require branches to be up to date before merging
     - Add these status checks (if available):
       - `Vercel – retail-insights-dashboard-ph`
       - `build`
       - Any other CI/CD checks

   ### 🔒 Additional Protections:
   - ✅ **Block force pushes**
   - ✅ **Require linear history** (optional - enforces clean commit history)
   - ✅ **Require deployments to succeed** (if using deployment environments)

5. Scroll down and click **"Create"**

## 🚫 Step 2: Disable Auto-Merge

1. Go to: https://github.com/jgtolentino/retail-insights-dashboard-ph/settings

2. Scroll to **"Pull Requests"** section

3. Under **"Allow merge commits"**, ensure these are UNCHECKED:
   - ❌ **Allow auto-merge**
   - ❌ **Automatically delete head branches** (optional, but recommended to keep for history)

4. Click **"Save"**

## 🤖 Step 3: Configure Claude/Lovable Settings

### For Claude Code CLI:
- Claude Code CLI respects GitHub branch protection by default
- It will create PRs but cannot merge them without approval

### For Lovable (if using):
1. Open your Lovable project
2. Click Settings (gear icon)
3. Find "GitHub Integration" or "Automations"
4. Turn OFF "Automatically merge approved revisions"
5. Save settings

## 📋 Verification Checklist

After setup, verify these behaviors:

- [ ] Direct pushes to main are blocked
- [ ] Creating a PR to main requires at least 1 review
- [ ] Force pushes to main are prevented
- [ ] Vercel preview deployments still work on PRs
- [ ] Production deployments only happen after merge to main

## 🧪 Test Your Protection

Try this command (it should fail):
```bash
git checkout main
echo "test" > test.txt
git add test.txt
git commit -m "test direct push"
git push origin main
```

Expected result: 
```
remote: error: GH006: Protected branch update failed
```

## 🔑 Emergency Override

If you need to temporarily bypass (use with extreme caution):

1. Go to the ruleset settings
2. Change enforcement from "Active" to "Disabled" 
3. Make your changes
4. Re-enable immediately after

## 📚 Additional Resources

- [GitHub Rulesets Documentation](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/about-rulesets)
- [Branch Protection Best Practices](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets)

---

**Remember**: These protections help prevent accidental deployments and ensure code quality. They're your safety net! 🎯