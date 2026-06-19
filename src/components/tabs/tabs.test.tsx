import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'jest-axe'
import { describe, expect, it } from 'vitest'
import { Tabs } from './tabs'
import { useTabs, type TabItem } from './use-tabs'

const TABS: TabItem[] = [
  { id: 'one', label: 'One' },
  { id: 'two', label: 'Two' },
  { id: 'three', label: 'Three' },
]

const TABS_WITH_DISABLED: TabItem[] = [
  { id: 'one', label: 'One' },
  { id: 'two', label: 'Two', disabled: true },
  { id: 'three', label: 'Three' },
]

function TestTabs({
  orientation = 'horizontal',
  defaultActiveId,
}: {
  orientation?: 'horizontal' | 'vertical'
  defaultActiveId?: string
}) {
  const state = useTabs({ tabs: TABS, orientation, defaultActiveId })
  return (
    <Tabs.Root state={state}>
      <Tabs.List>
        {TABS.map((t) => (
          <Tabs.Tab key={t.id} id={t.id}>
            {t.label}
          </Tabs.Tab>
        ))}
      </Tabs.List>
      <Tabs.Panels>
        {TABS.map((t) => (
          <Tabs.Panel key={t.id} id={t.id}>
            Panel {t.label}
          </Tabs.Panel>
        ))}
      </Tabs.Panels>
    </Tabs.Root>
  )
}

function TestTabsDisabled({ defaultActiveId }: { defaultActiveId?: string } = {}) {
  const state = useTabs({ tabs: TABS_WITH_DISABLED, defaultActiveId })
  return (
    <Tabs.Root state={state}>
      <Tabs.List>
        {TABS_WITH_DISABLED.map((t) => (
          <Tabs.Tab key={t.id} id={t.id} disabled={t.disabled}>
            {t.label}
          </Tabs.Tab>
        ))}
      </Tabs.List>
      <Tabs.Panels>
        {TABS_WITH_DISABLED.map((t) => (
          <Tabs.Panel key={t.id} id={t.id}>
            Panel {t.label}
          </Tabs.Panel>
        ))}
      </Tabs.Panels>
    </Tabs.Root>
  )
}

