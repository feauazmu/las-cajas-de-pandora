## Agent skills

### Issue tracker

Issues live as markdown files under `.scratch/<feature>/`. See `docs/agents/issue-tracker.md`.

### Triage labels

Five canonical roles, label strings equal to role names (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `CONTEXT.md` and `docs/adr/` at the repo root. See `docs/agents/domain.md`.

## Language

- Everything agent- and developer-facing is **English**: code, identifiers, comments, commit messages, docs, specs, issues, `CONTEXT.md`, ADRs, and agent replies.
- The **player-facing** game text (UI strings, item names, flavor text) is **Spanish**.
- The user may write in Spanish; answer in English.
