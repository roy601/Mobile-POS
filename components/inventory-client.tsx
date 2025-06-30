"use client"

import { useState } from "react"
import { Search, Plus, Edit, Eye, Package } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { useRole } from "@/components/role-provider"

type Product = {
  id: number
  name: string
  sku: string
  category: string
  price: number
  stock: number
  minStock: number
  supplier: string
  status: "active" | "inactive"
  isDemo?: boolean
}

export function InventoryClient() {
  const { toast } = useToast()
  const { hasPermission, isAdmin } = useRole()
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")

  const [products] = useState<Product[]>([
    {
      id: 1,
      name: "iPhone 14 Pro",
      sku: "IP14P-128",
      category: "Smartphones",
      price: 120000,
      stock: 15,
      minStock: 5,
      supplier: "Apple Inc.",
      status: "active",
    },
    {
      id: 2,
      name: "Samsung Galaxy S23",
      sku: "SGS23-256",
      category: "Smartphones",
      price: 95000,
      stock: 8,
      minStock: 10,
      supplier: "Samsung",
      status: "active",
    },
    {
      id: 3,
      name: "iPhone 13 Demo",
      sku: "IP13-DEMO",
      category: "Demo Phones",
      price: 85000,
      stock: 3,
      minStock: 1,
      supplier: "Apple Inc.",
      status: "active",
      isDemo: true,
    },
    {
      id: 4,
      name: "Samsung S22 Demo",
      sku: "SGS22-DEMO",
      category: "Demo Phones",
      price: 70000,
      stock: 2,
      minStock: 1,
      supplier: "Samsung",
      status: "active",
      isDemo: true,
    },
    {
      id: 5,
      name: "Screen Protector",
      sku: "SP-UNIV",
      category: "Accessories",
      price: 500,
      stock: 50,
      minStock: 20,
      supplier: "Generic",
      status: "active",
    },
    {
      id: 6,
      name: "Phone Case",
      sku: "PC-UNIV",
      category: "Accessories",
      price: 800,
      stock: 25,
      minStock: 15,
      supplier: "Generic",
      status: "active",
    },
  ])

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === "all" || product.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  const handleAddProduct = () => {
    window.location.href = "/purchases?tab=add-product"
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
      description: `Editing ${product.name}`,
    })
  }

  const handleViewProduct = (product: Product) => {
    toast({
      title: "Product Details",
      description: `Viewing details for ${product.name}`,
    })
  }

  const getStockStatus = (product: Product) => {
    if (product.stock === 0) return { label: "Out of Stock", variant: "destructive" as const }
    if (product.stock <= product.minStock) return { label: "Low Stock", variant: "secondary" as const }
    return { label: "In Stock", variant: "outline" as const }
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
          <Button onClick={handleAddProduct} className="bg-green-600 hover:bg-green-700">
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products.length}</div>
            <p className="text-xs text-muted-foreground">Active inventory items</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Demo Phones</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products.filter((p) => p.isDemo).length}</div>
            <p className="text-xs text-muted-foreground">Available for sale</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ৳{products.reduce((sum, product) => sum + product.price * product.stock, 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Current inventory value</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{new Set(products.map((p) => p.category)).size}</div>
            <p className="text-xs text-muted-foreground">Product categories</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="Smartphones">Smartphones</SelectItem>
            <SelectItem value="Demo Phones">Demo Phones</SelectItem>
            <SelectItem value="Accessories">Accessories</SelectItem>
            <SelectItem value="Tablets">Tablets</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>Products</CardTitle>
          <CardDescription>
            {filteredProducts.length} of {products.length} products
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => {
                const stockStatus = getStockStatus(product)
                return (
                  <TableRow key={product.id} className={product.isDemo ? "bg-blue-50" : ""}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {product.name}
                        {product.isDemo && (
                          <Badge variant="secondary" className="text-xs">
                            Demo
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{product.sku}</TableCell>
                    <TableCell>{product.category}</TableCell>
                    <TableCell>৳{product.price.toLocaleString()}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span>{product.stock}</span>
                        <Badge variant={stockStatus.variant} className="text-xs">
                          {stockStatus.label}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={product.status === "active" ? "outline" : "secondary"}>{product.status}</Badge>
                    </TableCell>
                    <TableCell>{product.supplier}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => handleViewProduct(product)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        {hasPermission("inventory_edit") && (
                          <Button variant="ghost" size="sm" onClick={() => handleEditProduct(product)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
