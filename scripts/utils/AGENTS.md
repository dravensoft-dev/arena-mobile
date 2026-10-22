# scripts/utils/

Flat, with no domain directories, because a domain states the vocabulary a module speaks and a
util speaks none. `walkFiles` takes a directory and a predicate, `readJson` takes a path, and
neither names a layer, a contract, a token, a phase or a repository.

**The test is what the module would have to import.** A util imports `node:` builtins and
another util and nothing else, so one reaching for `scripts/lib/arena/repo-root.ts` or for anything under
`lib/contracts/` is a `lib/` module sitting in the wrong directory.

| module | answers |
| --- | --- |
| `scripts/utils/captured.ts` | `captured(match, index)`, the one read of a regex capture group, which fails at the read where `?? ''` would hand a lost group on as an empty string |
| `scripts/utils/compare.ts` | `byCodeUnit(a, b)` and `sortedByCodeUnit(values)`, the only ordering that reaches a file |
| `scripts/utils/main-module.ts` | `isMainModule(url, argv)`, so importing a script does none of its work |
| `scripts/utils/posix-path.ts` | `toPosix(value)`, `relPosix(from, to, path)`, `isInside(base, candidate, path)` |
| `scripts/utils/read-json.ts` | `readJson(path)` |
| `scripts/utils/walk-files.ts` | `walkFiles(dir, keep, base)`, which is how absence is decided by walking rather than by probing a constructed path |

`walkFiles` returning an empty array for a directory that is not there is deliberate and is
also the trap: a gate that treats that as "nothing violates the rule" reports a clean pass over
a tree it never opened. Every gate reading it pairs the call with an explicit zero-result
failure, and [`scripts/check/AGENTS.md`](../check/AGENTS.md) says why.
