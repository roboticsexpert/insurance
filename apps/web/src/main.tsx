import { QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router'
import { AuthProvider } from './app/auth-context'
import { queryClient } from './app/query-client'
import { registerServiceWorker } from './app/register-sw'
import { router } from './app/router'
import './styles.css'

const container = document.getElementById('root')
if (!container) throw new Error('#root missing from index.html')

createRoot(container).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>,
)

registerServiceWorker()
