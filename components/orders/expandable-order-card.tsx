"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface ExpandableOrderCardProps {
    orderNumber: string
    date: string
    customer: {
        name: string
        email: string
    }
    status: React.ReactNode
    paymentStatus?: React.ReactNode
    total: number
    children: React.ReactNode
    actions?: React.ReactNode
    className?: string
}

export function ExpandableOrderCard({
    orderNumber,
    date,
    customer,
    status,
    paymentStatus,
    total,
    children,
    actions,
    className,
}: ExpandableOrderCardProps) {
    const [isExpanded, setIsExpanded] = useState(false)

    return (
        <Card className={cn("transition-all duration-200", className)}>
            <CardHeader className="p-4">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 shrink-0"
                            onClick={() => setIsExpanded(!isExpanded)}
                        >
                            {isExpanded ? (
                                <ChevronDown className="h-4 w-4" />
                            ) : (
                                <ChevronRight className="h-4 w-4" />
                            )}
                        </Button>

                        <div className="flex flex-col lg:flex-row lg:items-center gap-2 lg:gap-6 flex-1 min-w-0">
                            <div className="min-w-[140px] shrink-0">
                                <span className="font-semibold">#{orderNumber}</span>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                                {status}
                                {paymentStatus}
                            </div>

                            <div className="text-sm text-muted-foreground shrink-0">
                                {new Date(date).toLocaleString('en-US', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                    hour: 'numeric',
                                    minute: 'numeric',
                                    hour12: true
                                })}
                            </div>

                            <div className="flex flex-col text-sm lg:ml-auto lg:mr-4 lg:text-right min-w-0 truncate">
                                <span className="font-medium truncate">{customer.name}</span>
                                <span className="text-xs text-muted-foreground truncate">{customer.email}</span>
                            </div>

                            <div className="font-bold min-w-[80px] lg:text-right shrink-0">
                                ${total.toFixed(2)}
                            </div>
                        </div>
                    </div>
                </div>
            </CardHeader>

            {isExpanded && (
                <CardContent className="p-4 pt-0 border-t bg-muted/10">
                    <div className="pt-4 space-y-4">
                        {children}
                        {actions && (
                            <div className="flex items-center justify-end gap-2 pt-4 border-t mt-4">
                                {actions}
                            </div>
                        )}
                    </div>
                </CardContent>
            )}
        </Card>
    )
}
