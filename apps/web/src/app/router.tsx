import { createBrowserRouter } from 'react-router'
import { AppShell } from '../components/AppShell'
import { AuthPage } from '../routes/AuthPage'
import { OtpPage } from '../routes/OtpPage'
import { ProfileCompletionPage } from '../routes/ProfileCompletionPage'
import { CheckoutPage } from '../routes/CheckoutPage'
import { OfferDetailPage } from '../routes/OfferDetailPage'
import { PaymentCallbackPage } from '../routes/PaymentCallbackPage'
import { PolicyDetailPage } from '../routes/PolicyDetailPage'
import { QuotePage } from '../routes/QuotePage'
import { HomeFireWizardPage } from '../routes/HomeFireWizardPage'
import { MotorWizardPage } from '../routes/MotorWizardPage'
import { TravelWizardPage } from '../routes/TravelWizardPage'
import { WIZARD_SLUGS, type WizardSlug } from '../lib/wizards'
import { RequireAuth } from '../components/RequireAuth'
import { HomePage } from '../routes/HomePage'
import { NotFoundPage } from '../routes/NotFoundPage'
import { PoliciesPage } from '../routes/PoliciesPage'
import { ProfilePage } from '../routes/ProfilePage'
import { VehiclesPage } from '../routes/VehiclesPage'
import { SupportPage } from '../routes/SupportPage'

/** One entry per slug in `WIZARD_SLUGS`, so adding a wizard is a compile error until both agree. */
const WIZARDS: Record<WizardSlug, React.ReactElement> = {
  travel: <TravelWizardPage />,
  'motor-tpl': <MotorWizardPage />,
  'home-fire': <HomeFireWizardPage />,
}

export const router = createBrowserRouter([
  // The auth flow sits outside the tabbed shell — it is a linear task, not a destination.
  // The wizard runs outside the tabbed shell: a linear task, no tabs inviting escape.
  ...WIZARD_SLUGS.map((slug) => ({
    path: `/p/${slug}/form`,
    element: WIZARDS[slug],
  })),
  { path: '/quotes/:id', element: <QuotePage /> },
  { path: '/quotes/:id/offers/:offerId', element: <OfferDetailPage /> },
  {
    // Outside the tabbed shell: it brings its own full-height layout and a sticky action bar,
    // which would fight the bottom tab bar.
    path: '/policies/:id',
    element: (
      <RequireAuth>
        <PolicyDetailPage />
      </RequireAuth>
    ),
  },
  {
    path: '/checkout/:quoteId/:offerId',
    // The OTP wall sits here, not at the door — quoting stayed open to anyone.
    element: (
      <RequireAuth>
        <CheckoutPage />
      </RequireAuth>
    ),
  },
  // Reached from the bank, so it must work with or without a surviving session.
  { path: '/payment/callback', element: <PaymentCallbackPage /> },
  { path: '/auth', element: <AuthPage /> },
  { path: '/auth/otp', element: <OtpPage /> },
  {
    path: '/auth/profile',
    // Signed in, but deliberately not gated on a complete profile — this is where it is completed.
    element: (
      <RequireAuth requireCompleteProfile={false}>
        <ProfileCompletionPage />
      </RequireAuth>
    ),
  },
  {
    element: <AppShell />,
    children: [
      { path: '/', element: <HomePage /> },
      {
        path: '/policies',
        element: (
          <RequireAuth>
            <PoliciesPage />
          </RequireAuth>
        ),
      },

      { path: '/support', element: <SupportPage /> },
      { path: '/profile', element: <ProfilePage /> },
      {
        path: '/profile/vehicles',
        element: (
          <RequireAuth>
            <VehiclesPage />
          </RequireAuth>
        ),
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
