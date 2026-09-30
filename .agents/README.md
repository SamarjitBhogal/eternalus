# .agents

Cross-tool agent assets. `skills/` holds one pointer stub per skill so that Codex, Gemini
CLI/Antigravity and Cursor discover the same skills as Claude Code; the procedures themselves
live in `.claude/skills/<name>/SKILL.md` (canonical, maintained in one place). Instruction
files: `AGENTS.md` (root and per package). Setup per tool: `docs/agents/tool-setup.md`.
