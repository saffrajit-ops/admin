# Product Management System

Complete product management with table view, search, filters, and inline editing.

## Components

### ProductTable
Display products in a table with actions.

```tsx
<ProductTable
  products={filteredProducts}
  onEdit={handleEdit}
  onDelete={handleDelete}
  isLoading={isLoading}
/>
```

Features:
- Product thumbnail preview
- SKU, brand, price, stock display
- Status badges (Active/Inactive, Featured)
- Edit and delete actions
- Loading skeleton states
- Empty state handling

### ProductFilters
Search and filter products.

```tsx
<ProductFilters
  search={search}
  onSearchChange={setSearch}
  status={statusFilter}
  onStatusChange={setStatusFilter}
  featured={featuredFilter}
  onFeaturedChange={setFeaturedFilter}
  onClear={handleClearFilters}
/>
```

Features:
- Real-time search (title, SKU, brand)
- Status filter (all, active, inactive)
- Featured filter (all, featured, not featured)
- Clear all filters button

### ProductFormDialog
Modal form for creating/editing products.

```tsx
<ProductFormDialog
  open={dialogOpen}
  onOpenChange={setDialogOpen}
  product={editingProduct}
  onSubmit={handleSubmit}
  isLoading={isLoading}
/>
```

Features:
- Create new products
- Edit existing products
- Image upload with preview
- Form validation
- Responsive dialog layout

### ProductFormField
Reusable input field component.

```tsx
<ProductFormField
  label="Product Title"
  name="title"
  value={formData.title}
  onChange={(value) => updateField("title", value)}
  placeholder="Enter product title"
  required
  prefix="$" // Optional prefix for currency
/>
```

### ProductTextareaField
Multi-line text input for descriptions.

```tsx
<ProductTextareaField
  label="Description"
  name="description"
  value={formData.description}
  onChange={(value) => updateField("description", value)}
  rows={6}
/>
```

### ProductCheckboxField
Checkbox with label and description.

```tsx
<ProductCheckboxField
  label="Active"
  name="isActive"
  checked={formData.isActive}
  onChange={(checked) => updateField("isActive", checked)}
  description="Product is visible and available"
/>
```

### ImageUpload
Image upload with preview and alt text.

```tsx
<ImageUpload
  images={images}
  onChange={setImages}
  maxImages={5}
/>
```

Features:
- Multiple image upload
- Drag-and-drop support
- Image preview
- Alt text editing
- Primary image indicator
- Remove images

## Hook

### useProductForm
Custom hook for managing product form state.

```tsx
const {
  formData,
  images,
  updateField,
  setImages,
  buildFormData,
  resetForm
} = useProductForm()
```

## Store

### useProductStore
Zustand store for product state management.

```tsx
const {
  products,
  isLoading,
  error,
  fetchProducts,
  addProduct,
  updateProduct,
  deleteProduct
} = useProductStore()
```

## API Integration

All API calls follow the backend specification:

- `GET /api/products` - Fetch products
- `POST /api/admin/products` - Create product
- `PUT /api/admin/products/:id` - Update product
- `DELETE /api/admin/products/:id` - Delete product

Form data includes:
- title, sku, brand (required)
- price, stock (required)
- compareAtPrice (optional)
- shortDescription (required)
- description (optional)
- isActive, isFeatured (boolean)
- images (multipart/form-data)

## Features

- Table-based product listing
- Real-time search and filtering
- Inline edit/delete actions
- Modal-based form (create/edit)
- Image upload with preview
- Dollar ($) prefix for prices
- Status badges
- Loading states
- Error handling
- Toast notifications
- Mobile responsive
- TypeScript support
