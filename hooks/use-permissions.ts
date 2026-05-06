'use client'
import { useState, useEffect, useCallback } from 'react'
import { Camera } from '@capacitor/camera'
import { Geolocation } from '@capacitor/geolocation'
import { LocalNotifications } from '@capacitor/local-notifications'

export type PermissionName = 'geolocation' | 'notifications' | 'camera' | 'microphone'
export interface PermissionState {
  geolocation: PermissionStatus['state'] | 'unknown'
  notifications: PermissionStatus['state'] | 'unknown'
  camera: PermissionStatus['state'] | 'unknown'
  microphone: PermissionStatus['state'] | 'unknown'
}

export function usePermissions() {
  const [permissions, setPermissions] = useState<PermissionState>({
    geolocation: 'unknown',
    notifications: 'unknown',
    camera: 'unknown',
    microphone: 'unknown',
  })
  const [allGranted, setAllGranted] = useState(false)

  const checkPermission = useCallback(async (name: PermissionName) => {
    try {
      if (name === 'geolocation') {
        const result = await Geolocation.checkPermissions()
        return result.location === 'granted' ? 'granted' : result.location === 'denied' ? 'denied' : 'prompt'
      }
      if (name === 'camera' || name === 'microphone') {
        const result = await Camera.checkPermissions()
        if (name === 'camera') {
          return result.camera === 'granted' ? 'granted' : result.camera === 'denied' ? 'denied' : 'prompt'
        }
        // micrófono via navegador
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
          stream.getTracks().forEach(t => t.stop())
          return 'granted'
        } catch {
          return 'denied'
        }
      }
      if (name === 'notifications') {
        const result = await LocalNotifications.checkPermissions()
        return result.display === 'granted' ? 'granted' : result.display === 'denied' ? 'denied' : 'prompt'
      }
      return 'unknown' as PermissionStatus['state']
    } catch {
      return 'unknown' as PermissionStatus['state']
    }
  }, [])

  const requestGeolocation = useCallback(async () => {
    try {
      const result = await Geolocation.requestPermissions()
      return result.location === 'granted'
    } catch {
      return false
    }
  }, [])

  const requestNotifications = useCallback(async () => {
    try {
      const result = await LocalNotifications.requestPermissions()
      return result.display === 'granted'
    } catch {
      return false
    }
  }, [])

  const requestCamera = useCallback(async () => {
    try {
      const result = await Camera.requestPermissions({ permissions: ['camera'] })
      return result.camera === 'granted'
    } catch {
      return false
    }
  }, [])

  const requestMicrophone = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.getTracks().forEach(t => t.stop())
      return true
    } catch {
      return false
    }
  }, [])

  const requestAll = useCallback(async () => {
    const [geo, notif, cam, mic] = await Promise.all([
      requestGeolocation(),
      requestNotifications(),
      requestCamera(),
      requestMicrophone(),
    ])
    const newState: PermissionState = {
      geolocation: geo ? 'granted' : 'denied',
      notifications: notif ? 'granted' : 'denied',
      camera: cam ? 'granted' : 'denied',
      microphone: mic ? 'granted' : 'denied',
    }
    setPermissions(newState)
    setAllGranted(geo && notif)
    return newState
  }, [requestGeolocation, requestNotifications, requestCamera, requestMicrophone])

  useEffect(() => {
    const check = async () => {
      const [geo, notif, cam, mic] = await Promise.all([
        checkPermission('geolocation'),
        checkPermission('notifications'),
        checkPermission('camera'),
        checkPermission('microphone'),
      ])
      const state = { geolocation: geo, notifications: notif, camera: cam, microphone: mic }
      setPermissions(state)
      setAllGranted(geo === 'granted' && notif === 'granted')
    }
    check()
  }, [checkPermission])

  return { permissions, allGranted, requestAll, requestGeolocation, requestNotifications, requestCamera, requestMicrophone }
}