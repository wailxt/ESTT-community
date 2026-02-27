# ⚡ Quick Start: Automated Releases

## Setup (5 minutes)

### Step 1: Install Dependencies
```bash
npm install --save-dev semantic-release @semantic-release/changelog @semantic-release/git
```

### Step 2: Commit & Push
```bash
git add .
git commit -m "ci: configure automatic releases with semantic-release"
git push origin main
```

That's it! 🎉

## Now, Every Time You Push:

### Standard Feature
```bash
git commit -m "feat(notifications): add desktop notifications"
git push  # → Creates v1.1.0 (MINOR bump)
```

### Bug Fix
```bash
git commit -m "fix(loader): resolve infinite loading state"
git push  # → Creates v1.0.1 (PATCH bump)
```

### Breaking Change (Major Version)
```bash
git commit -m "feat(api)!: redesign webhook response format

BREAKING CHANGE: Response format changed from {...} to {...}"
git push  # → Creates v2.0.0 (MAJOR bump)
```

## Check GitHub

1. Go to your repo → **Releases** tab
2. See automatically generated release
3. Changelog auto-generated from commits

## Key Files Created

| File | Purpose |
|------|---------|
| `.github/workflows/release.yml` | Main automation |
| `.github/workflows/test.yml` | Run tests before release |
| `.releaserc.json` | Semantic release config |
| `RELEASE_PROCESS.md` | Detailed guide |
| `CONTRIBUTING.md` | For contributors |

## Common Commit Formats

| Commit | Result |
|--------|--------|
| `feat: add feature` | MINOR bump |
| `fix: resolve bug` | PATCH bump |
| `feat!: breaking change` | MAJOR bump |
| `docs: update readme` | No bump |
| `refactor: improve code` | No bump |

See [RELEASE_PROCESS.md](./RELEASE_PROCESS.md) for complete details!
