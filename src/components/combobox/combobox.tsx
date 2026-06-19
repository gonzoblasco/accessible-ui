import { useEffect, useRef, type ChangeEvent } from 'react'
import { type UseComboboxReturn } from './use-combobox'

interface ComboboxProps {
  state: UseComboboxReturn
  label: string
  placeholder?: string
  className?: string
}

export function Combobox({ state, label, placeholder, className }: ComboboxProps) {
  const {
    inputValue,
    items,
    isOpen,
    status,
    activeIndex,
    listboxId,
    getOptionId,
    handleInputChange,
    handleKeyDown,
    handleSelect,
    handleBlur,
  } = state

  const activeOptionRef = useRef<HTMLLIElement>(null)

  // Scroll active option into view
  useEffect(() => {
    activeOptionRef.current?.scrollIntoView?.({ block: 'nearest' })
  }, [activeIndex])

  const resultCount = items.length
  const statusMessage =
    status === 'loading'
      ? 'Loading results…'
      : status === 'error'
        ? 'Something went wrong. Try again.'
        : status === 'success' && resultCount === 0
          ? 'No results found.'
          : status === 'success'
            ? `${resultCount} result${resultCount === 1 ? '' : 's'} available.`
            : ''

  return (
    <div className={className ?? 'relative w-72'}>
      {/* Label */}
      <label
        htmlFor={`${listboxId}-input`}
        className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
      >
        {label}
      </label>

      {/* Input */}
      <input
        id={`${listboxId}-input`}
        role="combobox"
        aria-expanded={isOpen}
        aria-autocomplete="list"
        aria-controls={listboxId}
        aria-activedescendant={
          activeIndex !== null ? getOptionId(activeIndex) : undefined
        }
        type="text"
        value={inputValue}
        placeholder={placeholder}
        onChange={(e: ChangeEvent<HTMLInputElement>) =>
          handleInputChange(e.target.value)
        }
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        autoComplete="off"
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
      />

      {/* Live region for screen reader announcements */}
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {statusMessage}
      </div>

      {/* Listbox */}
      {isOpen && (
        <ul
          id={listboxId}
          role="listbox"
          aria-label={label}
          aria-busy={status === 'loading'}
          className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800"
        >
          {status === 'loading' && (
            <li
              role="option"
              aria-selected={false}
              aria-disabled={true}
              className="px-3 py-2 text-sm text-gray-400"
            >
              Loading…
            </li>
          )}

          {status === 'error' && (
            <li
              role="option"
              aria-selected={false}
              aria-disabled={true}
              className="px-3 py-2 text-sm text-red-500"
            >
              Something went wrong. Try again.
            </li>
          )}

          {status === 'success' && items.length === 0 && (
            <li
              role="option"
              aria-selected={false}
              aria-disabled={true}
              className="px-3 py-2 text-sm text-gray-400"
            >
              No results found.
            </li>
          )}

          {status === 'success' &&
            items.map((item, index) => {
              const isActive = activeIndex === index
              return (
                <li
                  key={item.id}
                  id={getOptionId(index)}
                  role="option"
                  aria-selected={isActive}
                  ref={isActive ? activeOptionRef : null}
                  onMouseDown={(e) => {
                    // Prevent blur before click registers
                    e.preventDefault()
                    handleSelect(item)
                  }}
                  className={[
                    'cursor-pointer px-3 py-2 text-sm',
                    isActive
                      ? 'bg-violet-600 text-white'
                      : 'text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700',
                  ].join(' ')}
                >
                  {item.label}
                </li>
              )
            })}
        </ul>
      )}
    </div>
  )
}
