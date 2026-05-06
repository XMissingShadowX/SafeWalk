'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { Geolocation } from '@capacitor/geolocation'
import type { Coordinates } from '@/lib/types'

interface UseGeolocationOptions {
  watch?: boolean
  enableHighAccuracy?: boolean
  timeout?: number
  maximumAge?: number
}

interface GeolocationState {
  coordinates: Coordinates | null
  loading: boolean
  error: string | null
}

export function useGeolocation(options: UseGeolocationOptions = {}): GeolocationState {
  const {
    watch = false,
    enableHighAccuracy = true,
    timeout = 10000,
    maximumAge = 0,
  } = options

  const [state, setState] = useState<GeolocationState>({
    coordinates: null,
    loading: true,
    error: null,
  })

  const watchIdRef = useRef<string | null>(null)

  const onSuccess = useCallback((latitude: number, longitude: number, accuracy: number) => {
    setState({
      coordinates: { latitude, longitude, accuracy },
      loading: false,
      error: null,
    })
  }, [])

  const onError = useCallback((message: string) => {
    setState((prev) => ({ ...prev, loading: false, error: message }))
  }, [])

  useEffect(() => {
    const positionOptions = {
      enableHighAccuracy,
      timeout,
      maximumAge,
    }

    if (watch) {
      Geolocation.watchPosition(positionOptions, (position, err) => {
        if (err || !position) {
          onError('Unable to retrieve location.')
          return
        }
        onSuccess(position.coords.latitude, position.coords.longitude, position.coords.accuracy)
      }).then((id) => {
        watchIdRef.current = id
      }).catch(() => {
        onError('Location access denied. Enable location in settings.')
      })
    } else {
      Geolocation.getCurrentPosition(positionOptions)
        .then((position) => {
          onSuccess(position.coords.latitude, position.coords.longitude, position.coords.accuracy)
        })
        .catch(() => {
          onError('Location access denied. Enable location in settings.')
        })
    }

    return () => {
      if (watchIdRef.current !== null) {
        Geolocation.clearWatch({ id: watchIdRef.current })
        watchIdRef.current = null
      }
    }
  }, [watch, enableHighAccuracy, timeout, maximumAge, onSuccess, onError])

  return state
}