# Accessible Modal/Dialog Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a headless, WAI-ARIA-compliant Modal/Dialog with a `useModal()` hook and unstyled compound components.

**Architecture:** `useModal` owns all state and refs (open/close, trigger ref, focus return, generated IDs). `Modal.*` compound components consume context — `Content` handles focus trap, inert background, and portal rendering; `Title`/`Description` wire their IDs to the dialog's ARIA attributes.

**Tech Stack:** React 19, TypeScript, Vitest, Testing Library, jest-axe

## Global Constraints

- No forced styles on semantic elements (headless)
- Escape is always an accessible close mechanism
- Click-outside must coexist with keyboard close, never be the only option
- `inert` + `aria-hidden` on background siblings when dialog is open
- Focus returns to trigger on close via `requestAnimationFrame`

---

### Task 1: `useModal` hook

**Files:**
- Modify: `src/components/modal/use-modal.ts`

**Interfaces:**
- Produces: `UseModalReturn { isOpen, open, close, titleId, descriptionId, triggerRef, dialogRef }`

- [x] Add `descriptionId` via `useId()` to `UseModalReturn` interface and hook return

---

### Task 2: Modal compound components

**Files:**
- Modify: `src/components/modal/modal.tsx`

**Interfaces:**
- Consumes: `UseModalReturn` (from Task 1)
- Produces: `Modal.{ Root, Trigger, Content, Title, Description, Close }`

- [x] Add `setBackgroundInert` helper (sets `inert` + `aria-hidden` on body siblings, skipping portal)
- [x] Wire `aria-describedby={descriptionId}` on dialog div
- [x] Add `useEffect` in `Content` to call `setBackgroundInert` on open/close
- [x] Add `Modal.Description` compound (`<p id={descriptionId}>`)
- [x] Remove incorrect `aria-hidden="false"` from backdrop div

---

### Task 3: Tests

**Files:**
- Modify: `src/components/modal/modal.test.tsx`

- [x] Update `TestModal` fixture to use `Modal.Description`
- [x] Add test: `aria-describedby` wired to `Modal.Description`
- [x] Add tests: background `inert`/`aria-hidden` set on open, cleared on close
- [x] Add test: focus returns to trigger after close button click
- [x] Reorganize tests into `describe` blocks for clarity

---

### Task 4: README

**Files:**
- Modify: `src/components/modal/README.md`

- [x] Document `Modal.Description` in API table
- [x] Add `inert` decision section (why dual `inert` + `aria-hidden`)
- [x] Add alternatives table (`aria-hidden` only, `aria-modal` only, native `<dialog>`)
- [x] Document backdrop click coexistence with keyboard close
