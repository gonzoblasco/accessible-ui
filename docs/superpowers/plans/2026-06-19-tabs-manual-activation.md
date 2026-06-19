# Tabs: Manual Activation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the existing Tabs component from automatic activation (arrows select tab) to manual activation (arrows move focus only; Enter/Space activate).

**Architecture:** The `List` keyboard handler stops calling `setActiveId` on arrow keys and instead only moves DOM focus; a new `onKeyDown` on `Tab` handles Enter/Space to activate. Focus tracking uses `document.activeElement` so we don't need a separate `focusedId` state.

**Tech Stack:** React 19, TypeScript, Vitest + Testing Library + jest-axe

## Global Constraints

- Framework: React 19 with TypeScript (strict)
- Test runner: Vitest with jsdom environment, globals enabled
- Setup file: `src/test/setup.ts` already extends `expect` with `toHaveNoViolations` and `@testing-library/jest-dom`
- All tests run with: `npm test` (vitest run)
- Files to modify: `src/components/tabs/tabs.tsx`, `src/components/tabs/tabs.test.tsx`, `src/components/tabs/README.md`
- Do NOT modify: `src/components/tabs/use-tabs.ts` (no state changes needed)
- Headless: default className fallbacks exist but are irrelevant to this feature
- WAI-ARIA pattern: manual activation from APG https://www.w3.org/WAI/ARIA/apg/patterns/tabs/

---

### Task 1: Implement manual activation in tabs.tsx

**Files:**
- Modify: `src/components/tabs/tabs.tsx`

**Interfaces:**
- Consumes: `UseTabsReturn` from `use-tabs.ts` — specifically `activeId`, `setActiveId`, `tabs`, `orientation`, `getTabId`, `getPanelId`
- Produces: updated `Tabs.List` and `Tabs.Tab` components with manual activation semantics

**Current behavior (automatic):**
In `List.handleKeyDown`, when `nextIdx !== null` the code calls BOTH `setActiveId(nextTab.id)` AND `document.getElementById(getTabId(nextTab.id))?.focus()`.

**Required behavior (manual):**
- Arrow keys (Left/Right/Up/Down), Home, End: call `.focus()` ONLY — do NOT call `setActiveId`
- Focus tracking: compute `currentIdx` from `document.activeElement` (not from `activeId`), so focus can drift from the active tab
- Enter/Space: activate the focused tab — add `onKeyDown` on `Tab` that calls `setActiveId(id)` and `e.preventDefault()`
- `tabindex` remains based on `activeId` (0 for active, -1 for others) — when focus drifts via arrows the browser holds it because `.focus()` was called programmatically; when Tab key leaves and returns, focus goes back to the active tab (tabindex=0), which is correct

- [ ] **Step 1: Update `List.handleKeyDown` to use document.activeElement and skip setActiveId**

Replace the entire `handleKeyDown` function in `List` with:

```tsx
const handleKeyDown = useCallback(
  (e: KeyboardEvent<HTMLDivElement>) => {
    const enabledTabs = tabs.filter((t) => !t.disabled)

    const isHorizontal = orientation === 'horizontal'
    const prevKey = isHorizontal ? 'ArrowLeft' : 'ArrowUp'
    const nextKey = isHorizontal ? 'ArrowRight' : 'ArrowDown'

    const focusedEl = document.activeElement
    const currentIdx = enabledTabs.findIndex(
      (t) => document.getElementById(getTabId(t.id)) === focusedEl,
    )
    if (currentIdx === -1) return

    let nextIdx: number | null = null

    if (e.key === nextKey) {
      nextIdx = (currentIdx + 1) % enabledTabs.length
    } else if (e.key === prevKey) {
      nextIdx = (currentIdx - 1 + enabledTabs.length) % enabledTabs.length
    } else if (e.key === 'Home') {
      nextIdx = 0
    } else if (e.key === 'End') {
      nextIdx = enabledTabs.length - 1
    }

    if (nextIdx !== null) {
      e.preventDefault()
      document.getElementById(getTabId(enabledTabs[nextIdx].id))?.focus()
    }
  },
  [orientation, tabs, getTabId],
)
```

