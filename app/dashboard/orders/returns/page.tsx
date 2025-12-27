'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { RotateCcw, Eye, Check, X, DollarSign, Search } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useNotifications } from '@/hooks/useNotifications';
import { NotificationDot } from '@/components/notifications/notification-badge';

interface ReturnRequest {
    _id: string;
    orderNumber: string;
    user: {
        name: string;
        email: string;
    };
    items: Array<{
        product: {
            title: string;
            images?: Array<{ url: string }>;
        };
        quantity: number;
        price: number;
    }>;
    return: {
        status: string;
        reason: string;
        requestedAt: string;
        refundAmount?: number;
        bankDetails?: {
            accountHolderName: string;
            accountNumber: string;
            routingNumber: string;
            bankName: string;
            accountType: 'checking' | 'savings';
        };
    };
    payment?: {
        method: 'stripe' | 'cod';
        paymentIntentId?: string;
    };
    refunds?: Array<{
        amount: number;
        status: string;
        processedAt?: string;
        stripeRefundId?: string;
    }>;
    total: number;
    createdAt: string;
}

const ITEMS_PER_PAGE = 10;

export default function ReturnsPage() {
    const router = useRouter();
    const { accessToken } = useAuthStore();
    const { newReturns } = useNotifications();
    const [returns, setReturns] = useState<ReturnRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentTab, setCurrentTab] = useState('all');
    const [paymentTypeTab, setPaymentTypeTab] = useState<'all' | 'cod' | 'prepaid'>('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [actionDialog, setActionDialog] = useState<{
        open: boolean;
        orderId: string | null;
        action: 'approve' | 'reject' | null;
    }>({ open: false, orderId: null, action: null });
    const [notes, setNotes] = useState('');
    const [processing, setProcessing] = useState(false);
    const [refundDialog, setRefundDialog] = useState<{
        open: boolean;
        orderId: string | null;
        orderTotal: number;
    }>({ open: false, orderId: null, orderTotal: 0 });
    const [refundAmount, setRefundAmount] = useState('');
    const [refundReason, setRefundReason] = useState('');

    useEffect(() => {
        if (accessToken) {
            fetchReturns();
        }
    }, [accessToken]);

    // Reset page when tab or search changes
    useEffect(() => {
        setCurrentPage(1);
    }, [currentTab, searchQuery, paymentTypeTab]);

    const fetchReturns = async () => {
        if (!accessToken) return;

        try {
            setLoading(true);
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

            const response = await fetch(`${API_URL}/orders/admin/orders?limit=1000`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });

            const data = await response.json();
            if (data.success && data.data) {
                const allOrders = Array.isArray(data.data) ? data.data : (data.data.orders || []);
                const returnOrders = allOrders.filter(
                    (order: any) => order.return && order.return.status
                );
                setReturns(returnOrders);
            }
        } catch (error) {
            console.error('Failed to fetch returns:', error);
            toast.error('Failed to load return requests');
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async () => {
        if (!actionDialog.orderId || !actionDialog.action || !accessToken) return;

        try {
            setProcessing(true);
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

            const action = actionDialog.action === 'approve' ? 'approve' : 'reject';

            const response = await fetch(`${API_URL}/orders/admin/orders/${actionDialog.orderId}/return`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${accessToken}`,
                },
                body: JSON.stringify({ action, notes }),
            });

            const data = await response.json();

            if (data.success) {
                toast.success(
                    `Return ${actionDialog.action === 'approve' ? 'approved' : 'rejected'} successfully`
                );
                setActionDialog({ open: false, orderId: null, action: null });
                setNotes('');
                fetchReturns();
            } else {
                toast.error(data.message || 'Failed to process return');
            }
        } catch (error) {
            console.error('Failed to process return:', error);
            toast.error('Failed to process return request');
        } finally {
            setProcessing(false);
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
                    reason: refundReason || 'Return approved',
                    status: 'completed',
                }),
            });

            const data = await response.json();

            if (data.success) {
                toast.success('Refund processed successfully');
                setRefundDialog({ open: false, orderId: null, orderTotal: 0 });
                setRefundAmount('');
                setRefundReason('');
                fetchReturns();
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
        switch (status.toLowerCase()) {
            case 'requested':
                return 'bg-yellow-500';
            case 'approved':
                return 'bg-green-500';
            case 'rejected':
                return 'bg-red-500';
            case 'completed':
                return 'bg-blue-500';
            default:
                return 'bg-gray-500';
        }
    };

    // Calculate stats based on payment type filter
    const stats = useMemo(() => {
        // First filter by payment type
        let filteredReturns = returns;

        if (paymentTypeTab === 'cod') {
            filteredReturns = returns.filter(r => (r as any).payment?.method === 'cod');
        } else if (paymentTypeTab === 'prepaid') {
            filteredReturns = returns.filter(r => (r as any).payment?.method === 'stripe');
        }
        // 'all' uses all returns

        // Calculate stats from filtered returns
        const requested = filteredReturns.filter(r => r.return.status === 'requested').length;
        // Approved: approved but not yet refunded
        const approved = filteredReturns.filter(r => {
            const isApproved = r.return.status === 'approved';
            const hasRefund = r.refunds?.some(ref => ref.status === 'completed');
            return isApproved && !hasRefund;
        }).length;
        const rejected = filteredReturns.filter(r => r.return.status === 'rejected').length;
        const refunded = filteredReturns.filter(r => r.refunds?.some(ref => ref.status === 'completed')).length;

        return { requested, approved, rejected, refunded, total: filteredReturns.length };
    }, [returns, paymentTypeTab]);

    // Filter orders based on tab and search
    const filteredOrders = useMemo(() => {
        let filtered = returns;

        // Filter by status tab
        if (currentTab === 'requested') {
            filtered = filtered.filter(order => order.return.status === 'requested');
        } else if (currentTab === 'approved') {
            // Approved: approved but not yet refunded
            filtered = filtered.filter(order => {
                const isApproved = order.return.status === 'approved';
                const hasRefund = order.refunds?.some(r => r.status === 'completed');
                return isApproved && !hasRefund;
            });
        } else if (currentTab === 'rejected') {
            filtered = filtered.filter(order => order.return.status === 'rejected');
        } else if (currentTab === 'refunded') {
            filtered = filtered.filter(order => order.refunds?.some(r => r.status === 'completed'));
        }
        // 'all' tab shows all returns

        // Filter by payment type
        if (paymentTypeTab === 'cod') {
            filtered = filtered.filter(order => (order as any).payment?.method === 'cod');
        } else if (paymentTypeTab === 'prepaid') {
            filtered = filtered.filter(order => (order as any).payment?.method === 'stripe');
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
    }, [returns, currentTab, searchQuery, paymentTypeTab]);

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
                    <h1 className="text-3xl font-bold tracking-tight">Return Requests</h1>
                    <p className="text-muted-foreground">Manage customer return requests</p>
                </div>
                {/* <Badge variant="outline" className="text-lg px-4 py-2">
                    {filteredOrders.length} {filteredOrders.length === 1 ? 'Request' : 'Requests'}
                </Badge> */}
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Returns</CardTitle>
                        <RotateCcw className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.total}</div>
                        <p className="text-xs text-muted-foreground">All return requests</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Requested</CardTitle>
                        <RotateCcw className="h-4 w-4 text-yellow-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.requested}</div>
                        <p className="text-xs text-muted-foreground">Pending approval</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Approved</CardTitle>
                        <Check className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.approved}</div>
                        <p className="text-xs text-muted-foreground">Awaiting refund</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Refunded</CardTitle>
                        <DollarSign className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.refunded}</div>
                        <p className="text-xs text-muted-foreground">Refund completed</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Rejected</CardTitle>
                        <X className="h-4 w-4 text-red-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.rejected}</div>
                        <p className="text-xs text-muted-foreground">Return denied</p>
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
                            All Returns
                        </TabsTrigger>
                        <TabsTrigger value="cod" className="cursor-pointer">
                            COD Returns
                        </TabsTrigger>
                        <TabsTrigger value="prepaid" className="cursor-pointer">
                            Prepaid Returns
                        </TabsTrigger>
                    </TabsList>
                </Tabs>
            </Card>

            {/* Status Tabs */}
            <Tabs value={currentTab} onValueChange={setCurrentTab} className="space-y-4">
                <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="all" className="cursor-pointer">
                        All ({stats.total})
                    </TabsTrigger>
                    <TabsTrigger value="requested" className="cursor-pointer">
                        <span className="flex items-center gap-2">
                            Requested ({stats.requested})
                            <NotificationDot show={newReturns > 0} />
                        </span>
                    </TabsTrigger>
                    <TabsTrigger value="approved" className="cursor-pointer">
                        Approved ({stats.approved})
                    </TabsTrigger>
                    <TabsTrigger value="refunded" className="cursor-pointer">
                        Refunded ({stats.refunded})
                    </TabsTrigger>
                    <TabsTrigger value="rejected" className="cursor-pointer">
                        Rejected ({stats.rejected})
                    </TabsTrigger>
                </TabsList>

                <TabsContent value={currentTab} className="space-y-4">
                    {paginatedOrders.length === 0 ? (
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center py-12">
                                <RotateCcw className="w-12 h-12 text-muted-foreground mb-4" />
                                <p className="text-lg font-medium">No return requests found</p>
                                <p className="text-sm text-muted-foreground">
                                    {searchQuery ? 'Try adjusting your search' : 'No returns in this category'}
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        <>
                            <div className="grid gap-4">
                                {paginatedOrders.map((returnOrder) => (
                                    <ExpandableOrderCard
                                        key={returnOrder._id}
                                        orderNumber={returnOrder.orderNumber}
                                        date={returnOrder.return.requestedAt}
                                        customer={{
                                            name: returnOrder.user.name,
                                            email: returnOrder.user.email
                                        }}
                                        status={
                                            <>
                                                <Badge className={`${getStatusColor(returnOrder.return.status)} text-white`}>
                                                    {returnOrder.return.status.toUpperCase()}
                                                </Badge>
                                                {returnOrder.refunds?.some(r => r.status === 'completed') && (
                                                    <Badge className="bg-blue-500 text-white ml-2">
                                                        REFUNDED
                                                    </Badge>
                                                )}
                                            </>
                                        }
                                        paymentStatus={
                                            <Badge variant="outline" className={returnOrder.payment?.method === 'cod' ? 'border-orange-500 text-orange-700' : 'border-blue-500 text-blue-700'}>
                                                {returnOrder.payment?.method === 'cod' ? 'COD Order' : 'Prepaid Order'}
                                            </Badge>
                                        }
                                        total={returnOrder.refunds?.some(r => r.status === 'completed')
                                            ? returnOrder.refunds.reduce((sum, r) => sum + r.amount, 0)
                                            : (returnOrder.return.refundAmount || returnOrder.total)}
                                        actions={
                                            <div className="flex gap-2">
                                                {returnOrder.return.status === 'requested' && (
                                                    <>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() =>
                                                                setActionDialog({
                                                                    open: true,
                                                                    orderId: returnOrder._id,
                                                                    action: 'reject',
                                                                })
                                                            }
                                                            className="gap-2 cursor-pointer"
                                                        >
                                                            <X className="w-4 h-4" />
                                                            Reject
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            onClick={() =>
                                                                setActionDialog({
                                                                    open: true,
                                                                    orderId: returnOrder._id,
                                                                    action: 'approve',
                                                                })
                                                            }
                                                            className="gap-2 cursor-pointer"
                                                        >
                                                            <Check className="w-4 h-4" />
                                                            Approve
                                                        </Button>
                                                    </>
                                                )}

                                                {returnOrder.return.status === 'approved' && !returnOrder.refunds?.some(r => r.status === 'completed') && (
                                                    <Button
                                                        size="sm"
                                                        onClick={() => {
                                                            setRefundDialog({
                                                                open: true,
                                                                orderId: returnOrder._id,
                                                                orderTotal: returnOrder.total,
                                                            });
                                                            setRefundAmount((returnOrder.return.refundAmount || returnOrder.total).toFixed(2));
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
                                                    onClick={() => router.push(`/dashboard/orders/${returnOrder._id}`)}
                                                    className="gap-2 cursor-pointer"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                    View Order
                                                </Button>
                                            </div>
                                        }
                                    >
                                        <div>
                                            <p className="text-sm font-medium mb-2">Return Reason:</p>
                                            <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                                                {returnOrder.return.reason}
                                            </p>
                                        </div>

                                        {/* Bank Details for COD Orders */}
                                        {returnOrder.payment?.method === 'cod' && returnOrder.return.bankDetails && (
                                            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                                <p className="text-sm font-semibold mb-3 text-blue-900">Bank Details for ACH Refund (US)</p>
                                                <div className="grid grid-cols-2 gap-3 text-sm">
                                                    <div>
                                                        <p className="text-xs text-blue-700 font-medium">Account Holder Name</p>
                                                        <p className="text-blue-900">{returnOrder.return.bankDetails.accountHolderName}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-blue-700 font-medium">Account Number</p>
                                                        <p className="text-blue-900 font-mono">{returnOrder.return.bankDetails.accountNumber}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-blue-700 font-medium">Routing Number (ABA)</p>
                                                        <p className="text-blue-900 font-mono">{returnOrder.return.bankDetails.routingNumber}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-blue-700 font-medium">Bank Name</p>
                                                        <p className="text-blue-900">{returnOrder.return.bankDetails.bankName}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-blue-700 font-medium">Account Type</p>
                                                        <p className="text-blue-900 capitalize">{returnOrder.return.bankDetails.accountType}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        <div>
                                            <p className="text-sm font-medium mb-2">Order Items:</p>
                                            <div className="space-y-2">
                                                {returnOrder.items.map((item, idx) => (
                                                    <div
                                                        key={idx}
                                                        className="flex items-center gap-3 p-2 bg-muted rounded-lg"
                                                    >
                                                        <div className="text-sm flex-1">
                                                            <p className="font-medium">{item.product?.title || "Unknown Product"}</p>
                                                            <p className="text-muted-foreground">
                                                                Qty: {item.quantity} × ${item.price.toFixed(2)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {returnOrder.refunds && returnOrder.refunds.length > 0 && (
                                            <div className="pt-4 border-t">
                                                <p className="text-sm font-medium mb-2">Refund Information:</p>
                                                <div className="space-y-2">
                                                    {returnOrder.refunds.map((refund, idx) => (
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
                                                                        Stripe Refund ID: <span className="font-mono">{refund.stripeRefundId}</span>
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
                                                    {returnOrder.refunds?.some(r => r.status === 'completed')
                                                        ? 'Refunded Amount'
                                                        : 'Refund Amount'}
                                                </p>
                                                <p className="text-2xl font-bold">
                                                    ${returnOrder.refunds?.some(r => r.status === 'completed')
                                                        ? returnOrder.refunds.reduce((sum, r) => sum + r.amount, 0).toFixed(2)
                                                        : (returnOrder.return.refundAmount || returnOrder.total).toFixed(2)}
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
                                            Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to{' '}
                                            {Math.min(currentPage * ITEMS_PER_PAGE, filteredOrders.length)} of{' '}
                                            {filteredOrders.length} requests
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

            {/* Action Dialog */}
            <Dialog open={actionDialog.open} onOpenChange={(open) => !processing && setActionDialog({ ...actionDialog, open })}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {actionDialog.action === 'approve' ? 'Approve' : 'Reject'} Return Request
                        </DialogTitle>
                        <DialogDescription>
                            {actionDialog.action === 'approve'
                                ? 'Approving this return will move it to the approved tab. You can then initiate the refund.'
                                : 'Please provide a reason for rejecting this return request.'}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="notes">Notes {actionDialog.action === 'reject' && '(Required)'}</Label>
                            <Textarea
                                id="notes"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder={
                                    actionDialog.action === 'approve'
                                        ? 'Add any notes about this approval (optional)'
                                        : 'Explain why this return is being rejected'
                                }
                                rows={4}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setActionDialog({ open: false, orderId: null, action: null });
                                setNotes('');
                            }}
                            disabled={processing}
                            className="cursor-pointer"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleAction}
                            disabled={processing || (actionDialog.action === 'reject' && !notes.trim())}
                            variant={actionDialog.action === 'approve' ? 'default' : 'destructive'}
                            className="cursor-pointer"
                        >
                            {processing ? (
                                <>
                                    <Spinner className="w-4 h-4 mr-2" />
                                    Processing...
                                </>
                            ) : (
                                <>
                                    {actionDialog.action === 'approve' ? 'Approve Return' : 'Reject Return'}
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Refund Dialog */}
            <Dialog open={refundDialog.open} onOpenChange={(open) => !processing && setRefundDialog({ ...refundDialog, open })}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Initiate Refund</DialogTitle>
                        <DialogDescription>
                            Process a refund for this approved return. The order will move to the refunded tab once completed.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="refund-amount">Refund Amount *</Label>
                            <Input
                                id="refund-amount"
                                type="number"
                                step="0.01"
                                min="0"
                                max={refundDialog.orderTotal}
                                value={refundAmount}
                                onChange={(e) => setRefundAmount(e.target.value)}
                                placeholder="0.00"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                                Maximum: ${refundDialog.orderTotal.toFixed(2)}
                            </p>
                        </div>
                        <div>
                            <Label htmlFor="refund-reason">Reason (Optional)</Label>
                            <Textarea
                                id="refund-reason"
                                value={refundReason}
                                onChange={(e) => setRefundReason(e.target.value)}
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
