'use client';

import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNotifications } from '@/hooks/useNotifications';
import { cn } from '@/lib/utils';

export function RefreshButton() {
    const { loading, total, refreshNotifications } = useNotifications();

    const handleRefresh = async () => {
        await refreshNotifications();
    };

    return (
        <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            disabled={loading}
            className={cn(
                "relative",
                loading && "cursor-not-allowed opacity-50"
            )}
            title="Refresh notifications"
        >
            <RefreshCw className={cn(
                "h-4 w-4",
                loading && "animate-spin"
            )} />
            {total > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-semibold">
                    {total > 99 ? '99+' : total}
                </span>
            )}
        </Button>
    );
}
