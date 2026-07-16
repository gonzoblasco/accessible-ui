/* @refresh reset */
/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  type KeyboardEvent,
  type PropsWithChildren,
  type ReactNode,
} from 'react'
import { type UseTabsReturn } from './use-tabs'

// ─── Context ───────────────────────────────────────────────────────────────

const TabsContext = createContext<UseTabsReturn | null>(null)

function useTabsContext() {
  const ctx = useContext(TabsContext)
  if (!ctx) throw new Error('Tabs compound components must be used inside <Tabs.Root>')
  return ctx
}

// ─── Root ──────────────────────────────────────────────────────────────────

interface RootProps extends PropsWithChildren {
  state: UseTabsReturn
  className?: string
}

function Root({ state, children, className }: RootProps) {
  return (
    <TabsContext.Provider value={state}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  )
}

// ─── List ──────────────────────────────────────────────────────────────────

interface ListProps {
  className?: string
  children: ReactNode
}

function List({ children, className }: ListProps) {
  const { orientation, tabs, getTabId } = useTabsContext()

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      const enabledTabs = tabs.filter((t) => !t.disabled)

      const isHorizontal = orientation === 'horizontal'
      const prevKey = isHorizontal ? 'ArrowLeft' : 'ArrowUp'
      const nextKey = isHorizontal ? 'ArrowRight' : 'ArrowDown'

      const focusedEl = document.activeElement
      const currentIdx = enabledTabs.findIndex(
        (t) => document.getElementById(getTabId(t.id)) === focusedEl,
      )
      if (currentIdx === -1) return

      let nextIdx: number | null = null

      if (e.key === nextKey) {
        nextIdx = (currentIdx + 1) % enabledTabs.length
      } else if (e.key === prevKey) {
        nextIdx = (currentIdx - 1 + enabledTabs.length) % enabledTabs.length
      } else if (e.key === 'Home') {
        nextIdx = 0
      } else if (e.key === 'End') {
        nextIdx = enabledTabs.length - 1
      }

      if (nextIdx !== null) {
        e.preventDefault()
        document.getElementById(getTabId(enabledTabs[nextIdx].id))?.focus()
      }
    },
    [orientation, tabs, getTabId],
  )

  return (
    // eslint-disable-next-line jsx-a11y/interactive-supports-focus
    <div
      role="tablist"
      aria-orientation={orientation}
      onKeyDown={handleKeyDown}
      className={className ?? (orientation === 'vertical'
        ? 'flex flex-col border-r border-gray-200 dark:border-gray-700'
        : 'flex border-b border-gray-200 dark:border-gray-700'
      )}
    >
      {children}
    </div>
  )
}

// ─── Tab ───────────────────────────────────────────────────────────────────

interface TabProps {
  id: string
  children: ReactNode
  className?: string
  disabled?: boolean
}

function Tab({ id, children, className, disabled }: TabProps) {
  const { activeId, setActiveId, getTabId, getPanelId } = useTabsContext()
  const isActive = activeId === id

  // Space→click is handled natively by the browser on <button>; only Enter needs explicit handling.
  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      setActiveId(id)
    }
  }

  return (
    <button
      id={getTabId(id)}
      role="tab"
      type="button"
      aria-selected={isActive}
      aria-controls={getPanelId(id)}
      tabIndex={isActive ? 0 : -1}
      disabled={disabled}
      onClick={() => !disabled && setActiveId(id)}
      onKeyDown={handleKeyDown}
      className={
        className ??
        [
          'px-4 py-2 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet-600',
          isActive
            ? 'border-b-2 border-violet-600 text-violet-600 dark:border-violet-400 dark:text-violet-400'
            : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200',
          disabled ? 'cursor-not-allowed opacity-40' : '',
        ].join(' ')
      }
    >
      {children}
    </button>
  )
}

// ─── Panels ────────────────────────────────────────────────────────────────

interface PanelsProps {
  children: ReactNode
  className?: string
}

function Panels({ children, className }: PanelsProps) {
  return <div className={className ?? 'pt-4'}>{children}</div>
}

// ─── Panel ─────────────────────────────────────────────────────────────────

interface PanelProps {
  id: string
  children: ReactNode
  className?: string
}

function Panel({ id, children, className }: PanelProps) {
  const { activeId, getTabId, getPanelId } = useTabsContext()
  const isActive = activeId === id

  if (!isActive) return null

  return (
    <div
      id={getPanelId(id)}
      role="tabpanel"
      aria-labelledby={getTabId(id)}
      tabIndex={0}
      className={className ?? 'text-gray-700 outline-none dark:text-gray-300'}
    >
      {children}
    </div>
  )
}

// ─── Exports ───────────────────────────────────────────────────────────────

export const Tabs = { Root, List, Tab, Panels, Panel }
