import { QueryClient } from '@tanstack/react-query'
import { ApiError } from '../lib/api'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        // Retrying a 422 or a 404 just wastes the user's data allowance.
        if (error instanceof ApiError && error.statusCode < 500) return false
        return failureCount < 2
      },
    },
    mutations: { retry: false },
  },
})
