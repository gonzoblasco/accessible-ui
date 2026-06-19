import type { Meta, StoryObj } from '@storybook/react-vite'
import { Modal } from './modal'
import { useModal } from './use-modal'

// Stories need a wrapper because Modal.Root requires a state object from useModal
function ModalDemo({
  closeOnBackdropClick = true,
  triggerLabel = 'Open modal',
}: {
  closeOnBackdropClick?: boolean
  triggerLabel?: string
}) {
  const modal = useModal()
  return (
    <Modal.Root state={modal}>
      <Modal.Trigger className="rounded-lg bg-violet-600 px-4 py-2 text-white hover:bg-violet-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet-600">
        {triggerLabel}
      </Modal.Trigger>
      <Modal.Content closeOnBackdropClick={closeOnBackdropClick}>
        <Modal.Close />
        <Modal.Title>Confirm action</Modal.Title>
        <p className="mb-6 text-gray-600 dark:text-gray-400">
          Are you sure you want to proceed? This action cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={modal.close}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={modal.close}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700"
          >
            Confirm
          </button>
        </div>
      </Modal.Content>
    </Modal.Root>
  )
}

const meta: Meta<typeof ModalDemo> = {
  title: 'Components/Modal',
  component: ModalDemo,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Headless modal/dialog implementing the [ARIA dialog pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/). Focus is trapped inside the dialog and returned to the trigger on close.',
      },
    },
  },
  argTypes: {
    closeOnBackdropClick: { control: 'boolean' },
    triggerLabel: { control: 'text' },
  },
}

export default meta
type Story = StoryObj<typeof ModalDemo>

export const Default: Story = {
  args: {
    closeOnBackdropClick: true,
    triggerLabel: 'Open modal',
  },
}

export const NoBackdropClose: Story = {
  args: {
    closeOnBackdropClick: false,
    triggerLabel: 'Open (Esc only)',
  },
}
