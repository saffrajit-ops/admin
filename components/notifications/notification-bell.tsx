'use client';

import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNotifications } from '@/hooks/useNotifications';
import { cn } from '@/lib/utils';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useRouter } from 'next/navigation';

export function NotificationBell() {
    const router = useRouter();
    const { newUsers, newOrders, newReturns, newCancellations, total, loading, refreshNotifications } = useNotifications();

    const handleNavigate = (path: string) => {
        router.push(path);
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="outline"
                    size="icon"
                    className={cn(
                        "relative",
                        loading && "cursor-not-allowed opacity-50"
                    )}
                    title="Notifications"
                >
                    <Bell className={cn(
                        "h-4 w-4",
                        total > 0 && "animate-pulse"
                    )} />
                    {total > 0 && (
                        <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-semibold">
                            {total > 99 ? '99+' : total}
                        </span>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel className="flex items-center justify-between">
                    <span>Notifications</span>
                    {total > 0 && (
                        <span className="text-xs font-normal text-muted-foreground">
                            {total} new
                        </span>
                    )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                {total === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                        No new notifications
                    </div>
                ) : (
                    <>
                        {newUsers > 0 && (
                            <DropdownMenuItem
                                onClick={() => handleNavigate('/dashboard/users')}
                                className="cursor-pointer flex items-center justify-between py-3"
                            >
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                                    <span>New Users</span>
                                </div>
                                <span className="text-xs font-semibold bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                                    {newUsers}
                                </span>
                            </DropdownMenuItem>
                        )}
                        
                        {newOrders > 0 && (
                            <DropdownMenuItem
                                onClick={() => handleNavigate('/dashboard/orders')}
                                className="cursor-pointer flex items-center justify-between py-3"
                            >
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-green-500" />
                                    <span>New Orders</span>
                                </div>
                                <span className="text-xs font-semibold bg-green-100 text-green-700 px-2 py-1 rounded-full">
                                    {newOrders}
                                </span>
                            </DropdownMenuItem>
                        )}
                        
                        {newReturns > 0 && (
                            <DropdownMenuItem
                                onClick={() => handleNavigate('/dashboard/orders/returns')}
                                className="cursor-pointer flex items-center justify-between py-3"
                            >
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-yellow-500" />
                                    <span>Return Requests</span>
                                </div>
                                <span className="text-xs font-semibold bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">
                                    {newReturns}
                                </span>
                            </DropdownMenuItem>
                        )}
                        
                        {newCancellations > 0 && (
                            <DropdownMenuItem
                                onClick={() => handleNavigate('/dashboard/orders/cancelled')}
                                className="cursor-pointer flex items-center justify-between py-3"
                            >
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-red-500" />
                                    <span>Cancelled Orders</span>
                                </div>
                                <span className="text-xs font-semibold bg-red-100 text-red-700 px-2 py-1 rounded-full">
                                    {newCancellations}
                                </span>
                            </DropdownMenuItem>
                        )}
                    </>
                )}
                
                <DropdownMenuSeparator />
                <DropdownMenuItem
                    onClick={() => refreshNotifications()}
                    disabled={loading}
                    className="cursor-pointer text-center justify-center text-sm text-primary"
                >
                    {loading ? 'Refreshing...' : 'Refresh Notifications'}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
