"use client"

import type React from "react"

import { useAuthStore } from "@/lib/auth-store"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { ThemeToggle } from "@/components/theme-toggle"
import { RefreshButton } from "@/components/notifications/refresh-button"
import { NotificationBell } from "@/components/notifications/notification-bell"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user } = useAuthStore()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted && !user) {
      router.push("/login")
    }
  }, [user, mounted, router])

  if (!mounted) return null
  if (!user) return null

  return (
    <div className="flex h-screen bg-background text-foreground">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden md:ml-0">
        <header className="bg-card border-b border-border p-4 md:p-6 flex justify-between items-center">
          <div className="ml-12 md:ml-0">
            <h1 className="text-2xl font-bold">Dashboard</h1>
          </div>
          <div className="flex items-center gap-3">
            <NotificationBell />
            <RefreshButton />
            <ThemeToggle />
          </div>
        </header>
        <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  )
}
