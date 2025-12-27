import { useEffect, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from './useRedux';
import { fetchNotificationCounts } from '@/store/slices/notificationSlice';

export const useNotifications = () => {
    const dispatch = useAppDispatch();
    const notifications = useAppSelector((state) => state.notifications);

    // Fetch notifications on mount
    useEffect(() => {
        dispatch(fetchNotificationCounts());
    }, [dispatch]);

    // Manual refresh function
    const refreshNotifications = useCallback(() => {
        return dispatch(fetchNotificationCounts());
    }, [dispatch]);

    return {
        ...notifications,
        refreshNotifications,
    };
};
