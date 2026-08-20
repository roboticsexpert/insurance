import { useMutation } from '@tanstack/react-query'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router'
import { useAuth } from '../app/auth-context'
import { AuthLayout } from '../components/AuthLayout'
import { Button } from '../components/ui/Button'
import { CodeField } from '../components/ui/CodeField'
import { ApiError } from '../lib/api'
import { requestOtp, verifyOtp } from '../lib/auth-api'
import { formatCountdown, formatMobile } from '../lib/fa'

const CODE_LENGTH = 4

interface OtpRouteState {
  mobile: string
  expiresIn: number
  retryAfter: number
  devCode?: string
  /** Where the customer was heading before the login wall. */
  from?: string
}

/** One ticking clock for both timers, rather than two intervals drifting apart. */
function useCountdowns(initial: { expiresIn: number; retryAfter: number }) {
  const [expiresIn, setExpiresIn] = useState(initial.expiresIn)
  const [retryAfter, setRetryAfter] = useState(initial.retryAfter)

  useEffect(() => {
    const id = setInterval(() => {
      setExpiresIn((v) => Math.max(0, v - 1))
      setRetryAfter((v) => Math.max(0, v - 1))
    }, 1000)
    return () => clearInterval(id)
  }, [])

  const reset = useCallback((next: { expiresIn: number; retryAfter: number }) => {
    setExpiresIn(next.expiresIn)
    setRetryAfter(next.retryAfter)
  }, [])

  return { expiresIn, retryAfter, reset }
}

export function OtpPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { signIn } = useAuth()
  const state = location.state as OtpRouteState | null

  const [code, setCode] = useState('')
  const [devCode, setDevCode] = useState(state?.devCode)
  const submittedFor = useRef<string | null>(null)

  const { expiresIn, retryAfter, reset } = useCountdowns({
    expiresIn: state?.expiresIn ?? 0,
    retryAfter: state?.retryAfter ?? 0,
  })

  const verification = useMutation({
    mutationFn: (value: string) => verifyOtp(state?.mobile ?? '', value),
    onSuccess: (result) => {
      signIn(result)
      // Straight to profile completion if it is still needed; the guard would bounce there
      // anyway, and this keeps `from` intact through both steps.
      const next = result.user.isProfileComplete ? (state?.from ?? '/') : '/auth/profile'
      navigate(next, { replace: true, state: state?.from ? { from: state.from } : undefined })
    },
    onError: () => setCode(''),
  })

  const resend = useMutation({
    mutationFn: () => requestOtp(state?.mobile ?? ''),
    onSuccess: (data) => {
      reset({ expiresIn: data.expiresIn, retryAfter: data.retryAfter })
      setDevCode(data.devCode)
      setCode('')
      submittedFor.current = null
      verification.reset()
    },
  })

  // Submitting the moment the last digit lands is the whole point of a 4-digit code —
  // the guard stops a re-render or an autofill event from firing it twice.
  useEffect(() => {
    if (code.length !== CODE_LENGTH) return
    if (submittedFor.current === code) return
    submittedFor.current = code
    verification.mutate(code)
  }, [code, verification])

  // Reached directly, with no number to verify against.
  if (!state?.mobile) return <Navigate to="/auth" replace />

  const error = verification.error ?? resend.error
  const errorMessage = error instanceof ApiError ? error.messageFa : undefined
  const isExpired = expiresIn === 0
  const canResend = retryAfter === 0 && !resend.isPending

  return (
    <AuthLayout
      title="کد تأیید"
      subtitle={
        <>
          کد ۴ رقمی ارسال‌شده به{' '}
          <span className="font-semibold text-strong" dir="ltr">
            {formatMobile(state.mobile.replace(/^0/, ''))}
          </span>{' '}
          را وارد کنید.
          <button
            type="button"
            onClick={() => navigate('/auth', { replace: true, state: state?.from ? { from: state.from } : undefined })}
            className="mr-2 text-brand-600 underline underline-offset-4"
          >
            ویرایش شماره
          </button>
        </>
      }
      footer={
        <Button
          variant="ghost"
          disabled={!canResend}
          loading={resend.isPending}
          onClick={() => resend.mutate()}
        >
          {canResend ? 'ارسال دوباره کد' : `ارسال دوباره تا ${formatCountdown(retryAfter)}`}
        </Button>
      }
    >
      <CodeField
        value={code}
        onChange={setCode}
        length={CODE_LENGTH}
        disabled={verification.isPending}
        error={errorMessage}
      />

      <p className="mt-4 text-center text-sm text-muted">
        {isExpired
          ? 'مهلت این کد تمام شده است.'
          : `این کد تا ${formatCountdown(expiresIn)} دیگر معتبر است.`}
      </p>

      {verification.isPending ? (
        <p className="mt-2 text-center text-sm text-muted">در حال بررسی…</p>
      ) : null}

      {devCode ? (
        <p className="mt-8 rounded-2xl border border-dashed border-line px-4 py-3 text-center text-sm text-muted">
          کد آزمایشی: <span dir="ltr" className="font-semibold text-strong">{devCode}</span>
        </p>
      ) : null}
    </AuthLayout>
  )
}
