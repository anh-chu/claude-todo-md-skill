# todo-md (Claude Code skill)

A [Claude Code](https://claude.com/claude-code) skill for managing a repo-local
`TODO.md` file that is **co-owned by a [pi](https://www.npmjs.com/package/@mariozechner/pi-coding-agent)
coding agent** running the [`pi-todo-md`](https://www.npmjs.com/package/pi-todo-md) extension.

The point is **zero format drift**: every change Claude makes is byte-identical to what
pi would write, so the two agents can work on the same `TODO.md` without clobbering each
other's formatting. It does this by driving all mutations through pi's own engine
(the exact same `executeTodoActionOnFile` code path pi uses) instead of hand-editing.

## Requirements

- [pi-todo-md](https://www.npmjs.com/package/pi-todo-md) installed (`pi install npm:pi-todo-md`).
  The skill reuses pi's engine; it does not reimplement the format.
- Node.js >= 20.

## Install

With the [`skills`](https://github.com/vercel-labs/skills) CLI (installs `SKILL.md`
and the `todo.mjs` helper together):

```bash
npx skills add anh-chu/claude-todo-md-skill -g -a claude-code
```

Or clone directly into your Claude Code skills directory:

```bash
git clone https://github.com/anh-chu/claude-todo-md-skill.git ~/.claude/skills/todo-md
```

That's it. Start Claude Code in a project and just ask:

- `Show me the current todo list`
- `Add a task to publish the plugin, high priority`
- `Mark task #3 as done`
- `Focus task #2 and add a note to publish after docs land`
- `Archive completed tasks`

## How it resolves pi's engine

`todo.mjs` finds pi's `pi-todo-md` engine in this order:

1. `PI_TODO_MD_SRC` env var, if set (path to `pi-todo-md/src/todo-md.js`)
2. Node module resolution of `pi-todo-md/src`
3. Default pi install path: `~/.pi/agent/npm/node_modules/pi-todo-md/src/todo-md.js`

## License

MIT. The `pi-todo-md` engine it calls is MIT-licensed by its authors and is not vendored here.
