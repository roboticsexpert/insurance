import { useEffect, useState } from 'react'

/**
 * Whether the browser thinks it has a network.
 *
 * `navigator.onLine` is only trustworthy in one direction: `false` means definitely offline,
 * while `true` merely means an interface is up — a captive hotel wifi reports `true` and
 * routes nothing. So this drives a *banner*, never a decision to skip a request. The requests
 * still go out and still fail honestly; the banner only explains why.
 */
export function useOnline(): boolean {
  const [online, setOnline] = useState(() => navigator.onLine)

  useEffect(() => {
    const goOnline = () => setOnline(true)
    const goOffline = () => setOnline(false)

    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)
    // The events can fire between first render and this effect attaching.
    setOnline(navigator.onLine)

    return () => {
      window.removeEventListener('online', goOnline)
      window.removeEventListener('offline', goOffline)
    }
  }, [])

  return online
}
