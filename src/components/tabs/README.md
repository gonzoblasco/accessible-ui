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
