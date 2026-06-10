---
name: todo-md
description: Read and edit a repo-local TODO.md file that is shared with a pi coding agent running the pi-todo-md extension. Use whenever the user asks to view, add, check off, prioritize, focus, note, reorder, archive, or otherwise manage tasks/todos in TODO.md. Keeps the file fully compatible with pi so both agents can co-op on the same file.
---

# todo-md

Manage a repo-local `TODO.md` that is **co-owned by a pi coding agent** running the
`pi-todo-md` extension. The goal is zero format drift: every change you make must be
byte-identical to what pi would write, so the two agents never fight over the file.

To guarantee that, **do not hand-edit TODO.md for mutations.** Drive all changes
through `todo.mjs`, which calls pi's own engine (the exact same `executeTodoActionOnFile`
code path pi uses). Reading is fine to do directly.

## Usage

`todo.mjs` lives in this skill's own directory (the same directory as this
SKILL.md). Run it with that path — `$SKILL_DIR/todo.mjs` below stands for that
directory (e.g. `~/.claude/skills/todo-md/` for a global install, or
`.claude/skills/todo-md/` for a project install). Run from the directory where the
work is happening (the `TODO.md` is auto-located: nearest one up the tree, else
created at the git repo root):

```bash
node "$SKILL_DIR/todo.mjs" <action> '<json-params>'
```

`<action>` is positional; the JSON object holds the rest of the params. Examples:

```bash
node "$SKILL_DIR/todo.mjs" list
node "$SKILL_DIR/todo.mjs" add '{"text":"publish the plugin","priority":"high"}'
node "$SKILL_DIR/todo.mjs" bulk_add '{"items":["write docs","record demo","publish"]}'
node "$SKILL_DIR/todo.mjs" add '{"text":"triage bug","section":"In Progress","index":1}'
node "$SKILL_DIR/todo.mjs" check '{"id":3}'
node "$SKILL_DIR/todo.mjs" focus_task '{"id":2}'
node "$SKILL_DIR/todo.mjs" set_priority '{"id":2,"priority":"high"}'
node "$SKILL_DIR/todo.mjs" append_note '{"id":2,"text":"publish after docs land"}'
node "$SKILL_DIR/todo.mjs" add_subtask '{"id":2,"text":"write README"}'
node "$SKILL_DIR/todo.mjs" check_subtask '{"id":2,"subtask":1}'
node "$SKILL_DIR/todo.mjs" move '{"id":3,"section":"In Progress"}'
node "$SKILL_DIR/todo.mjs" archive_done
```

Output ends with `[path: ... | changed: ... | written: ...]` so you can confirm the
file and whether anything actually changed.

## Actions

| Action | Required | Optional | Description |
|---|---|---|---|
| `list` | — | `section` | Show the task list |
| `list_focused` | — | — | Show focused tasks |
| `next_task` | — | `section` | Recommend the next open task |
| `create_section` | `section` | — | Create a section |
| `rename_section` | `section` | `targetSection` | Rename a section |
| `remove_section` | `section` | `targetSection` | Remove a section (move tasks to `targetSection` if non-empty) |
| `move_section` | `section`, `index` | — | Reorder a section (1-based) |
| `add` | `text` | `section`, `index` | Add one task |
| `bulk_add` | `items` (array) | `section`, `index` | Add many tasks |
| `check` / `uncheck` | `id` | — | Toggle a task done |
| `rename` | `id`, `text` | — | Change task text |
| `focus_task` / `unfocus_task` | `id` | — | Toggle active working set |
| `set_priority` | `id`, `priority` | — | `low` / `medium` / `high` |
| `clear_priority` | `id` | — | Remove priority |
| `set_note` / `append_note` | `id`, `text` | — | Replace / append note lines |
| `clear_note` | `id` | — | Remove notes |
| `add_subtask` | `id`, `text` | — | Add a subtask |
| `check_subtask` / `uncheck_subtask` / `remove_subtask` | `id`, `subtask` | — | Subtask ops (`subtask` is 1-based) |
| `archive_done` | — | `section` | Move completed tasks to `Archive` |
| `remove` | `id` | — | Delete a task |
| `move` | `id` | `section`, `index` | Move a task |
| `prioritize` | `id` | `section` | Move a task to the top of a section |

`index` and `subtask` are **1-based**. `id` is the stable number shown in `list`
(stored in a hidden `<!-- pi-todo-md:id=N -->` comment).

## File format (for reading)

When you read TODO.md directly, this is the canonical shape the engine maintains:

```md
# TODO
<!-- pi-todo-md:schema=1 -->

## Tasks
- [ ] ship the plugin [focus] [high] <!-- pi-todo-md:id=1 -->
  - note: publish after trusted publishing works
  - [ ] write docs
  - [x] publish package
- [x] read the docs <!-- pi-todo-md:id=2 -->

## In Progress
- [ ] package it for sharing <!-- pi-todo-md:id=3 -->

## Archive
- [x] initial release <!-- pi-todo-md:id=4 -->
```

- `[focus]` then priority (`[low|medium|high]`) are the metadata markers, in that order.
- Notes use `  - note: ...`; subtasks use `  - [ ] ...` (two-space indent, no id).
- `Archive` is special: focus/next ignore it. Default section is `Tasks`.
- The hidden `id` and `schema` comments must be preserved — that's how pi keeps IDs
  stable. The CLI handles all of this; never renumber or strip markers by hand.

## Co-op notes

- Pi rewrites the whole file in canonical form on each of its actions. Because this CLI
  uses the same engine, your writes match exactly, so diffs stay minimal and neither
  agent clobbers the other's formatting.
- Before a batch of edits, `list` first to get current IDs (pi may have changed them).
- For a quick glance you may `cat`/Read TODO.md, but route every mutation through the CLI.
