import { useCallback, useId, useRef, useState } from 'react'

export interface UseModalReturn {
  isOpen: boolean
  open: () => void
  close: () => void
  titleId: string
  descriptionId: string
  triggerRef: React.RefObject<HTMLButtonElement | null>
  dialogRef: React.RefObject<HTMLDivElement | null>
}

export function useModal(): UseModalReturn {
  const [isOpen, setIsOpen] = useState(false)
  const titleId = useId()
  const descriptionId = useId()
  const triggerRef = useRef<HTMLButtonElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)

  const open = useCallback(() => {
    setIsOpen(true)
    // Prevent body scroll while open
    document.body.style.overflow = 'hidden'
  }, [])

  const close = useCallback(() => {
    setIsOpen(false)
    document.body.style.overflow = ''
    // Return focus to trigger after paint
    requestAnimationFrame(() => triggerRef.current?.focus())
  }, [])

  return { isOpen, open, close, titleId, descriptionId, triggerRef, dialogRef }
}
