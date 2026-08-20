import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { AuthLayout } from '../components/AuthLayout'
import { Button } from '../components/ui/Button'
import { ErrorNote } from '../components/ui/ErrorNote'
import { MobileField } from '../components/ui/MobileField'
import { ApiError } from '../lib/api'
import { requestOtp } from '../lib/auth-api'
import { isPlausibleMobile, mobileHint } from '../lib/mobile'

export function AuthPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from
  const [mobile, setMobile] = useState('')
  const [touched, setTouched] = useState(false)

  const mutation = useMutation({
    mutationFn: () => requestOtp(mobile),
    onSuccess: (data) => {
      // The code screen needs the number and the timers; it never re-derives them.
      navigate('/auth/otp', {
        state: {
          mobile,
          expiresIn: data.expiresIn,
          retryAfter: data.retryAfter,
          devCode: data.devCode,
          from,
        },
        replace: true,
      })
    },
  })

  const error = mutation.error
  // A field-level message from the API wins over the local hint — it is the authority.
  const fieldError =
    (error instanceof ApiError ? error.fields?.mobile : undefined) ??
    (touched ? mobileHint(mobile) : undefined)
  const generalError =
    error instanceof ApiError && !error.fields?.mobile ? error.messageFa : undefined

  const canSubmit = isPlausibleMobile(mobile) && !mutation.isPending

  return (
    <AuthLayout
      title="ورود یا ثبت‌نام"
      subtitle="شماره موبایل خود را وارد کنید. یک کد ۴ رقمی برایتان پیامک می‌شود."
      footer={
        <>
          <Button
            type="submit"
            form="auth-form"
            disabled={!canSubmit}
            loading={mutation.isPending}
          >
            ادامه
          </Button>
          <p className="mt-3 text-center text-xs leading-6 text-muted">
            با ادامه، <span className="text-strong">قوانین و شرایط</span> بیمه ۲۴۷ را می‌پذیرید.
          </p>
        </>
      }
    >
      <form
        id="auth-form"
        noValidate
        onSubmit={(event) => {
          event.preventDefault()
          setTouched(true)
          if (isPlausibleMobile(mobile)) mutation.mutate()
        }}
      >
        <MobileField
          value={mobile}
          onChange={setMobile}
          onBlur={() => setTouched(true)}
          error={fieldError}
          autoFocus
        />
        {generalError ? <ErrorNote>{generalError}</ErrorNote> : null}
      </form>
    </AuthLayout>
  )
}
