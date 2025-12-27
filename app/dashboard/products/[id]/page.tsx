"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuthStore } from "@/lib/auth-store"
import { useProductStore, Product } from "@/lib/product-store"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Edit, Package } from "lucide-react"
import Image from "next/image"
import { useToast } from "@/hooks/use-toast"
import { sanitizeHtml } from "@/lib/html-utils"

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { accessToken } = useAuthStore()
  const { fetchProductById } = useProductStore()
  const { toast } = useToast()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [isNavigating, setIsNavigating] = useState(false)
  const [taxonomyNames, setTaxonomyNames] = useState<{
    concerns: { [key: string]: string }
    categories: { [key: string]: string }
    collections: { [key: string]: string }
  }>({
    concerns: {},
    categories: {},
    collections: {}
  })

  useEffect(() => {
    const loadProduct = async () => {
      if (!accessToken) {
        toast({
          title: "Error",
          description: "Authentication required",
          variant: "destructive",
        })
        router.push("/dashboard/products")
        return
      }

      try {
        const productData = await fetchProductById(params.id as string, accessToken)
        if (productData) {
          setProduct(productData)

          // Fetch taxonomy names
          const taxonomyResponse = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/taxonomies/for-products`, {
            headers: {
              Authorization: `Bearer ${accessToken}`
            }
          })
          const taxonomyData = await taxonomyResponse.json()

          if (taxonomyData.success) {
            const names: {
              concerns: { [key: string]: string }
              categories: { [key: string]: string }
              collections: { [key: string]: string }
            } = {
              concerns: {},
              categories: {},
              collections: {}
            }

            // Map concerns
            taxonomyData.data.concerns.forEach((item: any) => {
              names.concerns[item._id] = item.name
            })

            // Map categories and subcategories
            taxonomyData.data.categories.forEach((item: any) => {
              names.categories[item._id] = item.name
              if (item.subcategories) {
                item.subcategories.forEach((sub: any) => {
                  names.categories[sub._id] = `${item.name} > ${sub.name}`
                })
              }
            })

            // Map collections
            taxonomyData.data.collections.forEach((item: any) => {
              names.collections[item._id] = item.name
            })

            // Also add names from populated product data
            if (productData.category && typeof productData.category === 'object') {
              names.categories[productData.category._id] = productData.category.name
            }
            if (productData.subcategory && typeof productData.subcategory === 'object') {
              names.categories[productData.subcategory._id] = productData.subcategory.name
            }
            if (productData.categories) {
              productData.categories.forEach((c: any) => {
                if (typeof c === 'object' && c._id) {
                  names.categories[c._id] = c.name
                }
              })
            }
            if (productData.subcategories) {
              productData.subcategories.forEach((s: any) => {
                if (typeof s === 'object' && s._id) {
                  names.categories[s._id] = s.name
                }
              })
            }
            if (productData.concerns) {
              productData.concerns.forEach((c: any) => {
                if (typeof c === 'object' && c._id) {
                  names.concerns[c._id] = c.name
                }
              })
            }
            if (productData.collections) {
              productData.collections.forEach((c: any) => {
                if (typeof c === 'object' && c._id) {
                  names.collections[c._id] = c.name
                }
              })
            }

            setTaxonomyNames(names)
          }
        } else {
          throw new Error("Product not found")
        }
      } catch (error) {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to load product",
          variant: "destructive",
        })
        router.push("/dashboard/products")
      } finally {
        setLoading(false)
      }
    }

    loadProduct()
  }, [params.id, accessToken, fetchProductById, router, toast])

  if (loading || !product) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-muted-foreground">Loading product...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push("/dashboard/products")}
            className="gap-2 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Products
          </Button>
          <Button
            onClick={() => {
              setIsNavigating(true)
              router.push(`/dashboard/products/${product._id}/edit`)
            }}
            className="gap-2 cursor-pointer"
            disabled={isNavigating}
          >
            {isNavigating ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <Edit className="w-4 h-4" />
                Edit Product
              </>
            )}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Package Variants - MOVED TO TOP OF CONTENT */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <div className="w-1 h-5 bg-primary rounded-full" />
                Package Variants
              </h2>
              {product.packageVariants && product.packageVariants.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left font-medium p-2 pl-0">Weight/Size</th>
                        <th className="text-left font-medium p-2">SKU</th>
                        <th className="text-right font-medium p-2">Price</th>
                        <th className="text-right font-medium p-2">Discount</th>
                        <th className="text-right font-medium p-2">Final</th>
                        <th className="text-right font-medium p-2 pr-0">Stock</th>
                      </tr>
                    </thead>
                    <tbody>
                      {product.packageVariants.map((variant, index) => {
                        let finalPrice = variant.price;
                        if (variant.discount?.value > 0) {
                          finalPrice = variant.discount.type === 'percentage'
                            ? variant.price * (1 - variant.discount.value / 100)
                            : Math.max(0, variant.price - variant.discount.value);
                        }

                        return (
                          <tr key={index} className="border-b last:border-0 hover:bg-muted/50">
                            <td className="p-2 pl-0">
                              <div className="flex items-center gap-2">
                                <span>{variant.weight.value}{variant.weight.unit}</span>
                                {variant.isDefault && (
                                  <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4">Default</Badge>
                                )}
                              </div>
                            </td>
                            <td className="p-2 font-mono text-xs text-muted-foreground">{variant.sku}</td>
                            <td className="p-2 text-right">₹{variant.price.toFixed(2)}</td>
                            <td className="p-2 text-right text-muted-foreground">
                              {variant.discount?.value > 0 ? (
                                <span>
                                  {variant.discount.type === 'percentage'
                                    ? `${variant.discount.value}%`
                                    : `₹${variant.discount.value}`}
                                </span>
                              ) : (
                                <span>-</span>
                              )}
                            </td>
                            <td className="p-2 text-right font-medium">₹{finalPrice.toFixed(2)}</td>
                            <td className="p-2 text-right pr-0">
                              <span className={variant.stock < 10 ? "text-orange-600" : ""}>
                                {variant.stock}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No package variants defined.</p>
              )}
            </Card>

            {/* Product Header */}
            <Card className="p-6">
              <div className="flex items-start gap-6">
                <div className="w-40 h-40 rounded-xl overflow-hidden bg-muted shrink-0 border-2 border-border">
                  {product.images?.[0] ? (
                    <Image
                      src={product.images[0].url}
                      alt={product.images[0].altText || product.title}
                      width={160}
                      height={160}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-16 h-16 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div>
                      <h1 className="text-3xl font-bold mb-2">{product.title}</h1>
                      <div
                        className="text-muted-foreground text-base prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: sanitizeHtml(product.shortDescription) }}
                      />
                    </div>
                    <div className="flex gap-2 shrink-0">
                      {product.isActive ? (
                        <Badge variant="default" className="text-xs">Active</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">Inactive</Badge>
                      )}
                      {product.isFeatured && <Badge variant="outline" className="text-xs">Featured</Badge>}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">SKU:</span>
                      <span className="font-mono font-semibold text-sm">
                        {product.packageVariants?.find(v => v.isDefault)?.sku || product.packageVariants?.[0]?.sku || "-"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Stock:</span>
                      <span
                        className={`font-semibold text-sm ${(product.packageVariants?.reduce((acc, v) => acc + v.stock, 0) || 0) === 0
                          ? "text-destructive"
                          : (product.packageVariants?.reduce((acc, v) => acc + v.stock, 0) || 0) < 10
                            ? "text-orange-600"
                            : "text-green-600"
                          }`}
                      >
                        {product.packageVariants?.reduce((acc, v) => acc + v.stock, 0) || 0} units
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Description */}
            {product.description && (
              <Card className="p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <div className="w-1 h-5 bg-primary rounded-full" />
                  Description
                </h2>
                <div
                  className="prose prose-sm max-w-none text-muted-foreground"
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(product.description) }}
                />
              </Card>
            )}

            {/* Product Images */}
            {product.images && product.images.length > 0 && (
              <Card className="p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <div className="w-1 h-5 bg-primary rounded-full" />
                  Product Images ({product.images.length})
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {product.images.map((image, index) => (
                    <div
                      key={index}
                      className="aspect-square rounded-lg overflow-hidden bg-muted border-2 border-border hover:border-primary transition-colors cursor-pointer group"
                    >
                      <Image
                        src={image.url}
                        alt={image.altText || `${product.title} - Image ${index + 1}`}
                        width={300}
                        height={300}
                        className="object-cover w-full h-full group-hover:scale-105 transition-transform"
                      />
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Product Videos */}
            {product.videos && product.videos.length > 0 && (
              <Card className="p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <div className="w-1 h-5 bg-primary rounded-full" />
                  Product Videos ({product.videos.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {product.videos.map((video, index) => (
                    <div
                      key={index}
                      className="rounded-lg overflow-hidden bg-muted border-2 border-border"
                    >
                      <video
                        controls
                        className="w-full h-auto"
                        poster={video.thumbnail}
                      >
                        <source src={video.url} type="video/mp4" />
                        Your browser does not support the video tag.
                      </video>
                      {video.title && (
                        <div className="p-3 bg-background">
                          <p className="text-sm font-medium">{video.title}</p>
                          {video.duration && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Duration: {Math.floor(video.duration / 60)}:{String(Math.floor(video.duration % 60)).padStart(2, '0')}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">


            {/* Categories */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <div className="w-1 h-5 bg-primary rounded-full" />
                Categories & Collections
              </h2>
              <div className="space-y-4">
                {/* Categories */}
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Categories</p>
                  {(() => {
                    const categoryItems = product.categories || []
                    return categoryItems.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {categoryItems.map((cat: any, index: number) => {
                          const catId = typeof cat === 'object' ? cat._id : cat
                          const catName = typeof cat === 'object' ? cat.name : taxonomyNames.categories[catId] || catId
                          return (
                            <Badge key={index} variant="default" className="text-xs">
                              {catName}
                            </Badge>
                          )
                        })}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Not specified</p>
                    )
                  })()}
                </div>

                {/* Subcategories */}
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Subcategories</p>
                  {(() => {
                    const subcategoryItems = product.subcategories || []
                    return subcategoryItems.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {subcategoryItems.map((sub: any, index: number) => {
                          const subId = typeof sub === 'object' ? sub._id : sub
                          const subName = typeof sub === 'object' ? sub.name : taxonomyNames.categories[subId] || subId
                          return (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {subName}
                            </Badge>
                          )
                        })}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Not specified</p>
                    )
                  })()}
                </div>

              </div>
            </Card>

            {/* Payment & Returns */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <div className="w-1 h-5 bg-primary rounded-full" />
                Payment & Returns
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium">Cash on Delivery</p>
                    <p className="text-xs text-muted-foreground">Pay when product is delivered</p>
                  </div>
                  <Badge variant={product.cashOnDelivery?.enabled ? "default" : "secondary"}>
                    {product.cashOnDelivery?.enabled ? "Enabled" : "Disabled"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium">Returnable</p>
                    <p className="text-xs text-muted-foreground">
                      {product.returnPolicy?.returnable !== false
                        ? `${product.returnPolicy?.returnWindowDays || 7} days return window`
                        : "Product cannot be returned"}
                    </p>
                  </div>
                  <Badge variant={product.returnPolicy?.returnable !== false ? "default" : "secondary"}>
                    {product.returnPolicy?.returnable !== false ? "Yes" : "No"}
                  </Badge>
                </div>
              </div>
            </Card>

            {/* Metadata */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <div className="w-1 h-5 bg-primary rounded-full" />
                Information
              </h2>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Created</p>
                  <p className="font-medium">{new Date(product.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}</p>
                </div>
                {product.updatedAt && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Last Updated</p>
                    <p className="font-medium">{new Date(product.updatedAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Product ID</p>
                  <p className="font-mono text-xs break-all">{product._id}</p>
                </div>
              </div>
            </Card>
          </div>
        </div >
      </div >
    </div >
  )
}
