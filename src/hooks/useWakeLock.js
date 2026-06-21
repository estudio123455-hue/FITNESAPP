import { useCallback, useEffect, useRef } from 'react'

export default function useWakeLock() {
  const sentinelRef = useRef(null)

  const acquire = useCallback(async () => {
    try {
      if (sentinelRef.current) return
      if (!navigator.wakeLock) return
      sentinelRef.current = await navigator.wakeLock.request('screen')
      sentinelRef.current.addEventListener('release', () => {
        sentinelRef.current = null
      })
    } catch {
      // wake lock not available
    }
  }, [])

  const release = useCallback(() => {
    try {
      if (sentinelRef.current) {
        sentinelRef.current.release()
        sentinelRef.current = null
      }
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    return () => release()
  }, [release])

  return { acquire, release }
}
