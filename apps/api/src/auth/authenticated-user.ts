/** What a verified access token proves. Attached to `request.user` by the guards. */
export interface AuthenticatedUser {
  userId: string
  mobile: string
}

declare module 'express' {
  interface Request {
    user?: AuthenticatedUser
  }
}
