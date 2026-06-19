import type { Meta, StoryObj } from '@storybook/react-vite'
import { Tabs } from './tabs'
import { useTabs, type TabItem } from './use-tabs'

const DEMO_TABS: TabItem[] = [
  { id: 'account', label: 'Account' },
  { id: 'password', label: 'Password' },
  { id: 'billing', label: 'Billing' },
  { id: 'notifications', label: 'Notifications', disabled: true },
]

function TabsDemo({
  orientation = 'horizontal',
  defaultActiveId = 'account',
}: {
  orientation?: 'horizontal' | 'vertical'
  defaultActiveId?: string
}) {
  const tabs = useTabs({ tabs: DEMO_TABS, orientation, defaultActiveId })

  const panelContent: Record<string, string> = {
    account: 'Manage your account details and preferences.',
    password: 'Change your password and security settings.',
    billing: 'View and update your billing information.',
    notifications: 'This tab is disabled.',
  }

  return (
    <Tabs.Root
      state={tabs}
      className={orientation === 'vertical' ? 'flex gap-6' : undefined}
    >
      <Tabs.List
        className={
          orientation === 'vertical'
            ? 'flex flex-col gap-1 border-r border-gray-200 pr-4 dark:border-gray-700'
            : undefined
        }
      >
        {DEMO_TABS.map((t) => (
          <Tabs.Tab key={t.id} id={t.id} disabled={t.disabled}>
            {t.label}
          </Tabs.Tab>
        ))}
      </Tabs.List>
      <Tabs.Panels>
        {DEMO_TABS.map((t) => (
          <Tabs.Panel key={t.id} id={t.id}>
            <p>{panelContent[t.id]}</p>
          </Tabs.Panel>
        ))}
      </Tabs.Panels>
    </Tabs.Root>
  )
}

const meta: Meta<typeof TabsDemo> = {
  title: 'Components/Tabs',
  component: TabsDemo,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Headless tabs implementing the [ARIA tabs pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/). Arrow keys navigate between tabs; Tab/Shift+Tab moves in/out of the tab list.',
      },
    },
  },
  argTypes: {
    orientation: { control: 'radio', options: ['horizontal', 'vertical'] },
    defaultActiveId: {
      control: 'select',
      options: DEMO_TABS.filter((t) => !t.disabled).map((t) => t.id),
    },
  },
}

export default meta
type Story = StoryObj<typeof TabsDemo>

export const Horizontal: Story = {
  args: { orientation: 'horizontal', defaultActiveId: 'account' },
}

export const Vertical: Story = {
  args: { orientation: 'vertical', defaultActiveId: 'account' },
}
