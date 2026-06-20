import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import {
  ComboboxInput,
  ComboboxLiveRegion,
  ComboboxListbox,
  ComboboxOption,
  ComboboxRoot,
} from './combobox'
import type { ComboboxItem } from './use-combobox'

// ─── Data ──────────────────────────────────────────────────────────────────

const COUNTRIES: ComboboxItem[] = [
  { id: '1', label: 'Argentina' },
  { id: '2', label: 'Australia' },
  { id: '3', label: 'Austria' },
  { id: '4', label: 'Belgium' },
  { id: '5', label: 'Brazil' },
  { id: '6', label: 'Canada' },
  { id: '7', label: 'Chile' },
  { id: '8', label: 'China' },
  { id: '9', label: 'Colombia' },
  { id: '10', label: 'Denmark' },
  { id: '11', label: 'Finland' },
  { id: '12', label: 'France' },
  { id: '13', label: 'Germany' },
  { id: '14', label: 'Greece' },
  { id: '15', label: 'India' },
  { id: '16', label: 'Ireland' },
  { id: '17', label: 'Italy' },
  { id: '18', label: 'Japan' },
  { id: '19', label: 'Mexico' },
  { id: '20', label: 'Netherlands' },
  { id: '21', label: 'New Zealand' },
  { id: '22', label: 'Norway' },
  { id: '23', label: 'Portugal' },
  { id: '24', label: 'South Korea' },
  { id: '25', label: 'Spain' },
  { id: '26', label: 'Sweden' },
  { id: '27', label: 'Switzerland' },
  { id: '28', label: 'United Kingdom' },
  { id: '29', label: 'United States' },
  { id: '30', label: 'Uruguay' },
]

// ─── Demo ──────────────────────────────────────────────────────────────────

function ComboboxDemo({
  label = 'Search country',
  placeholder = 'Type to search…',
}: {
  label?: string
  placeholder?: string
}) {
  const [selected, setSelected] = useState<ComboboxItem | null>(null)
  return (
    <div className="relative w-72 p-8">
      <ComboboxRoot items={COUNTRIES} onSelect={setSelected}>
        <label
          htmlFor="demo-input"
          className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          {label}
        </label>
        <ComboboxInput
          id="demo-input"
          placeholder={placeholder}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
        />
        <ComboboxListbox
          label="Countries"
          className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800"
        >
          {(item, index) => (
            <ComboboxOption
              key={item.id}
              item={item}
              index={index}
              className="cursor-pointer px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 aria-selected:bg-violet-600 aria-selected:text-white dark:text-gray-200 dark:hover:bg-gray-700"
            >
              {item.label}
            </ComboboxOption>
          )}
        </ComboboxListbox>
        <ComboboxLiveRegion />
      </ComboboxRoot>
      {selected && (
        <p className="mt-4 text-sm text-gray-500">
          Selected: <strong>{selected.label}</strong>
        </p>
      )}
    </div>
  )
}

// ─── Meta ──────────────────────────────────────────────────────────────────

const meta: Meta<typeof ComboboxDemo> = {
  title: 'Components/Combobox',
  component: ComboboxDemo,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Headless combobox implementing the [WAI-ARIA Editable Combobox with List Autocomplete](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/) pattern. Focus stays in the input at all times; `aria-activedescendant` tracks the highlighted option. Compound-component API — bring your own styles.',
      },
    },
  },
  argTypes: {
    label: { control: 'text', description: 'Visible label text above the input' },
    placeholder: { control: 'text', description: 'Placeholder text inside the input' },
  },
}

export default meta
type Story = StoryObj<typeof ComboboxDemo>

export const Default: Story = {
  args: {
    label: 'Search country',
    placeholder: 'Type to search…',
  },
}
