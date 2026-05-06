'use client'

import { Home, Map, Route, Brain, ShieldCheck, Radio, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/lib/store'
import type { TabId } from '@/lib/types'

const tabs: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: 'home', label: 'Inicio', icon: Home },
  { id: 'before', label: 'Antes', icon: ShieldCheck },
  { id: 'map', label: 'Mapa', icon: Map },
  { id: 'during', label: 'Durante', icon: Radio },
  { id: 'after', label: 'Después', icon: CheckCircle },
  { id: 'routes', label: 'Rutas', icon: Route },
  { id: 'medic', label: 'Apoyo', icon: Brain },
]

export function BottomNavigation() {
  const { activeTab, setActiveTab } = useAppStore()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-sm border-t border-border safe-area-bottom">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2 overflow-x-auto gap-1">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex flex-col items-center gap-1 px-2 py-2 rounded-xl transition-colors flex-shrink-0',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className={cn('w-5 h-5', isActive && 'text-primary')} />
              <span className={cn('text-[10px] font-medium', isActive && 'text-primary')}>
                {tab.label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
