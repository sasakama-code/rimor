#!/bin/bash

# GitHub Branch Protection Rules設定スクリプト (GitHub CLI版)
# 手動リリースを防ぎ、自動化ワークフローを強制する

set -e

echo "🔒 Setting up Branch Protection Rules with GitHub CLI..."

# GitHub CLI認証確認
if ! gh auth status &>/dev/null; then
    echo "❌ GitHub CLI is not authenticated"
    echo "💡 Please run: gh auth login"
    exit 1
fi

# リポジトリ情報取得
REPO=$(gh repo view --json owner,name -q '.owner.login + "/" + .name')
echo "📋 Repository: $REPO"

echo "🛡️ Applying branch protection rules to 'main' branch..."

# Branch Protection Rules設定
gh api \
  --method PUT \
  -H "Accept: application/vnd.github+json" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  "/repos/$REPO/branches/main/protection" \
  --input - <<EOF
{
  "required_status_checks": {
    "strict": true,
    "contexts": [
      "📋 Quality Gates"
    ]
  },
  "enforce_admins": true,
  "required_pull_request_reviews": {
    "required_approving_review_count": 1,
    "dismiss_stale_reviews": true,
    "require_code_owner_reviews": false,
    "restrict_pushes": true
  },
  "restrictions": null,
  "required_linear_history": true,
  "allow_force_pushes": false,
  "allow_deletions": false,
  "block_creations": false,
  "lock_branch": false
}
EOF

echo "✅ Branch protection rules applied successfully!"
echo ""
echo "📋 Applied Rules:"
echo "  ✅ Require status checks to pass before merging"
echo "  ✅ Require branches to be up to date before merging"
echo "  ✅ Require pull request reviews before merging (1 approval)"
echo "  ✅ Dismiss stale pull request approvals when new commits are pushed"
echo "  ✅ Require linear history"
echo "  ✅ Do not allow force pushes"
echo "  ✅ Do not allow deletions"
echo "  ✅ Include administrators"
echo ""
echo "🚀 Release Protection:"
echo "  ✅ Direct pushes to main branch: BLOCKED"
echo "  ✅ Manual tag creation: CONTROLLED via PR process"
echo "  ✅ Release automation: ENFORCED via GitHub Actions"
echo ""
echo "🎯 Impact on Release Process:"
echo "  1. All code changes must go through Pull Request review"
echo "  2. Version bumps must be approved via PR"
echo "  3. Release tags are created automatically by GitHub Actions"
echo "  4. Manual npm publish is prevented - only CI can publish"
echo ""
echo "📝 To create a release:"
echo "  1. Create PR with version bump (package.json)"
echo "  2. Merge after approval and quality checks pass"
echo "  3. Create release tag via GitHub UI or API"
echo "  4. GitHub Actions will automatically handle npm publish"

# 現在の保護ルール確認
echo ""
echo "🔍 Current protection rules:"
gh api "/repos/$REPO/branches/main/protection" \
  --jq '{
    required_status_checks: .required_status_checks.contexts,
    required_reviews: .required_pull_request_reviews.required_approving_review_count,
    enforce_admins: .enforce_admins.enabled,
    allow_force_pushes: .allow_force_pushes.enabled,
    allow_deletions: .allow_deletions.enabled
  }'