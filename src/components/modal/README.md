# Modal

Headless modal/dialog implementing the [WAI-ARIA Dialog (Modal) Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/).

## Usage

```tsx
const modal = useModal()

<Modal.Root state={modal}>
  <Modal.Trigger>Open</Modal.Trigger>
  <Modal.Content>
    <Modal.Close />
    <Modal.Title>Confirm action</Modal.Title>
    <Modal.Description>This will permanently delete the item.</Modal.Description>
    <button onClick={modal.close}>Cancel</button>
    <button onClick={handleConfirm}>Delete</button>
  </Modal.Content>
</Modal.Root>
```

`Modal.Close` accepts an optional `onClick` callback that fires before the dialog closes — useful for logging, analytics, or resetting form state.

## API

| Component | Props | Description |
|---|---|---|
| `Modal.Root` | `state: UseModalReturn` | Context provider. Wraps trigger + content. |
| `Modal.Trigger` | `className?` | `<button>` that opens the dialog and captures the trigger ref for focus return. |
| `Modal.Content` | `className?`, `closeOnBackdropClick?` | Portal-rendered dialog. Manages focus trap and background inert. |
| `Modal.Title` | `className?` | `<h2>` wired to `aria-labelledby`. |
| `Modal.Description` | `className?` | `<p>` wired to `aria-describedby`. |
| `Modal.Close` | `className?`, `onClick?` | Close button with fallback `aria-label="Close dialog"`. |

## ARIA Decisions

### `role="dialog"` vs native `<dialog>`

`role="dialog"` on a `<div>` instead of the native `<dialog>` element. The native element has built-in focus management and `::backdrop`, but its behavior differs between `showModal()` and `show()` across browsers, and its imperative API doesn't map cleanly to React's declarative state model. With `role="dialog"` we own exactly when and how focus is applied, without depending on DOM APIs that have inconsistent polyfill behavior.

### `aria-modal="true"`

Tells screen readers that content behind the modal is not interactive. Without it, NVDA and some VoiceOver navigation modes allow the user to escape the modal via virtual cursor keys even though keyboard focus is trapped. `aria-modal` is the APG standard signal for this pattern.

### `aria-labelledby` + `aria-describedby`

Both are wired to IDs generated with `useId()`:

- `aria-labelledby` → `Modal.Title` (`<h2>`). Preferable to `aria-label` because the announced text is always consistent with what the user sees, without needing to keep strings in sync.
- `aria-describedby` → `Modal.Description` (`<p>`). Screen readers announce the description after the title when focus enters the dialog, giving users context before they interact with controls.

### `inert` + `aria-hidden` on background siblings

When the dialog opens, every direct child of `<body>` except the portal container receives `inert=""` and `aria-hidden="true"`. This is done in combination because:

- `aria-modal="true"` alone is insufficient: it signals to screen readers but does **not** prevent keyboard focus from reaching background content in all browsers and AT combinations.
- `aria-hidden="true"` alone hides background content from AT but does **not** block keyboard focus — a sighted keyboard user can still Tab into background content.
- `inert` blocks focus, pointer events, and AT simultaneously. It is the only attribute that covers all three channels.

The dual application (`inert` + `aria-hidden`) ensures correct behavior regardless of browser or AT. On browsers that don't support `inert`, `aria-hidden` still provides AT protection; the keyboard isolation relies on the focus trap.

### Manual focus trap vs library

The focus trap is implemented manually rather than using `focus-trap-react` or `@radix-ui/focus-scope`. The `FOCUSABLE` selector covers all standard interactive elements; the only uncovered case is `[contenteditable]`, which doesn't apply here. For a component demonstrating accessibility patterns, the goal is to show understanding of the mechanism, not just its usage.

### Return focus with `requestAnimationFrame`

On close, focus returns to the trigger via `requestAnimationFrame` rather than a direct `.focus()` call. React 19 batches state updates such that the trigger element may not yet be in the DOM at the synchronous point where `close()` is called. The rAF ensures the DOM has settled before attempting focus.

### Body scroll lock via `overflow: hidden`

`document.body.style.overflow = 'hidden'` on open, reverted on close. Simplest sufficient technique for the use case. Scroll-lock libraries solve the iOS Safari bounce edge case but add a dependency for a case that doesn't apply here.

## Keyboard Behavior

| Key | Behavior |
|---|---|
| `Tab` | Move focus to the next focusable element inside the dialog, wrapping to first |
| `Shift+Tab` | Move focus to the previous element, wrapping to last |
| `Escape` | Close the dialog and return focus to the trigger |
| Backdrop click | Close the dialog (configurable via `closeOnBackdropClick`, default `true`) |

Note: backdrop click is always accompanied by a keyboard-accessible close mechanism (`Escape` and `Modal.Close`), so it is never the only way to close the dialog.

## Alternatives Considered and Discarded

| Alternative | Reason discarded |
|---|---|
| Native `<dialog>` element | Inconsistent `showModal()` behavior across browsers; imperative DOM API conflicts with React's declarative model |
| `aria-hidden` only on background (no `inert`) | Does not block keyboard focus — sighted keyboard users can Tab to background content |
| `aria-modal` only (no `inert`/`aria-hidden` on background) | Some AT combinations (NVDA+Chrome) allow virtual cursor navigation past the dialog |
| `focus-trap-react` / `@radix-ui/focus-scope` | Dependency for a pattern simple enough to implement manually; hides the mechanism |
| `aria-label` on dialog instead of `aria-labelledby` | String would need to stay in sync with visible `Modal.Title`; visible/announced text can diverge |
| Radix UI Dialog | Production-ready and an excellent choice; not used here because the goal is to demonstrate the implementation |
