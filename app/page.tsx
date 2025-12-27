"use client"

import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/lib/auth-store"
import { useEffect } from "react"

export default function HomePage() {
  const router = useRouter()
  const { user } = useAuthStore()

  useEffect(() => {
    if (user) {
      router.push("/dashboard")
    }
  }, [user, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10 p-4">
      <div className="text-center space-y-6">
        <div className="space-y-2">
          <h1 className="text-5xl font-bold text-foreground">CanaGold Admin Panel</h1>
          <p className="text-xl text-muted-foreground">Manage your e-commerce platform</p>
        </div>
        <Button onClick={() => router.push("/login")} size="lg" className="rounded-lg font-semibold px-8">
          Login to Dashboard
        </Button>
      </div>
    </div>
  )
}