# Orders Components

This directory contains all the components related to order management in the admin panel.

## Components

### `order-table.tsx`
Displays a table of orders with key information:
- Order number
- Customer details (name, email)
- Number of items
- Total amount
- Payment status
- Order status
- Creation date
- View action button

### `order-filters.tsx`
Provides filtering options for orders:
- Search by order number, customer name, or email
- Filter by order status (pending, confirmed, processing, shipped, delivered, cancelled, returned, refunded, failed)
- Filter by payment status (pending, completed, failed)
- Clear filters button

### `order-details-dialog.tsx`
Shows comprehensive order information in a modal dialog:
- Customer information (name, email, phone)
- Shipping address
- Order items with images and pricing
- Payment information (subtotal, discount, total, payment method, payment status)
- Shipping information (tracking number, shipped date, notes)
- Order timeline (created, confirmed, delivered dates)
- Update status button

### `order-status-dialog.tsx`
Allows admins to update order status:
- Select new status from dropdown
- Add tracking number (for shipped status)
- Add optional notes
- Submit status update

### `order-stats-cards.tsx`
Displays key order statistics in card format:
- Total orders
- Total revenue
- Average order value
- Pending orders

### `order-pagination.tsx`
Provides pagination controls for the orders table:
- Shows current page and total items
- First/Previous/Next/Last page buttons
- Page number buttons with ellipsis for large page counts
- Always visible, even with fewer than 20 orders
- Displays "Showing X to Y of Z orders" or "No orders found"
- Works seamlessly with search and filters

## Usage

```tsx
import { OrderTable } from "@/components/orders/order-table"
import { OrderFilters } from "@/components/orders/order-filters"
import { OrderDetailsDialog } from "@/components/orders/order-details-dialog"
import { OrderStatusDialog } from "@/components/orders/order-status-dialog"
import { OrderStatsCards } from "@/components/orders/order-stats-cards"
import { OrderPagination } from "@/components/orders/order-pagination"

// Use in your page component
<OrderStatsCards stats={stats} isLoading={isLoading} />
<OrderFilters {...filterProps} />
<OrderTable orders={paginatedOrders} onOrderClick={handleClick} onStatusChange={handleStatusChange} isLoading={isLoading} />
<OrderPagination currentPage={page} totalPages={totalPages} totalItems={total} itemsPerPage={20} onPageChange={handlePageChange} />
<OrderDetailsDialog order={selectedOrder} onStatusUpdate={handleStatusUpdate} />
```

## Features

- Responsive design that works on mobile, tablet, and desktop
- Loading states with skeleton screens
- Empty states with helpful messages
- Color-coded status badges for quick visual identification
- Comprehensive order details view
- Easy status management workflow
- Real-time updates after status changes
- Pagination with 20 orders per page
- Pagination works with search and filters
- Clickable order rows to view details
- Recently updated/created orders appear first

## Status Colors

Order statuses are color-coded for easy identification:
- **Pending**: Yellow
- **Confirmed**: Blue
- **Processing**: Purple
- **Shipped**: Indigo
- **Delivered**: Green
- **Cancelled**: Red
- **Returned**: Orange
- **Refunded**: Pink
- **Failed**: Gray
