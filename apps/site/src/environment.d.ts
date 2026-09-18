declare global {
  namespace NodeJS {
    interface ProcessEnv {
      PAYLOAD_SECRET: string
      DATABASE_URL: string
      NEXT_PUBLIC_SERVER_URL: string
      /** آدرس اپ خرید — سایت چیزی نمی‌فروشد و هر دکمه استعلام به اینجا می‌رود. */
      NEXT_PUBLIC_APP_URL: string
      PREVIEW_SECRET: string
      CRON_SECRET: string
    }
  }
}

// If this file has no import/export statements (i.e. is a script)
// convert it into a module by adding an empty export statement.
export {}
