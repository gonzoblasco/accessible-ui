/* @refresh reset */
/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  type KeyboardEvent,
  type MouseEvent,
  type PropsWithChildren,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { type UseModalReturn } from './use-modal'

// ─── Context ───────────────────────────────────────────────────────────────

const ModalContext = createContext<UseModalReturn | null>(null)

function useModalContext() {
  const ctx = useContext(ModalContext)
  if (!ctx) throw new Error('Modal compound components must be used inside <Modal.Root>')
  return ctx
}

// ─── Focus trap helper ─────────────────────────────────────────────────────

const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),' +
  'textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'

function getFocusable(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE))
}

// ─── Background inert helper ───────────────────────────────────────────────

// Marks all direct children of <body> except the portal container as inert
// so keyboard and AT navigation cannot reach background content while the
// dialog is open. Falls back to aria-hidden for browsers without inert support.
function setBackgroundInert(portalContainer: HTMLElement, inert: boolean) {
  Array.from(document.body.children).forEach((child) => {
    if (child === portalContainer) return
    if (inert) {
      child.setAttribute('inert', '')
      child.setAttribute('aria-hidden', 'true')
    } else {
      child.removeAttribute('inert')
      child.removeAttribute('aria-hidden')
    }
  })
}

// ─── Root ──────────────────────────────────────────────────────────────────

interface RootProps extends PropsWithChildren {
  state: UseModalReturn
}

function Root({ state, children }: RootProps) {
  return <ModalContext.Provider value={state}>{children}</ModalContext.Provider>
}

// ─── Trigger ───────────────────────────────────────────────────────────────

interface TriggerProps extends PropsWithChildren {
  className?: string
}

function Trigger({ children, className }: TriggerProps) {
  const { open, triggerRef } = useModalContext()
  return (
    <button ref={triggerRef} type="button" onClick={open} className={className}>
      {children}
    </button>
  )
}

// ─── Content ───────────────────────────────────────────────────────────────

interface ContentProps extends PropsWithChildren {
  className?: string
  closeOnBackdropClick?: boolean
}

function Content({ children, className, closeOnBackdropClick = true }: ContentProps) {
  const { isOpen, close, titleId, descriptionId, dialogRef } = useModalContext()

  // Focus first focusable element when dialog opens
  useEffect(() => {
    if (!isOpen || !dialogRef.current) return
    const focusable = getFocusable(dialogRef.current)
    ;(focusable[0] ?? dialogRef.current).focus()
  }, [isOpen, dialogRef])

  // Mark background content as inert while dialog is open
  useEffect(() => {
    if (!isOpen || !dialogRef.current) return
    const portalContainer = dialogRef.current.closest('body > *') as HTMLElement | null
    if (!portalContainer) return
    setBackgroundInert(portalContainer, true)
    return () => setBackgroundInert(portalContainer, false)
  }, [isOpen, dialogRef])

  // Focus trap on keydown
  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      if (e.key === 'Escape') {
        close()
        return
      }
      if (e.key !== 'Tab' || !dialogRef.current) return

      const focusable = getFocusable(dialogRef.current)
      if (focusable.length === 0) return

      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault()
          last.focus()
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    },
    [close, dialogRef],
  )

  const handleBackdropClick = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      if (closeOnBackdropClick && e.target === e.currentTarget) close()
    },
    [close, closeOnBackdropClick],
  )

  if (!isOpen) return null

  return createPortal(
    // Backdrop — purely visual; Escape on the dialog handles keyboard dismissal
    <div
      role="presentation"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={handleBackdropClick}
    >
      {/* Dialog */}
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        className={
          className ??
          'relative w-full max-w-md rounded-xl bg-white p-6 shadow-xl outline-none dark:bg-gray-900'
        }
      >
        {children}
      </div>
    </div>,
    document.body,
  )
}

// ─── Title ─────────────────────────────────────────────────────────────────

interface TitleProps {
  children: ReactNode
  className?: string
}

function Title({ children, className }: TitleProps) {
  const { titleId } = useModalContext()
  return (
    <h2 id={titleId} className={className ?? 'mb-4 text-lg font-semibold text-gray-900 dark:text-white'}>
      {children}
    </h2>
  )
}

// ─── Description ───────────────────────────────────────────────────────────

interface DescriptionProps {
  children: ReactNode
  className?: string
}

function Description({ children, className }: DescriptionProps) {
  const { descriptionId } = useModalContext()
  return (
    <p id={descriptionId} className={className}>
      {children}
    </p>
  )
}

// ─── Close button ──────────────────────────────────────────────────────────

interface CloseProps {
  children?: ReactNode
  className?: string
  onClick?: () => void
}

function Close({ children, className, onClick }: CloseProps) {
  const { close } = useModalContext()
  return (
    <button
      type="button"
      onClick={() => { onClick?.(); close() }}
      aria-label={children ? undefined : 'Close dialog'}
      className={className ?? 'absolute right-4 top-4 text-gray-500 hover:text-gray-900 dark:hover:text-white'}
    >
      {children ?? '✕'}
    </button>
  )
}

// ─── Exports ───────────────────────────────────────────────────────────────

export const Modal = { Root, Trigger, Content, Title, Description, Close }
