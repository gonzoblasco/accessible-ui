# Combobox

Headless "Editable Combobox with List Autocomplete" implementing the [WAI-ARIA APG Combobox Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/).

## Usage

```tsx
const [selected, setSelected] = useState<ComboboxItem | null>(null)

<ComboboxRoot items={countries} onSelect={setSelected}>
  <label htmlFor="my-input">Country</label>
  <ComboboxInput id="my-input" placeholder="Search…" className="..." />
  <ComboboxListbox label="Countries" className="...">
    {(item, index) => (
      <ComboboxOption key={item.id} item={item} index={index} className="...">
        {item.label}
      </ComboboxOption>
    )}
  </ComboboxListbox>
  <ComboboxLiveRegion />
</ComboboxRoot>
```

`items` is reactive — pass a state array for dynamic lists (e.g. async data). The default filter is a case-insensitive substring match on `item.label`; override with the `filterFn` prop on `ComboboxRoot`.

## API

| Component | Props | Description |
|---|---|---|
| `ComboboxRoot` | `items`, `onSelect`, `filterFn?` | Context provider. Manages open state, filtered list, and active index. |
| `ComboboxInput` | All `<input>` props | The editable field. Holds `role="combobox"` and `aria-activedescendant`. |
| `ComboboxListbox` | `label`, `className?` | `<ul role="listbox">` — only mounted when open. |
| `ComboboxOption` | `item`, `index`, `className?` | `<li role="option">` with `aria-selected` on every item. |
| `ComboboxLiveRegion` | — | `aria-live="polite"` region that announces the filtered result count. |

## ARIA Decisions

### `aria-activedescendant` instead of roving tabindex

The pattern is *Editable* combobox — the user must be able to keep typing while navigating the list. Moving real DOM focus to list items would remove focus from the input, making further keystrokes impossible. `aria-activedescendant` keeps focus on the input at all times; the screen reader tracks the highlighted option via the ID pointer without the browser moving focus.

### `aria-live="polite"`, not `"assertive"`

`assertive` interrupts the screen reader mid-announcement — including the echo of the character the user just typed. `polite` waits for a natural pause, then announces the result count, matching how sighted users experience the updating list.

### `aria-selected` on every `<option>`

`role="listbox"` requires every `role="option"` child to have `aria-selected`. Omitting it is invalid per ARIA 1.2 and fails automated audits. Active option: `aria-selected="true"`; all others: `aria-selected="false"`.

### `aria-expanded` on the `<input>`, not on a wrapper `<div>`

ARIA 1.2 moved `role="combobox"` directly onto the `<input>` element. `aria-expanded` follows the widget role. A wrapper `<div role="combobox">` was the ARIA 1.0 pattern and is now incorrect.

### Listbox only mounts when open

The `<ul role="listbox">` is conditionally rendered (not just `display:none`). This prevents hidden-but-present structure that some AT can still traverse. `aria-controls` on the input resolves to the listbox ID at interaction time, so the relationship is valid even before the listbox is in the DOM.

## Keyboard Behavior

| Key | Behavior |
|---|---|
| `ArrowDown` | Open listbox / move to next option |
| `ArrowUp` | Move to previous option |
| `Home` / `End` | Jump to first / last option |
| `Enter` | Select highlighted option and close |
| `Escape` | Clear input and close listbox |
| `Tab` | Close listbox; focus moves normally |
