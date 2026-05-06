'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
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

  const watchIdRef = useRef<number | null>(null)

  const onSuccess = useCallback((position: GeolocationPosition) => {
    setState({
      coordinates: {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
      },
      loading: false,
      error: null,
    })
  }, [])

  const onError = useCallback((error: GeolocationPositionError) => {
    let message = 'Unable to retrieve location'
    switch (error.code) {
      case error.PERMISSION_DENIED:
        message = 'Location access denied. Enable location in settings.'
        break
      case error.POSITION_UNAVAILABLE:
        message = 'Location information unavailable.'
        break
      case error.TIMEOUT:
        message = 'Location request timed out.'
        break
    }
    setState((prev) => ({ ...prev, loading: false, error: message }))
  }, [])

  useEffect(() => {
    if (!navigator.geolocation) {
      setState({ coordinates: null, loading: false, error: 'Geolocation not supported.' })
      return
    }

    const positionOptions: PositionOptions = {
      enableHighAccuracy,
      timeout,
      maximumAge,
    }

    if (watch) {
      watchIdRef.current = navigator.geolocation.watchPosition(onSuccess, onError, positionOptions)
    } else {
      navigator.geolocation.getCurrentPosition(onSuccess, onError, positionOptions)
    }

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
        watchIdRef.current = null
      }
    }
  }, [watch, enableHighAccuracy, timeout, maximumAge, onSuccess, onError])

  return state
}
