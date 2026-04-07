import { useState, useEffect } from 'react'

export function useGeolocation(options = {}) {
  const [state, setState] = useState({
    loading: true,
    error: null,
    coords: null,
  })

  useEffect(() => {
    if (!navigator.geolocation) {
      setState({ loading: false, error: { code: 0, message: 'เบราว์เซอร์ไม่รองรับ GPS' }, coords: null })
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({ loading: false, error: null, coords: position.coords })
      },
      (err) => {
        setState({ loading: false, error: err, coords: null })
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 120000,
        ...options,
      }
    )
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return state
}
