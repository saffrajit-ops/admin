import { cn } from '@/lib/utils';

interface NotificationBadgeProps {
    count: number;
    className?: string;
    showZero?: boolean;
}

export function NotificationBadge({ count, className, showZero = false }: NotificationBadgeProps) {
    if (count === 0 && !showZero) {
        return null;
    }

    return (
        <span className={cn(
            "inline-flex items-center justify-center rounded-full bg-red-500 text-white text-xs font-semibold min-w-[18px] h-[18px] px-1",
            className
        )}>
            {count > 99 ? '99+' : count}
        </span>
    );
}

interface NotificationDotProps {
    show: boolean;
    className?: string;
}

export function NotificationDot({ show, className }: NotificationDotProps) {
    if (!show) {
        return null;
    }

    return (
        <span className={cn(
            "inline-block w-2 h-2 rounded-full bg-red-500 animate-pulse",
            className
        )} />
    );
}
