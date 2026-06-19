import type { Meta, StoryObj } from '@storybook/react-vite'
import { Combobox } from './combobox'
import { useCombobox, type ComboboxItem } from './use-combobox'

// ─── Simulated async data ──────────────────────────────────────────────────

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

function simulateFetch(query: string, delayMs = 600): Promise<ComboboxItem[]> {
  return new Promise((resolve) =>
    setTimeout(() => {
      const q = query.toLowerCase()
      resolve(COUNTRIES.filter((c) => c.label.toLowerCase().includes(q)))
    }, delayMs),
  )
}

function simulateError(): Promise<ComboboxItem[]> {
  return new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Network error')), 600),
  )
}

// ─── Wrappers ─────────────────────────────────────────────────────────────

function DefaultDemo() {
  const state = useCombobox({ fetcher: simulateFetch })
  return (
    <div className="p-8">
      <Combobox state={state} label="Search country" placeholder="Type to search…" />
      {state.selectedItem && (
        <p className="mt-4 text-sm text-gray-500">
          Selected: <strong>{state.selectedItem.label}</strong>
        </p>
      )}
    </div>
  )
}

function ErrorDemo() {
  const state = useCombobox({ fetcher: simulateError })
  return (
    <div className="p-8">
      <Combobox state={state} label="Search (always errors)" placeholder="Type anything…" />
    </div>
  )
}

// ─── Meta ─────────────────────────────────────────────────────────────────

const meta: Meta = {
  title: 'Components/Combobox',
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Headless async combobox implementing [ARIA combobox pattern 1.2](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/). Focus stays in the input; `aria-activedescendant` tracks the highlighted option. Supports debounced async fetching with stale-response cancellation.',
      },
    },
  },
}

export default meta

export const Default: StoryObj = { render: () => <DefaultDemo /> }
export const WithError: StoryObj = { render: () => <ErrorDemo /> }
