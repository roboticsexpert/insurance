import { useEffect, useState } from 'react'

/**
 * Seconds remaining until `iso`, ticking every second.
 *
 * The countdown is real, not decorative: the price on screen is the stored one, and it stops
 * being purchasable when this reaches zero. Recomputed from the deadline each tick rather than
 * decremented, so a backgrounded tab that misses timer ticks still shows the truth on return.
 */
export function useCountdown(iso: string): number {
  const deadline = Date.parse(iso)
  const [remaining, setRemaining] = useState(() =>
    Math.max(0, Math.floor((deadline - Date.now()) / 1000)),
  )

  useEffect(() => {
    const tick = () => setRemaining(Math.max(0, Math.floor((deadline - Date.now()) / 1000)))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [deadline])

  return remaining
}
