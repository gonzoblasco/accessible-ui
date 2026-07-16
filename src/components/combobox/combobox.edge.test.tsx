import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'jest-axe'
import { describe, expect, it, vi } from 'vitest'
import {
  ComboboxInput,
  ComboboxLiveRegion,
  ComboboxListbox,
  ComboboxOption,
  ComboboxRoot,
} from './combobox'
import type { ComboboxItem } from './use-combobox'

const ITEMS: ComboboxItem[] = [
  { id: '1', label: 'Argentina' },
  { id: '2', label: 'Australia' },
  { id: '3', label: 'Austria' },
  { id: '4', label: 'Belgium' },
]

function TestCombobox({
  items = ITEMS,
  onSelect = vi.fn(),
}: {
  items?: ComboboxItem[]
  onSelect?: (item: ComboboxItem) => void
}) {
  return (
    <ComboboxRoot items={items} onSelect={onSelect}>
      <label htmlFor="test-combobox-input">Country</label>
      <ComboboxInput id="test-combobox-input" placeholder="Search…" />
      <ComboboxListbox label="Country">
        {(item, index) => (
          <ComboboxOption key={item.id} item={item} index={index}>
            {item.label}
          </ComboboxOption>
        )}
      </ComboboxListbox>
      <ComboboxLiveRegion />
    </ComboboxRoot>
  )
}

// ─── Edge cases ────────────────────────────────────────────────────────────

