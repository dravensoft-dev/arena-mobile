## What this changes

<!-- One sentence. If it raises the contract pin, say which version and why. -->

## Which half it belongs to

- [ ] A translation: how a contract value becomes a native one, a unit, a theme, a density
- [ ] Tooling: the generator, a gate, the graph, a workflow
- [ ] Documentation
- [ ] Something else

A **value** belongs upstream in Arena and not here. `CONTRIBUTING.md` says why, and what a
change here is not allowed to break.

## Evidence

```
bun run build
bun run check
```

Paste the summary line. `check:kotlin` and `check:swift` report SKIP unless the host carries
a JDK and Xcode, and the run reports INCOMPLETE when they do; the workflow proves both.

- [ ] `bun run check` reports no failure on this host
- [ ] No emitted file is edited by hand
- [ ] Every new gate is registered, has a suite beside it, and declares a node
