# 🚀 Automated Release & Versioning Guide

This project uses **Semantic Release** with **Conventional Commits** for automated version management and GitHub releases.

## How It Works

Every time you push code to `main` or `master` branch:

1. ✅ GitHub Actions automatically runs
2. 📊 Analyzes your commit messages (conventional commits format)
3. 🔢 Determines version bump needed (MAJOR.MINOR.PATCH)
4. 📝 Generates changelog automatically
5. 🏷️ Creates a new Git tag
6. 🚀 Publishes a GitHub release

**Version Bumping Rules:**
- `BREAKING CHANGE` or `feat!:` → **MAJOR** version bump (1.0.0 → 2.0.0)
- `feat:` → **MINOR** version bump (1.0.0 → 1.1.0)
- `fix:`, `perf:` or `patch:` → **PATCH** version bump (1.0.0 → 1.0.1)
- Other types → **No release** (docs, chore, style, test, etc.)

## Conventional Commits Format

Write your commit messages following this format:

```
type(scope): subject

body

footer
```

### Examples

**New Feature:**
```
feat(auth): add Google sign-in authentication

This allows users to sign in using their Google account.
Implements OAuth 2.0 flow with proper error handling.
```

**Bug Fix:**
```
fix(footer): correct release badge alignment on mobile

Fixes the badge display issue on screens smaller than 768px.
```

**Breaking Change:**
```
feat(api)!: change webhook response format

BREAKING CHANGE: The GitHub webhook response format has changed from
{success: boolean} to {status: 'ok'|'error', message: string}

All clients must update their parsing logic.
```

**Performance Improvement:**
```
perf(database): optimize release query with indexing

Reduces query time from 500ms to 50ms by adding database index.
```

**Documentation:**
```
docs: add GitHub Actions setup instructions
```

**Code Cleanup (No Release):**
```
refactor(components): simplify Footer component structure

Improved code readability without changing functionality.
```

### Commit Message Keywords

| Type       | Description                          | Version Impact |
|-----------|--------------------------------------|-----------------|
| `feat`    | New feature                         | MINOR ↑         |
| `fix`     | Bug fix                             | PATCH ↑         |
| `perf`    | Performance improvement             | PATCH ↑         |
| `patch`   | Minor patch update                  | PATCH ↑         |
| `docs`    | Documentation changes               | None            |
| `style`   | Code style (no logic change)        | None            |
| `refactor`| Code refactoring (no logic change)  | None            |
| `test`    | Test additions/changes              | None            |
| `chore`   | Build, CI, dependencies, etc.       | None            |
| `ci`      | CI/CD configuration                 | None            |
| `revert`  | Reverts a previous commit           | PATCH ↑         |

### Scope (Optional)

Common scopes for this project:
- `auth` - Authentication features
- `api` - API endpoints
- `components` - React components
- `footer` - Footer component
- `database` - Database operations
- `webhook` - Webhook functionality
- `ui` - UI improvements
- `performance` - Performance optimizations

## Git Commit Best Practices

### ✅ Good Commits

```bash
git commit -m "feat(chat): add message search functionality"
git commit -m "fix(resources): resolve download link validation"
git commit -m "perf(api): cache frequently accessed resources"
```

### ❌ Bad Commits

```bash
git commit -m "fixed stuff"           # Too vague
git commit -m "WIP"                   # Unclear
git commit -m "asdfasdf"              # Meaningless
git commit -m "update"                # Missing type
git commit -m "Feature add login"     # Wrong format
```

## Squashing Commits

If you're working on a feature branch with multiple commits, squash them into one meaningful commit:

```bash
git rebase -i main
# Mark commits as 'squash' (s) except the first one (keep as 'pick')
# Write a meaningful commit message
git push --force-with-lease
```

## Pull Request Guidelines

When creating a PR:

1. **Use a descriptive title** following the conventional commit format
   ```
   feat(notifications): add real-time notification badges
   ```

2. **Describe your changes** in the PR description
3. **Reference issues** if applicable: `Closes #123`
4. **Ensure commits follow conventional format** before merging

Example PR description:
```markdown
## Description
Implements real-time notification badges in the header.

## Related Issue
Closes #123

## Type of Change
- [x] New feature
- [ ] Bug fix
- [ ] Refactoring
- [ ] Documentation update

## Testing
- [x] Tested on desktop
- [x] Tested on mobile
- [x] No console errors
```

## Workflow Files

### 1. `.github/workflows/release.yml`
Main semantic release workflow. Triggers on push to `main`/`master`.
- Analyzes commit messages
- Bumps version automatically
- Creates release

### 2. `.github/workflows/release-drafter.yml`
Supplements semantic release with better changelog generation.
- Creates draft releases
- Organizes changes by category
- Generates formatted changelog

### 3. `.releaserc.json`
Configuration for semantic-release behavior.
- Defines which commit types trigger releases
- Configures changelog format
- Sets up Git commit messages

### 4. `.github/release-drafter.yml`
Configuration for release drafter.
- Defines release name template
- Categorizes changes
- Formats changelog

## GitHub Setup

### Prerequisites

Ensure your GitHub repository has:

1. **Branch Protection** on `main`/`master` (optional but recommended)
   - Settings → Branches → Branch protection rules
   - Require pull request reviews

2. **GitHub Actions Enabled**
   - Settings → Actions → Allow all actions

3. **Proper Permissions**
   - The `GITHUB_TOKEN` is automatically available in all workflows

## Manual Release (if needed)

If you need to manually create a release:

1. Go to GitHub repo → Releases
2. Click "Draft a new release"
3. Use version format: `v1.0.0` (semantic versioning)
4. Add description following changelog format
5. Publish release

The webhook in your code will automatically detect and save it!

## Troubleshooting

### Release not created?

1. Check if commits follow conventional format
2. Verify commits were pushed to `main`/`master`
3. Check Actions tab for workflow run details:
   - Click the failed run
   - Scroll to "Release" step
   - Check error messages

### Wrong version bumped?

Commits are analyzed in order. Ensure your most recent commits follow the correct format.

### Want to skip release?

Add `[skip ci]` to commit message:
```bash
git commit -m "docs: update README [skip ci]"
```

## Semantic Versioning Reference

```
MAJOR.MINOR.PATCH
 1  .  2  .  3

- MAJOR (1): Breaking changes, incompatible API changes
- MINOR (2): New features, backward compatible
- PATCH (3): Bug fixes, backward compatible
```

Example progression:
- `v1.0.0` → (feat) → `v1.1.0`
- `v1.1.0` → (fix) → `v1.1.1`
- `v1.1.1` → (breaking change) → `v2.0.0`

## Resources

- [Conventional Commits](https://www.conventionalcommits.org/)
- [Semantic Versioning](https://semver.org/)
- [Semantic Release](https://semantic-release.gitbook.io/)
- [Angular Commit Guidelines](https://github.com/angular/angular/blob/master/CONTRIBUTING.md#-commit-message-guidelines)
