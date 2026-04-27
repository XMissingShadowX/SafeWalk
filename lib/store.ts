import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { TabId, Coordinates, Incident, EmergencyContact, SOSAlert } from './types'

interface AppState {
  // Navigation
  activeTab: TabId
  setActiveTab: (tab: TabId) => void

  // Location
  currentLocation: Coordinates | null
  setCurrentLocation: (location: Coordinates) => void

  // Map
  mapCenter: Coordinates
  mapZoom: number
  setMapCenter: (center: Coordinates) => void
  setMapZoom: (zoom: number) => void

  // Incidents
  nearbyIncidents: Incident[]
  setNearbyIncidents: (incidents: Incident[]) => void

  // Contacts
  contacts: EmergencyContact[]
  setContacts: (contacts: EmergencyContact[]) => void

  // SOS
  sosActive: boolean
  setSosActive: (active: boolean) => void
  sosAlert: SOSAlert | null
  setSosAlert: (alert: SOSAlert | null) => void

  // Routes
  routeOrigin: Coordinates | null
  routeDestination: Coordinates | null
  setRouteOrigin: (origin: Coordinates | null) => void
  setRouteDestination: (destination: Coordinates | null) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // Navigation
      activeTab: 'home',
      setActiveTab: (tab) => set({ activeTab: tab }),

      // Location
      currentLocation: null,
      setCurrentLocation: (location) => set({ currentLocation: location }),

      // Map
      mapCenter: { latitude: 20.9674, longitude: -89.6231 }, // Default center
      mapZoom: 14,
      setMapCenter: (center) => set({ mapCenter: center }),
      setMapZoom: (zoom) => set({ mapZoom: zoom }),

      // Incidents
      nearbyIncidents: [],
      setNearbyIncidents: (incidents) => set({ nearbyIncidents: incidents }),

      // Contacts
      contacts: [],
      setContacts: (contacts) => set({ contacts }),

      // SOS
      sosActive: false,
      setSosActive: (active) => set({ sosActive: active }),
      sosAlert: null,
      setSosAlert: (alert) => set({ sosAlert: alert }),

      // Routes
      routeOrigin: null,
      routeDestination: null,
      setRouteOrigin: (origin) => set({ routeOrigin: origin }),
      setRouteDestination: (destination) => set({ routeDestination: destination }),
    }),
    {
      name: 'safewalk-store',
      partialize: (state) => ({
        contacts: state.contacts,
        mapCenter: state.mapCenter,
        mapZoom: state.mapZoom,
      }),
    }
  )
)
