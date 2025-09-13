'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState, ReactNode } from 'react'

interface QueryProviderProps {
  children: ReactNode
}

export function QueryProvider({ children }: QueryProviderProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minuto
            gcTime: 10 * 60 * 1000, // 10 minutos
            retry: (failureCount, error: any) => {
              // No reintentar en errores de autenticación
              if (error?.code === 'unauthenticated') return false
              // Reintentar hasta 3 veces para otros errores
              return failureCount < 3
            },
            refetchOnWindowFocus: false,
            refetchOnReconnect: true
          },
          mutations: {
            retry: (failureCount, error: any) => {
              // No reintentar mutaciones críticas
              if (error?.code === 'unauthenticated') return false
              if (error?.code === 'permission-denied') return false
              return failureCount < 2
            }
          }
        }
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}