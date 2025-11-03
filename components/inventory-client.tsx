"use client"

import { useEffect, useMemo, useState } from "react"
import { Search, Edit, Eye, Package } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/utils/supabase/component"

// FIXED: More defensive type definition
type RawInventoryRow = {
  barcode: string
  product_name: string
  model_number?: string | null
  category?: string | null
  brand?: string | null
  supplier?: string | null
  sale_price?: number | null
  cost_price?: number | null
  quantity?: number | null
  color?: string | null
}

type Product = {
  productName: string
  modelNumber: string | null
  category: string | null
  brand: string | null
  supplier: string | null
  salePrice: number
  costPrice: number
  quantity: number
  color: string | null
}

const supabase = createClient()
const LOW_STOCK_THRESHOLD = 5

export function InventoryClient() {
  const { toast } = useToast()
  
  // FIXED: Provide fallback for role provider that might not exist
  let hasPermission = (perm: string) => true
  let isAdmin = () => true
  
  try {
    const { useRole } = require("@/components/role-provider")
    const roleContext = useRole?.()
    if (roleContext) {
      hasPermission = roleContext.hasPermission
      isAdmin = roleContext.isAdmin
    }
  } catch (error) {
    console.warn("Role provider not available, using default permissions")
  }

  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [rows, setRows] = useState<RawInventoryRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    async function loadInventory() {
      setIsLoading(true)
      setError(null)

      try {
        // FIXED: Try inventory view first, fallback to building from raw tables
        let invData: any[] = []
        
        const { data: viewData, error: viewError } = await supabase
          .from("inventory")
          .select("barcode, product_name, model_number, category, brand, supplier, sale_price, cost_price, quantity, color")

        if (viewError) {
          console.warn("Inventory view failed, trying to build from tables:", viewError)
          
          // FIXED: Fallback - build inventory from purchases + color_variants
          const { data: rawData, error: rawError } = await supabase
            .from("color_variants")
            .select(`
              barcode,
              color,
              quantity,
              imei,
              purchase_id,
              purchases!inner (
                product_name,
                model_number,
                category,
                brand,
                supplier,
                cost_price,
                sale_price
              )
            `)

          if (rawError) {
            console.error("Fallback query also failed:", rawError)
            throw new Error(`Failed to load inventory data: ${rawError.message}`)
          }

          // Transform raw data to inventory format
          invData = (rawData ?? []).map((item: any) => {
            const purchase = item.purchases
            return {
              barcode: item.barcode || '',
              product_name: purchase?.product_name || 'Unknown Product',
              model_number: purchase?.model_number || null,
              category: purchase?.category || null,
              brand: purchase?.brand || null,
              supplier: purchase?.supplier || null,
              sale_price: purchase?.sale_price || null,
              cost_price: purchase?.cost_price || null,
              quantity: item.quantity || 0,
              color: item.color || null
            }
          })
        } else {
          invData = viewData ?? []
        }

        // FIXED: Defensive normalization with better error handling
        const safeRows: RawInventoryRow[] = Array.isArray(invData)
          ? invData.map((r: any) => ({
              barcode: String(r?.barcode ?? ""),
              product_name: String(r?.product_name ?? "Unknown Product"),
              model_number: r?.model_number ?? null,
              category: r?.category ?? null,
              brand: r?.brand ?? null,
              supplier: r?.supplier ?? null,
              sale_price: r?.sale_price != null ? Number(r.sale_price) : null,
              cost_price: r?.cost_price != null ? Number(r.cost_price) : null,
              quantity: r?.quantity != null ? Number(r.quantity) : 0,
              color: r?.color ?? null,
            }))
          : []

        if (!mounted) return
        setRows(safeRows)
        setError(null)

      } catch (error: any) {
        console.error("Inventory load error:", error)
        if (!mounted) return
        
        setError(error.message || "Failed to load inventory data")
        toast({
          title: "Failed to load inventory",
          description: error.message || "Unknown error occurred",
          variant: "destructive",
        })
        setRows([])
      } finally {
        if (mounted) setIsLoading(false)
      }
    }

    loadInventory()
    return () => {
      mounted = false
    }
  }, [toast])

  // FIXED: Better grouping logic with validation
  const products: Product[] = useMemo(() => {
    const map = new Map<string, Product>()
    
    for (const r of rows) {
      if (!r.product_name) continue // Skip invalid entries
      
      const key = [
        r.product_name.trim().toLowerCase(),
        (r.model_number ?? "").trim().toLowerCase(),
        (r.brand ?? "").trim().toLowerCase(),
        (r.color ?? "").trim().toLowerCase(),
      ].join("|")

      const qty = Math.max(0, Number(r.quantity ?? 0)) // Ensure non-negative
      const sale = Math.max(0, Number(r.sale_price ?? 0))
      const cost = r.cost_price != null ? Math.max(0, Number(r.cost_price)) : null

      const existing = map.get(key)
      if (!existing) {
        map.set(key, {
          productName: r.product_name,
          modelNumber: r.model_number ?? null,
          category: r.category ?? null,
          brand: r.brand ?? null,
          supplier: r.supplier ?? null,
          salePrice: sale,
          costPrice: cost,
          quantity: qty,
          color: r.color ?? null,
        })
      } else {
        existing.quantity += qty
        // Use highest sale price if multiple entries
        if (sale > existing.salePrice) existing.salePrice = sale
        if (existing.costPrice == null && cost != null) existing.costPrice = cost
      }
    }
    return Array.from(map.values())
  }, [rows])

  // FIXED: Better filtering with null safety
  const filteredProducts = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    return products.filter((p) => {
      const matchesSearch =
        !term ||
        p.productName.toLowerCase().includes(term) ||
        (p.modelNumber ?? "").toLowerCase().includes(term) ||
        (p.brand ?? "").toLowerCase().includes(term) ||
        (p.color ?? "").toLowerCase().includes(term)
      const matchesCategory = categoryFilter === "all" || p.category === categoryFilter
      return matchesSearch && matchesCategory
    })
  }, [products, searchTerm, categoryFilter])

  // FIXED: Safe calculations
  const totalValue = useMemo(
    () => products.reduce((sum, p) => sum + (p.costPrice || 0) * (p.quantity || 0), 0),
    [products]
  )

  const categories = useMemo(() => {
    const cats = Array.from(new Set(products.map((p) => p.category ?? "Uncategorized")))
    return cats.sort()
  }, [products])

  const demoCount = useMemo(
    () => products.filter((p) => {
      const category = (p.category ?? "").toLowerCase()
      return category.includes("demo")
    }).length,
    [products]
  )

  // FIXED: Add low stock and out of stock counts
  const lowStockCount = useMemo(
    () => products.filter(p => p.quantity <= LOW_STOCK_THRESHOLD && p.quantity > 0).length,
    [products]
  )

  const outOfStockCount = useMemo(
    () => products.filter(p => p.quantity === 0).length,
    [products]
  )

  const getStockStatus = (p: Product) => {
    if (p.quantity === 0) return { label: "Out of Stock", variant: "destructive" as const }
    if (p.quantity <= LOW_STOCK_THRESHOLD) return { label: "Low Stock", variant: "secondary" as const }
    return { label: "In Stock", variant: "outline" as const }
  }

  const handleEditProduct = (product: Product) => {
    if (!hasPermission("inventory_edit")) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to edit products.",
        variant: "destructive",
      })
      return
    }
    toast({
      title: "Edit Product",
      description: `Editing ${product.productName} (${product.modelNumber ?? "—"})`,
    })
  }

  const handleViewProduct = (product: Product) => {
    toast({
      title: "Product Details",
      description: `${product.productName} • ${product.modelNumber ?? "—"} • ${product.brand ?? "—"} • ${
        product.color ?? "—"
      }`,
    })
  }

  // FIXED: Handle loading state
  if (isLoading) {
    return (
      <div className="sflex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Inventory Management</h1>
            <p className="text-muted-foreground">Loading inventory data...</p>
          </div>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {[...Array(5)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Loading...</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">—</div>
                <p className="text-xs text-muted-foreground">Please wait...</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  // FIXED: Handle error state
  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Inventory Management</h1>
            <p className="text-muted-foreground">Failed to load inventory data</p>
          </div>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">Error Loading Inventory</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-red-600 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()} variant="outline">
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Inventory Management</h1>
          <p className="text-muted-foreground">Manage your product inventory and stock levels</p>
        </div>
        <div className="flex items-center gap-2">
          {!isAdmin() && <Badge variant="secondary">Manager Access</Badge>}
        </div>
      </div>

      {/* FIXED: Enhanced Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products.length}</div>
            <p className="text-xs text-muted-foreground">Unique grouped items</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">৳{totalValue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Current inventory value (sale price)</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categories.length}</div>
            <p className="text-xs text-muted-foreground">Product categories</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
            <Package className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lowStockCount}</div>
            <p className="text-xs text-muted-foreground">Items need restocking</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
            <Package className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{outOfStockCount}</div>
            <p className="text-xs text-muted-foreground">Items unavailable</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, model, brand, or color…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>Products</CardTitle>
          <CardDescription>
            {`${filteredProducts.length} of ${products.length} grouped products`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Model</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Brand</TableHead>
                <TableHead>Color</TableHead>
                <TableHead>Cost Price</TableHead>
                <TableHead>Sale Price</TableHead>
                <TableHead>Qty (Grouped)</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground">
                    No products match your filters.
                  </TableCell>
                </TableRow>
              ) : (
                filteredProducts.map((p, idx) => {
                  const stockStatus = getStockStatus(p)
                  return (
                    <TableRow key={`${p.productName}|${p.modelNumber}|${p.brand}|${p.color}|${idx}`}>
                      <TableCell className="font-medium">{p.productName}</TableCell>
                      <TableCell>{p.modelNumber ?? "—"}</TableCell>
                      <TableCell>{p.category ?? "Uncategorized"}</TableCell>
                      <TableCell>{p.brand ?? "—"}</TableCell>
                      <TableCell>{p.color ?? "—"}</TableCell>
                      <TableCell>৳{p.costPrice.toLocaleString()}</TableCell>
                      <TableCell>৳{p.salePrice.toLocaleString()}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span>{p.quantity}</span>
                          <Badge variant={stockStatus.variant} className="text-xs">
                            {stockStatus.label}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>{p.supplier ?? "—"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => handleViewProduct(p)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditProduct(p)}
                            disabled={!hasPermission("inventory_edit")}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}