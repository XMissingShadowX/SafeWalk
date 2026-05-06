'use client'

import { useState, useEffect, useCallback } from 'react'

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
      if (name === 'notifications') {
        const state = Notification.permission === 'granted' ? 'granted'
          : Notification.permission === 'denied' ? 'denied' : 'prompt'
        return state as PermissionStatus['state']
      }
      const result = await navigator.permissions.query({ name: name as PermissionDescriptor['name'] })
      return result.state
    } catch {
      return 'unknown' as PermissionStatus['state']
    }
  }, [])

  const requestGeolocation = useCallback(() => {
    return new Promise<boolean>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        () => resolve(true),
        () => resolve(false),
        { enableHighAccuracy: true }
      )
    })
  }, [])

  const requestNotifications = useCallback(async () => {
    try {
      const result = await Notification.requestPermission()
      return result === 'granted'
    } catch {
      return false
    }
  }, [])

  const requestCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      stream.getTracks().forEach(t => t.stop())
      return true
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
