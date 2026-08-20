/**
 * Registers the offline shell.
 *
 * Production only, and deliberately so: a service worker in front of Vite's dev server serves
 * yesterday's module graph and turns every HMR update into a mystery.
 *
 * Registration is fire-and-forget after `load` — the app must never wait on it, and a browser
 * that refuses (private mode, no HTTPS, an old iOS) simply runs online-only.
 */
export function registerServiceWorker(): void {
  if (!import.meta.env.PROD) return
  if (!('serviceWorker' in navigator)) return

  window.addEventListener('load', () => {
    void navigator.serviceWorker.register('/sw.js').catch(() => undefined)
  })
}
