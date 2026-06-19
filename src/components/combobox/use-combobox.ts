import { useCallback, useId, useRef, useState } from 'react'

export interface ComboboxItem {
  id: string
  label: string
  [key: string]: unknown
}

export type FetchStatus = 'idle' | 'loading' | 'success' | 'error'

export interface UseComboboxOptions {
  fetcher: (query: string) => Promise<ComboboxItem[]>
  debounceMs?: number
  onSelect?: (item: ComboboxItem) => void
}

export interface UseComboboxReturn {
  inputValue: string
  items: ComboboxItem[]
  isOpen: boolean
  status: FetchStatus
  activeIndex: number | null
  selectedItem: ComboboxItem | null
  listboxId: string
  getOptionId: (index: number) => string
  handleInputChange: (value: string) => void
  handleKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void
  handleSelect: (item: ComboboxItem) => void
  handleBlur: () => void
  open: () => void
  close: () => void
}

export function useCombobox({
  fetcher,
  debounceMs = 300,
  onSelect,
}: UseComboboxOptions): UseComboboxReturn {
  const baseId = useId()
  const listboxId = `${baseId}-listbox`
  const getOptionId = useCallback((i: number) => `${baseId}-option-${i}`, [baseId])

  const [inputValue, setInputValue] = useState('')
  const [items, setItems] = useState<ComboboxItem[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [status, setStatus] = useState<FetchStatus>('idle')
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const [selectedItem, setSelectedItem] = useState<ComboboxItem | null>(null)

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const fetchSeq = useRef(0) // Cancels stale responses

  const runFetch = useCallback(
    (query: string) => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current)

      if (!query.trim()) {
        setItems([])
        setIsOpen(false)
        setStatus('idle')
        return
      }

      const seq = ++fetchSeq.current
      setStatus('loading')
      setIsOpen(true)

      debounceTimer.current = setTimeout(async () => {
        try {
          const result = await fetcher(query)
          if (seq !== fetchSeq.current) return // stale response
          setItems(result)
          setStatus('success')
          setActiveIndex(null)
        } catch {
          if (seq !== fetchSeq.current) return
          setStatus('error')
          setItems([])
        }
      }, debounceMs)
    },
    [fetcher, debounceMs],
  )

  const handleInputChange = useCallback(
    (value: string) => {
      setInputValue(value)
      setSelectedItem(null)
      runFetch(value)
    },
    [runFetch],
  )

  const handleSelect = useCallback(
    (item: ComboboxItem) => {
      setInputValue(item.label)
      setSelectedItem(item)
      setIsOpen(false)
      setActiveIndex(null)
      onSelect?.(item)
    },
    [onSelect],
  )

  const close = useCallback(() => {
    setIsOpen(false)
    setActiveIndex(null)
  }, [])

  const open = useCallback(() => {
    if (items.length > 0) setIsOpen(true)
  }, [items])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        if (!isOpen && items.length > 0) {
          setIsOpen(true)
          setActiveIndex(0)
          return
        }
        setActiveIndex((prev) =>
          prev === null ? 0 : Math.min(prev + 1, items.length - 1),
        )
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        if (!isOpen && items.length > 0) {
          setIsOpen(true)
          setActiveIndex(items.length - 1)
          return
        }
        setActiveIndex((prev) =>
          prev === null ? items.length - 1 : Math.max(prev - 1, 0),
        )
      } else if (e.key === 'Enter') {
        e.preventDefault()
        if (isOpen && activeIndex !== null && items[activeIndex]) {
          handleSelect(items[activeIndex])
        }
      } else if (e.key === 'Escape') {
        close()
      } else if (e.key === 'Tab') {
        close()
      }
    },
    [isOpen, items, activeIndex, handleSelect, close],
  )

  const handleBlur = useCallback(() => {
    // Small delay so clicks on options register before closing
    setTimeout(() => close(), 150)
  }, [close])

  return {
    inputValue,
    items,
    isOpen,
    status,
    activeIndex,
    selectedItem,
    listboxId,
    getOptionId,
    handleInputChange,
    handleKeyDown,
    handleSelect,
    handleBlur,
    open,
    close,
  }
}
