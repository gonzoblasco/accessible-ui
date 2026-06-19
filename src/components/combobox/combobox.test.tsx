import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'jest-axe'
import { describe, expect, it, vi } from 'vitest'
import { Combobox } from './combobox'
import { useCombobox, type ComboboxItem } from './use-combobox'

// ─── Fixture ───────────────────────────────────────────────────────────────

const ITEMS: ComboboxItem[] = [
  { id: '1', label: 'Argentina' },
  { id: '2', label: 'Australia' },
  { id: '3', label: 'Austria' },
]

function makeFetcher(items: ComboboxItem[] = ITEMS) {
  return vi.fn().mockResolvedValue(items)
}

function TestCombobox({
  fetcher = makeFetcher(),
  onSelect = vi.fn(),
}: {
  fetcher?: ReturnType<typeof makeFetcher>
  onSelect?: ReturnType<typeof vi.fn>
}) {
  const state = useCombobox({ fetcher, debounceMs: 0, onSelect })
  return <Combobox state={state} label="Country" placeholder="Search…" />
}

// ─── Tests ─────────────────────────────────────────────────────────────────

describe('Combobox', () => {
  it('renders input with correct ARIA attributes', () => {
    render(<TestCombobox />)
    const input = screen.getByRole('combobox')
    expect(input).toHaveAttribute('aria-expanded', 'false')
    expect(input).toHaveAttribute('aria-autocomplete', 'list')
    expect(input).toHaveAttribute('aria-controls')
  })

  it('opens listbox after typing', async () => {
    const user = userEvent.setup()
    render(<TestCombobox />)

    await user.type(screen.getByRole('combobox'), 'a')

    await waitFor(() => expect(screen.getByRole('listbox')).toBeInTheDocument())
    expect(screen.getByRole('combobox')).toHaveAttribute('aria-expanded', 'true')
  })

  it('shows fetched options', async () => {
    const user = userEvent.setup()
    render(<TestCombobox />)

    await user.type(screen.getByRole('combobox'), 'a')

    await waitFor(() => {
      expect(screen.getAllByRole('option').some((o) => o.textContent === 'Argentina')).toBe(true)
    })
  })

  it('announces result count via live region', async () => {
    const user = userEvent.setup()
    render(<TestCombobox />)

    await user.type(screen.getByRole('combobox'), 'a')

    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent('3 results available')
    })
  })

  it('ArrowDown highlights first option', async () => {
    const user = userEvent.setup()
    render(<TestCombobox />)

    await user.type(screen.getByRole('combobox'), 'a')
    await waitFor(() => screen.getByRole('listbox'))

    await user.keyboard('{ArrowDown}')

    await waitFor(() => {
      const options = screen.getAllByRole('option')
      expect(options[0]).toHaveAttribute('aria-selected', 'true')
    })
  })

  it('ArrowDown updates aria-activedescendant on input', async () => {
    const user = userEvent.setup()
    render(<TestCombobox />)

    await user.type(screen.getByRole('combobox'), 'a')
    await waitFor(() => screen.getByRole('listbox'))

    await user.keyboard('{ArrowDown}')

    await waitFor(() => {
      const input = screen.getByRole('combobox')
      const activeId = input.getAttribute('aria-activedescendant')
      expect(activeId).toBeTruthy()
      expect(document.getElementById(activeId!)).toHaveTextContent('Argentina')
    })
  })

  it('Enter selects highlighted option', async () => {
    const onSelect = vi.fn()
    const user = userEvent.setup()
    render(<TestCombobox onSelect={onSelect} />)

    await user.type(screen.getByRole('combobox'), 'a')
    await waitFor(() => screen.getByRole('listbox'))

    await user.keyboard('{ArrowDown}')
    await user.keyboard('{Enter}')

    expect(onSelect).toHaveBeenCalledWith(ITEMS[0])
    expect(screen.getByRole('combobox')).toHaveValue('Argentina')
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('clicking an option selects it', async () => {
    const onSelect = vi.fn()
    const user = userEvent.setup()
    render(<TestCombobox onSelect={onSelect} />)

    await user.type(screen.getByRole('combobox'), 'a')
    await waitFor(() => screen.getByRole('listbox'))

    await user.click(screen.getByRole('option', { name: 'Australia' }))

    expect(onSelect).toHaveBeenCalledWith(ITEMS[1])
    expect(screen.getByRole('combobox')).toHaveValue('Australia')
  })

  it('Escape closes the listbox without selecting', async () => {
    const user = userEvent.setup()
    render(<TestCombobox />)

    await user.type(screen.getByRole('combobox'), 'a')
    await waitFor(() => screen.getByRole('listbox'))

    await user.keyboard('{Escape}')

    await waitFor(() => expect(screen.queryByRole('listbox')).not.toBeInTheDocument())
    expect(screen.getByRole('combobox')).toHaveValue('a')
  })

  it('shows error state when fetcher rejects', async () => {
    const errorFetcher = vi.fn().mockRejectedValue(new Error('Network error'))
    const user = userEvent.setup()
    render(<TestCombobox fetcher={errorFetcher} />)

    await user.type(screen.getByRole('combobox'), 'x')

    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent('Something went wrong')
    })
  })

  it('shows no-results message when fetcher returns empty array', async () => {
    const emptyFetcher = vi.fn().mockResolvedValue([])
    const user = userEvent.setup()
    render(<TestCombobox fetcher={emptyFetcher} />)

    await user.type(screen.getByRole('combobox'), 'xyz')

    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent('No results found')
    })
  })

  it('cancels stale responses when typing quickly', async () => {
    let callCount = 0
    const slowFetcher = vi.fn().mockImplementation(() => {
      callCount++
      const thisCall = callCount
      return new Promise<ComboboxItem[]>((resolve) =>
        setTimeout(() => resolve(thisCall === 1 ? ITEMS : [{ id: '99', label: 'Only' }]), 50),
      )
    })

    const user = userEvent.setup()
    render(<TestCombobox fetcher={slowFetcher} />)

    await user.type(screen.getByRole('combobox'), 'ab')

    await waitFor(() => {
      const options = screen.queryAllByRole('option')
      // Only results from the LAST call should show
      expect(options.some((o) => o.textContent === 'Only')).toBe(true)
      expect(options.some((o) => o.textContent === 'Argentina')).toBe(false)
    })
  })

  it('has no axe accessibility violations (closed)', async () => {
    const { container } = render(<TestCombobox />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('has no axe accessibility violations (open with results)', async () => {
    const user = userEvent.setup()
    const { container } = render(<TestCombobox />)

    await user.type(screen.getByRole('combobox'), 'a')
    await waitFor(() => screen.getByRole('listbox'))

    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
