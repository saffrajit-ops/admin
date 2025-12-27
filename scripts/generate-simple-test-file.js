/**
 * Script to generate a simple test Excel file with minimal required fields
 * Run: node scripts/generate-simple-test-file.js
 */

const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

// Simple test data with only required fields
const testData = [
    {
        title: 'Test Product 1',
        price: 29.99,
        stock: 100
    },
    {
        title: 'Test Product 2',
        price: 39.99,
        stock: 50
    },
    {
        title: 'Test Product 3',
        price: 49.99,
        stock: 75
    }
];

// Create workbook
const wb = XLSX.utils.book_new();

// Create worksheet from test data
const ws = XLSX.utils.json_to_sheet(testData);

// Set column widths
ws['!cols'] = [
    { wch: 30 }, // title
    { wch: 10 }, // price
    { wch: 10 }  // stock
];

// Add worksheet to workbook
XLSX.utils.book_append_sheet(wb, ws, 'Products');

// Ensure public/templates directory exists
const templatesDir = path.join(__dirname, '..', 'public', 'templates');
if (!fs.existsSync(templatesDir)) {
    fs.mkdirSync(templatesDir, { recursive: true });
}

// Write file
const outputPath = path.join(templatesDir, 'test-simple-upload.xlsx');
XLSX.writeFile(wb, outputPath);

console.log('✅ Simple test file generated successfully!');
console.log(`📁 Location: ${outputPath}`);
console.log('\nTest file includes:');
console.log('- 3 test products');
console.log('- Only required fields (title, price, stock)');
console.log('- Ready to upload for testing');
