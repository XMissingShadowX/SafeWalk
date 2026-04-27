'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { AlertTriangle, X, Video, Phone } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/lib/store'
import { useGeolocation } from '@/hooks/use-geolocation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

const HOLD_DURATION = 2000 // 2 seconds to activate

export function SOSButton() {
  const { sosActive, setSosActive, setSosAlert, contacts, setActiveTab } = useAppStore()
  const { coordinates } = useGeolocation({ watch: true })
  const [holdProgress, setHoldProgress] = useState(0)
  const [isHolding, setIsHolding] = useState(false)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [contactsNotified, setContactsNotified] = useState<string[]>([])
  
  const holdTimerRef = useRef<NodeJS.Timeout | null>(null)
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const clearTimers = useCallback(() => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current)
      holdTimerRef.current = null
    }
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current)
      progressIntervalRef.current = null
    }
  }, [])

  const activateSOS = useCallback(async () => {
    if (!coordinates) return
    
    setSosActive(true)
    setIsRecording(true)
    
    // Create SOS alert in database
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      const { data: alert } = await supabase
        .from('sos_alerts')
        .insert({
          user_id: user.id,
          latitude: coordinates.latitude,
          longitude: coordinates.longitude,
          status: 'active',
          contacts_notified: contacts.map(c => c.name),
        })
        .select()
        .single()
      
      if (alert) {
        setSosAlert(alert)
      }
      
      // Also create an incident for the community map
      await supabase.from('incidents').insert({
        user_id: user.id,
        title: 'SOS Alert',
        description: 'Emergency SOS triggered',
        incident_type: 'other',
        severity: 'high',
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
      })
    }
    
    // Simulate notifying contacts
    setContactsNotified(contacts.map(c => c.name))
    
    // Vibrate if supported
    if (navigator.vibrate) {
      navigator.vibrate([200, 100, 200, 100, 200])
    }
  }, [coordinates, contacts, setSosActive, setSosAlert])

  const handleHoldStart = useCallback(() => {
    if (sosActive) return
    
    setIsHolding(true)
    setHoldProgress(0)
    
    const startTime = Date.now()
    
    progressIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime
      const progress = Math.min((elapsed / HOLD_DURATION) * 100, 100)
      setHoldProgress(progress)
    }, 50)
    
    holdTimerRef.current = setTimeout(() => {
      clearTimers()
      setIsHolding(false)
      setHoldProgress(0)
      activateSOS()
    }, HOLD_DURATION)
  }, [sosActive, clearTimers, activateSOS])

  const handleHoldEnd = useCallback(() => {
    clearTimers()
    setIsHolding(false)
    setHoldProgress(0)
  }, [clearTimers])

  const cancelSOS = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      await supabase
        .from('sos_alerts')
        .update({ status: 'false_alarm', resolved_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .eq('status', 'active')
    }
    
    setSosActive(false)
    setSosAlert(null)
    setIsRecording(false)
    setContactsNotified([])
    setShowCancelDialog(false)
  }, [setSosActive, setSosAlert])

  useEffect(() => {
    return () => clearTimers()
  }, [clearTimers])

  if (sosActive) {
    return (
      <>
        <div className="fixed inset-0 z-50 bg-destructive/10 backdrop-blur-sm">
          <div className="flex flex-col items-center justify-center h-full px-6 pb-20">
            <div className="w-full max-w-sm space-y-6">
              {/* Recording indicator */}
              <div className="flex items-center justify-center gap-2 text-destructive">
                <div className="w-3 h-3 rounded-full bg-destructive recording-indicator" />
                <span className="font-semibold">SOS ACTIVE</span>
              </div>
              
              {/* Video recording simulation */}
              <div className="relative aspect-video bg-card rounded-lg overflow-hidden border-2 border-destructive">
                <div className="absolute inset-0 flex items-center justify-center">
                  <Video className="w-12 h-12 text-muted-foreground animate-pulse" />
                </div>
                {isRecording && (
                  <div className="absolute top-3 left-3 flex items-center gap-2 px-2 py-1 bg-destructive rounded text-xs text-destructive-foreground font-medium">
                    <div className="w-2 h-2 rounded-full bg-destructive-foreground recording-indicator" />
                    REC
                  </div>
                )}
              </div>
              
              {/* Location info */}
              {coordinates && (
                <div className="p-4 bg-card rounded-lg border border-border">
                  <p className="text-sm text-muted-foreground mb-1">Your location</p>
                  <p className="font-mono text-sm">
                    {coordinates.latitude.toFixed(6)}, {coordinates.longitude.toFixed(6)}
                  </p>
                </div>
              )}
              
              {/* Contacts notified */}
              {contactsNotified.length > 0 && (
                <div className="p-4 bg-card rounded-lg border border-border">
                  <p className="text-sm text-muted-foreground mb-2 flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    Contacts notified
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {contactsNotified.map((name) => (
                      <span key={name} className="px-2 py-1 bg-safe/20 text-safe rounded text-sm">
                        {name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Cancel button */}
              <Button
                variant="outline"
                size="lg"
                className="w-full border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                onClick={() => setShowCancelDialog(true)}
              >
                <X className="w-5 h-5 mr-2" />
                Cancel SOS
              </Button>
              
              {/* View on map */}
              <Button
                variant="secondary"
                size="lg"
                className="w-full"
                onClick={() => setActiveTab('map')}
              >
                View on Map
              </Button>
            </div>
          </div>
        </div>
        
        <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Cancel SOS Alert?</AlertDialogTitle>
              <AlertDialogDescription>
                This will mark the alert as a false alarm. Your emergency contacts have already been notified.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Keep Active</AlertDialogCancel>
              <AlertDialogAction onClick={cancelSOS} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Yes, Cancel SOS
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    )
  }

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 safe-area-bottom">
      <button
        onMouseDown={handleHoldStart}
        onMouseUp={handleHoldEnd}
        onMouseLeave={handleHoldEnd}
        onTouchStart={handleHoldStart}
        onTouchEnd={handleHoldEnd}
        className={cn(
          "relative w-20 h-20 rounded-full bg-destructive text-destructive-foreground",
          "flex items-center justify-center",
          "shadow-lg shadow-destructive/30",
          "transition-transform active:scale-95",
          isHolding && "sos-pulse"
        )}
        aria-label="Hold for 2 seconds to activate SOS"
      >
        {/* Progress ring */}
        {isHolding && (
          <svg className="absolute inset-0 w-full h-full -rotate-90">
            <circle
              cx="40"
              cy="40"
              r="36"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              strokeDasharray={`${2 * Math.PI * 36}`}
              strokeDashoffset={`${2 * Math.PI * 36 * (1 - holdProgress / 100)}`}
              className="opacity-50"
            />
          </svg>
        )}
        
        <div className="flex flex-col items-center">
          <AlertTriangle className="w-8 h-8" />
          <span className="text-xs font-bold mt-0.5">SOS</span>
        </div>
      </button>
      
      {isHolding && (
        <p className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-sm text-muted-foreground">
          Hold to activate...
        </p>
      )}
    </div>
  )
}