describe('Tabs', () => {
  it('renders tablist and tabs with correct roles', () => {
    render(<TestTabs />)
    expect(screen.getByRole('tablist')).toBeInTheDocument()
    expect(screen.getAllByRole('tab')).toHaveLength(3)
  })

  it('first tab is selected by default', () => {
    render(<TestTabs />)
    expect(screen.getByRole('tab', { name: 'One' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tab', { name: 'Two' })).toHaveAttribute('aria-selected', 'false')
  })

  it('shows only the active panel', () => {
    render(<TestTabs />)
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Panel One')
    expect(screen.queryByText('Panel Two')).not.toBeInTheDocument()
  })

  it('activates tab on click', async () => {
    const user = userEvent.setup()
    render(<TestTabs />)

    await user.click(screen.getByRole('tab', { name: 'Two' }))

    expect(screen.getByRole('tab', { name: 'Two' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Panel Two')
  })

  it('inactive tabs have tabIndex -1, active tab has tabIndex 0', () => {
    render(<TestTabs />)
    expect(screen.getByRole('tab', { name: 'One' })).toHaveAttribute('tabindex', '0')
    expect(screen.getByRole('tab', { name: 'Two' })).toHaveAttribute('tabindex', '-1')
  })

  it('ArrowRight moves to next tab', async () => {
    const user = userEvent.setup()
    render(<TestTabs />)

    screen.getByRole('tab', { name: 'One' }).focus()
    await user.keyboard('{ArrowRight}')

    expect(screen.getByRole('tab', { name: 'Two' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tab', { name: 'Two' })).toHaveFocus()
  })

  it('ArrowRight wraps to first tab from last', async () => {
    const user = userEvent.setup()
    render(<TestTabs defaultActiveId="three" />)

    screen.getByRole('tab', { name: 'Three' }).focus()
    await user.keyboard('{ArrowRight}')

    expect(screen.getByRole('tab', { name: 'One' })).toHaveAttribute('aria-selected', 'true')
  })

  it('ArrowLeft moves to previous tab', async () => {
    const user = userEvent.setup()
    render(<TestTabs defaultActiveId="two" />)

    screen.getByRole('tab', { name: 'Two' }).focus()
    await user.keyboard('{ArrowLeft}')

    expect(screen.getByRole('tab', { name: 'One' })).toHaveAttribute('aria-selected', 'true')
  })

  it('Home moves to first tab', async () => {
    const user = userEvent.setup()
    render(<TestTabs defaultActiveId="three" />)

    screen.getByRole('tab', { name: 'Three' }).focus()
    await user.keyboard('{Home}')

    expect(screen.getByRole('tab', { name: 'One' })).toHaveAttribute('aria-selected', 'true')
  })

  it('End moves to last tab', async () => {
    const user = userEvent.setup()
    render(<TestTabs />)

    screen.getByRole('tab', { name: 'One' }).focus()
    await user.keyboard('{End}')

    expect(screen.getByRole('tab', { name: 'Three' })).toHaveAttribute('aria-selected', 'true')
  })

  it('tab panel has aria-labelledby pointing to its tab', () => {
    render(<TestTabs />)
    const panel = screen.getByRole('tabpanel')
    const labelId = panel.getAttribute('aria-labelledby')!
    expect(document.getElementById(labelId)).toHaveTextContent('One')
  })

  it('has correct aria-controls on each tab', () => {
    render(<TestTabs />)
    const tab = screen.getByRole('tab', { name: 'One' })
    const panelId = tab.getAttribute('aria-controls')!
    expect(document.getElementById(panelId)).toBeInTheDocument()
  })

  it('vertical orientation uses ArrowUp/Down', async () => {
    const user = userEvent.setup()
    render(<TestTabs orientation="vertical" />)

    screen.getByRole('tab', { name: 'One' }).focus()
    await user.keyboard('{ArrowDown}')

    expect(screen.getByRole('tab', { name: 'Two' })).toHaveAttribute('aria-selected', 'true')
  })

  it('has no axe accessibility violations', async () => {
    const { container } = render(<TestTabs />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  describe('disabled tabs', () => {
    it('skips disabled tab on ArrowRight', async () => {
      const user = userEvent.setup()
      render(<TestTabsDisabled />)

      screen.getByRole('tab', { name: 'One' }).focus()
      await user.keyboard('{ArrowRight}')

      // "Two" is disabled, should land on "Three"
      expect(screen.getByRole('tab', { name: 'Three' })).toHaveAttribute('aria-selected', 'true')
      expect(screen.getByRole('tab', { name: 'Three' })).toHaveFocus()
    })

    it('skips disabled tab on ArrowLeft', async () => {
      const user = userEvent.setup()
      render(<TestTabsDisabled defaultActiveId="three" />)

      screen.getByRole('tab', { name: 'Three' }).focus()
      await user.keyboard('{ArrowLeft}')

      // "Two" is disabled, should land on "One"
      expect(screen.getByRole('tab', { name: 'One' })).toHaveAttribute('aria-selected', 'true')
      expect(screen.getByRole('tab', { name: 'One' })).toHaveFocus()
    })

    it('disabled tab has tabIndex -1', () => {
      render(<TestTabsDisabled />)
      expect(screen.getByRole('tab', { name: 'Two' })).toHaveAttribute('tabindex', '-1')
    })

    it('initial active tab skips disabled — first enabled tab is active', () => {
      render(<TestTabsDisabled />)
      // useTabs defaults to first non-disabled tab = "One"
      expect(screen.getByRole('tab', { name: 'One' })).toHaveAttribute('aria-selected', 'true')
    })
  })
})
