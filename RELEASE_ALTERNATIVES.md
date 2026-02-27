## Alternative: Simple Manual Release Workflow

If you prefer a **simpler approach without semantic-release**, you can use this alternative workflow that creates releases based on manual version tags.

### Option 1: Manual Tag-Based Release (Simplest)

Instead of using the semantic-release workflow, you can manually tag releases:

```bash
# Make your changes and commit
git add .
git commit -m "feat: add new feature"

# Create an annotated tag (this triggers release)
git tag -a v1.1.0 -m "Release version 1.1.0"

# Push to trigger release workflow
git push origin main
git push origin v1.1.0
```

Then use this simple workflow:

**.github/workflows/release-simple.yml:**
```yaml
name: 📦 Create Release from Tag

on:
  push:
    tags:
      - 'v*'

permissions:
  contents: write

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - name: 📥 Checkout code
        uses: actions/checkout@v4

      - name: 🏷️ Get version from tag
        id: tag_name
        run: |
          echo "version=${GITHUB_REF#refs/tags/}" >> $GITHUB_OUTPUT

      - name: 📝 Generate changelog
        id: changelog
        run: |
          git log --oneline $(git describe --tags --abbrev=0 2>/dev/null || echo 'HEAD~10')..HEAD > CHANGELOG_TEMP.txt
          cat CHANGELOG_TEMP.txt

      - name: 🚀 Create Release
        uses: softprops/action-gh-release@v1
        with:
          tag_name: ${{ steps.tag_name.outputs.version }}
          body_path: CHANGELOG_TEMP.txt
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### Option 2: Commit-Based Simple Release

Another simple approach using conventional commits but without semantic-release complexity:

Create `.github/workflows/release-auto.yml`:
```yaml
name: 🚀 Auto Release

on:
  push:
    branches:
      - main
    paths-ignore:
      - 'docs/**'
      - 'README.md'

permissions:
  contents: write

jobs:
  release:
    runs-on: ubuntu-latest
    
    steps:
      - name: 📥 Checkout
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: 📊 Check for version change
        id: version
        run: |
          # Get last tag
          LAST_TAG=$(git describe --tags --abbrev=0 2>/dev/null || echo "v0.0.0")
          LAST_VERSION=${LAST_TAG#v}
          
          # Check commit messages for keywords
          COMMITS=$(git log $LAST_TAG..HEAD --oneline)
          
          if echo "$COMMITS" | grep -q "BREAKING CHANGE"; then
            MAJOR=$((${LAST_VERSION%%.*} + 1))
            NEW_VERSION="$MAJOR.0.0"
          elif echo "$COMMITS" | grep -q -E "^feat"; then
            MINOR=$((${LAST_VERSION#*.} | cut -d. -f1))
            MINOR=$((MINOR + 1))
            MAJOR=${LAST_VERSION%%.*}
            NEW_VERSION="$MAJOR.$MINOR.0"
          elif echo "$COMMITS" | grep -q -E "^fix|^perf"; then
            PATCH=$((${LAST_VERSION##*.} + 1))
            NEW_VERSION="${LAST_VERSION%.*}.$PATCH"
          else
            echo "skip=true" >> $GITHUB_OUTPUT
            exit 0
          fi
          
          echo "version=$NEW_VERSION" >> $GITHUB_OUTPUT

      - name: 🚀 Release
        if: steps.version.outputs.skip != 'true'
        uses: softprops/action-gh-release@v1
        with:
          tag_name: v${{ steps.version.outputs.version }}
          generate_release_notes: true
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### Recommended Approach

**Use the semantic-release setup** (.github/workflows/release.yml) because it:
- ✅ Automatically determines version bumps
- ✅ Generates professional changelogs
- ✅ Updates package.json version
- ✅ Manages release history
- ✅ Follows industry standards
- ✅ Less manual work

Only use manual/simple approaches if you:
- Prefer full control over version numbers
- Don't want automation
- Have a small team with clear release schedule
