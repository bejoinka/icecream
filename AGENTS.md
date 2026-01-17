# Agent Instructions

This project uses **bd** (beads) for issue tracking. Run `bd onboard` to get started.

## Required Reading for Content Work

Before creating any player-facing content (UI copy, events, dialogue, descriptions), you MUST read:

1. **[FACT_SHEET.md](./FACT_SHEET.md)** - Core design principles and ethical guardrails
2. **[TONE_AND_LANGUAGE_GUIDE.md](./TONE_AND_LANGUAGE_GUIDE.md)** - Voice, style, and language rules

Key principles from the tone guide:
- **Satire punches up** — target systems and power, never victims
- **Educational, not instructional** — teach rights, not evasion tactics
- **Systemic framing** — failure feels political, not personal
- **Opacity by design** — consequences before causes
- **Restraint** — avoid exclamation points, superlatives, and emotional manipulation

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

## Content Generation

When creating any written content for the game—UI copy, event descriptions, dialogue, satirical framing, or page content—you MUST follow the **[TONE_AND_LANGUAGE_GUIDE.md](./TONE_AND_LANGUAGE_GUIDE.md)**.

### Before Writing Content

1. Read TONE_AND_LANGUAGE_GUIDE.md completely
2. Identify the content type (UI Microcopy, Event Description, Dialogue, or Satirical Framing)
3. Apply the appropriate voice and register from the guide

### Content Checklist

Before finalizing any content, verify using the guide's checklist:

- [ ] Does this punch up at systems, not down at victims?
- [ ] Is this educational rather than instructional?
- [ ] Does failure feel political, not personal?
- [ ] Does the player discover meaning, or is it handed to them?
- [ ] Would this work in a documentary about bureaucratic violence?
- [ ] Is the satire deadpan, not winking?
- [ ] Are we showing restraint with trauma?

If any answer is "no," revise before shipping.

---

## Planning Agent (Rule of 3)

### Required Reading (MANDATORY)

Before doing ANY planning work, you MUST read and understand:

1. **[FACT_SHEET.md](./FACT_SHEET.md)** - Core game design, non-negotiables, tone, and ethical guardrails
2. **[TONE_AND_LANGUAGE_GUIDE.md](./TONE_AND_LANGUAGE_GUIDE.md)** - Voice, language register, and content standards (required for content work)

This is non-negotiable. Plans that violate the design principles in FACT_SHEET.md will be rejected.

---

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

### Pass 4: Create Review Task

Every plan MUST include a **review task** as the final step. This task:
- Depends on ALL other work units (runs last)
- Validates completed work against project requirements

Create the review task:
```bash
bd create "Review: Validate work against FACT_SHEET" --type task --priority 1
bd dep add <review-id> <unit-a-id>  # Review depends on all units
bd dep add <review-id> <unit-b-id>
bd dep add <review-id> <unit-c-id>
# ... add dependency for every work unit
```

The review task description MUST include:
1. **Epic reference** - Link to the parent epic/feature being implemented
2. **Required reading list** - Always includes FACT_SHEET.md, plus any other docs relevant to this feature
3. **Review checklist** - Specific items to verify based on the work planned

Example review task description:
```
## Review: [Feature Name]

### Required Reading (MANDATORY)
- [ ] FACT_SHEET.md - Core design principles and ethical guardrails
- [ ] TONE_AND_LANGUAGE_GUIDE.md - Voice and language standards (for content work)
- [ ] [Epic ID] - Parent epic with full context
- [ ] [Any other relevant docs listed in the epic]

### Review Checklist
- [ ] Satire punches up at systems, not at victims
- [ ] Educational, not instructional - teaches rights, not evasion
- [ ] Systemic framing - failure feels political, not personal
- [ ] No violations of ethical guardrails
- [ ] Content follows TONE_AND_LANGUAGE_GUIDE voice and register (if applicable)
- [ ] Implementation matches epic requirements
- [ ] Code quality and test coverage adequate

### If Issues Found
Create follow-up issues for any violations or gaps discovered.
```

### Planning Output

After all four passes:
1. Create beads with `bd create` for each work unit
2. Set dependencies with `bd dep add`
3. Ensure each bead is independently testable
4. **Create the review task that depends on all work units**
5. Run `bd sync` to persist
6. Report the beads created and how many workers can run in parallel

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

---

## Reviewer Agent (Review Tasks)

When you pick up a **review task** (identified by "Review:" prefix), you are acting as a quality gate for completed work.

### Required Reading (MANDATORY)

Before reviewing, you MUST read ALL of the following in order:

1. **[FACT_SHEET.md](./FACT_SHEET.md)** - Core game design, non-negotiables, tone, and ethical guardrails
2. **[TONE_AND_LANGUAGE_GUIDE.md](./TONE_AND_LANGUAGE_GUIDE.md)** - Voice, language register, and content standards (for content reviews)
3. **The parent epic** - Use `bd show <epic-id>` to get full context on what was planned
4. **Any additional docs listed in the review task description**

Do NOT skip this step. You cannot review work you don't understand.

### Review Workflow

#### 1. Gather Context

```bash
bd show <review-task-id>           # Get the review task with checklist
bd show <epic-id>                   # Read the parent epic
```

Read FACT_SHEET.md and any other documents listed in the review task.

#### 2. Review the Completed Work

For each work unit that was completed:
- Read the code changes (use `git log` and `git diff` against the base branch)
- Verify the implementation matches the epic requirements
- Check against FACT_SHEET.md principles:
  - **Satire punches up** - Does it target systems/power, not victims?
  - **Educational, not instructional** - Does it teach rights, not evasion tactics?
  - **Systemic framing** - Does failure feel political/structural, not personal?
  - **Opacity by design** - Do players experience consequences before causes?
  - **Ethical guardrails** - Any violations of the non-negotiables?

#### 3. Document Findings

If issues are found:
```bash
bd create "Fix: [describe violation]" --type bug --priority 1
bd note <review-task-id> "Found issue: [brief description], created follow-up [new-issue-id]"
```

If no issues:
```bash
bd note <review-task-id> "Review passed. All work aligns with FACT_SHEET requirements."
```

#### 4. Complete the Review

```bash
bd close <review-task-id> --reason "Review complete: [passed/N issues filed]"
bd sync
git push
```

### Review Verdicts

- **PASSED** - All work aligns with FACT_SHEET.md and epic requirements
- **PASSED WITH NOTES** - Minor issues documented but not blocking
- **FAILED** - Violations found, follow-up issues created, work should not ship until resolved
