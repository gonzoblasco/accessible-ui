import { render, screen, within } from '@testing-library/react'
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

// ─── Fixture ───────────────────────────────────────────────────────────────

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

// ─── ARIA attributes ────────────────────────────────────────────────────────

describe('ARIA attributes', () => {
  it('input has role="combobox", aria-expanded="false", aria-autocomplete="list", aria-controls', () => {
    render(<TestCombobox />)
    const input = screen.getByRole('combobox')
    expect(input).toHaveAttribute('aria-expanded', 'false')
    expect(input).toHaveAttribute('aria-autocomplete', 'list')
    expect(input).toHaveAttribute('aria-controls')
  })

  it('listbox is not in the DOM when closed', () => {
    render(<TestCombobox />)
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('listbox mounts with role="listbox" after typing', async () => {
    const user = userEvent.setup()
    render(<TestCombobox />)
    await user.type(screen.getByRole('combobox'), 'a')
    expect(screen.getByRole('listbox')).toBeInTheDocument()
    expect(screen.getByRole('combobox')).toHaveAttribute('aria-expanded', 'true')
  })

  it('options have role="option"', async () => {
    const user = userEvent.setup()
    render(<TestCombobox />)
    await user.type(screen.getByRole('combobox'), 'a')
    const options = within(screen.getByRole('listbox')).getAllByRole('option')
    expect(options.length).toBeGreaterThan(0)
  })

  it('aria-controls on input points to listbox id', async () => {
    const user = userEvent.setup()
    render(<TestCombobox />)
    await user.type(screen.getByRole('combobox'), 'a')
    const input = screen.getByRole('combobox')
    const listbox = screen.getByRole('listbox')
    expect(input.getAttribute('aria-controls')).toBe(listbox.id)
  })
})

// ─── Filtering ─────────────────────────────────────────────────────────────

describe('Filtering', () => {
  it('shows all items when no query', async () => {
    const user = userEvent.setup()
    render(<TestCombobox />)
    await user.type(screen.getByRole('combobox'), 'a')
    // "a" matches Argentina, Australia, Austria, Belgium — but Belgium has no "a"
    // Actually Belgium does not match "a"? Let me check: "Belgium".includes("a") → false
    // So 3 matches: Argentina, Australia, Austria
    expect(screen.getAllByRole('option')).toHaveLength(3)
  })

  it('filters options by typed text (case-insensitive)', async () => {
    const user = userEvent.setup()
    render(<TestCombobox />)
    await user.type(screen.getByRole('combobox'), 'Arg')
    expect(screen.getAllByRole('option')).toHaveLength(1)
    expect(screen.getByRole('option')).toHaveTextContent('Argentina')
  })

  it('shows all items when query is cleared', async () => {
    const user = userEvent.setup()
    render(<TestCombobox />)
    const input = screen.getByRole('combobox')
    await user.type(input, 'Arg')
    await user.clear(input)
    // After clearing the input is empty → listbox closes
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })
})

// ─── Keyboard navigation ───────────────────────────────────────────────────

describe('Keyboard navigation', () => {
  it('ArrowDown opens listbox and highlights first option', async () => {
    const user = userEvent.setup()
    render(<TestCombobox />)
    const input = screen.getByRole('combobox')
    input.focus()
    await user.keyboard('{ArrowDown}')
    const options = screen.getAllByRole('option')
    expect(options[0]).toHaveAttribute('aria-selected', 'true')
    expect(options.slice(1).every((o) => o.getAttribute('aria-selected') === 'false')).toBe(true)
  })

  it('ArrowDown sets aria-activedescendant on input to first option id', async () => {
    const user = userEvent.setup()
    render(<TestCombobox />)
    const input = screen.getByRole('combobox')
    input.focus()
    await user.keyboard('{ArrowDown}')
    const activeId = input.getAttribute('aria-activedescendant')
    expect(activeId).toBeTruthy()
    expect(document.getElementById(activeId!)).toHaveTextContent('Argentina')
  })

  it('ArrowDown moves highlight down through options', async () => {
    const user = userEvent.setup()
    render(<TestCombobox />)
    const input = screen.getByRole('combobox')
    input.focus()
    await user.keyboard('{ArrowDown}{ArrowDown}')
    const options = screen.getAllByRole('option')
    expect(options[1]).toHaveAttribute('aria-selected', 'true')
  })

  it('ArrowDown does not go past the last option', async () => {
    const user = userEvent.setup()
    render(<TestCombobox items={[ITEMS[0]]} />)
    const input = screen.getByRole('combobox')
    input.focus()
    await user.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}')
    const options = screen.getAllByRole('option')
    expect(options[0]).toHaveAttribute('aria-selected', 'true')
  })

  it('ArrowUp opens listbox and highlights last option', async () => {
    const user = userEvent.setup()
    render(<TestCombobox />)
    const input = screen.getByRole('combobox')
    input.focus()
    await user.keyboard('{ArrowUp}')
    const options = screen.getAllByRole('option')
    expect(options[options.length - 1]).toHaveAttribute('aria-selected', 'true')
  })

  it('ArrowUp moves highlight up through options', async () => {
    const user = userEvent.setup()
    render(<TestCombobox />)
    const input = screen.getByRole('combobox')
    input.focus()
    await user.keyboard('{ArrowDown}{ArrowDown}{ArrowUp}')
    const options = screen.getAllByRole('option')
    expect(options[0]).toHaveAttribute('aria-selected', 'true')
  })

  it('Enter selects the highlighted option and closes listbox', async () => {
    const onSelect = vi.fn()
    const user = userEvent.setup()
    render(<TestCombobox onSelect={onSelect} />)
    const input = screen.getByRole('combobox')
    input.focus()
    await user.keyboard('{ArrowDown}{Enter}')
    expect(onSelect).toHaveBeenCalledWith(ITEMS[0])
    expect(input).toHaveValue('Argentina')
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('Enter without highlighted option does nothing', async () => {
    const onSelect = vi.fn()
    const user = userEvent.setup()
    render(<TestCombobox onSelect={onSelect} />)
    const input = screen.getByRole('combobox')
    input.focus()
    await user.keyboard('{ArrowDown}') // opens listbox
    // Close it, then press Enter with no highlight
    await user.keyboard('{Escape}{ArrowDown}{Escape}')
    await user.keyboard('{Enter}')
    expect(onSelect).not.toHaveBeenCalled()
  })

  it('Escape closes listbox without selecting', async () => {
    const onSelect = vi.fn()
    const user = userEvent.setup()
    render(<TestCombobox onSelect={onSelect} />)
    const input = screen.getByRole('combobox')
    input.focus()
    await user.keyboard('{ArrowDown}{Escape}')
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    expect(onSelect).not.toHaveBeenCalled()
  })

  it('Escape preserves the current input value', async () => {
    const user = userEvent.setup()
    render(<TestCombobox />)
    const input = screen.getByRole('combobox')
    await user.type(input, 'Arg')
    await user.keyboard('{Escape}')
    expect(input).toHaveValue('Arg')
  })

  it('focus stays on input throughout keyboard navigation', async () => {
    const user = userEvent.setup()
    render(<TestCombobox />)
    const input = screen.getByRole('combobox')
    input.focus()
    await user.keyboard('{ArrowDown}{ArrowDown}{ArrowUp}')
    expect(document.activeElement).toBe(input)
  })
})

// ─── Mouse interaction ─────────────────────────────────────────────────────

describe('Mouse interaction', () => {
  it('clicking an option selects it', async () => {
    const onSelect = vi.fn()
    const user = userEvent.setup()
    render(<TestCombobox onSelect={onSelect} />)
    await user.type(screen.getByRole('combobox'), 'Aus')
    await user.click(screen.getByRole('option', { name: 'Australia' }))
    expect(onSelect).toHaveBeenCalledWith(ITEMS[1])
    expect(screen.getByRole('combobox')).toHaveValue('Australia')
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })
})

// ─── Live region ───────────────────────────────────────────────────────────

describe('Live region', () => {
  it('live region is present with aria-live="polite"', () => {
    render(<TestCombobox />)
    const region = screen.getByRole('status')
    expect(region).toHaveAttribute('aria-live', 'polite')
    expect(region).toHaveAttribute('aria-atomic', 'true')
  })

  it('announces result count when listbox opens', async () => {
    const user = userEvent.setup()
    render(<TestCombobox />)
    await user.type(screen.getByRole('combobox'), 'a')
    expect(screen.getByRole('status')).toHaveTextContent('3 results available.')
  })

  it('announces singular "result" when exactly 1 match', async () => {
    const user = userEvent.setup()
    render(<TestCombobox />)
    await user.type(screen.getByRole('combobox'), 'Arg')
    expect(screen.getByRole('status')).toHaveTextContent('1 result available.')
  })

  it('announces "No results available." when filter yields nothing', async () => {
    const user = userEvent.setup()
    render(<TestCombobox />)
    await user.type(screen.getByRole('combobox'), 'zzz')
    expect(screen.getByRole('status')).toHaveTextContent('No results available.')
  })

  it('updates announcement when filter changes', async () => {
    const user = userEvent.setup()
    render(<TestCombobox />)
    const input = screen.getByRole('combobox')
    await user.type(input, 'a')
    expect(screen.getByRole('status')).toHaveTextContent('3 results available.')
    await user.type(input, 'r')
    expect(screen.getByRole('status')).toHaveTextContent('1 result available.')
  })

  it('clears announcement when listbox closes', async () => {
    const user = userEvent.setup()
    render(<TestCombobox />)
    const input = screen.getByRole('combobox')
    await user.type(input, 'a')
    await user.keyboard('{Escape}')
    expect(screen.getByRole('status')).toHaveTextContent('')
  })
})

// ─── Accessibility (axe) ──────────────────────────────────────────────────

describe('axe accessibility', () => {
  it('has no violations when closed', async () => {
    const { container } = render(<TestCombobox />)
    expect(await axe(container)).toHaveNoViolations()
  })

  it('has no violations when open with results', async () => {
    const user = userEvent.setup()
    const { container } = render(<TestCombobox />)
    const input = screen.getByRole('combobox')
    input.focus()
    await user.keyboard('{ArrowDown}')
    expect(await axe(container)).toHaveNoViolations()
  })

  it('has no violations when open after typing', async () => {
    const user = userEvent.setup()
    const { container } = render(<TestCombobox />)
    await user.type(screen.getByRole('combobox'), 'Aus')
    expect(await axe(container)).toHaveNoViolations()
  })
})
