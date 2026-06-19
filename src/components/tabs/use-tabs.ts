import { useCallback, useId, useState } from 'react'

export type Orientation = 'horizontal' | 'vertical'

export interface TabItem {
  id: string
  label: string
  disabled?: boolean
}

export interface UseTabsOptions {
  tabs: TabItem[]
  defaultActiveId?: string
  orientation?: Orientation
}

export interface UseTabsReturn {
  activeId: string
  setActiveId: (id: string) => void
  orientation: Orientation
  baseId: string
  tabs: TabItem[]
  getTabId: (id: string) => string
  getPanelId: (id: string) => string
}

export function useTabs({
  tabs,
  defaultActiveId,
  orientation = 'horizontal',
}: UseTabsOptions): UseTabsReturn {
  const baseId = useId()
  const [activeId, setActiveId] = useState(
    defaultActiveId ?? tabs.find((t) => !t.disabled)?.id ?? tabs[0]?.id,
  )

  const getTabId = useCallback((id: string) => `${baseId}-tab-${id}`, [baseId])
  const getPanelId = useCallback((id: string) => `${baseId}-panel-${id}`, [baseId])

  return { activeId, setActiveId, orientation, baseId, tabs, getTabId, getPanelId }
}
