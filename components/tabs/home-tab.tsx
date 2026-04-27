'use client'

import { useEffect, useState } from 'react'
import { Shield, MapPin, Users, Plus, Trash2, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/lib/store'
import { useGeolocation } from '@/hooks/use-geolocation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { FieldGroup, Field, FieldLabel } from '@/components/ui/field'
import type { EmergencyContact } from '@/lib/types'

export function HomeTab() {
  const { coordinates, loading: locationLoading, error: locationError } = useGeolocation({ watch: true })
  const { setCurrentLocation, contacts, setContacts, nearbyIncidents } = useAppStore()
  const [showAddContact, setShowAddContact] = useState(false)
  const [newContact, setNewContact] = useState({ name: '', phone: '', relationship: '' })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (coordinates) {
      setCurrentLocation(coordinates)
    }
  }, [coordinates, setCurrentLocation])

  useEffect(() => {
    async function loadContacts() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        const { data } = await supabase
          .from('emergency_contacts')
          .select('*')
          .eq('user_id', user.id)
          .order('priority')
        
        if (data) {
          setContacts(data)
        }
      }
      setLoading(false)
    }
    
    loadContacts()
  }, [setContacts])

  const addContact = async () => {
    if (!newContact.name || !newContact.phone) return
    if (contacts.length >= 3) return
    
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      const { data, error } = await supabase
        .from('emergency_contacts')
        .insert({
          user_id: user.id,
          name: newContact.name,
          phone: newContact.phone,
          relationship: newContact.relationship || null,
          priority: contacts.length + 1,
        })
        .select()
        .single()
      
      if (data && !error) {
        setContacts([...contacts, data])
        setNewContact({ name: '', phone: '', relationship: '' })
        setShowAddContact(false)
      }
    }
  }

  const removeContact = async (contact: EmergencyContact) => {
    const supabase = createClient()
    await supabase.from('emergency_contacts').delete().eq('id', contact.id)
    setContacts(contacts.filter(c => c.id !== contact.id))
  }

  const nearbyDangerCount = nearbyIncidents.filter(i => i.severity === 'high').length

  return (
    <div className="flex flex-col gap-6 pb-40">
      {/* Status Banner */}
      <Card className={cn(
        "border-2",
        nearbyDangerCount > 0 
          ? "border-warning bg-warning/10" 
          : "border-safe bg-safe/10"
      )}>
        <CardContent className="flex items-center gap-4 p-4">
          <div className={cn(
            "p-3 rounded-full",
            nearbyDangerCount > 0 ? "bg-warning/20" : "bg-safe/20"
          )}>
            <Shield className={cn(
              "w-8 h-8",
              nearbyDangerCount > 0 ? "text-warning" : "text-safe"
            )} />
          </div>
          <div className="flex-1">
            <h2 className={cn(
              "font-semibold text-lg",
              nearbyDangerCount > 0 ? "text-warning" : "text-safe"
            )}>
              {nearbyDangerCount > 0 
                ? `${nearbyDangerCount} Alert${nearbyDangerCount > 1 ? 's' : ''} Nearby`
                : 'Area Appears Safe'
              }
            </h2>
            <p className="text-sm text-muted-foreground">
              {locationLoading 
                ? 'Getting your location...'
                : locationError 
                  ? locationError
                  : coordinates 
                    ? `${coordinates.latitude.toFixed(4)}, ${coordinates.longitude.toFixed(4)}`
                    : 'Enable location for safety features'
              }
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Location Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <MapPin className="w-5 h-5 text-primary" />
            Current Location
          </CardTitle>
        </CardHeader>
        <CardContent>
          {locationLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span>Acquiring GPS...</span>
            </div>
          ) : locationError ? (
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="w-4 h-4" />
              <span>{locationError}</span>
            </div>
          ) : coordinates ? (
            <div className="space-y-2">
              <p className="font-mono text-sm bg-muted px-3 py-2 rounded">
                {coordinates.latitude.toFixed(6)}, {coordinates.longitude.toFixed(6)}
              </p>
              <p className="text-xs text-muted-foreground">
                Your location is being tracked for safety features
              </p>
            </div>
          ) : (
            <p className="text-muted-foreground">Location not available</p>
          )}
        </CardContent>
      </Card>

      {/* Emergency Contacts */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="w-5 h-5 text-primary" />
              Emergency Contacts
            </CardTitle>
            <span className="text-sm text-muted-foreground">{contacts.length}/3</span>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <div className="flex items-center gap-2 text-muted-foreground py-4">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span>Loading contacts...</span>
            </div>
          ) : contacts.length === 0 ? (
            <div className="text-center py-6">
              <Users className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground mb-3">No emergency contacts yet</p>
              <p className="text-sm text-muted-foreground">
                Add up to 3 contacts who will be notified during SOS
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {contacts.map((contact, index) => (
                <div
                  key={contact.id}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{contact.name}</p>
                      <p className="text-sm text-muted-foreground">{contact.phone}</p>
                      {contact.relationship && (
                        <p className="text-xs text-muted-foreground">{contact.relationship}</p>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeContact(contact)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
          
          {contacts.length < 3 && (
            <Dialog open={showAddContact} onOpenChange={setShowAddContact}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Contact
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Emergency Contact</DialogTitle>
                  <DialogDescription>
                    This person will be notified when you trigger an SOS alert.
                  </DialogDescription>
                </DialogHeader>
                <FieldGroup>
                  <Field>
                    <FieldLabel>Name</FieldLabel>
                    <Input
                      placeholder="Contact name"
                      value={newContact.name}
                      onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                    />
                  </Field>
                  <Field>
                    <FieldLabel>Phone Number</FieldLabel>
                    <Input
                      type="tel"
                      placeholder="+1 (555) 000-0000"
                      value={newContact.phone}
                      onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                    />
                  </Field>
                  <Field>
                    <FieldLabel>Relationship (Optional)</FieldLabel>
                    <Select
                      value={newContact.relationship}
                      onValueChange={(value) => setNewContact({ ...newContact, relationship: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select relationship" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="parent">Parent</SelectItem>
                        <SelectItem value="spouse">Spouse</SelectItem>
                        <SelectItem value="sibling">Sibling</SelectItem>
                        <SelectItem value="friend">Friend</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                </FieldGroup>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowAddContact(false)}>
                    Cancel
                  </Button>
                  <Button onClick={addContact} disabled={!newContact.name || !newContact.phone}>
                    Add Contact
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </CardContent>
      </Card>

      {/* Quick Tips */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Safety Tips</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3 text-sm">
            <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-primary font-semibold text-xs">1</span>
            </div>
            <p className="text-muted-foreground">
              <strong className="text-foreground">Hold SOS for 2 seconds</strong> to activate emergency mode
            </p>
          </div>
          <div className="flex items-start gap-3 text-sm">
            <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-primary font-semibold text-xs">2</span>
            </div>
            <p className="text-muted-foreground">
              <strong className="text-foreground">Check the map</strong> for reported incidents near you
            </p>
          </div>
          <div className="flex items-start gap-3 text-sm">
            <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-primary font-semibold text-xs">3</span>
            </div>
            <p className="text-muted-foreground">
              <strong className="text-foreground">Use Safe Routes</strong> to avoid danger zones
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
