"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuthStore } from "@/lib/auth-store"
import { useOrderStore, Order } from "@/lib/order-store"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Download, Printer, Package } from "lucide-react"
import Image from "next/image"
import { toast } from "sonner"
import { OrderTrackingInfo } from "@/components/orders/order-tracking-info"
import { OrderActivityTimeline } from "@/components/orders/order-activity-timeline"

export default function OrderDetailPage() {
    const params = useParams()
    const router = useRouter()
    const { accessToken } = useAuthStore()
    const { fetchOrderById } = useOrderStore()
    const [order, setOrder] = useState<Order | null>(null)
    const [loading, setLoading] = useState(true)
    const [isPrinting, setIsPrinting] = useState(false)

    useEffect(() => {
        const loadOrder = async () => {
            if (!accessToken) {
                toast.error("Error", {
                    description: "Authentication required",
                })
                router.push("/dashboard/orders")
                return
            }

            try {
                const orderData = await fetchOrderById(params.id as string, accessToken)
                if (orderData) {
                    setOrder(orderData)
                } else {
                    throw new Error("Order not found")
                }
            } catch (error) {
                toast.error("Error", {
                    description: error instanceof Error ? error.message : "Failed to load order",
                })
                router.push("/dashboard/orders")
            } finally {
                setLoading(false)
            }
        }

        loadOrder()
    }, [params.id, accessToken, fetchOrderById, router])

    const handlePrint = () => {
        if (!order) return

        setIsPrinting(true)

        try {
            // Generate the filename
            const customerName = order.user?.name?.replace(/[^a-zA-Z0-9]/g, '_') || 'Customer'
            const orderNumber = order.orderNumber.replace(/[^a-zA-Z0-9]/g, '_')
            const filename = `Invoice_${customerName}_${orderNumber}`

            // Create a hidden iframe for printing
            const iframe = document.createElement('iframe')
            iframe.style.position = 'fixed'
            iframe.style.right = '0'
            iframe.style.bottom = '0'
            iframe.style.width = '0'
            iframe.style.height = '0'
            iframe.style.border = 'none'
            iframe.setAttribute('title', filename)
            iframe.setAttribute('name', filename)
            document.body.appendChild(iframe)

            const iframeDoc = iframe.contentWindow?.document
            if (!iframeDoc) {
                toast.error("Error", {
                    description: "Failed to create print document",
                })
                setIsPrinting(false)
                return
            }

            const html = generateReceiptHTML(order)
            iframeDoc.open()
            iframeDoc.write(html)
            iframeDoc.close()

            // Wait for content to load then print
            iframe.onload = () => {
                setTimeout(() => {
                    iframe.contentWindow?.focus()
                    iframe.contentWindow?.print()

                    // Remove iframe after printing
                    setTimeout(() => {
                        document.body.removeChild(iframe)
                        setIsPrinting(false)
                    }, 1000)
                }, 500)
            }

            // Fallback if onload doesn't fire
            setTimeout(() => {
                if (iframe.contentWindow) {
                    iframe.contentWindow.focus()
                    iframe.contentWindow.print()

                    setTimeout(() => {
                        if (document.body.contains(iframe)) {
                            document.body.removeChild(iframe)
                        }
                        setIsPrinting(false)
                    }, 1000)
                }
            }, 2000)
        } catch (error) {
            console.error('Print error:', error)
            toast.error("Error", {
                description: "Failed to open print dialog",
            })
            setIsPrinting(false)
        }
    }

    const handleDownloadPDF = () => {
        if (!order) return

        // Generate the filename
        const customerName = order.user?.name?.replace(/[^a-zA-Z0-9]/g, '_') || 'Customer'
        const orderNumber = order.orderNumber.replace(/[^a-zA-Z0-9]/g, '_')
        const filename = `Invoice_${customerName}_${orderNumber}`

        toast.info("Download PDF", {
            description: `Opening print dialog. Select 'Save as PDF' and use filename: ${filename}.pdf`,
            duration: 8000,
        })

        setTimeout(() => {
            handlePrint()
        }, 500)
    }

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            pending: "bg-yellow-500",
            confirmed: "bg-blue-500",
            processing: "bg-purple-500",
            shipped: "bg-indigo-500",
            delivered: "bg-green-500",
            cancelled: "bg-red-500",
            returned: "bg-orange-500",
            refunded: "bg-gray-500",
            failed: "bg-red-600",
        }
        return colors[status] || "bg-gray-500"
    }

    const getPaymentStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            pending: "bg-yellow-500",
            completed: "bg-green-500",
            failed: "bg-red-500",
        }
        return colors[status] || "bg-gray-500"
    }

    const generateReceiptHTML = (order: Order): string => {
        const currentDate = new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        })

        const itemsHTML = order.items.map(item => {
            const isProductDeleted = !item.product || !item.product._id;
            const sku = item.product?.sku || 'N/A';
            const deletedLabel = isProductDeleted ? '<span style="color: #ef4444; font-size: 11px; margin-left: 8px;">(Deleted)</span>' : '';

            return `
                <tr>
                    <td>
                        <div class="item-name">${item.title}${deletedLabel}</div>
                        <div class="item-sku">SKU: ${sku}</div>
                    </td>
                    <td class="text-center">${item.quantity}</td>
                    <td class="text-right">${item.price.toFixed(2)}</td>
                    <td class="text-right"><strong>${item.subtotal.toFixed(2)}</strong></td>
                </tr>
            `;
        }).join('');

        // Create a clean filename for the PDF
        const customerName = order.user?.name?.replace(/[^a-zA-Z0-9]/g, '_') || 'Customer'
        const orderNumber = order.orderNumber.replace(/[^a-zA-Z0-9]/g, '_')
        const filename = `Invoice_${customerName}_${orderNumber}`

        return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>${filename}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            padding: 40px;
            color: #1a1a1a;
            line-height: 1.6;
            background: white;
        }
        .receipt-container {
            max-width: 800px;
            margin: 0 auto;
        }
        .receipt-header {
            border-bottom: 3px solid #000;
            padding-bottom: 30px;
            margin-bottom: 30px;
            display: flex;
            justify-content: space-between;
            align-items: start;
        }
        .company-info h1 {
            font-size: 36px;
            font-weight: 700;
            margin-bottom: 8px;
        }
        .company-info p {
            font-size: 14px;
            color: #6b7280;
            margin: 2px 0;
        }
        .order-info {
            text-align: right;
        }
        .status-badges {
            margin-bottom: 16px;
        }
        .badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-left: 8px;
            border: 1px solid;
        }
        .badge-pending { background: #fef3c7; color: #92400e; border-color: #fbbf24; }
        .badge-confirmed { background: #dbeafe; color: #1e40af; border-color: #3b82f6; }
        .badge-processing { background: #e9d5ff; color: #6b21a8; border-color: #a855f7; }
        .badge-shipped { background: #c7d2fe; color: #3730a3; border-color: #6366f1; }
        .badge-delivered { background: #d1fae5; color: #065f46; border-color: #10b981; }
        .badge-cancelled { background: #fee2e2; color: #991b1b; border-color: #ef4444; }
        .badge-completed { background: #d1fae5; color: #065f46; border-color: #10b981; }
        .badge-failed { background: #fee2e2; color: #991b1b; border-color: #ef4444; }
        .order-number {
            font-size: 24px;
            font-weight: 700;
            color: #ea580c;
            margin: 8px 0;
        }
        .order-date {
            font-size: 12px;
            color: #6b7280;
        }
        .bill-ship-section {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 40px;
            margin-bottom: 30px;
            page-break-inside: avoid;
        }
        .section-title {
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: #6b7280;
            margin-bottom: 12px;
        }
        .address-info p {
            font-size: 14px;
            margin: 4px 0;
        }
        .address-info .name {
            font-weight: 600;
            font-size: 15px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 30px 0;
            page-break-inside: auto;
        }
        thead {
            display: table-header-group;
        }
        thead tr {
            border-bottom: 2px solid #000;
        }
        th {
            text-align: left;
            padding: 12px 8px;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #374151;
        }
        th.text-center { text-align: center; }
        th.text-right { text-align: right; }
        tbody tr {
            border-bottom: 1px solid #e5e7eb;
            page-break-inside: avoid;
            page-break-after: auto;
        }
        td {
            padding: 16px 8px;
            font-size: 14px;
        }
        td.text-center { text-align: center; }
        td.text-right { text-align: right; }
        .item-name {
            font-weight: 500;
            margin-bottom: 4px;
        }
        .item-sku {
            font-size: 12px;
            color: #6b7280;
        }
        .totals-section {
            display: flex;
            justify-content: flex-end;
            margin: 30px 0;
            page-break-inside: avoid;
        }
        .totals-box {
            width: 320px;
        }
        .total-row {
            display: flex;
            justify-content: space-between;
            padding: 12px 0;
            font-size: 14px;
        }
        .total-row.subtotal {
            color: #6b7280;
        }
        .total-row.discount {
            color: #059669;
        }
        .total-row.final {
            border-top: 2px solid #000;
            padding-top: 16px;
            margin-top: 8px;
            font-size: 18px;
            font-weight: 700;
        }
        .payment-shipping-section {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 40px;
            margin: 30px 0;
            padding-top: 30px;
            border-top: 1px solid #e5e7eb;
            page-break-inside: avoid;
        }
        .info-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            font-size: 14px;
        }
        .info-label {
            color: #6b7280;
        }
        .info-value {
            font-weight: 500;
            text-align: right;
        }
        .footer {
            margin-top: 50px;
            padding-top: 30px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            page-break-inside: avoid;
        }
        .footer p {
            font-size: 12px;
            color: #6b7280;
            margin: 4px 0;
        }
        @media print {
            body {
                padding: 20px;
            }
            @page {
                size: A4;
                margin: 15mm;
            }
        }
    </style>
</head>
<body>
    <div class="receipt-container">
        <!-- Header -->
        <div class="receipt-header">
            <div class="company-info">
                <h1>INVOICE</h1>
                <p>CanaGold Beauty</p>
                <p>123 Business Street</p>
                <p>City, State 12345</p>
                <p>contact@canagold.com</p>
            </div>
            <div class="order-info">
                <div class="status-badges">
                    <span class="badge badge-${order.status}">${order.status.toUpperCase()}</span>
                    <span class="badge badge-${order.payment.status}">${order.payment.status.toUpperCase()}</span>
                </div>
                <div class="order-number">#${order.orderNumber}</div>
                <div class="order-date">Date: ${new Date(order.createdAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })}</div>
            </div>
        </div>

        <!-- Bill To / Ship To -->
        <div class="bill-ship-section">
            ${order.user ? `
            <div>
                <div class="section-title">Bill To</div>
                <div class="address-info">
                    <p class="name">${order.user.name}</p>
                    <p>${order.user.email}</p>
                    ${order.user.phone ? `<p>${order.user.phone}</p>` : ''}
                </div>
            </div>
            ` : ''}
            
            ${order.shippingAddress ? `
            <div>
                <div class="section-title">Ship To</div>
                <div class="address-info">
                    ${order.shippingAddress.label ? `<p class="name">${order.shippingAddress.label}</p>` : ''}
                    <p>${order.shippingAddress.line1}</p>
                    ${order.shippingAddress.line2 ? `<p>${order.shippingAddress.line2}</p>` : ''}
                    <p>${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zip}</p>
                    <p>${order.shippingAddress.country}</p>
                </div>
            </div>
            ` : ''}
        </div>

        <!-- Items Table -->
        <table>
            <thead>
                <tr>
                    <th>Item</th>
                    <th class="text-center">Qty</th>
                    <th class="text-right">Price</th>
                    <th class="text-right">Total</th>
                </tr>
            </thead>
            <tbody>
                ${order.items.map(item => `
                <tr>
                    <td>
                        <div class="item-name">${item.title}</div>
                        <div class="item-sku">SKU: ${item.product?.sku || 'N/A'}</div>
                    </td>
                    <td class="text-center">${item.quantity}</td>
                    <td class="text-right">$${item.price.toFixed(2)}</td>
                    <td class="text-right"><strong>$${item.subtotal.toFixed(2)}</strong></td>
                </tr>
                `).join('')}
            </tbody>
        </table>

        <!-- Totals -->
        <div class="totals-section">
            <div class="totals-box">
                <div class="total-row subtotal">
                    <span>Subtotal</span>
                    <span>$${order.subtotal.toFixed(2)}</span>
                </div>
                ${order.coupon ? `
                <div class="total-row discount">
                    <span>Discount (${order.coupon.code})</span>
                    <span>-$${order.coupon.discount.toFixed(2)}</span>
                </div>
                ` : ''}
                <div class="total-row final">
                    <span>TOTAL</span>
                    <span>$${order.total.toFixed(2)} ${order.currency}</span>
                </div>
            </div>
        </div>

        <!-- Payment & Shipping Info -->
        <div class="payment-shipping-section">
            <div>
                <div class="section-title">Payment Information</div>
                <div class="info-row">
                    <span class="info-label">Method:</span>
                    <span class="info-value">${order.payment.method}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Status:</span>
                    <span class="info-value">${order.payment.status}</span>
                </div>
                ${order.payment.paidAt ? `
                <div class="info-row">
                    <span class="info-label">Paid:</span>
                    <span class="info-value">${new Date(order.payment.paidAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        })}</span>
                </div>
                ` : ''}
            </div>
            
            ${order.shipping ? `
            <div>
                <div class="section-title">Shipping Information</div>
                ${order.shipping.trackingNumber ? `
                <div class="info-row">
                    <span class="info-label">Tracking:</span>
                    <span class="info-value" style="font-family: monospace; font-size: 12px;">${order.shipping.trackingNumber}</span>
                </div>
                ` : ''}
                <div class="info-row">
                    <span class="info-label">Shipped:</span>
                    <span class="info-value">${new Date(order.shipping.shippedAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        })}</span>
                </div>
            </div>
            ` : ''}
        </div>

        <!-- Footer -->
        <div class="footer">
            <p><strong>Thank you for your business!</strong></p>
            <p>If you have any questions about this invoice, please contact us at contact@canagold.com</p>
            <p style="margin-top: 20px; font-size: 11px;">Generated on ${currentDate}</p>
        </div>
    </div>
</body>
</html>
        `
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-muted-foreground">Loading order details...</p>
            </div>
        )
    }

    if (!order) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <p className="text-muted-foreground mb-4">Order not found</p>
                    <Button onClick={() => router.push("/dashboard/orders")}>
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Orders
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <>
            <style jsx global>{`
        @media print {
          /* Hide non-printable elements */
          .no-print {
            display: none !important;
          }
          .print-only {
            display: block !important;
          }
          
          /* Reset body and page setup */
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          
          body {
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          
          /* Page setup */
          @page {
            size: A4;
            margin: 15mm;
          }
          
          /* Receipt container */
          .receipt-container {
            max-width: 100% !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            background: white !important;
          }
          
          /* Header - keep together */
          .receipt-header {
            page-break-after: avoid;
            page-break-inside: avoid;
            border-bottom: 3px solid #000 !important;
            margin-bottom: 20px !important;
          }
          
          /* Bill/Ship section - keep together */
          .bill-ship-section {
            page-break-inside: avoid;
            page-break-after: avoid;
            margin-bottom: 20px !important;
          }
          
          /* Items table */
          .items-table {
            page-break-inside: auto;
            width: 100%;
          }
          
          .items-table thead {
            display: table-header-group;
          }
          
          .items-table tbody tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }
          
          /* Totals section - keep together */
          .totals-section {
            page-break-inside: avoid;
            margin-top: 20px !important;
          }
          
          /* Payment/Shipping info - keep together if possible */
          .payment-shipping-section {
            page-break-inside: avoid;
            margin-top: 20px !important;
          }
          
          /* Footer */
          .receipt-footer {
            page-break-inside: avoid;
            margin-top: 30px !important;
          }
          
          /* Ensure images print */
          img {
            max-width: 100% !important;
            page-break-inside: avoid;
          }
          
          /* Table styling for print */
          table {
            border-collapse: collapse !important;
            width: 100% !important;
          }
          
          th, td {
            border: 1px solid #e5e7eb !important;
          }
          
          /* Badge colors */
          .badge-print {
            border: 1px solid #000 !important;
            padding: 2px 8px !important;
            display: inline-block !important;
          }
        }
        
        @media screen {
          .print-only {
            display: none;
          }
          .receipt-container {
            background: white !important;
            color: #1a1a1a !important;
            box-shadow: 0 0 40px rgba(0, 0, 0, 0.1);
          }
          .receipt-container * {
            color: inherit;
          }
          .receipt-container .text-muted-foreground {
            color: #6b7280 !important;
          }
          .receipt-container .text-primary {
            color: #ea580c !important;
          }
        }
      `}</style>

            <div className="min-h-screen bg-background">
                <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8 no-print">
                        <Button
                            variant="ghost"
                            onClick={() => router.push("/dashboard/orders")}
                            className="gap-2 cursor-pointer"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back to Orders
                        </Button>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                onClick={handlePrint}
                                className="gap-2 cursor-pointer"
                                disabled={isPrinting}
                            >
                                {isPrinting ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                        Printing...
                                    </>
                                ) : (
                                    <>
                                        <Printer className="w-4 h-4" />
                                        Print
                                    </>
                                )}
                            </Button>
                            <Button
                                onClick={handleDownloadPDF}
                                className="gap-2 cursor-pointer"
                                disabled={isPrinting}
                            >
                                {isPrinting ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        Loading...
                                    </>
                                ) : (
                                    <>
                                        <Download className="w-4 h-4" />
                                        Download PDF
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>

                    {/* Receipt Container */}
                    <div className="receipt-container rounded-lg p-8 md:p-12 bg-white text-gray-900">
                        {/* Receipt Header */}
                        <div className="receipt-header pb-8 mb-8 border-b-2 border-gray-900">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h1 className="text-4xl font-bold mb-2">INVOICE</h1>
                                    <p className="text-xl text-muted-foreground">canagold beauty</p>
                                    {/* <p className="text-sm text-muted-foreground">123 Business Street</p>
                                    <p className="text-sm text-muted-foreground">City, State 12345</p>
                                    <p className="text-sm text-muted-foreground">contact@company.com</p> */}
                                </div>
                                <div className="text-right">
                                    <div className="mb-4 flex items-right space-x-4">
                                        {/* Order Status Heading and Badge */}
                                        <div>
                                            <h4 className="text-sm font-semibold text-muted-foreground mb-1">Order Status</h4>
                                            <Badge className={`badge-print ${getStatusColor(order.status)} text-white text-xs px-3 py-1`}>
                                                {order.status.toUpperCase()}
                                            </Badge>
                                        </div>

                                        {/* Payment Status Heading and Badge */}
                                        <div>
                                            <h4 className="text-sm font-semibold text-muted-foreground mb-1">Payment Status</h4>
                                            <Badge className={`badge-print ${getPaymentStatusColor(order.payment.status)} text-white text-xs px-3 py-1`}>
                                                {order.payment.status.toUpperCase()}
                                            </Badge>
                                        </div>
                                    </div>
                                    <p className="text-sm font-semibold">Order Number</p>
                                    <p className="text-2xl font-bold text-primary mb-2">#{order.orderNumber}</p>
                                    <p className="text-xs text-muted-foreground">
                                        Date: {new Date(order.createdAt).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Bill To / Ship To Section */}
                        <div className="bill-ship-section grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                            {/* Bill To */}
                            {order.user && (
                                <div>
                                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Bill To</h3>
                                    <div className="space-y-1">
                                        <p className="font-semibold text-base">{order.user.name}</p>
                                        <p className="text-sm">{order.user.email}</p>
                                        {order.user.phone && <p className="text-sm">{order.user.phone}</p>}
                                    </div>
                                </div>
                            )}

                            {/* Ship To */}
                            {order.shippingAddress && (
                                <div>
                                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Ship To</h3>
                                    <div className="space-y-1">
                                        {order.shippingAddress.label && (
                                            <p className="font-semibold text-base">{order.shippingAddress.label}</p>
                                        )}
                                        <p className="text-sm">{order.shippingAddress.line1}</p>
                                        {order.shippingAddress.line2 && <p className="text-sm">{order.shippingAddress.line2}</p>}
                                        <p className="text-sm">
                                            {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zip}
                                        </p>
                                        <p className="text-sm">{order.shippingAddress.country}</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Order Items Table */}
                        <div className="mb-8">
                            <table className="items-table w-full">
                                <thead>
                                    <tr className="border-b-2 border-gray-900">
                                        <th className="text-left py-3 text-xs font-bold uppercase tracking-wider">Item</th>
                                        <th className="text-center py-3 text-xs font-bold uppercase tracking-wider">Qty</th>
                                        <th className="text-right py-3 text-xs font-bold uppercase tracking-wider">Price</th>
                                        <th className="text-right py-3 text-xs font-bold uppercase tracking-wider">Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {order.items.map((item, index) => {
                                        const isProductDeleted = !item.product || !item.product._id;
                                        return (
                                            <tr key={index} className="border-b border-gray-200">
                                                <td className="py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-12 h-12 rounded overflow-hidden bg-muted shrink-0 no-print">
                                                            {item.product?.images?.[0] ? (
                                                                <Image
                                                                    src={item.product.images[0].url}
                                                                    alt={item.product.images[0].altText || item.title}
                                                                    width={48}
                                                                    height={48}
                                                                    className="object-cover w-full h-full"
                                                                />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center">
                                                                    <Package className="w-5 h-5 text-muted-foreground" />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-sm">
                                                                {item.title}
                                                                {isProductDeleted && (
                                                                    <span className="ml-2 text-xs text-red-500">(Deleted)</span>
                                                                )}
                                                            </p>
                                                            <p className="text-xs text-muted-foreground">SKU: {item.product?.sku || "N/A"}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-4 text-center text-sm">{item.quantity}</td>
                                                <td className="py-4 text-right text-sm">${item.price.toFixed(2)}</td>
                                                <td className="py-4 text-right font-semibold text-sm">${item.subtotal.toFixed(2)}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Totals Section */}
                        <div className="totals-section flex justify-end mb-8">
                            <div className="w-full md:w-80 space-y-3">
                                <div className="flex justify-between text-sm py-2">
                                    <span className="text-muted-foreground">Subtotal</span>
                                    <span className="font-medium">${order.subtotal.toFixed(2)}</span>
                                </div>
                                {order.coupon && (
                                    <div className="flex justify-between text-sm py-2 text-green-600">
                                        <span>Discount ({order.coupon.code})</span>
                                        <span className="font-medium">-${order.coupon.discount.toFixed(2)}</span>
                                    </div>
                                )}
                                <div className="border-t-2 border-gray-900 pt-3 flex justify-between">
                                    <span className="text-lg font-bold">TOTAL</span>
                                    <span className="text-2xl font-bold">${order.total.toFixed(2)} {order.currency}</span>
                                </div>
                            </div>
                        </div>

                        {/* Payment & Shipping Info */}
                        <div className="payment-shipping-section grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-gray-200">
                            {/* Payment Information */}
                            <div>
                                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Payment Information</h3>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Method:</span>
                                        <span className="font-medium capitalize">{order.payment.method}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Status:</span>
                                        <span className="font-medium capitalize">{order.payment.status}</span>
                                    </div>
                                    {order.payment.paidAt && (
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Paid:</span>
                                            <span className="font-medium">
                                                {new Date(order.payment.paidAt).toLocaleDateString('en-US', {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    year: 'numeric'
                                                })}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Shipping Information */}
                            {order.shipping && (
                                <div>
                                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Shipping Information</h3>
                                    <div className="space-y-2 text-sm">
                                        {order.shipping.trackingNumber && (
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Tracking:</span>
                                                <span className="font-medium font-mono text-xs">{order.shipping.trackingNumber}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Shipped:</span>
                                            <span className="font-medium">
                                                {new Date(order.shipping.shippedAt).toLocaleDateString('en-US', {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    year: 'numeric'
                                                })}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="receipt-footer mt-12 pt-8 border-t border-gray-200 text-center">
                            <p className="text-xs text-muted-foreground mb-2">Thank you for your business!</p>
                            <p className="text-xs text-muted-foreground">
                                If you have any questions about this invoice, please contact us at contact@company.com
                            </p>
                        </div>
                    </div>

                    {/* Tracking and Activity Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8 no-print">
                        <OrderTrackingInfo order={order} />
                        <OrderActivityTimeline order={order} />
                    </div>
                </div>
            </div>
        </>
    )
}
