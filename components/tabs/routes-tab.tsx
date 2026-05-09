'use client'

import { useState, useEffect, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { Navigation, MapPin, AlertTriangle, Clock, Shield, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/lib/store'
import { useGeolocation } from '@/hooks/use-geolocation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { FieldGroup, Field, FieldLabel } from '@/components/ui/field'
import type { Coordinates, SafetyScore } from '@/lib/types'

// Dynamic import for map
const IncidentMap = dynamic(
  () => import('@/components/incident-map').then(mod => mod.IncidentMap),
  { 
    ssr: false,
    loading: () => (
      <div className="h-full w-full flex items-center justify-center bg-muted rounded-lg">
        <div className="flex items-center gap-2 text-muted-foreground">
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span>Loading map...</span>
        </div>
      </div>
    )
  }
)

interface RouteOption {
  id: string
  name: string
  distance: string
  duration: string
  safetyScore: SafetyScore
  incidentsOnRoute: number
}

// Calculate safety score based on nearby incidents
function calculateSafetyScore(
  destination: Coordinates,
  incidents: { latitude: number; longitude: number; severity: string }[]
): SafetyScore {
  // Simple distance calculation (Haversine would be more accurate)
  const nearbyIncidents = incidents.filter(inc => {
    const latDiff = Math.abs(inc.latitude - destination.latitude)
    const lngDiff = Math.abs(inc.longitude - destination.longitude)
    return latDiff < 0.01 && lngDiff < 0.01 // Roughly within 1km
  })
  
  const highSeverity = nearbyIncidents.filter(i => i.severity === 'high').length
  const mediumSeverity = nearbyIncidents.filter(i => i.severity === 'medium').length
  const lowSeverity = nearbyIncidents.filter(i => i.severity === 'low').length
  
  // Score calculation (100 is safest)
  let score = 100
  score -= highSeverity * 25
  score -= mediumSeverity * 10
  score -= lowSeverity * 5
  score = Math.max(0, Math.min(100, score))
  
  let riskLevel: 'safe' | 'caution' | 'danger' = 'safe'
  if (score < 50) riskLevel = 'danger'
  else if (score < 75) riskLevel = 'caution'
  
  return {
    score,
    incidents_nearby: nearbyIncidents.length,
    risk_level: riskLevel,
  }
}

// Mock saved locations
const savedLocations = [
  { id: '1', name: 'Home', address: '123 Main St' },
  { id: '2', name: 'Work', address: '456 Office Blvd' },
]

export function RoutesTab() {
  const { coordinates } = useGeolocation({ watch: true })
  const { nearbyIncidents, routeOrigin, routeDestination, setRouteOrigin, setRouteDestination, currentLocation } = useAppStore()
  
  const [destinationInput, setDestinationInput] = useState('')
  const [showRoutes, setShowRoutes] = useState(false)
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null)

  // Set origin to current location
  useEffect(() => {
    if (coordinates && !routeOrigin) {
      setRouteOrigin(coordinates)
    }
  }, [coordinates, routeOrigin, setRouteOrigin])

  // Mock route options based on destination
  const routeOptions: RouteOption[] = useMemo(() => {
    if (!routeDestination) return []
    
    const safetyScore = calculateSafetyScore(routeDestination, nearbyIncidents)
    
    // Generate mock routes with varying safety scores
    return [
      {
        id: 'safest',
        name: 'Safest Route',
        distance: '2.3 km',
        duration: '28 min',
        safetyScore: {
          score: Math.min(100, safetyScore.score + 15),
          incidents_nearby: Math.max(0, safetyScore.incidents_nearby - 2),
          risk_level: safetyScore.score + 15 >= 75 ? 'safe' : 'caution',
        },
        incidentsOnRoute: Math.max(0, safetyScore.incidents_nearby - 2),
      },
      {
        id: 'fastest',
        name: 'Fastest Route',
        distance: '1.8 km',
        duration: '22 min',
        safetyScore: safetyScore,
        incidentsOnRoute: safetyScore.incidents_nearby,
      },
      {
        id: 'alternate',
        name: 'Alternate Route',
        distance: '2.1 km',
        duration: '25 min',
        safetyScore: {
          score: Math.max(0, safetyScore.score - 10),
          incidents_nearby: safetyScore.incidents_nearby + 1,
          risk_level: safetyScore.score - 10 < 50 ? 'danger' : safetyScore.score - 10 < 75 ? 'caution' : 'safe',
        },
        incidentsOnRoute: safetyScore.incidents_nearby + 1,
      },
    ]
  }, [routeDestination, nearbyIncidents])

  const handleSearch = () => {
    if (!destinationInput) return
    
    // For demo, create a destination slightly offset from current location
    if (coordinates) {
      setRouteDestination({
        latitude: coordinates.latitude + 0.01,
        longitude: coordinates.longitude + 0.01,
      })
      setShowRoutes(true)
      setSelectedRoute('safest')
    }
  }

  const handleQuickSelect = (location: typeof savedLocations[0]) => {
    setDestinationInput(location.address)
    if (coordinates) {
      setRouteDestination({
        latitude: coordinates.latitude + (Math.random() * 0.02 - 0.01),
        longitude: coordinates.longitude + (Math.random() * 0.02 - 0.01),
      })
      setShowRoutes(true)
      setSelectedRoute('safest')
    }
  }

  const resetRoute = () => {
    setDestinationInput('')
    setRouteDestination(null)
    setShowRoutes(false)
    setSelectedRoute(null)
  }

  const getSafetyColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'safe': return 'text-safe'
      case 'caution': return 'text-warning'
      case 'danger': return 'text-destructive'
      default: return 'text-muted-foreground'
    }
  }

  const getSafetyBg = (riskLevel: string) => {
    switch (riskLevel) {
      case 'safe': return 'bg-safe/10 border-safe'
      case 'caution': return 'bg-warning/10 border-warning'
      case 'danger': return 'bg-destructive/10 border-destructive'
      default: return 'bg-muted'
    }
  }

  return (
    <div className="flex flex-col gap-4 pb-40">
      {/* Search / Input */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Navigation className="w-5 h-5 text-primary" />
            Plan Safe Route
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Origin */}
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <div className="w-3 h-3 rounded-full bg-safe" />
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">From</p>
              <p className="text-sm font-medium">
                {coordinates 
                  ? 'Current Location' 
                  : 'Waiting for location...'}
              </p>
            </div>
          </div>
          
          {/* Destination */}
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <div className="w-3 h-3 rounded-full bg-primary" />
            <div className="flex-1">
              <Input
                placeholder="Where are you going?"
                value={destinationInput}
                onChange={(e) => setDestinationInput(e.target.value)}
                className="border-0 bg-transparent p-0 h-auto focus-visible:ring-0"
              />
            </div>
          </div>
          
          {/* Quick select saved locations */}
          <div className="flex gap-2 flex-wrap">
            {savedLocations.map((loc) => (
              <Button
                key={loc.id}
                variant="outline"
                size="sm"
                onClick={() => handleQuickSelect(loc)}
              >
                <MapPin className="w-3 h-3 mr-1" />
                {loc.name}
              </Button>
            ))}
          </div>
          
          <div className="flex gap-2">
            {showRoutes ? (
              <Button variant="outline" onClick={resetRoute} className="flex-1">
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </Button>
            ) : (
              <Button onClick={handleSearch} className="flex-1" disabled={!destinationInput || !coordinates}>
                Find Safe Routes
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Map Preview */}
      {showRoutes && (
        <div className="h-48 rounded-lg overflow-hidden">
          <IncidentMap
            incidents={nearbyIncidents}
            userLocation={currentLocation || coordinates || null}
            showHeatZones={true}
          />
        </div>
      )}
      
      {/* Route Options */}
      {showRoutes && routeOptions.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground">Route Options</h3>
          
          {routeOptions.map((route) => (
            <Card 
              key={route.id}
              className={cn(
                "cursor-pointer transition-all border-2",
                selectedRoute === route.id 
                  ? getSafetyBg(route.safetyScore.risk_level)
                  : "border-transparent hover:border-border"
              )}
              onClick={() => setSelectedRoute(route.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-semibold flex items-center gap-2">
                      {route.name}
                      {route.id === 'safest' && (
                        <Shield className="w-4 h-4 text-safe" />
                      )}
                    </h4>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                      <span>{route.distance}</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {route.duration}
                      </span>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className={cn(
                      "text-2xl font-bold",
                      getSafetyColor(route.safetyScore.risk_level)
                    )}>
                      {route.safetyScore.score}
                    </div>
                    <p className="text-xs text-muted-foreground">Safety Score</p>
                  </div>
                </div>
                
                {route.incidentsOnRoute > 0 && (
                  <div className="flex items-center gap-2 text-sm text-warning">
                    <AlertTriangle className="w-4 h-4" />
                    <span>
                      {route.incidentsOnRoute} incident{route.incidentsOnRoute > 1 ? 's' : ''} near route
                    </span>
                  </div>
                )}
                
                {route.safetyScore.risk_level === 'safe' && route.incidentsOnRoute === 0 && (
                  <div className="flex items-center gap-2 text-sm text-safe">
                    <Shield className="w-4 h-4" />
                    <span>No incidents reported on this route</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      {/* Start Navigation */}
      {showRoutes && selectedRoute && (
        <Button size="lg" className="w-full">
          <Navigation className="w-5 h-5 mr-2" />
          Start Navigation
        </Button>
      )}
      
      {/* Tips when no route selected */}
      {!showRoutes && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <h4 className="font-medium flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              Route Safety Tips
            </h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-safe mt-2 flex-shrink-0" />
                Choose routes with higher safety scores when possible
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-warning mt-2 flex-shrink-0" />
                Avoid areas with recent high-severity incidents
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                Well-lit main roads are generally safer at night
              </li>
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
