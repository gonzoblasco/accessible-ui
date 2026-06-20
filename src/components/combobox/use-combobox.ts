import { useCallback, useEffect, useId, useRef, useState } from 'react'

export interface ComboboxItem {
  id: string
  label: string
  [key: string]: unknown
}

export interface UseComboboxOptions<T extends ComboboxItem> {
  items: T[]
  onSelect?: (item: T) => void
  filterFn?: (item: T, query: string) => boolean
}

export interface UseComboboxReturn<T extends ComboboxItem> {
  inputValue: string
  filteredItems: T[]
  isOpen: boolean
  activeIndex: number | null
  selectedItem: T | null
  inputId: string
  listboxId: string
  getOptionId: (index: number) => string
  handleInputChange: (value: string) => void
  handleKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void
  handleSelect: (item: T) => void
  handleBlur: () => void
  open: () => void
  close: () => void
}

const defaultFilter = <T extends ComboboxItem>(item: T, query: string) =>
  item.label.toLowerCase().includes(query.toLowerCase())

export function useCombobox<T extends ComboboxItem>({
  items,
  onSelect,
  filterFn = defaultFilter,
}: UseComboboxOptions<T>): UseComboboxReturn<T> {
  const baseId = useId()
  const inputId = `${baseId}-input`
  const listboxId = `${baseId}-listbox`
  const getOptionId = useCallback((i: number) => `${baseId}-option-${i}`, [baseId])

  const [inputValue, setInputValue] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const [selectedItem, setSelectedItem] = useState<T | null>(null)

  const filteredItems = inputValue
    ? items.filter((item) => filterFn(item, inputValue))
    : items

  const closeRef = useRef<() => void>(() => {})

  const close = useCallback(() => {
    setIsOpen(false)
    setActiveIndex(null)
  }, [])

  // Keep the ref in sync outside render (avoids stale-closure in handleBlur's setTimeout)
  useEffect(() => {
    closeRef.current = close
  })

  const open = useCallback(() => {
    if (filteredItems.length > 0) setIsOpen(true)
  }, [filteredItems.length])

  const handleInputChange = useCallback((value: string) => {
    setInputValue(value)
    setSelectedItem(null)
    setActiveIndex(null)
    setIsOpen(value.length > 0)
  }, [])

  const handleSelect = useCallback(
    (item: T) => {
      setInputValue(item.label)
      setSelectedItem(item)
      setIsOpen(false)
      setActiveIndex(null)
      onSelect?.(item)
    },
    [onSelect],
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      const count = filteredItems.length

      if (e.key === 'ArrowDown') {
        e.preventDefault()
        if (!isOpen && count > 0) {
          setIsOpen(true)
          setActiveIndex(0)
          return
        }
        setActiveIndex((prev) => (prev === null ? 0 : Math.min(prev + 1, count - 1)))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        if (!isOpen && count > 0) {
          setIsOpen(true)
          setActiveIndex(count - 1)
          return
        }
        setActiveIndex((prev) => (prev === null ? count - 1 : Math.max(prev - 1, 0)))
      } else if (e.key === 'Enter') {
        e.preventDefault()
        if (isOpen && activeIndex !== null && filteredItems[activeIndex]) {
          handleSelect(filteredItems[activeIndex])
        }
      } else if (e.key === 'Escape') {
        close()
      } else if (e.key === 'Tab') {
        close()
      }
    },
    [isOpen, filteredItems, activeIndex, handleSelect, close],
  )

  const handleBlur = useCallback(() => {
    // Small delay so mousedown on options fires before blur closes the list
    setTimeout(() => closeRef.current(), 150)
  }, [])

  return {
    inputValue,
    filteredItems,
    isOpen,
    activeIndex,
    selectedItem,
    inputId,
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
