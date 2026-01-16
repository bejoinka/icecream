# Agent Instructions

This project uses **bd** (beads) for issue tracking. Run `bd onboard` to get started.

## Quick Reference

```bash
bd ready              # Find available work
bd show <id>          # View issue details
bd update <id> --status in_progress  # Claim work
bd close <id>         # Complete work
bd sync               # Sync with git
```

## Landing the Plane (Session Completion)

**When ending a work session**, you MUST complete ALL steps below. Work is NOT complete until `git push` succeeds.

**MANDATORY WORKFLOW:**

1. **File issues for remaining work** - Create issues for anything that needs follow-up
2. **Run quality gates** (if code changed) - Tests, linters, builds
3. **Update issue status** - Close finished work, update in-progress items
4. **PUSH TO REMOTE** - This is MANDATORY:
   ```bash
   git pull --rebase
   bd sync
   git push
   git status  # MUST show "up to date with origin"
   ```
5. **Clean up** - Clear stashes, prune remote branches
6. **Verify** - All changes committed AND pushed
7. **Hand off** - Provide context for next session

**CRITICAL RULES:**
- Work is NOT complete until `git push` succeeds
- NEVER stop before pushing - that leaves work stranded locally
- NEVER say "ready to push when you are" - YOU must push
- If push fails, resolve and retry until it succeeds


---

## Planning Agent (Rule of 3)

When acting as a **planning agent** (launched via `scripts/plan-feature.sh`), apply the **Rule of 3** to decompose work into non-overlapping, independently testable units. The goal is to **eliminate merge conflicts** by ensuring workers touch distinct files.

### Pass 1: Decomposition

Break the feature into discrete work units. For each unit:
- Define a clear, testable deliverable
- List the files it will create or modify
- Estimate complexity (small/medium/large)

### Pass 2: Dependency Analysis

Identify ordering constraints between units:
- Which units must complete before others can start?
- Are there shared interfaces or types that need to exist first?

Create beads and set dependencies:
```bash
bd create "Unit A: Create shared types" --priority 1
bd create "Unit B: Implement feature X" --priority 2
bd create "Unit C: Implement feature Y" --priority 2
bd dep add <unit-b-id> <unit-a-id>  # B depends on A
bd dep add <unit-c-id> <unit-a-id>  # C depends on A
```

### Pass 3: Conflict Assessment

For each work unit, verify no file overlap with other units:

| Unit | Files Modified |
|------|----------------|
| A    | src/types/foo.ts |
| B    | src/features/bar.ts, src/components/Bar.tsx |
| C    | src/features/baz.ts, src/components/Baz.tsx |

**If overlap is found:**
1. Refactor the decomposition to eliminate overlap, OR
2. Add dependency constraints so overlapping work is sequential, OR
3. Document the expected merge strategy if overlap is unavoidable

### Planning Output

After all three passes:
1. Create beads with `bd create` for each work unit
2. Set dependencies with `bd dep add`
3. Ensure each bead is independently testable
4. Run `bd sync` to persist
5. Report the beads created and how many workers can run in parallel

---

## Worker Agent (Worktree Mode)

When acting as a **worker agent** (launched via `scripts/start-worker.sh`), you are operating in a dedicated git worktree on your own branch.

### Your Environment

- **Worktree**: `.worktrees/<feature>-w<N>` (e.g., `.worktrees/awl-4000-w1`)
- **Your branch**: `<feature>-w<N>` (e.g., `awl-4000-w1`)
- **Parent branch**: `<feature>` (e.g., `awl-4000`)
- **Beads database**: Shared with main repo via redirect file

### Workflow

#### 1. Find and Claim Work

```bash
bd ready                              # See available unblocked issues
bd show <id>                          # Get full context
bd update <id> --status in_progress   # Claim the issue
```

Pick ONE issue at a time. Don't claim multiple.

#### 2. Do the Work

- Make small, focused commits
- Reference bead ID in commit messages:
  ```bash
  git commit -m "implement parser for X (bd-abc123)"
  ```
- Add notes as you discover things:
  ```bash
  bd note <id> "Found edge case: need to handle empty input"
  ```

#### 3. Complete the Issue

```bash
bd close <id> --reason "completed: brief summary of what was done"
bd sync
git push -u origin <your-branch>
```

#### 4. Integrate Back to Feature Branch

**Preferred: Rebase** (cleaner history)
```bash
git fetch origin
git rebase origin/<feature-branch>
# If conflicts, resolve them, then: git rebase --continue
git push --force-with-lease
```

**Alternative: Cherry-pick** (if rebase is complex)
```bash
# From the feature branch directory (not worktree):
git checkout <feature-branch>
git cherry-pick <your-commit-sha>
bd sync
git push
```

#### 5. Pick Next Work or Exit

If `bd ready` shows more available work, go back to step 1.
If no work or blocked, report status and exit cleanly.

### Landing the Plane (Worker Edition)

Before ending your session, ensure:
```bash
bd sync                    # Persist issue state
git status                 # No uncommitted changes
git push                   # Your branch is pushed
```

Report what you completed and any issues for follow-up.
