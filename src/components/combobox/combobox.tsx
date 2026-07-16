import {
  createContext,
  useContext,
  useEffect,
  useRef,
  type ChangeEvent,
  type CSSProperties,
  type FocusEvent,
  type HTMLAttributes,
  type InputHTMLAttributes,
  type LiHTMLAttributes,
  type ReactNode,
} from 'react'
import { useCombobox, type ComboboxItem, type UseComboboxOptions, type UseComboboxReturn } from './use-combobox'

// ─── Context ───────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ComboboxContext = createContext<UseComboboxReturn<any> | null>(null)

function useComboboxContext<T extends ComboboxItem>(): UseComboboxReturn<T> {
  const ctx = useContext(ComboboxContext)
  if (!ctx) throw new Error('Combobox compound components must be used inside <ComboboxRoot>')
  return ctx
}

// ─── ComboboxRoot ──────────────────────────────────────────────────────────

interface ComboboxRootProps<T extends ComboboxItem> extends UseComboboxOptions<T> {
  children: ReactNode
}

export function ComboboxRoot<T extends ComboboxItem>({
  items,
  onSelect,
  filterFn,
  children,
}: ComboboxRootProps<T>) {
  const state = useCombobox({ items, onSelect, filterFn })
  return <ComboboxContext.Provider value={state}>{children}</ComboboxContext.Provider>
}

// ─── ComboboxInput ─────────────────────────────────────────────────────────

type ComboboxInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  | 'role'
  | 'aria-expanded'
  | 'aria-autocomplete'
  | 'aria-controls'
  | 'aria-activedescendant'
  | 'value'
  | 'onChange'
  | 'onKeyDown'
  | 'onBlur'
  | 'autoComplete'
>

export function ComboboxInput(props: ComboboxInputProps) {
  const {
    inputId,
    listboxId,
    isOpen,
    activeIndex,
    getOptionId,
    inputValue,
    selectedItem,
    handleInputChange,
    handleKeyDown,
    handleBlur,
  } = useComboboxContext()

  // Select all text on focus when an item was previously selected
  const handleFocus = (e: FocusEvent<HTMLInputElement>) => {
    if (selectedItem) {
      // Use requestAnimationFrame to ensure the value is committed before selecting
      requestAnimationFrame(() => e.target.select())
    }
  }

  return (
    <input
      {...props}
      id={inputId}
      role="combobox"
      aria-expanded={isOpen}
      aria-autocomplete="list"
      aria-controls={listboxId}
      aria-activedescendant={activeIndex !== null ? getOptionId(activeIndex) : undefined}
      autoComplete="off"
      value={inputValue}
      onChange={(e: ChangeEvent<HTMLInputElement>) => handleInputChange(e.target.value)}
      onFocus={handleFocus}
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
    />
  )
}

// ─── ComboboxListbox ───────────────────────────────────────────────────────

interface ComboboxListboxProps
  extends Omit<HTMLAttributes<HTMLUListElement>, 'id' | 'role' | 'children'> {
  children: (item: ComboboxItem, index: number) => ReactNode
  label?: string
}

export function ComboboxListbox({ children, label, ...props }: ComboboxListboxProps) {
  const { isOpen, filteredItems, listboxId } = useComboboxContext()
  if (!isOpen) return null
  return (
    <ul {...props} id={listboxId} role="listbox" aria-label={label}>
      {filteredItems.map((item, index) => children(item, index))}
    </ul>
  )
}

// ─── ComboboxOption ────────────────────────────────────────────────────────

interface ComboboxOptionProps
  extends Omit<LiHTMLAttributes<HTMLLIElement>, 'id' | 'role' | 'aria-selected'> {
  item: ComboboxItem
  index: number
}

export function ComboboxOption({ item, index, ...props }: ComboboxOptionProps) {
  const { activeIndex, getOptionId, handleSelect } = useComboboxContext()
  const isActive = activeIndex === index
  const ref = useRef<HTMLLIElement>(null)

  useEffect(() => {
    if (isActive) ref.current?.scrollIntoView?.({ block: 'nearest' })
  }, [isActive])

  return (
    <li
      {...props}
      ref={ref}
      id={getOptionId(index)}
      role="option"
      aria-selected={isActive}
      onMouseDown={(e) => {
        // Prevent input blur before the click registers
        e.preventDefault()
        handleSelect(item)
        props.onMouseDown?.(e)
      }}
    />
  )
}

// ─── ComboboxLiveRegion ────────────────────────────────────────────────────

const srOnly: CSSProperties = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  padding: 0,
  margin: '-1px',
  overflow: 'hidden',
  clip: 'rect(0,0,0,0)',
  whiteSpace: 'nowrap',
  border: 0,
}

export function ComboboxLiveRegion() {
  const { isOpen, filteredItems } = useComboboxContext()
  const count = filteredItems.length
  const message = isOpen
    ? count === 0
      ? 'No results available.'
      : `${count} result${count === 1 ? '' : 's'} available.`
    : ''

  return (
    <div role="status" aria-live="polite" aria-atomic="true" style={srOnly}>
      {message}
    </div>
  )
}
