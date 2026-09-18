import canUseDOM from './canUseDOM'

/**
 * سایت بازاریابی است و چیزی نمی‌فروشد؛ هر دکمه خرید یا استعلام به اپ می‌رود.
 * پیش‌فرض همان پورت محلی `apps/web` است تا روی لپ‌تاپ هم مسیر واقعی طی شود.
 */
export const getAppURL = () => process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:5173'

export const getServerSideURL = () => {
  return process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3100'
}

export const getClientSideURL = () => {
  if (canUseDOM) {
    const protocol = window.location.protocol
    const domain = window.location.hostname
    const port = window.location.port

    return `${protocol}//${domain}${port ? `:${port}` : ''}`
  }

  return process.env.NEXT_PUBLIC_SERVER_URL || ''
}
