import { apiFetch } from './api'

export interface UserDto {
  id: string
  mobile: string
  firstName: string | null
  lastName: string | null
  nationalCode: string | null
  birthDate: string | null
  email: string | null
  isProfileComplete: boolean
}

export interface OtpRequestResponse {
  expiresIn: number
  retryAfter: number
  /** Present only outside production — the API refuses to send it there. */
  devCode?: string
}

export interface AuthResponse {
  accessToken: string
  user: UserDto
  isNewUser: boolean
}

export const requestOtp = (mobile: string) =>
  apiFetch<OtpRequestResponse>('/auth/otp/request', { method: 'POST', body: { mobile } })

export const verifyOtp = (mobile: string, code: string) =>
  apiFetch<AuthResponse>('/auth/otp/verify', { method: 'POST', body: { mobile, code } })

export interface UpdateProfilePayload {
  firstName: string
  lastName: string
  nationalCode: string
  /** Gregorian `YYYY-MM-DD`. Jalali exists only in the UI. */
  birthDate: string
  email?: string | null
}

export const updateProfile = (payload: UpdateProfilePayload) =>
  apiFetch<UserDto>('/me', { method: 'PATCH', body: payload })

