import { Outlet, useLocation } from 'react-router'
import { BottomTabBar } from './BottomTabBar'
import { OfflineBanner } from './OfflineBanner'

/**
 * The phone frame. Mobile-only by decision — on a wide screen this stays a 430px column on a
 * neutral backdrop so it reads as deliberate rather than as a broken desktop layout.
 */
export function AppShell() {
  const { pathname } = useLocation()

  return (
    <div className="min-h-dvh bg-sunken">
      <div className="relative mx-auto flex min-h-dvh w-full max-w-[430px] flex-col bg-page shadow-[0_0_60px_rgba(0,0,0,0.06)]">
        <OfflineBanner />
        {/*
          Keyed on the path so each screen mounts fresh and plays the entrance once. Without the
          key React reuses the subtree across routes and nothing animates; with it, the
          transition marks that the screen changed — which on a tabbed mobile app is otherwise
          easy to miss.
        */}
        <main key={pathname} className="flex-1 animate-screen-in pb-24">
          <Outlet />
        </main>
        <BottomTabBar />
      </div>
    </div>
  )
}
