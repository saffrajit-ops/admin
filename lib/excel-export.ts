import * as XLSX from 'xlsx';
import { Product } from './product-store';
import { BlogPost } from './blog-store';

/**
 * Export products to Excel file
 */
export function exportProductsToExcel(products: Product[], filename: string = 'products') {
  // Prepare data for Excel
  const data = products.map((product) => ({
    'Product ID': product._id,
    'Title': product.title,
    'SKU': product.sku,
    'Brand': product.brand,
    'Price': product.price,
    'Compare At Price': product.compareAtPrice || '',
    'Stock': product.stock,
    'Type': product.type,
    'Categories': Array.isArray(product.categories) ? product.categories.join(', ') : '',
    'Collection': product.collection || '',
    'Concern': Array.isArray(product.concern) ? product.concern.join(', ') : '',
    'Short Description': product.shortDescription || '',
    'Description': product.description || '',
    'Benefits': Array.isArray(product.benefits) ? product.benefits.join('; ') : '',
    'How To Apply': product.howToApply || '',
    'Ingredients': product.ingredientsText || '',
    'Is Active': product.isActive ? 'Yes' : 'No',
    'Is Featured': product.isFeatured ? 'Yes' : 'No',
    'Rating Average': product.ratingAvg || 0,
    'Rating Count': product.ratingCount || 0,
    'Images': Array.isArray(product.images) ? product.images.map(img => img.url).join('; ') : '',
    'Created At': new Date(product.createdAt).toLocaleString(),
    'Updated At': product.updatedAt ? new Date(product.updatedAt).toLocaleString() : '',
  }));

  // Create worksheet
  const worksheet = XLSX.utils.json_to_sheet(data);

  // Set column widths
  const columnWidths = [
    { wch: 25 }, // Product ID
    { wch: 40 }, // Title
    { wch: 15 }, // SKU
    { wch: 20 }, // Brand
    { wch: 10 }, // Price
    { wch: 15 }, // Compare At Price
    { wch: 10 }, // Stock
    { wch: 15 }, // Type
    { wch: 30 }, // Categories
    { wch: 20 }, // Collection
    { wch: 30 }, // Concern
    { wch: 50 }, // Short Description
    { wch: 60 }, // Description
    { wch: 50 }, // Benefits
    { wch: 50 }, // How To Apply
    { wch: 50 }, // Ingredients
    { wch: 10 }, // Is Active
    { wch: 12 }, // Is Featured
    { wch: 12 }, // Rating Average
    { wch: 12 }, // Rating Count
    { wch: 60 }, // Images
    { wch: 20 }, // Created At
    { wch: 20 }, // Updated At
  ];
  worksheet['!cols'] = columnWidths;

  // Create workbook
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Products');

  // Generate file
  const timestamp = new Date().toISOString().split('T')[0];
  const fileName = `${filename}_${timestamp}.xlsx`;
  XLSX.writeFile(workbook, fileName);

  return fileName;
}

/**
 * Export blog posts to Excel file
 */
export function exportBlogsToExcel(posts: BlogPost[], filename: string = 'blog_posts') {
  // Prepare data for Excel
  const data = posts.map((post) => ({
    'Post ID': post._id,
    'Title': post.title,
    'Slug': post.slug,
    'Author': post.author?.name || post.author?.email || '',
    'Category': post.category || '',
    'Tags': Array.isArray(post.tags) ? post.tags.join(', ') : '',
    'Excerpt': post.excerpt || '',
    'Content': post.content || '',
    'Featured Image': post.featuredImage || '',
    'Is Published': post.isPublished ? 'Yes' : 'No',
    'Published At': post.publishedAt ? new Date(post.publishedAt).toLocaleString() : '',
    'Views': post.views || 0,
    'Likes': post.likes || 0,
    'Meta Title': post.metaTitle || '',
    'Meta Description': post.metaDescription || '',
    'Meta Keywords': Array.isArray(post.metaKeywords) ? post.metaKeywords.join(', ') : '',
    'Created At': new Date(post.createdAt).toLocaleString(),
    'Updated At': post.updatedAt ? new Date(post.updatedAt).toLocaleString() : '',
  }));

  // Create worksheet
  const worksheet = XLSX.utils.json_to_sheet(data);

  // Set column widths
  const columnWidths = [
    { wch: 25 }, // Post ID
    { wch: 50 }, // Title
    { wch: 40 }, // Slug
    { wch: 25 }, // Author
    { wch: 20 }, // Category
    { wch: 30 }, // Tags
    { wch: 60 }, // Excerpt
    { wch: 80 }, // Content
    { wch: 50 }, // Featured Image
    { wch: 12 }, // Is Published
    { wch: 20 }, // Published At
    { wch: 10 }, // Views
    { wch: 10 }, // Likes
    { wch: 40 }, // Meta Title
    { wch: 60 }, // Meta Description
    { wch: 40 }, // Meta Keywords
    { wch: 20 }, // Created At
    { wch: 20 }, // Updated At
  ];
  worksheet['!cols'] = columnWidths;

  // Create workbook
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Blog Posts');

  // Generate file
  const timestamp = new Date().toISOString().split('T')[0];
  const fileName = `${filename}_${timestamp}.xlsx`;
  XLSX.writeFile(workbook, fileName);

  return fileName;
}
