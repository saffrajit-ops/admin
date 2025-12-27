"use client"

import { Order } from "@/lib/order-store"
import { Button } from "@/components/ui/button"
import { Download, Printer } from "lucide-react"
import { toast } from "sonner"

interface OrdersListPrintProps {
  orders: Order[]
  title?: string
}

export function OrdersListPrint({ orders, title = "Orders List" }: OrdersListPrintProps) {
  const handlePrint = () => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      toast.error("Error", {
        description: "Please allow pop-ups to print the orders list",
      })
      return
    }

    const html = generatePrintHTML(orders, title)
    printWindow.document.write(html)
    printWindow.document.close()
    printWindow.focus()

    // Wait for content to load before printing
    setTimeout(() => {
      printWindow.print()
      printWindow.close()
    }, 250)
  }

  const handleDownloadPDF = () => {
    handlePrint()
    toast.info("Print Dialog", {
      description: "Use 'Save as PDF' option in the print dialog to download",
    })
  }

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        onClick={handlePrint}
        className="gap-2 cursor-pointer"
        disabled={orders.length === 0}
      >
        <Printer className="w-4 h-4" />
        Print List
      </Button>
      <Button
        onClick={handleDownloadPDF}
        className="gap-2 cursor-pointer"
        disabled={orders.length === 0}
      >
        <Download className="w-4 h-4" />
        Download PDF
      </Button>
    </div>
  )
}

function generatePrintHTML(orders: Order[], title: string): string {
  const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0)
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>${title}</title>
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
          }
          .header {
            margin-bottom: 30px;
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 20px;
          }
          .header h1 {
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 8px;
          }
          .header .meta {
            color: #6b7280;
            font-size: 14px;
          }
          .summary {
            display: flex;
            gap: 30px;
            margin-bottom: 30px;
            padding: 20px;
            background: #f9fafb;
            border-radius: 8px;
          }
          .summary-item {
            flex: 1;
          }
          .summary-item .label {
            font-size: 12px;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 4px;
          }
          .summary-item .value {
            font-size: 24px;
            font-weight: 700;
            color: #1a1a1a;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          thead {
            background: #f3f4f6;
          }
          th {
            text-align: left;
            padding: 12px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #374151;
            border-bottom: 2px solid #e5e7eb;
          }
          td {
            padding: 12px;
            border-bottom: 1px solid #e5e7eb;
            font-size: 14px;
          }
          tbody tr:hover {
            background: #f9fafb;
          }
          .status-badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .status-pending { background: #fef3c7; color: #92400e; }
          .status-confirmed { background: #dbeafe; color: #1e40af; }
          .status-processing { background: #e9d5ff; color: #6b21a8; }
          .status-shipped { background: #c7d2fe; color: #3730a3; }
          .status-delivered { background: #d1fae5; color: #065f46; }
          .status-cancelled { background: #fee2e2; color: #991b1b; }
          .status-returned { background: #fed7aa; color: #9a3412; }
          .status-refunded { background: #e5e7eb; color: #374151; }
          .status-failed { background: #fecaca; color: #7f1d1d; }
          .payment-pending { background: #fef3c7; color: #92400e; }
          .payment-completed { background: #d1fae5; color: #065f46; }
          .payment-failed { background: #fee2e2; color: #991b1b; }
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            color: #6b7280;
            font-size: 12px;
          }
          @media print {
            body {
              padding: 20px;
            }
            .header h1 {
              font-size: 24px;
            }
            .summary {
              page-break-inside: avoid;
            }
            table {
              page-break-inside: auto;
            }
            tr {
              page-break-inside: avoid;
              page-break-after: auto;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${title}</h1>
          <div class="meta">
            Generated on ${currentDate} • ${orders.length} order${orders.length !== 1 ? 's' : ''}
          </div>
        </div>

        <div class="summary">
          <div class="summary-item">
            <div class="label">Total Orders</div>
            <div class="value">${orders.length}</div>
          </div>
          <div class="summary-item">
            <div class="label">Total Revenue</div>
            <div class="value">$${totalRevenue.toFixed(2)}</div>
          </div>
          <div class="summary-item">
            <div class="label">Average Order</div>
            <div class="value">$${orders.length > 0 ? (totalRevenue / orders.length).toFixed(2) : '0.00'}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Order #</th>
              <th>Customer</th>
              <th>Items</th>
              <th>Total</th>
              <th>Payment</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            ${orders.map(order => `
              <tr>
                <td><strong>${order.orderNumber}</strong></td>
                <td>
                  <div>${order.user?.name || 'N/A'}</div>
                  <div style="font-size: 12px; color: #6b7280;">${order.user?.email || 'N/A'}</div>
                </td>
                <td>${order.items?.length || 0} item${order.items?.length !== 1 ? 's' : ''}</td>
                <td>
                  <strong>$${order.total.toFixed(2)}</strong>
                  ${order.coupon ? `<div style="font-size: 11px; color: #059669;">-${order.coupon.code}</div>` : ''}
                </td>
                <td>
                  <span class="status-badge payment-${order.payment.status}">
                    ${order.payment.status}
                  </span>
                </td>
                <td>
                  <span class="status-badge status-${order.status}">
                    ${order.status}
                  </span>
                </td>
                <td>${new Date(order.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="footer">
          <p>This is a computer-generated document. No signature is required.</p>
        </div>
      </body>
    </html>
  `
}
