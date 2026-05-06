'use client'

import { useEffect, useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet'
import L from 'leaflet'
import { useAppStore } from '@/lib/store'
import type { Incident, Coordinates } from '@/lib/types'
import 'leaflet/dist/leaflet.css'

// Fix Leaflet default marker icons
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: () => string })._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

// Custom marker icons
const createIcon = (color: string) => new L.DivIcon({
  className: 'custom-marker',
  html: `
    <div style="
      width: 24px;
      height: 24px;
      background: ${color};
      border: 3px solid white;
      border-radius: 50%;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    "></div>
  `,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  popupAnchor: [0, -12],
})

const userIcon = new L.DivIcon({
  className: 'user-marker',
  html: `
    <div style="
      width: 20px;
      height: 20px;
      background: #4ade80;
      border: 4px solid white;
      border-radius: 50%;
      box-shadow: 0 0 0 4px rgba(74, 222, 128, 0.3), 0 2px 8px rgba(0,0,0,0.3);
    "></div>
  `,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
  popupAnchor: [0, -10],
})

const severityColors: Record<string, string> = {
  high: '#ef4444',
  medium: '#f59e0b',
  low: '#3b82f6',
}

const incidentTypeLabels: Record<string, string> = {
  theft: 'Theft',
  assault: 'Assault',
  harassment: 'Harassment',
  suspicious: 'Suspicious Activity',
  accident: 'Accident',
  other: 'Other',
}

interface MapUpdaterProps {
  center: Coordinates
  zoom: number
}

function MapUpdater({ center, zoom }: MapUpdaterProps) {
  const map = useMap()
  
  useEffect(() => {
    map.setView([center.latitude, center.longitude], zoom)
  }, [map, center, zoom])
  
  return null
}

interface IncidentMapProps {
  incidents: Incident[]
  userLocation: Coordinates | null
  onMapClick?: (coords: Coordinates) => void
  showHeatZones?: boolean
}

export function IncidentMap({ 
  incidents, 
  userLocation, 
  onMapClick,
  showHeatZones = true 
}: IncidentMapProps) {
  const { mapCenter, mapZoom, setMapCenter, setMapZoom } = useAppStore()

  const center = useMemo(() => {
    if (userLocation) {
      return userLocation
    }
    return mapCenter
  }, [userLocation, mapCenter])

  // Group incidents by proximity for heat zones
  const heatZones = useMemo(() => {
    if (!showHeatZones) return []
    
    const highSeverity = incidents.filter(i => i.severity === 'high')
    return highSeverity.map(incident => ({
      center: [incident.latitude, incident.longitude] as [number, number],
      radius: 200, // 200 meters
      color: '#ef4444',
    }))
  }, [incidents, showHeatZones])

  return (
    <MapContainer
      center={[center.latitude, center.longitude]}
      zoom={mapZoom}
      className="h-full w-full rounded-lg"
      zoomControl={false}
      attributionControl={false}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />
      
      <MapUpdater center={center} zoom={mapZoom} />
      
      {/* Heat zones for high severity areas */}
      {heatZones.map((zone, index) => (
        <Circle
          key={`zone-${index}`}
          center={zone.center}
          radius={zone.radius}
          pathOptions={{
            color: zone.color,
            fillColor: zone.color,
            fillOpacity: 0.2,
            weight: 1,
          }}
        />
      ))}
      
      {/* User location marker */}
      {userLocation && (
        <Marker
          position={[userLocation.latitude, userLocation.longitude]}
          icon={userIcon}
        >
          <Popup>
            <div className="text-center p-1">
              <strong>You are here</strong>
            </div>
          </Popup>
        </Marker>
      )}
      
      {/* Incident markers */}
      {incidents.map((incident) => (
        <Marker
          key={incident.id}
          position={[incident.latitude, incident.longitude]}
          icon={createIcon(severityColors[incident.severity] || severityColors.low)}
        >
          <Popup>
            <div className="p-2 min-w-[200px]">
              <div className="flex items-center gap-2 mb-2">
                <span 
                  className="w-3 h-3 rounded-full"
                  style={{ background: severityColors[incident.severity] }}
                />
                <strong className="text-sm">{incident.title}</strong>
              </div>
              <p className="text-xs text-gray-600 mb-1">
                {incidentTypeLabels[incident.incident_type]}
              </p>
              {incident.description && (
                <p className="text-xs text-gray-500 mb-2">{incident.description}</p>
              )}
              <p className="text-xs text-gray-400">
                {new Date(incident.reported_at).toLocaleString()}
              </p>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
