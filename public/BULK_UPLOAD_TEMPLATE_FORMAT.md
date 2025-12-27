# Product Bulk Upload Template Format

## Excel Column Headers (Required)

Create an Excel file (.xlsx or .xls) with the following columns:

### Required Columns:
1. **title** - Product title (max 200 characters)
2. **price** - Product price (number, minimum 0)
3. **stock** - Stock quantity (integer, minimum 0)

### Optional Columns:
4. **type** - Product type: "single" or "gift-set" (default: "single")
5. **sku** - Stock Keeping Unit (unique identifier)
6. **barcode** - Product barcode
7. **brand** - Brand name (default: "Cana Gold")
8. **shortDescription** - Brief description (max 300 characters)
9. **description** - Full product description (max 5000 characters)
10. **compareAtPrice** - Original price for discount display (must be greater than price)
11. **currency** - Currency code (default: "USD")
12. **isActive** - Active status: TRUE or FALSE (default: TRUE)
13. **isFeatured** - Featured status: TRUE or FALSE (default: FALSE)
14. **benefits** - Pipe-separated list (e.g., "Benefit 1|Benefit 2|Benefit 3")
15. **shade** - Product shade/color
16. **size** - Product size
17. **skinType** - Skin type: "dry", "oily", "combination", "sensitive", "normal", or "all"
18. **categories** - Pipe-separated categories (e.g., "Anti Aging|Eye Care")
19. **collection** - Collection name (e.g., "Prestige Line")
20. **concern** - Pipe-separated concerns (e.g., "Lines and Wrinkles|Hydration and Glow")
21. **relatedProductIds** - Comma-separated product IDs (24-character MongoDB IDs)
22. **ingredientsText** - Pipe-separated ingredients list
23. **howToApply** - Application instructions (max 1000 characters)
24. **imageUrls** - Pipe-separated image URLs (e.g., "https://example.com/img1.jpg|https://example.com/img2.jpg")
25. **metaTitle** - SEO meta title
26. **metaDescription** - SEO meta description
27. **metaKeywords** - Pipe-separated SEO keywords

## Example Data:

| title | sku | brand | price | compareAtPrice | stock | shortDescription | categories | concern | isActive | isFeatured |
|-------|-----|-------|-------|----------------|-------|------------------|------------|---------|----------|------------|
| Premium Face Cream | PFC-001 | Cana Gold | 49.99 | 69.99 | 100 | Luxurious anti-aging cream | Anti Aging | Lines and Wrinkles | TRUE | TRUE |
| Eye Serum Deluxe | ESD-002 | Cana Gold | 39.99 | | 50 | Reduces puffiness and dark circles | Eye Care | Puffiness and Pigmentation | TRUE | FALSE |

## Notes:

1. **Separators**: Use pipe (|) for multi-value fields like benefits, categories, concerns, and image URLs
2. **Boolean Values**: Use TRUE or FALSE (case-insensitive)
3. **File Size**: Maximum 5MB
4. **Validation**: Each row will be validated individually. Failed rows will be reported with error messages
5. **Unique Fields**: SKU must be unique across all products
6. **Image URLs**: Must be valid, publicly accessible URLs
7. **Price Validation**: compareAtPrice must be greater than price if provided

## Sample Template Structure:

```
Row 1 (Headers): title | sku | brand | price | stock | shortDescription | categories | isActive
Row 2 (Data):    Premium Face Cream | PFC-001 | Cana Gold | 49.99 | 100 | Anti-aging cream | Anti Aging | TRUE
Row 3 (Data):    Eye Serum | ESD-002 | Cana Gold | 39.99 | 50 | Reduces puffiness | Eye Care | TRUE
```

## Category Options:
- Anti Aging
- Eye Care
- Body Care
- Instant Face Lift
- Neck
- Masks
- Gift Sets

## Concern Options:
- Lines and Wrinkles
- Hydration and Glow
- Puffiness and Pigmentation
- Dark Skin (Whitening)

## Collection Options:
- Prestige Line
