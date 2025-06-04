"use client"

import { useState } from "react"
import { Search, Plus, Edit, Trash2, Package, AlertTriangle, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { useRole } from "@/components/role-provider"
import { Alert, AlertDescription } from "@/components/ui/alert"

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
}

export function InventoryClient() {
  const { toast } = useToast()
  const { hasPermission, isAdmin } = useRole()
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")

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
      name: "Screen Protector",
      sku: "SP-UNIV",
      category: "Accessories",
      price: 500,
      stock: 3,
      minStock: 20,
      supplier: "Generic",
      status: "active",
    },
    {
      id: 4,
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
    const matchesStatus = statusFilter === "all" || product.status === statusFilter
    return matchesSearch && matchesCategory && matchesStatus
  })

  const lowStockProducts = products.filter((product) => product.stock <= product.minStock)

  const handleAddProduct = () => {
    if (!hasPermission("inventory_edit")) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to add products. Redirecting to purchase page.",
        variant: "destructive",
      })
      // Redirect to purchase page
      window.location.href = "/purchases?tab=add-product"
      return
    }
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

  const handleDeleteProduct = (product: Product) => {
    if (!hasPermission("delete_records")) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to delete products.",
        variant: "destructive",
      })
      return
    }
    if (confirm(`Are you sure you want to delete ${product.name}?`)) {
      toast({
        title: "Product Deleted",
        description: `${product.name} has been removed from inventory.`,
      })
    }
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
          <Button onClick={handleAddProduct}>
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Button>
        </div>
      </div>

      {/* Low Stock Alert */}
      {lowStockProducts.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {lowStockProducts.length} product(s) are running low on stock:{" "}
            {lowStockProducts.map((p) => p.name).join(", ")}
          </AlertDescription>
        </Alert>
      )}

      {/* Manager Access Notice */}
      {!hasPermission("inventory_full") && hasPermission("inventory_view") && (
        <Alert>
          <AlertDescription>
            You have limited inventory access. You can view and edit products but cannot delete them.
          </AlertDescription>
        </Alert>
      )}

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
            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{lowStockProducts.length}</div>
            <p className="text-xs text-muted-foreground">Need restocking</p>
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
            <SelectItem value="Accessories">Accessories</SelectItem>
            <SelectItem value="Tablets">Tablets</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
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
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
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
                        {hasPermission("delete_records") && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500"
                            onClick={() => handleDeleteProduct(product)}
                          >
                            <Trash2 className="h-4 w-4" />
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