Note: `setActiveId` is removed from the dependency array and is no longer called here.

- [ ] **Step 2: Add Enter/Space handler to `Tab` component**

Add an `onKeyDown` prop to the `<button>` in `Tab`:

```tsx
function Tab({ id, children, className, disabled }: TabProps) {
  const { activeId, setActiveId, getTabId, getPanelId } = useTabsContext()
  const isActive = activeId === id

  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      setActiveId(id)
    }
  }

  return (
    <button
      id={getTabId(id)}
      role="tab"
      type="button"
      aria-selected={isActive}
      aria-controls={getPanelId(id)}
      tabIndex={isActive ? 0 : -1}
      disabled={disabled}
      onClick={() => !disabled && setActiveId(id)}
      onKeyDown={handleKeyDown}
      className={
        className ??
        [
          'px-4 py-2 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet-600',
          isActive
            ? 'border-b-2 border-violet-600 text-violet-600'
            : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200',
          disabled ? 'cursor-not-allowed opacity-40' : '',
        ].join(' ')
      }
    >
      {children}
    </button>
  )
}
```

Import `KeyboardEvent` from react at the top (it's already imported for the List handler — just add `HTMLButtonElement` usage).

- [ ] **Step 3: Run tests to see which ones fail (expected)**

```bash
cd /Users/gonzoblasco/Projects/pr01 && npm test -- --reporter=verbose 2>&1 | tail -60
```

Expected: several keyboard tests fail because they assert `aria-selected` changes on arrow keys. That is the expected baseline — Task 2 will fix the tests.

- [ ] **Step 4: Commit the implementation**

```bash
cd /Users/gonzoblasco/Projects/pr01 && git add src/components/tabs/tabs.tsx && git commit -m "feat(tabs): switch to manual activation — arrows move focus, Enter/Space activate"
```

---

### Task 2: Update tests to match manual activation semantics

**Files:**
- Modify: `src/components/tabs/tabs.test.tsx`

**Interfaces:**
- Consumes: updated `tabs.tsx` from Task 1

**Manual activation semantics to test:**
- ArrowRight/Left/Home/End: assert `.toHaveFocus()` on target tab, assert `aria-selected` did NOT change on the previously-active tab
- Enter: after focusing a different tab via ArrowRight, pressing Enter should change `aria-selected` and show the new panel
- Space: same as Enter

**Current tests that need updating (they assert aria-selected changes on arrows — wrong for manual):**
- `'ArrowRight moves to next tab'` — assert focus moved but NOT aria-selected
- `'ArrowRight wraps to first tab from last'` — assert focus moved only  
- `'ArrowLeft moves to previous tab'` — assert focus moved only
- `'Home moves to first tab'` — assert focus moved only
- `'End moves to last tab'` — assert focus moved only
- `'vertical orientation uses ArrowUp/Down'` — assert focus moved only
- `'skips disabled tab on ArrowRight'` — assert focus moved only
- `'skips disabled tab on ArrowLeft'` — assert focus moved only

**New tests to add:**
- Enter activates the focused tab (changes panel)
- Space activates the focused tab (changes panel)
- After ArrowRight + Enter: original tab loses aria-selected, new tab gains it, panel updates

- [ ] **Step 1: Write all updated and new tests**

Replace the full content of `src/components/tabs/tabs.test.tsx` with:

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'jest-axe'
import { describe, expect, it } from 'vitest'
import { Tabs } from './tabs'
import { useTabs, type TabItem } from './use-tabs'

const TABS: TabItem[] = [
  { id: 'one', label: 'One' },
  { id: 'two', label: 'Two' },
  { id: 'three', label: 'Three' },
]

const TABS_WITH_DISABLED: TabItem[] = [
  { id: 'one', label: 'One' },
  { id: 'two', label: 'Two', disabled: true },
  { id: 'three', label: 'Three' },
]

function TestTabs({
  orientation = 'horizontal',
  defaultActiveId,
}: {
  orientation?: 'horizontal' | 'vertical'
  defaultActiveId?: string
}) {
  const state = useTabs({ tabs: TABS, orientation, defaultActiveId })
  return (
    <Tabs.Root state={state}>
      <Tabs.List>
        {TABS.map((t) => (
          <Tabs.Tab key={t.id} id={t.id}>
            {t.label}
          </Tabs.Tab>
        ))}
      </Tabs.List>
      <Tabs.Panels>
        {TABS.map((t) => (
          <Tabs.Panel key={t.id} id={t.id}>
            Panel {t.label}
          </Tabs.Panel>
        ))}
      </Tabs.Panels>
    </Tabs.Root>
  )
}

function TestTabsDisabled({ defaultActiveId }: { defaultActiveId?: string } = {}) {
  const state = useTabs({ tabs: TABS_WITH_DISABLED, defaultActiveId })
  return (
    <Tabs.Root state={state}>
      <Tabs.List>
        {TABS_WITH_DISABLED.map((t) => (
          <Tabs.Tab key={t.id} id={t.id} disabled={t.disabled}>
            {t.label}
          </Tabs.Tab>
        ))}
      </Tabs.List>
      <Tabs.Panels>
        {TABS_WITH_DISABLED.map((t) => (
          <Tabs.Panel key={t.id} id={t.id}>
            Panel {t.label}
          </Tabs.Panel>
        ))}
      </Tabs.Panels>
    </Tabs.Root>
  )
}

describe('Tabs', () => {
  it('renders tablist and tabs with correct roles', () => {
    render(<TestTabs />)
    expect(screen.getByRole('tablist')).toBeInTheDocument()
    expect(screen.getAllByRole('tab')).toHaveLength(3)
  })

  it('first tab is selected by default', () => {
    render(<TestTabs />)
    expect(screen.getByRole('tab', { name: 'One' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tab', { name: 'Two' })).toHaveAttribute('aria-selected', 'false')
  })

  it('shows only the active panel', () => {
    render(<TestTabs />)
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Panel One')
    expect(screen.queryByText('Panel Two')).not.toBeInTheDocument()
  })

  it('activates tab on click', async () => {
    const user = userEvent.setup()
    render(<TestTabs />)

    await user.click(screen.getByRole('tab', { name: 'Two' }))

    expect(screen.getByRole('tab', { name: 'Two' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Panel Two')
  })

  it('inactive tabs have tabIndex -1, active tab has tabIndex 0', () => {
    render(<TestTabs />)
    expect(screen.getByRole('tab', { name: 'One' })).toHaveAttribute('tabindex', '0')
    expect(screen.getByRole('tab', { name: 'Two' })).toHaveAttribute('tabindex', '-1')
  })

  it('tab panel has aria-labelledby pointing to its tab', () => {
    render(<TestTabs />)
    const panel = screen.getByRole('tabpanel')
    const labelId = panel.getAttribute('aria-labelledby')!
    expect(document.getElementById(labelId)).toHaveTextContent('One')
  })

  it('has correct aria-controls on each tab', () => {
    render(<TestTabs />)
    const tab = screen.getByRole('tab', { name: 'One' })
    const panelId = tab.getAttribute('aria-controls')!
    expect(document.getElementById(panelId)).toBeInTheDocument()
  })

  it('has no axe accessibility violations', async () => {
    const { container } = render(<TestTabs />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  describe('keyboard navigation — focus movement (manual activation)', () => {
    it('ArrowRight moves focus to next tab but does NOT activate it', async () => {
      const user = userEvent.setup()
      render(<TestTabs />)

      screen.getByRole('tab', { name: 'One' }).focus()
      await user.keyboard('{ArrowRight}')

      expect(screen.getByRole('tab', { name: 'Two' })).toHaveFocus()
      // Selection must NOT have changed — One is still active
      expect(screen.getByRole('tab', { name: 'One' })).toHaveAttribute('aria-selected', 'true')
      expect(screen.getByRole('tab', { name: 'Two' })).toHaveAttribute('aria-selected', 'false')
    })

    it('ArrowRight wraps focus to first tab from last without activating', async () => {
      const user = userEvent.setup()
      render(<TestTabs defaultActiveId="three" />)

      screen.getByRole('tab', { name: 'Three' }).focus()
      await user.keyboard('{ArrowRight}')

      expect(screen.getByRole('tab', { name: 'One' })).toHaveFocus()
      expect(screen.getByRole('tab', { name: 'Three' })).toHaveAttribute('aria-selected', 'true')
    })

    it('ArrowLeft moves focus to previous tab but does NOT activate it', async () => {
      const user = userEvent.setup()
      render(<TestTabs defaultActiveId="two" />)

      screen.getByRole('tab', { name: 'Two' }).focus()
      await user.keyboard('{ArrowLeft}')

      expect(screen.getByRole('tab', { name: 'One' })).toHaveFocus()
      expect(screen.getByRole('tab', { name: 'Two' })).toHaveAttribute('aria-selected', 'true')
    })

    it('Home moves focus to first tab without activating', async () => {
      const user = userEvent.setup()
      render(<TestTabs defaultActiveId="three" />)

      screen.getByRole('tab', { name: 'Three' }).focus()
      await user.keyboard('{Home}')

      expect(screen.getByRole('tab', { name: 'One' })).toHaveFocus()
      expect(screen.getByRole('tab', { name: 'Three' })).toHaveAttribute('aria-selected', 'true')
    })

    it('End moves focus to last tab without activating', async () => {
      const user = userEvent.setup()
      render(<TestTabs />)

      screen.getByRole('tab', { name: 'One' }).focus()
      await user.keyboard('{End}')

      expect(screen.getByRole('tab', { name: 'Three' })).toHaveFocus()
      expect(screen.getByRole('tab', { name: 'One' })).toHaveAttribute('aria-selected', 'true')
    })

    it('vertical orientation: ArrowDown moves focus without activating', async () => {
      const user = userEvent.setup()
      render(<TestTabs orientation="vertical" />)

      screen.getByRole('tab', { name: 'One' }).focus()
      await user.keyboard('{ArrowDown}')

      expect(screen.getByRole('tab', { name: 'Two' })).toHaveFocus()
      expect(screen.getByRole('tab', { name: 'One' })).toHaveAttribute('aria-selected', 'true')
    })
  })

  describe('keyboard navigation — activation (Enter / Space)', () => {
    it('Enter activates the focused tab', async () => {
      const user = userEvent.setup()
      render(<TestTabs />)

      screen.getByRole('tab', { name: 'One' }).focus()
      await user.keyboard('{ArrowRight}')
      await user.keyboard('{Enter}')

      expect(screen.getByRole('tab', { name: 'Two' })).toHaveAttribute('aria-selected', 'true')
      expect(screen.getByRole('tab', { name: 'One' })).toHaveAttribute('aria-selected', 'false')
      expect(screen.getByRole('tabpanel')).toHaveTextContent('Panel Two')
    })

    it('Space activates the focused tab', async () => {
      const user = userEvent.setup()
      render(<TestTabs />)

      screen.getByRole('tab', { name: 'One' }).focus()
      await user.keyboard('{ArrowRight}')
      await user.keyboard(' ')

      expect(screen.getByRole('tab', { name: 'Two' })).toHaveAttribute('aria-selected', 'true')
      expect(screen.getByRole('tabpanel')).toHaveTextContent('Panel Two')
    })

    it('Enter at Home (first tab) activates it', async () => {
      const user = userEvent.setup()
      render(<TestTabs defaultActiveId="three" />)

      screen.getByRole('tab', { name: 'Three' }).focus()
      await user.keyboard('{Home}')
      await user.keyboard('{Enter}')

      expect(screen.getByRole('tab', { name: 'One' })).toHaveAttribute('aria-selected', 'true')
      expect(screen.getByRole('tabpanel')).toHaveTextContent('Panel One')
    })

    it('Enter at End (last tab) activates it', async () => {
      const user = userEvent.setup()
      render(<TestTabs />)

      screen.getByRole('tab', { name: 'One' }).focus()
      await user.keyboard('{End}')
      await user.keyboard('{Enter}')

      expect(screen.getByRole('tab', { name: 'Three' })).toHaveAttribute('aria-selected', 'true')
      expect(screen.getByRole('tabpanel')).toHaveTextContent('Panel Three')
    })
  })

  describe('disabled tabs', () => {
    it('skips disabled tab on ArrowRight and moves focus only', async () => {
      const user = userEvent.setup()
      render(<TestTabsDisabled />)

      screen.getByRole('tab', { name: 'One' }).focus()
      await user.keyboard('{ArrowRight}')

      // "Two" is disabled, focus should land on "Three"
      expect(screen.getByRole('tab', { name: 'Three' })).toHaveFocus()
      expect(screen.getByRole('tab', { name: 'One' })).toHaveAttribute('aria-selected', 'true')
    })

    it('skips disabled tab on ArrowLeft and moves focus only', async () => {
      const user = userEvent.setup()
      render(<TestTabsDisabled defaultActiveId="three" />)

      screen.getByRole('tab', { name: 'Three' }).focus()
      await user.keyboard('{ArrowLeft}')

      // "Two" is disabled, focus should land on "One"
      expect(screen.getByRole('tab', { name: 'One' })).toHaveFocus()
      expect(screen.getByRole('tab', { name: 'Three' })).toHaveAttribute('aria-selected', 'true')
    })

    it('disabled tab has tabIndex -1', () => {
      render(<TestTabsDisabled />)
      expect(screen.getByRole('tab', { name: 'Two' })).toHaveAttribute('tabindex', '-1')
    })

    it('initial active tab skips disabled — first enabled tab is active', () => {
      render(<TestTabsDisabled />)
      expect(screen.getByRole('tab', { name: 'One' })).toHaveAttribute('aria-selected', 'true')
    })
  })
})
```

- [ ] **Step 2: Run tests — all should pass**

```bash
cd /Users/gonzoblasco/Projects/pr01 && npm test -- --reporter=verbose 2>&1 | tail -80
```

Expected: all tests pass (green).

- [ ] **Step 3: Commit**

```bash
cd /Users/gonzoblasco/Projects/pr01 && git add src/components/tabs/tabs.test.tsx && git commit -m "test(tabs): update keyboard tests for manual activation; add Enter/Space suite"
```

---

### Task 3: Update README to document manual activation decision

**Files:**
- Modify: `src/components/tabs/README.md`

**Interfaces:**
- No code interfaces — documentation only

- [ ] **Step 1: Update the README**

Replace the full content of `src/components/tabs/README.md` with:

```markdown
# Tabs

Headless tabs implementing the [ARIA tabs pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/) with **manual activation**.

## Usage

```tsx
const state = useTabs({
  tabs: [
    { id: 'one', label: 'One' },
    { id: 'two', label: 'Two', disabled: true },
  ],
  orientation: 'horizontal', // or 'vertical'
  defaultActiveId: 'one',
})

<Tabs.Root state={state}>
  <Tabs.List>
    <Tabs.Tab id="one">One</Tabs.Tab>
    <Tabs.Tab id="two" disabled>Two</Tabs.Tab>
  </Tabs.List>
  <Tabs.Panels>
    <Tabs.Panel id="one">Content One</Tabs.Panel>
    <Tabs.Panel id="two">Content Two</Tabs.Panel>
  </Tabs.Panels>
</Tabs.Root>
```

## ARIA Decisions

### Roving tabindex vs `aria-activedescendant`

Roving tabindex is used: the active tab has `tabIndex=0`, all others have `-1`. The alternative is `aria-activedescendant`, where DOM focus stays on the `tablist` container and the screen reader announces the "active" child virtually.

The critical difference: with `aria-activedescendant`, announcement of name and state depends on the screen reader's implementation of that attribute. With roving tabindex, real DOM focus moves to the selected tab, so the name + `aria-selected` announcement works across all screen readers without relying on `aria-activedescendant` support. APG documents both patterns as valid; roving tabindex has more consistent support in NVDA+Firefox and VoiceOver+Safari combinations.

### Manual activation (chosen) vs automatic activation

Arrow keys move focus **without** activating the tab. Only `Enter` or `Space` confirm the selection and show the panel.

**Why manual is more robust for screen reader users:** with automatic activation, moving focus immediately triggers the panel content to be announced. If the user is exploring tabs to decide which to open, each arrow keystroke interrupts them with panel content announcements. With manual activation, the user can browse tab labels silently and only commit when they press Enter/Space — matching how a screen reader user reads a list before choosing an item.

APG documents both patterns as valid. The rule of thumb: automatic activation is fine when switching panels has no cost and no side effects. Manual activation is the safer default when there is any chance panels have loading states, animations, or screen reader users will want to explore before choosing.

**Implementation:** the `List` `onKeyDown` handler uses `document.activeElement` to find the currently focused tab (which may differ from `activeId` after arrow navigation), then calls `.focus()` only. Each `Tab` has its own `onKeyDown` for Enter/Space that calls `setActiveId`. The `tabindex` attribute is still driven by `activeId` (0 for active, -1 for others), so pressing Tab leaves the tablist and returns to the active tab — not to wherever the user last moved focus with arrows.

### `aria-controls` on each tab

Each `<Tabs.Tab>` has `aria-controls` pointing to its panel's ID. JAWS uses this attribute to expose a shortcut for jumping directly to the panel. NVDA and VoiceOver don't use it actively, but it's present because the spec requires it and it doesn't cause any harm.

### IDs generated with `useId`

Tab and panel IDs are generated with React's `useId()`, which produces stable IDs in SSR. The format is `${baseId}-tab-${id}` and `${baseId}-panel-${id}`. This guarantees that multiple `<Tabs.Root>` instances on the same page don't collide.

### Inactive panel: `return null` vs `hidden` attribute

Inactive panels are not rendered (`return null`) rather than hidden with the `hidden` attribute or `display:none`. With `return null` there is no DOM node, which avoids inactive content being accidentally indexed or read. The tradeoff is that inactive panels don't pre-render, which matters if panels have expensive initialization (`useEffect` with fetches). For this use case simplicity wins.

## Keyboard Behavior

| Key | Behavior |
|-----|----------|
| `ArrowRight` / `ArrowDown` | Move **focus** to the next enabled tab (wrapping) — does not activate |
| `ArrowLeft` / `ArrowUp` | Move **focus** to the previous enabled tab (wrapping) — does not activate |
| `Home` | Move **focus** to the first enabled tab — does not activate |
| `End` | Move **focus** to the last enabled tab — does not activate |
| `Enter` / `Space` | **Activate** the focused tab — shows its panel |
| `Tab` | Leave the tablist and move to the active panel |
| `Shift+Tab` | Leave the tablist backwards |

`ArrowUp`/`ArrowDown` only apply in `orientation="vertical"`. Disabled tabs are skipped in all keyboard navigation.

## Alternatives Considered

- **`aria-activedescendant`**: Rejected due to inconsistent support in NVDA+Firefox. See roving tabindex decision above.
- **Automatic activation**: Rejected because manual activation is safer for screen reader users — they can explore tab labels without triggering panel announcements.
- **`hidden` attribute on inactive panels**: Rejected because keeping the panel in the DOM with `hidden` can trigger `useEffect` and other lifecycle side effects in panel content unexpectedly.
- **Separate `focusedId` state in `useTabs`**: Not needed — `document.activeElement` in the `List` handler tracks where keyboard focus is, keeping the hook simple.
```

- [ ] **Step 2: Commit**

```bash
cd /Users/gonzoblasco/Projects/pr01 && git add src/components/tabs/README.md && git commit -m "docs(tabs): document manual activation decision and update keyboard table"
```
