# Contributing

Thanks for your interest in accessible-ui! This is a small, focused library — every contribution counts.

## Code of Conduct

Be respectful. This is a learning project as much as a library. Assume good intent.

## What we need help with

- **New components** following WAI-ARIA APG patterns (Select, Menu, Dialog non-modal, Disclosure, etc.)
- **Test coverage** — edge cases, browser-specific quirks, screen reader behavior
- **Documentation** — clearer READMEs, more Storybook stories, migration guides
- **Bug reports** — especially screen reader-specific issues

## Before you start

Open an issue or a discussion to propose the change. Small bug fixes and test additions don't need prior discussion — just open a PR.

## Development setup

```bash
npm install
npm run dev          # Vite dev server
npm test             # Run tests
npm run test:watch   # Watch mode
npm run storybook    # Storybook dev server
npm run typecheck    # TypeScript check
npm run lint         # ESLint
```

## PR guidelines

1. **One component per PR** — keeps reviews focused
2. **Tests first or at least included** — every component has 3 test layers (rendering, keyboard, axe). Match the pattern.
3. **Follow the APG pattern** — link to the WAI-ARIA pattern in the PR description
4. **No styles in components** — this is a headless library. Demo styles go in Storybook stories.
5. **Document decisions** — if the APG offers multiple valid approaches, document which one you chose and why (see existing component READMEs)

## Testing expectations

- All existing tests must pass
- New components need the 3-layer test suite (rendering, keyboard, axe)
- Edge case tests are welcome in `*.edge.test.tsx` files
- `npm run build` must succeed

## Release process

Maintainers handle releases. We follow semver:

- **Patch** — bug fixes, test additions, documentation
- **Minor** — new components, new features
- **Major** — breaking API changes

## Questions?

Open a discussion or an issue. No question is too small.
