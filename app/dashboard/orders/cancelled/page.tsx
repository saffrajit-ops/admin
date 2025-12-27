'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { XCircle, Eye, DollarSign, Search } from 'lucide-react';
import { toast } from 'sonner';
import { ExpandableOrderCard } from '@/components/orders/expandable-order-card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useNotifications } from '@/hooks/useNotifications';
import { NotificationDot } from '@/components/notifications/notification-badge';

interface CancelledOrder {
    _id: string;
    orderNumber: string;
    user: {
        name: string;
        email: string;
    };
    payment: {
        method: string;
        status?: string;
    };
    items: Array<{
        product: {
            title: string;
            images?: Array<{ url: string }>;
        };
        quantity: number;
        price: number;
        subtotal: number;
    }>;
    total: number;
    subtotal: number;
    discount?: number;
    shippingCharges?: number;
    status: string;
    cancellation: {
        reason?: string;
        cancelledAt: string;
        cancelledBy?: {
            name: string;
        };
    };
    refunds?: Array<{
        amount: number;
        status: string;
        processedAt?: string;
        stripeRefundId?: string;
    }>;
    createdAt: string;
}

const ITEMS_PER_PAGE = 10;

export default function CancelledOrdersPage() {
    const router = useRouter();
    const { accessToken } = useAuthStore();
    const { newCancellations } = useNotifications();
    const [orders, setOrders] = useState<CancelledOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [paymentTypeTab, setPaymentTypeTab] = useState<'all' | 'cod' | 'prepaid'>('all');
    const [currentTab, setCurrentTab] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [refundDialog, setRefundDialog] = useState<{
        open: boolean;
        orderId: string | null;
        orderTotal: number;
    }>({ open: false, orderId: null, orderTotal: 0 });
    const [refundAmount, setRefundAmount] = useState('');
    const [refundReason, setRefundReason] = useState('');
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        if (accessToken) {
            fetchCancelledOrders();
        }
    }, [accessToken]);

    // Reset page when tab or search changes
    useEffect(() => {
        setCurrentPage(1);
    }, [currentTab, searchQuery, paymentTypeTab]);

    const fetchCancelledOrders = async () => {
        if (!accessToken) return;

        try {
            setLoading(true);
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

            const response = await fetch(`${API_URL}/orders/admin/orders?status=cancelled&limit=1000`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });

            const data = await response.json();
            if (data.success && data.data) {
                const cancelledOrders = Array.isArray(data.data) ? data.data : (data.data.orders || []);

                // Sort by cancellation date (most recent first)
                cancelledOrders.sort((a: CancelledOrder, b: CancelledOrder) => {
                    const dateA = new Date(a.cancellation?.cancelledAt || a.createdAt).getTime();
                    const dateB = new Date(b.cancellation?.cancelledAt || b.createdAt).getTime();
                    return dateB - dateA;
                });

                setOrders(cancelledOrders);
            } else {
                console.error('Invalid response structure:', data);
                toast.error(data.message || 'Failed to load cancelled orders');
            }
        } catch (error) {
            console.error('Failed to fetch cancelled orders:', error);
            toast.error('Failed to load cancelled orders');
        } finally {
            setLoading(false);
        }
    };

    const handleInitiateRefund = async () => {
        if (!refundDialog.orderId || !accessToken) return;

        const amount = parseFloat(refundAmount);
        if (isNaN(amount) || amount <= 0) {
            toast.error('Please enter a valid refund amount');
            return;
        }

        if (amount > refundDialog.orderTotal) {
            toast.error('Refund amount cannot exceed order total');
            return;
        }

        try {
            setProcessing(true);
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

            const response = await fetch(`${API_URL}/orders/admin/orders/${refundDialog.orderId}/refund`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${accessToken}`,
                },
                body: JSON.stringify({
                    amount,
                    reason: refundReason || 'Order cancelled',
                    status: 'completed',
                }),
            });

            const data = await response.json();

            if (data.success) {
                toast.success('Refund processed successfully');
                setRefundDialog({ open: false, orderId: null, orderTotal: 0 });
                setRefundAmount('');
                setRefundReason('');
                fetchCancelledOrders();
            } else {
                toast.error(data.message || 'Failed to process refund');
            }
        } catch (error) {
            console.error('Failed to process refund:', error);
            toast.error('Failed to process refund');
        } finally {
            setProcessing(false);
        }
    };

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            pending: 'bg-yellow-500',
            confirmed: 'bg-blue-500',
            processing: 'bg-purple-500',
            shipped: 'bg-indigo-500',
            delivered: 'bg-green-500',
            cancelled: 'bg-red-500',
        };
        return colors[status] || 'bg-gray-500';
    };

    // Calculate stats based on payment type filter
    const stats = useMemo(() => {
        // First filter by payment type
        let filteredOrders = orders;

        if (paymentTypeTab === 'cod') {
            filteredOrders = orders.filter(o => o.payment?.method === 'cod');
        } else if (paymentTypeTab === 'prepaid') {
            filteredOrders = orders.filter(o => o.payment?.method !== 'cod');
        }

        // Calculate stats from filtered orders
        const cancelled = filteredOrders.filter(o => !o.refunds?.some(r => r.status === 'completed')).length;
        const refunded = filteredOrders.filter(o => o.refunds?.some(r => r.status === 'completed')).length;

        return { cancelled, refunded, total: filteredOrders.length };
    }, [orders, paymentTypeTab]);

    // Filter orders based on tab and search
    const filteredOrders = useMemo(() => {
        let filtered = orders;

        // Filter by status tab
        if (currentTab === 'cancelled') {
            // Show orders that are cancelled but not refunded
            filtered = filtered.filter(order => !order.refunds?.some(r => r.status === 'completed'));
        } else if (currentTab === 'refunded') {
            // Show orders that have been refunded
            filtered = filtered.filter(order => order.refunds?.some(r => r.status === 'completed'));
        }
        // 'all' tab shows all cancelled orders

        // Filter by payment type
        if (paymentTypeTab === 'cod') {
            filtered = filtered.filter(order => order.payment?.method === 'cod');
        } else if (paymentTypeTab === 'prepaid') {
            filtered = filtered.filter(order => order.payment?.method !== 'cod');
        }

        // Filter by search
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(order =>
                order.orderNumber.toLowerCase().includes(query) ||
                order.user.name.toLowerCase().includes(query) ||
                order.user.email.toLowerCase().includes(query)
            );
        }

        return filtered;
    }, [orders, currentTab, searchQuery, paymentTypeTab]);

    // Pagination
    const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE);
    const paginatedOrders = filteredOrders.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Spinner className="w-8 h-8" />
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Cancelled Orders</h1>
                    <p className="text-muted-foreground">View and manage cancelled orders</p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Cancelled</CardTitle>
                        <XCircle className="h-4 w-4 text-red-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.total}</div>
                        <p className="text-xs text-muted-foreground">All cancelled orders</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Cancelled</CardTitle>
                        <XCircle className="h-4 w-4 text-yellow-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.cancelled}</div>
                        <p className="text-xs text-muted-foreground">
                            {paymentTypeTab === 'cod' ? 'No refund needed' : 'Awaiting refund'}
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Refunded</CardTitle>
                        <DollarSign className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.refunded}</div>
                        <p className="text-xs text-muted-foreground">Refund completed</p>
                    </CardContent>
                </Card>
            </div>

            {/* Search Bar */}
            <Card className="p-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by order number, customer name, or email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                    />
                </div>
            </Card>

            {/* Payment Type Tabs */}
            <Card className="p-4">
                <Tabs value={paymentTypeTab} onValueChange={(v) => setPaymentTypeTab(v as 'all' | 'cod' | 'prepaid')} className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="all" className="cursor-pointer">
                            All Cancelled Orders
                        </TabsTrigger>
                        <TabsTrigger value="cod" className="cursor-pointer">
                            COD Cancelled
                        </TabsTrigger>
                        <TabsTrigger value="prepaid" className="cursor-pointer">
                            Prepaid Cancelled
                        </TabsTrigger>
                    </TabsList>
                </Tabs>
            </Card>

            {/* Status Tabs */}
            <Tabs value={currentTab} onValueChange={setCurrentTab} className="space-y-4">
                <TabsList className={paymentTypeTab === 'cod' ? 'grid w-full grid-cols-2' : 'grid w-full grid-cols-3'}>
                    <TabsTrigger value="all" className="cursor-pointer">
                        All ({stats.total})
                    </TabsTrigger>
                    <TabsTrigger value="cancelled" className="cursor-pointer">
                        <span className="flex items-center gap-2">
                            Cancelled ({stats.cancelled})
                            <NotificationDot show={newCancellations > 0} />
                        </span>
                    </TabsTrigger>
                    {paymentTypeTab !== 'cod' && (
                        <TabsTrigger value="refunded" className="cursor-pointer">
                            Refunded ({stats.refunded})
                        </TabsTrigger>
                    )}
                </TabsList>

                <TabsContent value={currentTab} className="space-y-4">
                    {paginatedOrders.length === 0 ? (
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center py-12">
                                <XCircle className="w-12 h-12 text-muted-foreground mb-4" />
                                <p className="text-lg font-medium">No orders found</p>
                                <p className="text-sm text-muted-foreground">
                                    {searchQuery ? 'Try adjusting your search' : 'No cancelled orders in this category'}
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        <>
                            <div className="grid gap-4">
                                {paginatedOrders.map((order) => (
                                    <ExpandableOrderCard
                                        key={order._id}
                                        orderNumber={order.orderNumber}
                                        date={order.cancellation?.cancelledAt || order.createdAt}
                                        customer={{
                                            name: order.user.name,
                                            email: order.user.email,
                                        }}
                                        status={
                                            <>
                                                <Badge className={`${getStatusColor(order.status)} text-white`}>
                                                    {order.status.toUpperCase()}
                                                </Badge>
                                                {order.refunds?.some(r => r.status === 'completed') && (
                                                    <Badge className="bg-blue-500 text-white ml-2">
                                                        REFUNDED
                                                    </Badge>
                                                )}
                                            </>
                                        }
                                        paymentStatus={
                                            <Badge
                                                variant="outline"
                                                className={
                                                    order.payment.method === 'cod'
                                                        ? 'border-orange-500 text-orange-700'
                                                        : 'border-blue-500 text-blue-700'
                                                }
                                            >
                                                {order.payment.method === 'cod' ? 'COD Order' : 'Prepaid Order'}
                                            </Badge>
                                        }
                                        total={
                                            order.refunds?.some(r => r.status === 'completed')
                                                ? order.refunds.reduce((sum, r) => sum + r.amount, 0)
                                                : order.total
                                        }
                                        actions={
                                            <div className="flex gap-2">
                                                {order.payment.method !== 'cod' &&
                                                    order.payment.status === 'completed' &&
                                                    !order.refunds?.some(r => r.status === 'completed') && (
                                                        <Button
                                                            size="sm"
                                                            onClick={() => {
                                                                setRefundDialog({
                                                                    open: true,
                                                                    orderId: order._id,
                                                                    orderTotal: order.total,
                                                                });
                                                                setRefundAmount(order.total.toFixed(2));
                                                            }}
                                                            className="gap-2 cursor-pointer"
                                                        >
                                                            <DollarSign className="w-4 h-4" />
                                                            Initiate Refund
                                                        </Button>
                                                    )}

                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => router.push(`/dashboard/orders/${order._id}`)}
                                                    className="gap-2 cursor-pointer"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                    View Order
                                                </Button>
                                            </div>
                                        }
                                    >
                                        <div>
                                            <p className="text-sm font-medium mb-2">Cancellation Details:</p>
                                            <div className="bg-muted p-3 rounded-lg space-y-2">
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-muted-foreground">Reason:</span>
                                                    <span className="font-medium">
                                                        {order.cancellation?.reason || 'No reason provided'}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-muted-foreground">Cancelled By:</span>
                                                    <span className="font-medium capitalize">
                                                        {order.cancellation?.cancelledBy?.name || 'User'}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-muted-foreground">Date:</span>
                                                    <span>
                                                        {new Date(
                                                            order.cancellation?.cancelledAt || order.createdAt
                                                        ).toLocaleString()}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <p className="text-sm font-medium mb-2">Order Items:</p>
                                            <div className="space-y-2">
                                                {order.items.map((item, idx) => (
                                                    <div
                                                        key={idx}
                                                        className="flex items-center justify-between p-2 bg-muted rounded-lg"
                                                    >
                                                        <div className="text-sm">
                                                            <p className="font-medium">
                                                                {item.product?.title || 'Unknown Product'}
                                                            </p>
                                                            <p className="text-muted-foreground">
                                                                Qty: {item.quantity} × ${item.price.toFixed(2)}
                                                            </p>
                                                        </div>
                                                        <p className="font-medium">${item.subtotal.toFixed(2)}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {order.refunds && order.refunds.length > 0 && (
                                            <div className="pt-4 border-t">
                                                <p className="text-sm font-medium mb-2">Refund Information:</p>
                                                <div className="space-y-2">
                                                    {order.refunds.map((refund, idx) => (
                                                        <div
                                                            key={idx}
                                                            className={`p-3 rounded-lg ${refund.status === 'completed'
                                                                ? 'bg-green-50 border border-green-200'
                                                                : refund.status === 'failed'
                                                                    ? 'bg-red-50 border border-red-200'
                                                                    : 'bg-yellow-50 border border-yellow-200'
                                                                }`}
                                                        >
                                                            <div className="flex items-center justify-between">
                                                                <div>
                                                                    <p className="text-sm font-medium">
                                                                        ${refund.amount.toFixed(2)}
                                                                    </p>
                                                                    <p className="text-xs text-muted-foreground">
                                                                        Status: {refund.status}
                                                                    </p>
                                                                    {refund.processedAt && (
                                                                        <p className="text-xs text-muted-foreground">
                                                                            Processed:{' '}
                                                                            {new Date(refund.processedAt).toLocaleDateString()}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            {refund.stripeRefundId && (
                                                                <div className="mt-2 pt-2 border-t border-green-300">
                                                                    <p className="text-xs text-muted-foreground">
                                                                        Stripe Refund ID:{' '}
                                                                        <span className="font-mono">{refund.stripeRefundId}</span>
                                                                    </p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex items-center justify-between pt-4 border-t">
                                            <div>
                                                <p className="text-sm text-muted-foreground">
                                                    {order.refunds?.some(r => r.status === 'completed')
                                                        ? 'Refunded Amount'
                                                        : 'Total Amount'}
                                                </p>
                                                <p className="text-2xl font-bold">
                                                    $
                                                    {order.refunds?.some(r => r.status === 'completed')
                                                        ? order.refunds.reduce((sum, r) => sum + r.amount, 0).toFixed(2)
                                                        : order.total.toFixed(2)}
                                                </p>
                                            </div>
                                        </div>
                                    </ExpandableOrderCard>
                                ))}
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <Card className="p-4">
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm text-muted-foreground">
                                            Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{' '}
                                            {Math.min(currentPage * ITEMS_PER_PAGE, filteredOrders.length)} of{' '}
                                            {filteredOrders.length} orders
                                        </p>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                                disabled={currentPage === 1}
                                                className="cursor-pointer"
                                            >
                                                Previous
                                            </Button>
                                            <div className="flex items-center gap-1">
                                                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                                                    let page;
                                                    if (totalPages <= 5) {
                                                        page = i + 1;
                                                    } else if (currentPage <= 3) {
                                                        page = i + 1;
                                                    } else if (currentPage >= totalPages - 2) {
                                                        page = totalPages - 4 + i;
                                                    } else {
                                                        page = currentPage - 2 + i;
                                                    }
                                                    return (
                                                        <Button
                                                            key={page}
                                                            variant={currentPage === page ? 'default' : 'outline'}
                                                            size="sm"
                                                            onClick={() => setCurrentPage(page)}
                                                            className="cursor-pointer"
                                                        >
                                                            {page}
                                                        </Button>
                                                    );
                                                })}
                                            </div>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                                disabled={currentPage === totalPages}
                                                className="cursor-pointer"
                                            >
                                                Next
                                            </Button>
                                        </div>
                                    </div>
                                </Card>
                            )}
                        </>
                    )}
                </TabsContent>
            </Tabs>

            {/* Refund Dialog */}
            <Dialog
                open={refundDialog.open}
                onOpenChange={open => !processing && setRefundDialog({ ...refundDialog, open })}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Initiate Refund</DialogTitle>
                        <DialogDescription>
                            Process a refund for this cancelled order. The order will move to the refunded tab once
                            completed.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="amount">Refund Amount *</Label>
                            <Input
                                id="amount"
                                type="number"
                                step="0.01"
                                min="0"
                                max={refundDialog.orderTotal}
                                value={refundAmount}
                                onChange={e => setRefundAmount(e.target.value)}
                                placeholder="0.00"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                                Maximum: ${refundDialog.orderTotal.toFixed(2)}
                            </p>
                        </div>
                        <div>
                            <Label htmlFor="reason">Reason (Optional)</Label>
                            <Textarea
                                id="reason"
                                value={refundReason}
                                onChange={e => setRefundReason(e.target.value)}
                                placeholder="Reason for refund..."
                                rows={3}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setRefundDialog({ open: false, orderId: null, orderTotal: 0 });
                                setRefundAmount('');
                                setRefundReason('');
                            }}
                            disabled={processing}
                            className="cursor-pointer"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleInitiateRefund}
                            disabled={processing || !refundAmount || parseFloat(refundAmount) <= 0}
                            className="cursor-pointer"
                        >
                            {processing ? (
                                <>
                                    <Spinner className="w-4 h-4 mr-2" />
                                    Processing...
                                </>
                            ) : (
                                'Process Refund'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
