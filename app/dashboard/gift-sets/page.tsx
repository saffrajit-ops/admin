'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Gift, Plus, Search, Loader2, Package, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';
import { useAuthStore } from '@/lib/auth-store';
import { useProductStore } from '@/lib/product-store';

interface Product {
  _id: string;
  title: string;
  slug: string;
  price: number;
  images: { url: string; alt?: string }[];
  category?: any;
  categories: any[];
  subcategories: any[];
  isActive: boolean;
  stock: number;
}

interface Taxonomy {
  _id: string;
  name: string;
  slug: string;
  type: string;
}

export default function GiftSetsPage() {
  const { accessToken } = useAuthStore();
  const { updateProduct } = useProductStore();
  const [giftSetCategory, setGiftSetCategory] = useState<Taxonomy | null>(null);
  const [giftSetProducts, setGiftSetProducts] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [addingProducts, setAddingProducts] = useState(false);
  const [removingProduct, setRemovingProduct] = useState<string | null>(null);

  useEffect(() => {
    if (accessToken) {
      fetchGiftSetData();
    }
  }, [accessToken]);

  const fetchGiftSetData = async () => {
    if (!accessToken) return;
    
    try {
      setLoading(true);

      // Find Gift Set category
      const taxonomyResponse = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/taxonomies?type=category`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      const taxonomyData = await taxonomyResponse.json();

      if (taxonomyData.success) {
        const giftSet = taxonomyData.data.find((cat: Taxonomy) => 
          cat.name.toLowerCase() === 'gift set' || cat.name.toLowerCase() === 'gift sets'
        );
        
        if (giftSet) {
          setGiftSetCategory(giftSet);

          // Fetch products in Gift Set category
          const productsResponse = await fetch(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/products?category=${giftSet._id}&limit=1000`,
            {
              headers: {
                'Authorization': `Bearer ${accessToken}`
              }
            }
          );
          const productsData = await productsResponse.json();

          if (productsData.success) {
            setGiftSetProducts(productsData.data.products || []);
          }
        } else {
          toast.error('Gift Set category not found');
        }
      }
    } catch (error) {
      console.error('Failed to fetch gift set data:', error);
      toast.error('Failed to load gift set data');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableProducts = async () => {
    if (!accessToken) return;
    
    try {
      setLoadingProducts(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/products?limit=1000`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      const data = await response.json();

      if (data.success) {
        // Filter out products already in gift sets
        const giftSetProductIds = giftSetProducts.map(p => p._id);
        const available = data.data.products.filter(
          (p: Product) => !giftSetProductIds.includes(p._id)
        );
        setAllProducts(available);
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleAddProducts = async () => {
    if (!giftSetCategory || selectedProducts.length === 0 || !accessToken) return;

    try {
      setAddingProducts(true);
      let successCount = 0;
      let errorCount = 0;

      // Add Gift Set category to selected products
      for (const productId of selectedProducts) {
        const product = allProducts.find(p => p._id === productId);
        if (!product) continue;

        try {
          // Get current categories as IDs
          const currentCategoryIds = (product.categories || []).map((cat: any) => 
            typeof cat === 'string' ? cat : cat._id
          );
          
          // Add Gift Set category if not already present
          if (!currentCategoryIds.includes(giftSetCategory._id)) {
            currentCategoryIds.push(giftSetCategory._id);
          }

          // Update product using the product store
          const formData = new FormData();
          formData.append('categories', JSON.stringify(currentCategoryIds));
          await updateProduct(productId, formData, accessToken);
          
          successCount++;
        } catch (error) {
          console.error(`Failed to add product ${productId}:`, error);
          errorCount++;
        }
      }

      if (successCount > 0) {
        toast.success(`Added ${successCount} product(s) to Gift Sets`);
      }
      if (errorCount > 0) {
        toast.error(`Failed to add ${errorCount} product(s)`);
      }
      
      setShowAddDialog(false);
      setSelectedProducts([]);
      setSearchQuery('');
      fetchGiftSetData();
    } catch (error) {
      console.error('Failed to add products:', error);
      toast.error('Failed to add products to Gift Sets');
    } finally {
      setAddingProducts(false);
    }
  };

  const handleRemoveProduct = async (productId: string) => {
    if (!giftSetCategory || !accessToken) return;

    try {
      setRemovingProduct(productId);
      const product = giftSetProducts.find(p => p._id === productId);
      if (!product) return;

      // Remove Gift Set category from categories array
      const updatedCategoryIds = (product.categories || [])
        .map((cat: any) => typeof cat === 'string' ? cat : cat._id)
        .filter((catId: string) => catId !== giftSetCategory._id);

      // Update product using the product store
      const formData = new FormData();
      formData.append('categories', JSON.stringify(updatedCategoryIds));
      
      // Also clear legacy category field if it matches Gift Set
      const legacyCategoryId = typeof product.category === 'string' 
        ? product.category 
        : product.category?._id;
      
      if (legacyCategoryId === giftSetCategory._id) {
        // Set to first remaining category or null
        if (updatedCategoryIds.length > 0) {
          formData.append('category', updatedCategoryIds[0]);
        } else {
          formData.append('category', '');
        }
      }
      
      await updateProduct(productId, formData, accessToken);

      toast.success('Product removed from Gift Sets');
      fetchGiftSetData();
    } catch (error) {
      console.error('Failed to remove product:', error);
      toast.error('Failed to remove product from Gift Sets');
    } finally {
      setRemovingProduct(null);
    }
  };

  const filteredProducts = allProducts.filter(product =>
    product.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!giftSetCategory) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>Gift Set Category Not Found</CardTitle>
            <CardDescription>
              The Gift Set category needs to be created in the taxonomy system first.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Gift className="w-8 h-8" />
            Gift Sets Manager
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage products in the Gift Sets category
          </p>
        </div>
        <Button
          onClick={() => {
            fetchAvailableProducts();
            setShowAddDialog(true);
          }}
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Products
        </Button>
      </div>

      {/* Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-muted-foreground" />
            <span className="text-2xl font-bold">{giftSetProducts.length}</span>
            <span className="text-muted-foreground">products in Gift Sets</span>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>Gift Set Products</CardTitle>
          <CardDescription>
            Products currently in the Gift Sets category
          </CardDescription>
        </CardHeader>
        <CardContent>
          {giftSetProducts.length === 0 ? (
            <div className="text-center py-12">
              <Gift className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No products in Gift Sets yet</p>
              <Button
                onClick={() => {
                  fetchAvailableProducts();
                  setShowAddDialog(true);
                }}
                variant="outline"
                className="mt-4"
              >
                Add Products
              </Button>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">Image</TableHead>
                    <TableHead>Product Name</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {giftSetProducts.map((product) => (
                    <TableRow key={product._id}>
                      <TableCell>
                        <div className="w-16 h-16 relative bg-gray-100 rounded overflow-hidden">
                          {product.images?.[0]?.url ? (
                            <Image
                              src={product.images[0].url}
                              alt={product.title}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="w-6 h-6 text-gray-300" />
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{product.title}</TableCell>
                      <TableCell>${product.price.toFixed(2)}</TableCell>
                      <TableCell>{product.stock || 0}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          product.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {product.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          onClick={() => handleRemoveProduct(product._id)}
                          variant="destructive"
                          size="sm"
                          disabled={removingProduct === product._id}
                        >
                          {removingProduct === product._id ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Removing...
                            </>
                          ) : (
                            <>
                              <Trash2 className="w-4 h-4 mr-2" />
                              Remove
                            </>
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Products Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Products to Gift Sets</DialogTitle>
            <DialogDescription>
              Select products to add to the Gift Sets category
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Products List */}
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {loadingProducts ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-gray-400 mb-3" />
                  <p className="text-muted-foreground">Loading products...</p>
                </div>
              ) : filteredProducts.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No products available
                </p>
              ) : (
                filteredProducts.map((product) => (
                  <div
                    key={product._id}
                    className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50"
                  >
                    <Checkbox
                      checked={selectedProducts.includes(product._id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedProducts([...selectedProducts, product._id]);
                        } else {
                          setSelectedProducts(selectedProducts.filter(id => id !== product._id));
                        }
                      }}
                    />
                    <div className="w-16 h-16 relative bg-gray-100 rounded overflow-hidden shrink-0">
                      {product.images?.[0]?.url ? (
                        <Image
                          src={product.images[0].url}
                          alt={product.title}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-6 h-6 text-gray-300" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">{product.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        ${product.price.toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-between items-center pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                {selectedProducts.length} product(s) selected
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAddDialog(false);
                    setSelectedProducts([]);
                    setSearchQuery('');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddProducts}
                  disabled={selectedProducts.length === 0 || addingProducts}
                >
                  {addingProducts ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    `Add ${selectedProducts.length} Product(s)`
                  )}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
