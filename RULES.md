# rules.md

## 1) Terminal Environment Rules (PowerShell First)

**IMPORTANT:** The terminal environment is assumed to be **PowerShell on Windows**.

### Command Compatibility

* Never use **CMD syntax** inside PowerShell.
* Always prefer **native PowerShell commands**.
* Verify PowerShell syntax before executing any command.
* Avoid using aliases when clarity matters.

### Preferred Commands

* Use `Get-ChildItem` instead of `dir /s /b`
* Use `Remove-Item` instead of `del /q`
* Use `Copy-Item` instead of `copy`
* Use `Move-Item` instead of `move`
* Use `Set-Location` instead of `cd` when writing reusable scripts
* Use `Select-String` instead of `findstr`

### Path Rules

* Always use **quoted paths** when spaces may exist.
* Prefer **absolute paths** for destructive operations.
* Validate that the target path exists before deleting or moving files.

### Safe Execution

* For delete, rename, or overwrite operations:

  1. Confirm the target path
  2. Preview affected files
  3. Execute the command
* Use `-WhatIf` when testing risky commands.
* Use `-Force` only when necessary.

---

## 2) Experience Logging Rules

The file `experience.md` stores lessons learned from previous tasks.

### Read Before Work

* Before starting a task, check `experience.md` for similar past issues.
* Reuse proven solutions when relevant.

### Write After Work

* After each completed task, add a short lesson learned to `experience.md`.
* If the task provides no meaningful insight, logging may be skipped.

### What Should Be Logged

Write only **high-value experience**, such as:

* repeated mistakes
* debugging shortcuts
* better workflows
* faster commands
* framework-specific fixes
* common user preferences
* project structure lessons

### What Should NOT Be Logged

Do not log:

* trivial one-time mistakes
* obvious syntax fixes
* temporary environment issues
* duplicate lessons already documented

---

## 3) File Editing Rules

* Preserve the existing project structure.
* Never rewrite a full file when a targeted patch is enough.
* Keep formatting style consistent with the existing codebase.
* Do not rename files unless required.
* Before editing, understand the purpose of the file.

### For Markdown Files

* Use clear heading hierarchy (`#`, `##`, `###`)
* Keep bullet formatting consistent
* Use fenced code blocks for commands
* Keep instructions concise and actionable

---

## 4) Debugging Rules

* Fix the **root cause**, not just the symptom.
* Read the full error message before changing code.
* Check imports, paths, and naming first.
* Prefer minimal fixes over large refactors.
* If multiple solutions exist, choose the most maintainable one.

### Error Workflow

1. Reproduce the issue
2. Locate the failing file/line
3. Identify the real cause
4. Apply the smallest safe fix
5. Verify the result
6. Log useful learning in `experience.md`

---

## 5) Decision-Making Rules

* Prefer solutions that are:

  1. readable
  2. maintainable
  3. reusable
  4. safe

* If unsure, inspect the existing project conventions first.

* Follow the current stack and architecture.

* Avoid introducing new dependencies unless necessary.

---

## 6) Continuous Improvement Rules

* If a better workflow is discovered, document it in `experience.md`.
* Convert repeated manual steps into reusable commands or scripts.
* Improve future speed through better documentation.
* Learn from every failure pattern.

---

## 7) Agent Behavior Rules

* When corrected by the user, update behavior immediately.
* Treat repeated mistakes as a high-priority experience log.
* Use previous failures to avoid regression.
* Optimize for reliability over speed.

---

## 8) Quality Checklist Before Finishing

Before marking a task complete:

* [ ] PowerShell syntax is valid
* [ ] File paths are correct
* [ ] Only necessary files were changed
* [ ] The fix addresses the root cause
* [ ] Useful lessons were added to `experience.md`
* [ ] No duplicate experience entries were added
