export const ACCESS_TOKEN_TTL = '15m'
export const REFRESH_TOKEN_TTL_DAYS = 30

export const REFRESH_COOKIE_NAME = 'bimegold_rt'
/** The cookie is only ever needed by the auth endpoints, so it is not sent anywhere else. */
export const REFRESH_COOKIE_PATH = '/api/v1/auth'
