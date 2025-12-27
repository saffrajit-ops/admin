/**
 * Script to generate Excel template for bulk product upload
 * Run: node scripts/generate-bulk-upload-template.js
 */

const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

// Template headers
const headers = [
  'title',
  'sku',
  'brand',
  'price',
  'compareAtPrice',
  'stock',
  'shortDescription',
  'description',
  'type',
  'currency',
  'isActive',
  'isFeatured',
  'benefits',
  'shade',
  'size',
  'skinType',
  'categories',
  'collection',
  'concern',
  'relatedProductIds',
  'ingredientsText',
  'howToApply',
  'imageUrls',
  'metaTitle',
  'metaDescription',
  'metaKeywords'
];

// Sample data rows - IMPORTANT: All keys must be lowercase to match backend expectations
const sampleData = [
  {
    title: 'Premium Face Cream',
    sku: 'PFC-001',
    brand: 'Cana Gold',
    price: 49.99,
    compareAtPrice: 69.99,
    stock: 100,
    shortDescription: 'Luxurious anti-aging face cream with natural ingredients',
    description: 'Our premium face cream combines the finest natural ingredients to reduce signs of aging and promote healthy, glowing skin.',
    type: 'single',
    currency: 'USD',
    isActive: 'TRUE',
    isFeatured: 'TRUE',
    benefits: 'Reduces fine lines|Improves skin texture|Provides deep hydration',
    shade: '',
    size: '50ml',
    skinType: 'all',
    categories: 'Anti Aging',
    collection: 'Prestige Line',
    concern: 'Lines and Wrinkles|Hydration and Glow',
    relatedProductIds: '',
    ingredientsText: 'Aqua|Glycerin|Hyaluronic Acid|Vitamin E|Retinol',
    howToApply: 'Apply a small amount to clean, dry skin. Massage gently in upward circular motions.',
    imageUrls: '',
    metaTitle: 'Premium Face Cream - Anti-Aging Skincare',
    metaDescription: 'Discover our premium anti-aging face cream with natural ingredients',
    metaKeywords: 'face cream|anti-aging|skincare|natural'
  },
  {
    title: 'Eye Serum Deluxe',
    sku: 'ESD-002',
    brand: 'Cana Gold',
    price: 39.99,
    compareAtPrice: '',
    stock: 50,
    shortDescription: 'Reduces puffiness and dark circles around the eyes',
    description: 'Specially formulated eye serum that targets puffiness, dark circles, and fine lines around the delicate eye area.',
    type: 'single',
    currency: 'USD',
    isActive: 'TRUE',
    isFeatured: 'FALSE',
    benefits: 'Reduces puffiness|Minimizes dark circles|Smooths fine lines',
    shade: '',
    size: '15ml',
    skinType: 'all',
    categories: 'Eye Care',
    collection: 'Prestige Line',
    concern: 'Puffiness and Pigmentation',
    relatedProductIds: '',
    ingredientsText: 'Aqua|Caffeine|Peptides|Vitamin C|Niacinamide',
    howToApply: 'Gently pat a small amount around the eye area using your ring finger.',
    imageUrls: '',
    metaTitle: 'Eye Serum Deluxe - Reduce Puffiness & Dark Circles',
    metaDescription: 'Professional eye serum for puffiness and dark circles',
    metaKeywords: 'eye serum|dark circles|puffiness|eye care'
  }
];

// Create workbook
const wb = XLSX.utils.book_new();

// Create worksheet from sample data
const ws = XLSX.utils.json_to_sheet(sampleData, { header: headers });

// Set column widths
const colWidths = headers.map(h => ({ wch: 20 }));
ws['!cols'] = colWidths;

// Add worksheet to workbook
XLSX.utils.book_append_sheet(wb, ws, 'Products');

// Ensure public/templates directory exists
const templatesDir = path.join(__dirname, '..', 'public', 'templates');
if (!fs.existsSync(templatesDir)) {
  fs.mkdirSync(templatesDir, { recursive: true });
}

// Write file
const outputPath = path.join(templatesDir, 'product-bulk-upload-template.xlsx');
XLSX.writeFile(wb, outputPath);

console.log('✅ Excel template generated successfully!');
console.log(`📁 Location: ${outputPath}`);
console.log('\nTemplate includes:');
console.log('- All required and optional columns');
console.log('- 2 sample product rows');
console.log('- Proper formatting and column widths');
