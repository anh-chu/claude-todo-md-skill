#!/usr/bin/env node
// Thin wrapper around the installed pi-todo-md engine so Claude's edits to
// TODO.md are byte-identical to what a pi agent running the extension writes.
// Reuses pi's own locateTodoFile + executeTodoActionOnFile (same code path).

import { homedir } from "node:os";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";

// Resolve pi's own todo-md engine so our writes are byte-identical to pi's.
// Order: explicit env var -> node module resolution -> default pi install path.
function resolveEngine() {
  if (process.env.PI_TODO_MD_SRC) return process.env.PI_TODO_MD_SRC;
  try {
    return createRequire(import.meta.url).resolve("pi-todo-md/src");
  } catch {
    return `${homedir()}/.pi/agent/npm/node_modules/pi-todo-md/src/todo-md.js`;
  }
}

const SRC = resolveEngine();

let engine;
try {
  engine = await import(pathToFileURL(SRC).href);
} catch (error) {
  console.error(
    `Could not load the pi-todo-md engine (tried: ${SRC}).\n` +
      `Install it with \`pi install npm:pi-todo-md\`, or set PI_TODO_MD_SRC to the path of pi-todo-md/src/todo-md.js.\n` +
      String(error),
  );
  process.exit(1);
}

const { locateTodoFile, executeTodoActionOnFile } = engine;

const action = process.argv[2];
if (!action) {
  console.error('Usage: node todo.mjs <action> \'{"id":3,...}\'');
  process.exit(1);
}

let params = {};
if (process.argv[3]) {
  try {
    params = JSON.parse(process.argv[3]);
  } catch {
    console.error("Second argument must be valid JSON.");
    process.exit(1);
  }
}

const todoPath = await locateTodoFile(process.cwd());

try {
  const result = await executeTodoActionOnFile(todoPath, { ...params, action });
  console.log(result.message);
  console.log(
    `\n[path: ${result.details.path} | changed: ${result.changed} | written: ${result.details.written}]`,
  );
} catch (error) {
  console.error(String(error.message || error));
  process.exit(1);
}
