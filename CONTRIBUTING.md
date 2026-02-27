# 🤝 Contributing Guide

Thank you for contributing to ESTT Community! This guide helps you understand our development workflow and best practices.

## Quick Start

1. **Fork & Clone**
   ```bash
   git clone https://github.com/abdelhakim-sahifa/ESTT-community.git
   cd ESTT-community
   ```

2. **Create Feature Branch**
   ```bash
   git checkout -b feature/my-feature
   # or
   git checkout -b fix/my-bug-fix
   ```

3. **Make Changes**
   - Write clean, readable code
   - Follow existing code style
   - Add comments for complex logic

4. **Commit with Conventional Format**
   ```bash
   git commit -m "feat(component): add new feature"
   git commit -m "fix(api): resolve endpoint issue"
   ```
   See [RELEASE_PROCESS.md](./RELEASE_PROCESS.md) for detailed commit guidelines.

5. **Push & Create Pull Request**
   ```bash
   git push origin feature/my-feature
   ```
   - Add descriptive PR title
   - Describe your changes
   - Reference related issues

6. **Wait for Review**
   - Address feedback
   - Merge when approved

## Commit Message Format

**IMPORTANT:** All commits must follow [Conventional Commits](https://www.conventionalcommits.org/) format:

```
type(scope): short description

Longer explanation if needed.
Reference issue #123.
```

### Types:
- `feat:` - New feature
- `fix:` - Bug fix
- `perf:` - Performance improvement
- `docs:` - Documentation
- `style:` - Code formatting
- `refactor:` - Code structure changes
- `test:` - Test additions
- `chore:` - Dependencies, build scripts, etc.

### Examples:
```bash
git commit -m "feat(chat): add message reactions"
git commit -m "fix(footer): correct badge alignment"
git commit -m "docs: update setup instructions"
```

## Code Style

- Use existing code patterns as reference
- Follow project's Tailwind CSS conventions
- Use meaningful variable/function names
- Add JSDoc comments for functions

## Before Submitting PR

- [ ] Commit messages follow conventional format
- [ ] Code tested locally
- [ ] No console errors
- [ ] Responsive design verified (mobile, tablet, desktop)
- [ ] PR description is clear
- [ ] Related issues are referenced

## Help & Questions

- Open an [Issue](https://github.com/abdelhakim-sahifa/ESTT-community/issues)
- Check existing issues/discussions first
- Use clear titles and descriptions

---

See [RELEASE_PROCESS.md](./RELEASE_PROCESS.md) for how automated releases work!
