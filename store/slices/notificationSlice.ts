import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

interface NotificationState {
    newUsers: number;
    newOrders: number;
    newReturns: number;
    newCancellations: number;
    total: number;
    loading: boolean;
    error: string | null;
    lastFetched: number | null;
}

const initialState: NotificationState = {
    newUsers: 0,
    newOrders: 0,
    newReturns: 0,
    newCancellations: 0,
    total: 0,
    loading: false,
    error: null,
    lastFetched: null,
};

// Async thunk to fetch notification counts
export const fetchNotificationCounts = createAsyncThunk(
    'notifications/fetchCounts',
    async (_, { rejectWithValue }) => {
        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
            const token = localStorage.getItem('accessToken');

            if (!token) {
                throw new Error('No access token found');
            }

            const response = await fetch(`${API_URL}/admin/notifications/counts`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.message || 'Failed to fetch notification counts');
            }

            return data.data;
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to fetch notifications');
        }
    }
);

const notificationSlice = createSlice({
    name: 'notifications',
    initialState,
    reducers: {
        setNotificationCounts: (state, action: PayloadAction<Omit<NotificationState, 'loading' | 'error' | 'lastFetched'>>) => {
            state.newUsers = action.payload.newUsers;
            state.newOrders = action.payload.newOrders;
            state.newReturns = action.payload.newReturns;
            state.newCancellations = action.payload.newCancellations;
            state.total = action.payload.total;
            state.lastFetched = Date.now();
        },
        incrementCount: (state, action: PayloadAction<'newUsers' | 'newOrders' | 'newReturns' | 'newCancellations'>) => {
            state[action.payload] += 1;
            state.total += 1;
        },
        resetCount: (state, action: PayloadAction<'newUsers' | 'newOrders' | 'newReturns' | 'newCancellations'>) => {
            const oldValue = state[action.payload];
            state[action.payload] = 0;
            state.total = Math.max(0, state.total - oldValue);
        },
        resetAllCounts: (state) => {
            state.newUsers = 0;
            state.newOrders = 0;
            state.newReturns = 0;
            state.newCancellations = 0;
            state.total = 0;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchNotificationCounts.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchNotificationCounts.fulfilled, (state, action) => {
                state.loading = false;
                state.newUsers = action.payload.newUsers;
                state.newOrders = action.payload.newOrders;
                state.newReturns = action.payload.newReturns;
                state.newCancellations = action.payload.newCancellations;
                state.total = action.payload.total;
                state.lastFetched = Date.now();
            })
            .addCase(fetchNotificationCounts.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });
    },
});

export const { setNotificationCounts, incrementCount, resetCount, resetAllCounts } = notificationSlice.actions;
export default notificationSlice.reducer;
