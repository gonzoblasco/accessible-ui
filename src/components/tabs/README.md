# Tabs

Headless tabs implementing the [ARIA tabs pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/).

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

### Automatic activation vs manual activation

Arrow keys activate the tab immediately (automatic activation). APG documents both patterns. Automatic activation matches the expectation users build from native patterns (browser tabs, OS tab controls). Manual activation — where arrows move focus without activating, and `Enter` or `Space` confirm — is the right choice when loading the panel has a meaningful cost (data fetch). To add manual activation, extend the hook to track a separate `focusedId` alongside `activeId`.

### `aria-controls` on each tab

Each `<Tabs.Tab>` has `aria-controls` pointing to its panel's ID. JAWS uses this attribute to expose a shortcut for jumping directly to the panel. NVDA and VoiceOver don't use it actively, but it's present because the spec requires it and it doesn't cause any harm.

### IDs generated with `useId`

Tab and panel IDs are generated with React's `useId()`, which produces stable IDs in SSR. The format is `${baseId}-tab-${id}` and `${baseId}-panel-${id}`. This guarantees that multiple `<Tabs.Root>` instances on the same page don't collide.

### Inactive panel: `return null` vs `hidden` attribute

Inactive panels are not rendered (`return null`) rather than hidden with the `hidden` attribute or `display:none`. With `return null` there is no DOM node, which avoids inactive content being accidentally indexed or read. The tradeoff is that inactive panels don't pre-render, which matters if panels have expensive initialization (`useEffect` with fetches). For this use case simplicity wins.

## Keyboard Behavior

| Key | Behavior |
|-----|----------|
| `ArrowRight` / `ArrowDown` | Activate the next enabled tab (wrapping) |
| `ArrowLeft` / `ArrowUp` | Activate the previous enabled tab (wrapping) |
| `Home` | Activate the first enabled tab |
| `End` | Activate the last enabled tab |
| `Tab` | Leave the tablist and move to the active panel |
| `Shift+Tab` | Leave the tablist backwards |

`ArrowUp`/`ArrowDown` only apply in `orientation="vertical"`. Disabled tabs are skipped in all keyboard navigation.

## Alternatives Considered

- **`aria-activedescendant`**: Rejected due to inconsistent support in NVDA+Firefox. See roving tabindex decision above.
- **Manual activation**: Not implemented because there is no loading cost in this component. Documented here so the decision is obvious if the requirement changes.
- **`hidden` attribute on inactive panels**: Rejected because keeping the panel in the DOM with `hidden` can trigger `useEffect` and other lifecycle side effects in panel content unexpectedly.
