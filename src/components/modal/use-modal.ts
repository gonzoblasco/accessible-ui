import { useCallback, useEffect, useId, useRef, useState } from 'react'

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
  }, [])

  const close = useCallback(() => {
    setIsOpen(false)
    // Return focus to trigger after paint
    requestAnimationFrame(() => triggerRef.current?.focus())
  }, [])

  // Lock body scroll while open; cleanup on unmount
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  return { isOpen, open, close, titleId, descriptionId, triggerRef, dialogRef }
}