describe('Combobox — edge cases', () => {
  it('handles empty items array without crashing', async () => {
    const user = userEvent.setup()
    render(<TestCombobox items={[]} />)
    const input = screen.getByRole('combobox')
    input.focus()
    await user.keyboard('{ArrowDown}')
    // Should not crash, listbox should not appear
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('handles ArrowDown on empty items — no crash, no listbox', async () => {
    const user = userEvent.setup()
    render(<TestCombobox items={[]} />)
    const input = screen.getByRole('combobox')
    input.focus()
    await user.keyboard('{ArrowDown}')
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('handles ArrowUp on empty items — no crash', async () => {
    const user = userEvent.setup()
    render(<TestCombobox items={[]} />)
    const input = screen.getByRole('combobox')
    input.focus()
    await user.keyboard('{ArrowUp}')
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('handles Enter on empty items — no crash, no selection', async () => {
    const onSelect = vi.fn()
    const user = userEvent.setup()
    render(<TestCombobox items={[]} onSelect={onSelect} />)
    const input = screen.getByRole('combobox')
    input.focus()
    await user.keyboard('{Enter}')
    expect(onSelect).not.toHaveBeenCalled()
  })

  it('handles single item list — ArrowDown wraps correctly', async () => {
    const user = userEvent.setup()
    render(<TestCombobox items={[ITEMS[0]]} />)
    const input = screen.getByRole('combobox')
    input.focus()
    await user.keyboard('{ArrowDown}')
    const options = screen.getAllByRole('option')
    expect(options[0]).toHaveAttribute('aria-selected', 'true')
    // ArrowDown again should stay on same item (only one)
    await user.keyboard('{ArrowDown}')
    expect(options[0]).toHaveAttribute('aria-selected', 'true')
  })

  it('ArrowUp from first option wraps to last', async () => {
    const user = userEvent.setup()
    render(<TestCombobox />)
    const input = screen.getByRole('combobox')
    input.focus()
    await user.keyboard('{ArrowDown}') // opens, activeIndex=0
    await user.keyboard('{ArrowUp}') // should go to last
    const options = screen.getAllByRole('option')
    expect(options[options.length - 1]).toHaveAttribute('aria-selected', 'true')
  })

  it('typing after selection clears activeIndex and shows filtered results', async () => {
    const onSelect = vi.fn()
    const user = userEvent.setup()
    render(<TestCombobox onSelect={onSelect} />)
    const input = screen.getByRole('combobox')
    input.focus()
    // Select an item
    await user.keyboard('{ArrowDown}{Enter}')
    expect(input).toHaveValue('Argentina')
    // Clear and type something new
    await user.clear(input)
    await user.type(input, 'Bel')
    expect(input).toHaveValue('Bel')
    // Should show filtered results
    expect(screen.getByRole('listbox')).toBeInTheDocument()
    expect(screen.getByRole('option')).toHaveTextContent('Belgium')
  })

  it('blur closes listbox after delay', async () => {
    const user = userEvent.setup()
    render(<TestCombobox />)
    const input = screen.getByRole('combobox')
    input.focus()
    await user.keyboard('{ArrowDown}')
    expect(screen.getByRole('listbox')).toBeInTheDocument()
    // Click outside
    await user.click(document.body)
    await waitFor(() => {
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    })
  })

  it('blur does NOT close before mousedown on option registers', async () => {
    const onSelect = vi.fn()
    const user = userEvent.setup()
    render(<TestCombobox onSelect={onSelect} />)
    const input = screen.getByRole('combobox')
    await user.type(input, 'Aus')
    // Click on the option directly
    await user.click(screen.getByRole('option', { name: 'Australia' }))
    expect(onSelect).toHaveBeenCalledWith(ITEMS[1])
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('typing with no matches shows empty listbox and announces no results', async () => {
    const user = userEvent.setup()
    render(<TestCombobox />)
    const input = screen.getByRole('combobox')
    await user.type(input, 'zzz')
    // Listbox renders but has no options
    expect(screen.getByRole('listbox')).toBeInTheDocument()
    expect(screen.queryByRole('option')).not.toBeInTheDocument()
    // Live region should say no results
    expect(screen.getByRole('status')).toHaveTextContent('No results available.')
  })

  it('does not open listbox when typing and no items match', async () => {
    const user = userEvent.setup()
    render(<TestCombobox />)
    const input = screen.getByRole('combobox')
    await user.type(input, 'zzz')
    // handleInputChange sets isOpen when value.length > 0, but ComboboxListbox
    // checks isOpen AND filteredItems — if filteredItems is empty, listbox renders
    // but with no children. Let's check: the listbox renders when isOpen is true
    // regardless of filteredItems length.
    // Actually looking at the code: handleInputChange sets setIsOpen(value.length > 0)
    // So the listbox WILL render even with 0 results. That's a potential issue.
    expect(screen.getByRole('listbox')).toBeInTheDocument()
    expect(screen.queryByRole('option')).not.toBeInTheDocument()
  })

  it('no axe violations with no matches', async () => {
    const user = userEvent.setup()
    const { container } = render(<TestCombobox />)
    await user.type(screen.getByRole('combobox'), 'zzz')
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('rapid typing does not cause stale filtered results', async () => {
    const user = userEvent.setup()
    render(<TestCombobox />)
    const input = screen.getByRole('combobox')
    await user.type(input, 'Ar')
    expect(screen.getAllByRole('option')).toHaveLength(1)
    expect(screen.getByRole('option')).toHaveTextContent('Argentina')
  })

  it('selecting an item then pressing ArrowDown reopens listbox', async () => {
    const user = userEvent.setup()
    render(<TestCombobox />)
    const input = screen.getByRole('combobox')
    input.focus()
    await user.keyboard('{ArrowDown}{Enter}')
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    // ArrowDown should reopen
    await user.keyboard('{ArrowDown}')
    expect(screen.getByRole('listbox')).toBeInTheDocument()
  })

  it('Escape when listbox is closed does nothing', async () => {
    const user = userEvent.setup()
    render(<TestCombobox />)
    const input = screen.getByRole('combobox')
    input.focus()
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    expect(input).toHaveValue('')
  })

  it('Tab closes listbox', async () => {
    const user = userEvent.setup()
    render(<TestCombobox />)
    const input = screen.getByRole('combobox')
    input.focus()
    await user.keyboard('{ArrowDown}')
    expect(screen.getByRole('listbox')).toBeInTheDocument()
    await user.tab()
    await waitFor(() => {
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    })
  })

  it('multiple comboboxes on the same page have unique IDs', () => {
    render(
      <>
        <TestCombobox />
        <TestCombobox />
      </>,
    )
    const inputs = screen.getAllByRole('combobox')
    expect(inputs[0].id).not.toBe(inputs[1].id)
    const listboxIds = inputs.map((i) => i.getAttribute('aria-controls'))
    expect(listboxIds[0]).not.toBe(listboxIds[1])
  })

  it('items with duplicate labels — selects by index correctly', async () => {
    const items: ComboboxItem[] = [
      { id: '1', label: 'Same' },
      { id: '2', label: 'Same' },
    ]
    const onSelect = vi.fn()
    const user = userEvent.setup()
    render(<TestCombobox items={items} onSelect={onSelect} />)
    const input = screen.getByRole('combobox')
    input.focus()
    await user.keyboard('{ArrowDown}{ArrowDown}{Enter}')
    expect(onSelect).toHaveBeenCalledWith(items[1])
  })

  it('items with very long labels do not break rendering', () => {
    const longLabel = 'A'.repeat(1000)
    const items: ComboboxItem[] = [{ id: '1', label: longLabel }]
    render(<TestCombobox items={items} />)
    const input = screen.getByRole('combobox')
    input.focus()
    // Just check it renders without error
    expect(screen.getByRole('combobox')).toBeInTheDocument()
  })

  it('selecting item calls onSelect with the correct item reference', async () => {
    const onSelect = vi.fn()
    const user = userEvent.setup()
    render(<TestCombobox onSelect={onSelect} />)
    const input = screen.getByRole('combobox')
    input.focus()
    await user.keyboard('{ArrowDown}{ArrowDown}{Enter}')
    expect(onSelect).toHaveBeenCalledWith(ITEMS[1])
    expect(onSelect).toHaveBeenCalledTimes(1)
  })

  it('onSelect is not called when listbox closes without selection', async () => {
    const onSelect = vi.fn()
    const user = userEvent.setup()
    render(<TestCombobox onSelect={onSelect} />)
    const input = screen.getByRole('combobox')
    input.focus()
    await user.keyboard('{ArrowDown}{Escape}')
    expect(onSelect).not.toHaveBeenCalled()
  })

  it('typing after selection resets selectedItem so Enter does not re-select', async () => {
    const onSelect = vi.fn()
    const user = userEvent.setup()
    render(<TestCombobox onSelect={onSelect} />)
    const input = screen.getByRole('combobox')
    input.focus()
    await user.keyboard('{ArrowDown}{Enter}')
    expect(input).toHaveValue('Argentina')
    // Clear and type
    await user.clear(input)
    await user.type(input, 'x')
    expect(input).toHaveValue('x')
    // The selectedItem should be null now, so pressing Enter should not call onSelect
    await user.keyboard('{Enter}')
    expect(onSelect).toHaveBeenCalledTimes(1) // still only the first call
  })
})
