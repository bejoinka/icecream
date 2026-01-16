# Project Context

This is a dark satirical survival RPG game project (working title TBD). Before making any changes, you MUST read and understand the project's design documents.

## Required Reading (Read These First)

Before doing ANY work in this repo, read these documents in order:

1. **[FACT_SHEET.md](./FACT_SHEET.md)** - Core game design, non-negotiables, tone, and ethical guardrails
2. **[TONE_AND_LANGUAGE_GUIDE.md](./TONE_AND_LANGUAGE_GUIDE.md)** - Voice, language register, and content standards for all written content
3. **[SYSTEMS_PULSES_AND_EVENTS.md](./SYSTEMS_PULSES_AND_EVENTS.md)** - Technical spec for the city/neighborhood pulse system
4. **[CITY_PROFILING_BRIEF_AGENT_INSTRUCTIONS.md](./CITY_PROFILING_BRIEF_AGENT_INSTRUCTIONS.md)** - Instructions for city profiling work
5. **[AGENTS.md](./AGENTS.md)** - Workflow and session completion requirements

## Key Design Principles

- Satire punches up at systems, never at victims
- Educational, not instructional - teaches rights and tradeoffs, not evasion tactics
- Systemic framing - failure feels political and structural, not personal
- Opacity by design - players experience consequences before causes

## Issue Tracking

This project uses **beads** for issue tracking. See [AGENTS.md](./AGENTS.md) for workflow details.

```bash
bd ready              # Find available work
bd show <id>          # View issue details
bd update <id> --status in_progress  # Claim work
bd close <id>         # Complete work
bd sync               # Sync with git
```

## Session Completion

Work is NOT complete until `git push` succeeds. Always run:

```bash
bd sync && git push
```
