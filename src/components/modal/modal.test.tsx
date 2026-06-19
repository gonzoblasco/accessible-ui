import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'jest-axe'
import { describe, expect, it, vi } from 'vitest'
import { Modal } from './modal'
import { useModal } from './use-modal'

// ─── Test fixtures ─────────────────────────────────────────────────────────

function TestModal({
  closeOnBackdropClick = true,
  onClose,
}: {
  closeOnBackdropClick?: boolean
  onClose?: () => void
}) {
  const modal = useModal()
  return (
    <Modal.Root state={modal}>
      <Modal.Trigger>Open</Modal.Trigger>
      <Modal.Content closeOnBackdropClick={closeOnBackdropClick}>
        <Modal.Close onClick={onClose} />
        <Modal.Title>Test dialog</Modal.Title>
        <Modal.Description>Dialog body</Modal.Description>
        <button type="button" onClick={modal.close}>
          Confirm
        </button>
      </Modal.Content>
    </Modal.Root>
  )
}

// ─── Tests ─────────────────────────────────────────────────────────────────

describe('Modal', () => {
  it('is not visible on initial render', () => {
    render(<TestModal />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('opens when trigger is clicked', async () => {
    const user = userEvent.setup()
    render(<TestModal />)

    await user.click(screen.getByRole('button', { name: 'Open' }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  describe('ARIA attributes', () => {
    it('has aria-modal, aria-labelledby, and aria-describedby when open', async () => {
      const user = userEvent.setup()
      render(<TestModal />)

      await user.click(screen.getByRole('button', { name: 'Open' }))

      const dialog = screen.getByRole('dialog')
      expect(dialog).toHaveAttribute('aria-modal', 'true')

      const titleId = dialog.getAttribute('aria-labelledby')!
      expect(titleId).toBeTruthy()
      expect(document.getElementById(titleId)).toHaveTextContent('Test dialog')

      const descriptionId = dialog.getAttribute('aria-describedby')!
      expect(descriptionId).toBeTruthy()
      expect(document.getElementById(descriptionId)).toHaveTextContent('Dialog body')
    })

    it('wires aria-describedby to Modal.Description', async () => {
      const user = userEvent.setup()
      render(<TestModal />)

      await user.click(screen.getByRole('button', { name: 'Open' }))

      const dialog = screen.getByRole('dialog')
      const descriptionId = dialog.getAttribute('aria-describedby')!
      const descEl = document.getElementById(descriptionId)
      expect(descEl?.tagName).toBe('P')
      expect(descEl).toHaveTextContent('Dialog body')
    })
  })

  describe('Keyboard behavior', () => {
    it('closes on Escape key', async () => {
      const user = userEvent.setup()
      render(<TestModal />)

      await user.click(screen.getByRole('button', { name: 'Open' }))
      expect(screen.getByRole('dialog')).toBeInTheDocument()

      await user.keyboard('{Escape}')
      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    })

    it('returns focus to trigger after closing with Escape', async () => {
      const user = userEvent.setup()
      render(<TestModal />)

      const trigger = screen.getByRole('button', { name: 'Open' })
      await user.click(trigger)
      await user.keyboard('{Escape}')

      await waitFor(() => expect(trigger).toHaveFocus())
    })

    it('returns focus to trigger after closing with close button', async () => {
      const user = userEvent.setup()
      render(<TestModal />)

      const trigger = screen.getByRole('button', { name: 'Open' })
      await user.click(trigger)
      await user.click(screen.getByRole('button', { name: 'Close dialog' }))

      await waitFor(() => expect(trigger).toHaveFocus())
    })

    it('traps Tab focus within the dialog', async () => {
      const user = userEvent.setup()
      render(<TestModal />)

      await user.click(screen.getByRole('button', { name: 'Open' }))

      // Dialog opens with focus on first focusable element (Close dialog)
      expect(screen.getByRole('button', { name: 'Close dialog' })).toHaveFocus()

      // Tab forward through all elements
      await user.tab()
      expect(screen.getByRole('button', { name: 'Confirm' })).toHaveFocus()

      // Tab wraps back to first
      await user.tab()
      expect(screen.getByRole('button', { name: 'Close dialog' })).toHaveFocus()
    })

    it('traps Shift+Tab focus within the dialog', async () => {
      const user = userEvent.setup()
      render(<TestModal />)

      await user.click(screen.getByRole('button', { name: 'Open' }))

      // Shift+Tab from first focusable wraps to last
      screen.getByRole('button', { name: 'Close dialog' }).focus()
      await user.tab({ shift: true })
      expect(screen.getByRole('button', { name: 'Confirm' })).toHaveFocus()
    })
  })

  describe('Background inert', () => {
    it('marks background content as inert and aria-hidden while open', async () => {
      const user = userEvent.setup()
      // Render the app root in a sibling div, as it would be in a real app
      const appRoot = document.createElement('div')
      appRoot.id = 'app-root'
      document.body.appendChild(appRoot)

      const { unmount } = render(<TestModal />, { container: appRoot })

      await user.click(screen.getByRole('button', { name: 'Open' }))

      expect(appRoot).toHaveAttribute('inert')
      expect(appRoot).toHaveAttribute('aria-hidden', 'true')

      await user.keyboard('{Escape}')
      await waitFor(() => {
        expect(appRoot).not.toHaveAttribute('inert')
        expect(appRoot).not.toHaveAttribute('aria-hidden')
      })

      unmount()
      document.body.removeChild(appRoot)
    })

    it('removes inert from background after close button click', async () => {
      const user = userEvent.setup()
      const appRoot = document.createElement('div')
      document.body.appendChild(appRoot)

      const { unmount } = render(<TestModal />, { container: appRoot })

      await user.click(screen.getByRole('button', { name: 'Open' }))
      expect(appRoot).toHaveAttribute('inert')

      await user.click(screen.getByRole('button', { name: 'Close dialog' }))
      await waitFor(() => expect(appRoot).not.toHaveAttribute('inert'))

      unmount()
      document.body.removeChild(appRoot)
    })
  })

  describe('Close behavior', () => {
    it('closes when close button is clicked', async () => {
      const user = userEvent.setup()
      render(<TestModal />)

      await user.click(screen.getByRole('button', { name: 'Open' }))
      await user.click(screen.getByRole('button', { name: 'Close dialog' }))

      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    })

    it('calls onClick callback when close button is clicked', async () => {
      const user = userEvent.setup()
      const onClose = vi.fn()
      render(<TestModal onClose={onClose} />)

      await user.click(screen.getByRole('button', { name: 'Open' }))
      await user.click(screen.getByRole('button', { name: 'Close dialog' }))

      expect(onClose).toHaveBeenCalledOnce()
      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    })

    it('does NOT close on backdrop click when closeOnBackdropClick=false', async () => {
      const user = userEvent.setup()
      const { container } = render(<TestModal closeOnBackdropClick={false} />)

      await user.click(screen.getByRole('button', { name: 'Open' }))

      const backdrop = container.querySelector('.fixed') as HTMLElement
      await user.click(backdrop)

      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })
  })

  describe('Scroll lock', () => {
    it('prevents body scroll when open and restores on close', async () => {
      const user = userEvent.setup()
      render(<TestModal />)

      await user.click(screen.getByRole('button', { name: 'Open' }))
      expect(document.body.style.overflow).toBe('hidden')

      await user.keyboard('{Escape}')
      await waitFor(() => expect(document.body.style.overflow).toBe(''))
    })
  })

  describe('Accessibility (axe)', () => {
    it('has no violations when closed', async () => {
      const { container } = render(<TestModal />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('has no violations when open', async () => {
      const user = userEvent.setup()
      render(<TestModal />)

      await user.click(screen.getByRole('button', { name: 'Open' }))
      const results = await axe(document.body)
      expect(results).toHaveNoViolations()
    })
  })
})
