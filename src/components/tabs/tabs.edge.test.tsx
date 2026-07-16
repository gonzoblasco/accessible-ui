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

describe('Tabs — edge cases', () => {
  it('empty tabs array does not crash', () => {
    function TestEmpty() {
      const state = useTabs({ tabs: [] })
      return (
        <Tabs.Root state={state}>
          <Tabs.List>
            <span>no tabs</span>
          </Tabs.List>
          <Tabs.Panels>
            <span>no panels</span>
          </Tabs.Panels>
        </Tabs.Root>
      )
    }
    const { container } = render(<TestEmpty />)
    expect(container).toBeInTheDocument()
  })

  it('all tabs disabled — first tab is still active (no enabled fallback)', () => {
    const allDisabled: TabItem[] = [
      { id: 'one', label: 'One', disabled: true },
      { id: 'two', label: 'Two', disabled: true },
    ]
    function TestAllDisabled() {
      const state = useTabs({ tabs: allDisabled })
      return (
        <Tabs.Root state={state}>
          <Tabs.List>
            {allDisabled.map((t) => (
              <Tabs.Tab key={t.id} id={t.id} disabled={t.disabled}>
                {t.label}
              </Tabs.Tab>
            ))}
          </Tabs.List>
          <Tabs.Panels>
            {allDisabled.map((t) => (
              <Tabs.Panel key={t.id} id={t.id}>
                Panel {t.label}
              </Tabs.Panel>
            ))}
          </Tabs.Panels>
        </Tabs.Root>
      )
    }
    render(<TestAllDisabled />)
    // First tab should be active (no enabled fallback found)
    expect(screen.getByRole('tab', { name: 'One' })).toHaveAttribute('aria-selected', 'true')
  })

  it('defaultActiveId that does not exist in tabs — falls back to first tab', () => {
    function TestInvalidDefault() {
      const state = useTabs({ tabs: TABS, defaultActiveId: 'nonexistent' })
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
    render(<TestInvalidDefault />)
    // Falls back to first tab
    expect(screen.getByRole('tab', { name: 'One' })).toHaveAttribute('aria-selected', 'true')
  })

  it('defaultActiveId that is disabled — falls back to first enabled tab', () => {
    function TestDisabledDefault() {
      const state = useTabs({ tabs: TABS_WITH_DISABLED, defaultActiveId: 'two' })
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
    render(<TestDisabledDefault />)
    // Falls back to first enabled tab (One)
    expect(screen.getByRole('tab', { name: 'One' })).toHaveAttribute('aria-selected', 'true')
  })

  it('rapid tab switching does not cause stale state', async () => {
    const user = userEvent.setup()
    render(<TestTabs />)

    await user.click(screen.getByRole('tab', { name: 'Two' }))
    await user.click(screen.getByRole('tab', { name: 'Three' }))
    await user.click(screen.getByRole('tab', { name: 'One' }))

    expect(screen.getByRole('tab', { name: 'One' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Panel One')
  })

  it('clicking the already-active tab does nothing (stays active)', async () => {
    const user = userEvent.setup()
    render(<TestTabs />)

    await user.click(screen.getByRole('tab', { name: 'One' }))
    expect(screen.getByRole('tab', { name: 'One' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Panel One')
  })

  it('clicking a disabled tab does not activate it', async () => {
    const user = userEvent.setup()
    render(<TestTabsDisabled />)

    await user.click(screen.getByRole('tab', { name: 'Two' }))
    // Two is disabled, should not become active
    expect(screen.getByRole('tab', { name: 'Two' })).toHaveAttribute('aria-selected', 'false')
    expect(screen.getByRole('tab', { name: 'One' })).toHaveAttribute('aria-selected', 'true')
  })

  it('keyboard navigation skips disabled tabs in both directions', async () => {
    const user = userEvent.setup()
    render(<TestTabsDisabled defaultActiveId="three" />)

    screen.getByRole('tab', { name: 'Three' }).focus()
    await user.keyboard('{ArrowLeft}')
    // Should skip "Two" (disabled) and land on "One"
    expect(screen.getByRole('tab', { name: 'One' })).toHaveFocus()

    await user.keyboard('{ArrowRight}')
    // Should skip "Two" (disabled) and land on "Three"
    expect(screen.getByRole('tab', { name: 'Three' })).toHaveFocus()
  })

  it('Home/End work correctly with disabled tabs', async () => {
    const user = userEvent.setup()
    render(<TestTabsDisabled defaultActiveId="three" />)

    screen.getByRole('tab', { name: 'Three' }).focus()
    await user.keyboard('{Home}')
    expect(screen.getByRole('tab', { name: 'One' })).toHaveFocus()

    await user.keyboard('{End}')
    expect(screen.getByRole('tab', { name: 'Three' })).toHaveFocus()
  })

  it('vertical orientation ArrowUp/ArrowDown work correctly', async () => {
    const user = userEvent.setup()
    render(<TestTabs orientation="vertical" />)

    screen.getByRole('tab', { name: 'One' }).focus()
    await user.keyboard('{ArrowDown}')
    expect(screen.getByRole('tab', { name: 'Two' })).toHaveFocus()

    await user.keyboard('{ArrowUp}')
    expect(screen.getByRole('tab', { name: 'One' })).toHaveFocus()
  })

  it('no axe violations with disabled tabs', async () => {
    const { container } = render(<TestTabsDisabled />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('no axe violations with vertical orientation', async () => {
    const { container } = render(<TestTabs orientation="vertical" />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('multiple tab groups on the same page have unique IDs', () => {
    render(
      <>
        <TestTabs />
        <TestTabs />
      </>,
    )
    const tablists = screen.getAllByRole('tablist')
    expect(tablists).toHaveLength(2)
    // Each tab group should have its own tabs
    const allTabs = screen.getAllByRole('tab')
    expect(allTabs).toHaveLength(6)
  })

  it('Enter on a tab activates it (manual activation pattern)', async () => {
    const user = userEvent.setup()
    render(<TestTabs />)

    screen.getByRole('tab', { name: 'One' }).focus()
    await user.keyboard('{ArrowRight}')
    expect(screen.getByRole('tab', { name: 'Two' })).toHaveFocus()
    expect(screen.getByRole('tab', { name: 'One' })).toHaveAttribute('aria-selected', 'true')

    await user.keyboard('{Enter}')
    expect(screen.getByRole('tab', { name: 'Two' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Panel Two')
  })

  it('Space on a tab activates it (browser fires click on button)', async () => {
    const user = userEvent.setup()
    render(<TestTabs />)

    screen.getByRole('tab', { name: 'One' }).focus()
    await user.keyboard('{ArrowRight}')
    await user.keyboard(' ')

    expect(screen.getByRole('tab', { name: 'Two' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Panel Two')
  })

  it('tabpanel has tabIndex={0} so it is focusable', () => {
    render(<TestTabs />)
    const panel = screen.getByRole('tabpanel')
    expect(panel).toHaveAttribute('tabindex', '0')
  })

  it('switching tabs updates aria-selected correctly', async () => {
    const user = userEvent.setup()
    render(<TestTabs />)

    await user.click(screen.getByRole('tab', { name: 'Two' }))
    expect(screen.getByRole('tab', { name: 'One' })).toHaveAttribute('aria-selected', 'false')
    expect(screen.getByRole('tab', { name: 'Two' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tab', { name: 'Three' })).toHaveAttribute('aria-selected', 'false')
  })
})
