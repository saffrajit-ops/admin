export interface QuantityPricingTier {
  minQuantity: number
  maxQuantity: number | null
  price: number
  discountPercentage: number
}

export interface PriceCalculation {
  price: number
  discountPercentage: number
  tier: QuantityPricingTier | null
  originalPrice?: number
  totalPrice: number
  savings?: number
}

/**
 * Calculate price for a given quantity based on quantity pricing tiers
 */
export function calculatePriceForQuantity(
  quantity: number,
  basePrice: number,
  quantityPricing: QuantityPricingTier[] = []
): PriceCalculation {
  if (!quantityPricing || quantityPricing.length === 0) {
    return {
      price: basePrice,
      discountPercentage: 0,
      tier: null,
      totalPrice: basePrice * quantity
    }
  }

  // Find applicable tier
  const applicableTiers = quantityPricing
    .filter(tier => tier.minQuantity <= quantity)
    .filter(tier => !tier.maxQuantity || tier.maxQuantity >= quantity)
    .sort((a, b) => b.minQuantity - a.minQuantity)

  if (applicableTiers.length === 0) {
    return {
      price: basePrice,
      discountPercentage: 0,
      tier: null,
      totalPrice: basePrice * quantity
    }
  }

  const tier = applicableTiers[0]
  const totalPrice = tier.price * quantity
  const originalTotalPrice = basePrice * quantity
  const savings = originalTotalPrice - totalPrice

  return {
    price: tier.price,
    discountPercentage: tier.discountPercentage,
    tier,
    originalPrice: basePrice,
    totalPrice,
    savings: savings > 0 ? savings : undefined
  }
}

/**
 * Get all applicable pricing tiers for display
 */
export function getPricingTiers(quantityPricing: QuantityPricingTier[] = []): QuantityPricingTier[] {
  return quantityPricing.sort((a, b) => a.minQuantity - b.minQuantity)
}

/**
 * Format quantity range for display
 */
export function formatQuantityRange(tier: QuantityPricingTier): string {
  if (tier.maxQuantity) {
    return `${tier.minQuantity} - ${tier.maxQuantity}`
  }
  return `${tier.minQuantity}+`
}

/**
 * Validate quantity pricing tiers
 */
export function validateQuantityPricingTiers(tiers: QuantityPricingTier[]): string[] {
  const errors: string[] = []
  
  if (tiers.length === 0) {
    return errors
  }

  // Sort tiers by minQuantity for validation
  const sortedTiers = [...tiers].sort((a, b) => a.minQuantity - b.minQuantity)

  for (let i = 0; i < sortedTiers.length; i++) {
    const tier = sortedTiers[i]
    
    // Check basic validation
    if (tier.minQuantity < 1) {
      errors.push(`Tier ${i + 1}: Minimum quantity must be at least 1`)
    }
    
    if (tier.price < 0) {
      errors.push(`Tier ${i + 1}: Price cannot be negative`)
    }
    
    if (tier.discountPercentage < 0 || tier.discountPercentage > 100) {
      errors.push(`Tier ${i + 1}: Discount percentage must be between 0 and 100`)
    }
    
    if (tier.maxQuantity && tier.maxQuantity < tier.minQuantity) {
      errors.push(`Tier ${i + 1}: Maximum quantity must be greater than minimum quantity`)
    }

    // Check for overlaps with next tier
    if (i < sortedTiers.length - 1) {
      const nextTier = sortedTiers[i + 1]
      
      if (tier.maxQuantity && tier.maxQuantity >= nextTier.minQuantity) {
        errors.push(`Tier ${i + 1} and ${i + 2}: Quantity ranges overlap`)
      }
      
      if (!tier.maxQuantity) {
        errors.push(`Tier ${i + 1}: Cannot have unlimited range when there are more tiers`)
      }
    }
  }

  return errors
}