export type TabId = 'home' | 'map' | 'routes' | 'medic'

export interface Coordinates {
  latitude: number
  longitude: number
  accuracy?: number
}

export type IncidentType = 'theft' | 'assault' | 'harassment' | 'suspicious' | 'accident' | 'other'
export type IncidentSeverity = 'high' | 'medium' | 'low'

export interface Incident {
  id: string
  user_id: string | null
  title: string
  description: string | null
  incident_type: IncidentType
  severity: IncidentSeverity
  latitude: number
  longitude: number
  is_active: boolean
  reported_at: string
  resolved_at: string | null
}

export interface EmergencyContact {
  id: string
  user_id: string
  name: string
  phone: string
  relationship: string | null
  priority: number
  created_at?: string
}

export interface SOSAlert {
  id: string
  user_id: string
  latitude: number
  longitude: number
  status: 'active' | 'resolved' | 'false_alarm'
  contacts_notified: string[]
  created_at: string
  resolved_at: string | null
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export interface SafetyScore {
  score: number
  incidents_nearby: number
  risk_level: 'safe' | 'caution' | 'danger'
}
