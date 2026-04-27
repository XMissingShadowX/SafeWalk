'use client'

import { Home, Map, Navigation, MessageCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/lib/store'
import type { TabId } from '@/lib/types'

const tabs: { id: TabId; label: string; icon: typeof Home }[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'map', label: 'Map', icon: Map },
  { id: 'routes', label: 'Routes', icon: Navigation },
  { id: 'medic', label: 'AI Medic', icon: MessageCircle },
]

export function BottomNavigation() {
  const { activeTab, setActiveTab, sosActive } = useAppStore()

  return (
    <nav className={cn(
      "fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-md border-t border-border safe-area-bottom",
      sosActive && "opacity-50 pointer-events-none"
    )}>
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors",
                isActive 
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-foreground"
              )}
              aria-label={tab.label}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className={cn(
                "h-5 w-5 transition-transform",
                isActive && "scale-110"
              )} />
              <span className={cn(
                "text-xs font-medium",
                isActive && "font-semibold"
              )}>
                {tab.label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
