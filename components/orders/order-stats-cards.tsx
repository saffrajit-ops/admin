"use client"

import { Card } from "@/components/ui/card"
import { Package, DollarSign, TrendingUp, Clock } from "lucide-react"

interface OrderStatsCardsProps {
  stats: {
    totalOrders: number
    totalRevenue: number
    averageOrderValue: number
    pendingOrders: number
  } | null
  isLoading?: boolean
}

export function OrderStatsCards({ stats, isLoading }: OrderStatsCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="p-6">
            <div className="h-20 bg-muted animate-pulse rounded" />
          </Card>
        ))}
      </div>
    )
  }

  const cards = [
    {
      title: "Total Orders",
      value: stats?.totalOrders || 0,
      icon: Package,
      color: "text-blue-600",
      bgColor: "bg-blue-500/10",
    },
    {
      title: "Total Revenue",
      value: `$${(stats?.totalRevenue || 0).toFixed(2)}`,
      icon: DollarSign,
      color: "text-green-600",
      bgColor: "bg-green-500/10",
    },
    {
      title: "Average Order Value",
      value: `$${(stats?.averageOrderValue || 0).toFixed(2)}`,
      icon: TrendingUp,
      color: "text-purple-600",
      bgColor: "bg-purple-500/10",
    },
    {
      title: "Pending Orders",
      value: stats?.pendingOrders || 0,
      icon: Clock,
      color: "text-orange-600",
      bgColor: "bg-orange-500/10",
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, index) => (
        <Card key={index} className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">{card.title}</p>
              <p className="text-2xl font-bold">{card.value}</p>
            </div>
            <div className={`p-3 rounded-lg ${card.bgColor}`}>
              <card.icon className={`w-6 h-6 ${card.color}`} />
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}
