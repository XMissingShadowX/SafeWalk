'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '@/lib/store'
import { useGeolocation } from '@/hooks/use-geolocation'
import { createClient } from '@/lib/supabase/client'
import { BottomNavigation } from './bottom-navigation'
import { SOSButton } from './sos-button'
import { HomeTab } from './tabs/home-tab'
import { MapTab } from './tabs/map-tab'
import { RoutesTab } from './tabs/routes-tab'
import { MedicTab } from './tabs/medic-tab'
import { Shield, Settings, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { User } from '@supabase/supabase-js'

export function AppShell() {
  const { activeTab, setCurrentLocation, setNearbyIncidents } = useAppStore()
  const { coordinates } = useGeolocation({ watch: true })
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    if (coordinates) {
      setCurrentLocation(coordinates)
    }
  }, [coordinates, setCurrentLocation])

  useEffect(() => {
    const supabase = createClient()
    
    // Get initial user
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
    })
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null)
    })
    
    // Load incidents
    const loadIncidents = async () => {
      const { data } = await supabase
        .from('incidents')
        .select('*')
        .eq('is_active', true)
        .order('reported_at', { ascending: false })
        .limit(100)
      
      if (data) {
        setNearbyIncidents(data)
      }
    }
    
    loadIncidents()
    
    // Subscribe to real-time incident updates
    const channel = supabase
      .channel('incidents-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'incidents' }, () => {
        loadIncidents()
      })
      .subscribe()
    
    return () => {
      subscription.unsubscribe()
      supabase.removeChannel(channel)
    }
  }, [setNearbyIncidents])

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/auth/login'
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border safe-area-top">
        <div className="flex items-center justify-between h-14 px-4 max-w-lg mx-auto">
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            <span className="font-bold text-lg">SafeWalk</span>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Settings className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {user && (
                <>
                  <DropdownMenuItem className="text-xs text-muted-foreground">
                    {user.email}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-lg mx-auto px-4 py-4">
          {activeTab === 'home' && <HomeTab />}
          {activeTab === 'map' && <MapTab />}
          {activeTab === 'routes' && <RoutesTab />}
          {activeTab === 'medic' && <MedicTab />}
        </div>
      </main>

      {/* SOS Button */}
      <SOSButton />

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  )
}
