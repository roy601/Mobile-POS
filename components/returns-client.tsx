"use client"

import { useState } from "react"
import { ArrowLeft, ArrowRight, Filter, Package, Search, Eye, Edit, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SalesReturnForm } from "@/components/sales-return-form"
import { PurchaseReturnForm } from "@/components/purchase-return-form"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

type Return = {
  id: string
  customer?: string
  supplier?: string
  date: string
  product: string
  reason: string
  amount: number
  status: string
  type: "sales" | "purchase"
}

export function ReturnsClient() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedPeriod, setSelectedPeriod] = useState("all-time")
  const [selectedSupplier, setSelectedSupplier] = useState("all-suppliers")
  const [selectedReturn, setSelectedReturn] = useState<Return | null>(null)
  const [showReturnDetails, setShowReturnDetails] = useState(false)
  const [activeTab, setActiveTab] = useState("sales-returns")

  const [returns] = useState<Return[]>([
    {
      id: "RET-001",
      customer: "John Doe",
      date: "2023-05-15",
      product: "Smartphone X",
      reason: "Defective",
      amount: 899.99,
      status: "Completed",
      type: "sales",
    },
    {
      id: "RET-002",
      customer: "Sarah Davis",
      date: "2023-05-14",
      product: "Wireless Earbuds",
      reason: "Wrong Item",
      amount: 129.99,
      status: "Pending",
      type: "sales",
    },
    {
      id: "RET-003",
      customer: "Michael Brown",
      date: "2023-05-12",
      product: "Phone Case",
      reason: "Not Satisfied",
      amount: 24.99,
      status: "Completed",
      type: "sales",
    },
    {
      id: "PRET-001",
      supplier: "TechSupplies Inc.",
      date: "2023-05-16",
      product: "Smartphone X (Batch)",
      reason: "Defective Batch",
      amount: 4499.95,
      status: "Completed",
      type: "purchase",
    },
    {
      id: "PRET-002",
      supplier: "AccessoryWorld",
      date: "2023-05-13",
      product: "Screen Protectors (Box)",
      reason: "Wrong Specifications",
      amount: 299.9,
      status: "Pending",
      type: "purchase",
    },
    {
      id: "PRET-003",
      supplier: "MobileParts Ltd.",
      date: "2023-05-09",
      product: "Charging Cables (Bulk)",
      reason: "Quality Issues",
      amount: 450.0,
      status: "Completed",
      type: "purchase",
    },
  ])

  const salesReturns = returns.filter((r) => r.type === "sales")
  const purchaseReturns = returns.filter((r) => r.type === "purchase")
  const totalReturns = returns.length
  const totalSalesReturns = salesReturns.length
  const totalPurchaseReturns = purchaseReturns.length
  const salesReturnValue = salesReturns.reduce((sum, r) => sum + r.amount, 0)
  const purchaseReturnValue = purchaseReturns.reduce((sum, r) => sum + r.amount, 0)

  const filteredSalesReturns = salesReturns.filter(
    (returnItem) =>
      returnItem.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
      returnItem.customer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      returnItem.id.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const filteredPurchaseReturns = purchaseReturns.filter(
    (returnItem) =>
      returnItem.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
      returnItem.supplier?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      returnItem.id.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleViewReturn = (returnItem: Return) => {
    setSelectedReturn(returnItem)
    setShowReturnDetails(true)
  }

  const handleEditReturn = (returnItem: Return) => {
    alert(`Edit return ${returnItem.id} functionality would be implemented here`)
  }

  const handleDeleteReturn = (returnItem: Return) => {
    if (confirm(`Are you sure you want to delete return ${returnItem.id}?`)) {
      alert("Return deleted successfully!")
    }
  }

  const handleProcessReturn = (returnItem: Return) => {
    alert(`Processing return ${returnItem.id}...`)
  }

  const handleExportData = () => {
    alert("Returns data exported successfully!")
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Returns Management</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Returns</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalReturns}</div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sales Returns</CardTitle>
            <ArrowLeft className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSalesReturns}</div>
            <p className="text-xs text-muted-foreground">৳{salesReturnValue.toFixed(2)} total value</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Purchase Returns</CardTitle>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPurchaseReturns}</div>
            <p className="text-xs text-muted-foreground">৳{purchaseReturnValue.toFixed(2)} total value</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="sales-returns">Sales Returns</TabsTrigger>
          <TabsTrigger value="purchase-returns">Purchase Returns</TabsTrigger>
          <TabsTrigger value="new-sales-return">New Sales Return</TabsTrigger>
          <TabsTrigger value="new-purchase-return">New Purchase Return</TabsTrigger>
        </TabsList>

        <TabsContent value="sales-returns" className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search returns..."
                  className="pl-8 w-[200px] lg:w-[300px]"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <Button variant="outline" size="icon" onClick={handleExportData}>
                <Filter className="h-4 w-4" />
              </Button>

              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select Period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-time">All Time</SelectItem>
                  <SelectItem value="this-month">This Month</SelectItem>
                  <SelectItem value="last-month">Last Month</SelectItem>
                  <SelectItem value="this-year">This Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Sales Returns</CardTitle>
              <CardDescription>Products returned by customers</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Return ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSalesReturns.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.id}</TableCell>
                      <TableCell>{item.customer}</TableCell>
                      <TableCell>{item.date}</TableCell>
                      <TableCell>{item.product}</TableCell>
                      <TableCell>{item.reason}</TableCell>
                      <TableCell>৳{item.amount.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            item.status === "Completed"
                              ? "outline"
                              : item.status === "Processing"
                                ? "secondary"
                                : "default"
                          }
                        >
                          {item.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handleViewReturn(item)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleEditReturn(item)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          {item.status === "Pending" && (
                            <Button variant="ghost" size="sm" onClick={() => handleProcessReturn(item)}>
                              Process
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteReturn(item)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="purchase-returns" className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search returns..."
                  className="pl-8 w-[200px] lg:w-[300px]"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <Button variant="outline" size="icon" onClick={handleExportData}>
                <Filter className="h-4 w-4" />
              </Button>

              <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select Supplier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-suppliers">All Suppliers</SelectItem>
                  <SelectItem value="techsupplies">TechSupplies Inc.</SelectItem>
                  <SelectItem value="accessoryworld">AccessoryWorld</SelectItem>
                  <SelectItem value="mobileparts">MobileParts Ltd.</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Purchase Returns</CardTitle>
              <CardDescription>Products returned to suppliers</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Return ID</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPurchaseReturns.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.id}</TableCell>
                      <TableCell>{item.supplier}</TableCell>
                      <TableCell>{item.date}</TableCell>
                      <TableCell>{item.product}</TableCell>
                      <TableCell>{item.reason}</TableCell>
                      <TableCell>৳{item.amount.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            item.status === "Completed"
                              ? "outline"
                              : item.status === "Processing"
                                ? "secondary"
                                : "default"
                          }
                        >
                          {item.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handleViewReturn(item)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleEditReturn(item)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          {item.status === "Pending" && (
                            <Button variant="ghost" size="sm" onClick={() => handleProcessReturn(item)}>
                              Process
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteReturn(item)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="new-sales-return" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Process Sales Return</CardTitle>
              <CardDescription>Process a return from customer</CardDescription>
            </CardHeader>
            <CardContent>
              <SalesReturnForm />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="new-purchase-return" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Process Purchase Return</CardTitle>
              <CardDescription>Return products to supplier</CardDescription>
            </CardHeader>
            <CardContent>
              <PurchaseReturnForm />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Return Details Dialog */}
      <Dialog open={showReturnDetails} onOpenChange={setShowReturnDetails}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Return Details</DialogTitle>
            <DialogDescription>Complete information about the selected return</DialogDescription>
          </DialogHeader>
          {selectedReturn && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Return ID</Label>
                  <p className="text-sm text-muted-foreground">{selectedReturn.id}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Type</Label>
                  <p className="text-sm text-muted-foreground capitalize">{selectedReturn.type} Return</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">
                    {selectedReturn.type === "sales" ? "Customer" : "Supplier"}
                  </Label>
                  <p className="text-sm text-muted-foreground">{selectedReturn.customer || selectedReturn.supplier}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Date</Label>
                  <p className="text-sm text-muted-foreground">{selectedReturn.date}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Product</Label>
                  <p className="text-sm text-muted-foreground">{selectedReturn.product}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Amount</Label>
                  <p className="text-sm text-muted-foreground">৳{selectedReturn.amount.toFixed(2)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Reason</Label>
                  <p className="text-sm text-muted-foreground">{selectedReturn.reason}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <Badge variant="outline">{selectedReturn.status}</Badge>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReturnDetails(false)}>
              Close
            </Button>
            {selectedReturn?.status === "Pending" && (
              <Button
                onClick={() => {
                  setShowReturnDetails(false)
                  handleProcessReturn(selectedReturn)
                }}
              >
                Process Return
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
