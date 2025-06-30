"use client"

import { useState } from "react"
import { Search, Filter, RotateCcw, Package, ShoppingCart, Calendar, Building2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { SalesReturnForm } from "@/components/sales-return-form"
import { PurchaseReturnForm } from "@/components/purchase-return-form"

type ReturnRecord = {
  id: string
  type: "sales" | "purchase"
  date: string
  invoiceNumber: string
  customerSupplier: string
  productName: string
  quantity: number
  amount: number
  reason: string
  status: "pending" | "completed" | "processing"
}

const mockReturns: ReturnRecord[] = [
  {
    id: "1",
    type: "sales",
    date: "2024-01-15",
    invoiceNumber: "INV-001",
    customerSupplier: "John Doe",
    productName: "iPhone 14 Pro",
    quantity: 1,
    amount: 95000,
    reason: "Defective",
    status: "completed",
  },
  {
    id: "2",
    type: "purchase",
    date: "2024-01-14",
    invoiceNumber: "PUR-002",
    customerSupplier: "TechSupplies Inc.",
    productName: "Samsung Galaxy S23",
    quantity: 2,
    amount: 84000,
    reason: "Wrong Model",
    status: "processing",
  },
  {
    id: "3",
    type: "sales",
    date: "2024-01-13",
    invoiceNumber: "INV-003",
    customerSupplier: "Jane Smith",
    productName: "iPad Air",
    quantity: 1,
    amount: 65000,
    reason: "Customer Changed Mind",
    status: "pending",
  },
]

export function ReturnsClient() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedPeriod, setSelectedPeriod] = useState("All Periods")
  const [selectedSupplier, setSelectedSupplier] = useState("All")
  const [showSalesReturn, setShowSalesReturn] = useState(false)
  const [showPurchaseReturn, setShowPurchaseReturn] = useState(false)
  const [returns, setReturns] = useState<ReturnRecord[]>(mockReturns)

  const filteredReturns = returns.filter((returnItem) => {
    const matchesSearch =
      returnItem.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      returnItem.customerSupplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
      returnItem.productName.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesPeriod = selectedPeriod === "All Periods" || returnItem.date.includes(selectedPeriod)
    const matchesSupplier = selectedSupplier === "All" || returnItem.customerSupplier === selectedSupplier

    return matchesSearch && matchesPeriod && matchesSupplier
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>
      case "processing":
        return <Badge className="bg-yellow-100 text-yellow-800">Processing</Badge>
      case "pending":
        return <Badge className="bg-red-100 text-red-800">Pending</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getTypeIcon = (type: string) => {
    return type === "sales" ? (
      <ShoppingCart className="h-4 w-4 text-blue-600" />
    ) : (
      <Package className="h-4 w-4 text-green-600" />
    )
  }

  return (
    <div className="flex-1 p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Returns Management</h1>
        <div className="flex gap-2">
          <Button onClick={() => setShowSalesReturn(true)} className="bg-blue-600 hover:bg-blue-700">
            <ShoppingCart className="mr-2 h-4 w-4" />
            Sales Return
          </Button>
          <Button variant="outline" onClick={() => setShowPurchaseReturn(true)}>
            <Package className="mr-2 h-4 w-4" />
            Purchase Return
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="mr-2 h-5 w-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search returns..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="period">Period</Label>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger>
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All Periods">All Periods</SelectItem>
                  <SelectItem value="2024-01">January 2024</SelectItem>
                  <SelectItem value="2023-12">December 2023</SelectItem>
                  <SelectItem value="2023-11">November 2023</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="supplier">Customer/Supplier</Label>
              <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
                <SelectTrigger>
                  <SelectValue placeholder="Select customer/supplier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All</SelectItem>
                  <SelectItem value="John Doe">John Doe</SelectItem>
                  <SelectItem value="Jane Smith">Jane Smith</SelectItem>
                  <SelectItem value="TechSupplies Inc.">TechSupplies Inc.</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("")
                  setSelectedPeriod("All Periods")
                  setSelectedSupplier("All")
                }}
                className="w-full"
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Reset
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Returns Table */}
      <Card>
        <CardHeader>
          <CardTitle>Return Records</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Customer/Supplier</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReturns.length > 0 ? (
                  filteredReturns.map((returnItem) => (
                    <TableRow key={returnItem.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getTypeIcon(returnItem.type)}
                          <span className="capitalize">{returnItem.type}</span>
                        </div>
                      </TableCell>
                      <TableCell>{returnItem.date}</TableCell>
                      <TableCell className="font-medium">{returnItem.invoiceNumber}</TableCell>
                      <TableCell>{returnItem.customerSupplier}</TableCell>
                      <TableCell>{returnItem.productName}</TableCell>
                      <TableCell>{returnItem.quantity}</TableCell>
                      <TableCell>৳{returnItem.amount.toLocaleString()}</TableCell>
                      <TableCell>{returnItem.reason}</TableCell>
                      <TableCell>{getStatusBadge(returnItem.status)}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      No returns found matching your criteria
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <ShoppingCart className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Sales Returns</p>
                <p className="text-2xl font-bold">{returns.filter((r) => r.type === "sales").length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Purchase Returns</p>
                <p className="text-2xl font-bold">{returns.filter((r) => r.type === "purchase").length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">This Month</p>
                <p className="text-2xl font-bold">{returns.filter((r) => r.date.includes("2024-01")).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Building2 className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total Value</p>
                <p className="text-2xl font-bold">৳{returns.reduce((sum, r) => sum + r.amount, 0).toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sales Return Dialog */}
      <Dialog open={showSalesReturn} onOpenChange={setShowSalesReturn}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Process Sales Return</DialogTitle>
          </DialogHeader>
          <SalesReturnForm onClose={() => setShowSalesReturn(false)} />
        </DialogContent>
      </Dialog>

      {/* Purchase Return Dialog */}
      <Dialog open={showPurchaseReturn} onOpenChange={setShowPurchaseReturn}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Process Purchase Return</DialogTitle>
          </DialogHeader>
          <PurchaseReturnForm onClose={() => setShowPurchaseReturn(false)} />
        </DialogContent>
      </Dialog>
    </div>
  )
}
