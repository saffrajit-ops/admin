# Blog Components

This directory contains all the components related to blog management in the admin panel.

## Components

### `blog-table.tsx`
Displays a table of blog posts with key information:
- Cover image or placeholder
- Post title and excerpt
- Tags (first 2 shown)
- Author name
- Category
- Publication status (Published/Draft)
- View count
- Creation date
- Action buttons (Preview, Edit, Delete)

### `blog-filters.tsx`
Provides filtering options for blog posts:
- Search by title, excerpt, or tags
- Filter by status (All, Published, Draft)
- Filter by category (All, Skincare, Wellness, CBD, Lifestyle, News)
- Clear filters button

### `blog-preview-dialog.tsx`
Shows comprehensive blog post preview in a modal dialog:
- Cover image
- Title and excerpt
- Meta information (author, date, reading time, views)
- Category and tags
- Full post content (HTML rendered)
- SEO meta information (if available)

### `blog-form.tsx`
Form component for creating and editing blog posts:
- Title and slug fields
- Excerpt and body content
- Author, category, and tags
- Cover image upload with preview
- Publish/Draft toggle
- Save and cancel buttons

### `blog-pagination.tsx`
Provides pagination controls for the blog table:
- Shows current page and total items
- First/Previous/Next/Last page buttons
- Page number buttons with ellipsis for large page counts
- Always visible
- Displays "Showing X to Y of Z posts"

## Usage

```tsx
import { BlogTable } from "@/components/blog/blog-table"
import { BlogFilters } from "@/components/blog/blog-filters"
import { BlogPreviewDialog } from "@/components/blog/blog-preview-dialog"
import { BlogForm } from "@/components/blog/blog-form"
import { BlogPagination } from "@/components/blog/blog-pagination"

// Use in your page component
<BlogFilters {...filterProps} />
<BlogTable posts={paginatedPosts} onEdit={handleEdit} onDelete={handleDelete} onPreview={handlePreview} />
<BlogPagination currentPage={page} totalPages={totalPages} totalItems={total} itemsPerPage={20} onPageChange={handlePageChange} />
<BlogPreviewDialog post={selectedPost} open={open} onOpenChange={setOpen} />
<BlogForm post={post} onSubmit={handleSubmit} onCancel={handleCancel} isLoading={isLoading} />
```

## Features

- Responsive design that works on mobile, tablet, and desktop
- Loading states with skeleton screens
- Empty states with helpful messages
- Cover image upload and preview
- Rich text content support
- SEO meta fields
- Tag and category management
- Publication status toggle
- Pagination with 20 posts per page
- Search and filter functionality
- Preview before publishing
- Recently updated/created posts appear first

## Pages

### `/dashboard/blog`
Main blog listing page with:
- All blog posts in a table
- Search and filter options
- Pagination
- Create new post button
- Edit, delete, and preview actions

### `/dashboard/blog/new`
Create new blog post page with:
- Blog form for all fields
- Cover image upload
- Publish/Draft toggle
- Save and cancel buttons

### `/dashboard/blog/[id]/edit`
Edit existing blog post page with:
- Pre-filled blog form
- Update functionality
- Same features as new post page

## API Integration

The blog manager integrates with the backend API:
- `GET /admin/blog` - Fetch all blog posts
- `POST /admin/blog` - Create new blog post
- `PUT /admin/blog/:id` - Update blog post
- `DELETE /admin/blog/:id` - Delete blog post

All requests require admin authentication token.
