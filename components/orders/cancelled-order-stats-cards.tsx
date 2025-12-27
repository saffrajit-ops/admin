import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { XCircle, Clock, CheckCircle, AlertCircle, DollarSign } from "lucide-react"

interface CancelledOrderStatsCardsProps {
  stats: {
    total: number
    pending: number
    completed: number
    failed: number
    totalAmount: number
  }
  isLoading: boolean
}

export function CancelledOrderStatsCards({ stats, isLoading }: CancelledOrderStatsCardsProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {[...Array(5)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4 rounded-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-1" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const cards = [
    {
      title: "Total Cancelled",
      value: stats.total,
      description: "All cancelled orders",
      icon: XCircle,
      color: "text-red-600",
    },
    {
      title: "Pending Refund",
      value: stats.pending,
      description: "Awaiting refund",
      icon: Clock,
      color: "text-yellow-600",
    },
    {
      title: "Refund Completed",
      value: stats.completed,
      description: "Successfully refunded",
      icon: CheckCircle,
      color: "text-green-600",
    },
    {
      title: "Refund Failed",
      value: stats.failed,
      description: "Failed refunds",
      icon: AlertCircle,
      color: "text-red-600",
    },
    {
      title: "Total Amount",
      value: `$${stats.totalAmount.toFixed(2)}`,
      description: "Cancelled order value",
      icon: DollarSign,
      color: "text-blue-600",
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      {cards.map((card, index) => {
        const Icon = card.icon
        return (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <Icon className={`h-4 w-4 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <p className="text-xs text-muted-foreground">{card.description}</p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
