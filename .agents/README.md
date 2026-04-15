# .agents

This folder contains planning and agent-oriented project context for the travel insurance operations portal.

## Structure

- `plans/`
  - canonical project planning documents
  - `plan.md` is the main delivery and phase plan
  - `architecture.md` is the main system architecture reference

- `tasks.yml`
  - current execution-oriented checklist for implementation
  - can be updated as scope gets refined

- `agents/`
  - reserved for role-specific instructions or operating notes if the project later needs them

- `skills/`
  - reserved for repeatable project-specific workflows, conventions, or implementation guides

## Usage

- Keep architecture and planning decisions in `plans/`
- Keep short-term implementation tracking in `tasks.yml`
- Add role- or workflow-specific guidance later only if it becomes useful

This setup is intentionally lighter than larger agent-heavy repos. It keeps one source of truth without over-structuring the project too early.
