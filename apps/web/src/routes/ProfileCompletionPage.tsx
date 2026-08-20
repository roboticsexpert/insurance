import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { useAuth } from '../app/auth-context'
import { AuthLayout } from '../components/AuthLayout'
import { Button } from '../components/ui/Button'
import { ErrorNote } from '../components/ui/ErrorNote'
import { JalaliDateField } from '../components/ui/JalaliDateField'
import { TextField } from '../components/ui/TextField'
import { ApiError } from '../lib/api'
import { toLatinDigits, toPersianDigits } from '../lib/fa'
import { updateProfile } from '../lib/auth-api'

export function ProfileCompletionPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from
  const { user, updateUser } = useAuth()

  const [firstName, setFirstName] = useState(user?.firstName ?? '')
  const [lastName, setLastName] = useState(user?.lastName ?? '')
  const [nationalCode, setNationalCode] = useState(user?.nationalCode ?? '')
  const [birthDate, setBirthDate] = useState<string | null>(user?.birthDate ?? null)

  const mutation = useMutation({
    mutationFn: () =>
      updateProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        nationalCode,
        birthDate: birthDate as string,
      }),
    onSuccess: (updated) => {
      updateUser(updated)
      navigate(from ?? '/', { replace: true })
    },
  })

  const error = mutation.error instanceof ApiError ? mutation.error : undefined
  const fieldError = (name: string) => error?.fields?.[name]
  const generalError = error && !error.fields ? error.messageFa : undefined

  const complete =
    firstName.trim().length >= 2 &&
    lastName.trim().length >= 2 &&
    nationalCode.length === 10 &&
    birthDate !== null

  return (
    <AuthLayout
      title="تکمیل اطلاعات"
      subtitle="این اطلاعات روی بیمه‌نامه درج می‌شود، پس همان‌طور که در کارت ملی آمده وارد کنید."
      footer={
        <Button
          type="submit"
          form="profile-form"
          disabled={!complete || mutation.isPending}
          loading={mutation.isPending}
        >
          ثبت و ادامه
        </Button>
      }
    >
      <form
        id="profile-form"
        noValidate
        className="space-y-5"
        onSubmit={(event) => {
          event.preventDefault()
          if (complete) mutation.mutate()
        }}
      >
        <TextField
          label="نام"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          autoComplete="given-name"
          error={fieldError('firstName')}
        />
        <TextField
          label="نام خانوادگی"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          autoComplete="family-name"
          error={fieldError('lastName')}
        />
        <TextField
          label="کد ملی"
          inputMode="numeric"
          dir="ltr"
          className="text-center"
          value={toPersianDigits(nationalCode)}
          onChange={(e) =>
            setNationalCode(toLatinDigits(e.target.value).replace(/\D/g, '').slice(0, 10))
          }
          error={fieldError('nationalCode')}
          hint="۱۰ رقم، بدون خط تیره"
        />
        <JalaliDateField
          label="تاریخ تولد"
          value={birthDate}
          onChange={setBirthDate}
          error={fieldError('birthDate')}
        />
        {generalError ? <ErrorNote>{generalError}</ErrorNote> : null}
      </form>
    </AuthLayout>
  )
}
