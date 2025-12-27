'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthStore } from '@/lib/auth-store'

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { accessToken, checkAuth } = useAuthStore()

  useEffect(() => {
    // Public routes that don't require authentication
    const publicRoutes = ['/login', '/forgot-password', '/reset-password']
    const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))

    if (isPublicRoute) {
      // If already logged in and trying to access login page, redirect to dashboard
      if (accessToken && pathname === '/login') {
        router.push('/dashboard')
      }
      return
    }

    // For protected routes, check if user is authenticated
    if (!accessToken) {
      console.warn('No token found, redirecting to login')
      router.push('/login')
      return
    }

    // Check if token is valid and not expired
    checkAuth()
  }, [accessToken, pathname, router, checkAuth])

  return <>{children}</>
}
