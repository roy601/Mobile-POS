"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Download, Filter, Search, Settings, ShoppingBag } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { MainNav } from "@/components/main-nav"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UserNav } from "@/components/user-nav"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AddProductForm } from "@/components/add-product-form"

export default function PurchasesPage() {
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState("purchases")

  useEffect(() => {
    const tab = searchParams.get("tab")
    if (tab === "add-product") {
      setActiveTab("add-product")
    }
  }, [searchParams])

  return (
    <div className="flex min-h-screen flex-col">
      <div className="border-b">
        <div className="flex h-16 items-center px-4">
          <MainNav className="mx-6" />
          <div className="ml-auto flex items-center space-x-4">
            <UserNav />
          </div>
        </div>
      </div>
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Purchase Management</h2>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Purchases</CardTitle>
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">245</div>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-muted-foreground">Awaiting delivery</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Month</CardTitle>
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">18</div>
              <p className="text-xs text-muted-foreground">৳24,350.75 total value</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Order Value</CardTitle>
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">৳1,352.82</div>
              <p className="text-xs text-muted-foreground">+5.2% from last month</p>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="purchases">Purchase Orders</TabsTrigger>
            <TabsTrigger value="add-product">Add Product</TabsTrigger>
          </TabsList>

          <TabsContent value="purchases" className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search purchases..." className="pl-8 w-[200px] lg:w-[300px]" />
                </div>

                <Button variant="outline" size="icon">
                  <Filter className="h-4 w-4" />
                </Button>

                <Button variant="outline" size="icon">
                  <Download className="h-4 w-4" />
                </Button>

                <Select defaultValue="all-suppliers">
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
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>PO Number</TableHead>
                      <TableHead>Supplier</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[
                      {
                        id: "PO-1245",
                        supplier: "TechSupplies Inc.",
                        date: "2023-05-18",
                        items: 24,
                        total: 12450.75,
                        payment: "Paid",
                        status: "Received",
                      },
                      {
                        id: "PO-1244",
                        supplier: "AccessoryWorld",
                        date: "2023-05-17",
                        items: 150,
                        total: 3750.25,
                        payment: "Paid",
                        status: "Shipped",
                      },
                      {
                        id: "PO-1243",
                        supplier: "MobileParts Ltd.",
                        date: "2023-05-15",
                        items: 75,
                        total: 2250.0,
                        payment: "Pending",
                        status: "Processing",
                      },
                      {
                        id: "PO-1242",
                        supplier: "TechSupplies Inc.",
                        date: "2023-05-12",
                        items: 18,
                        total: 8950.5,
                        payment: "Paid",
                        status: "Received",
                      },
                      {
                        id: "PO-1241",
                        supplier: "AccessoryWorld",
                        date: "2023-05-10",
                        items: 200,
                        total: 4500.0,
                        payment: "Paid",
                        status: "Received",
                      },
                    ].map((purchase, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{purchase.id}</TableCell>
                        <TableCell>{purchase.supplier}</TableCell>
                        <TableCell>{purchase.date}</TableCell>
                        <TableCell>{purchase.items}</TableCell>
                        <TableCell>৳{purchase.total.toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge variant={purchase.payment === "Paid" ? "outline" : "secondary"}>
                            {purchase.payment}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              purchase.status === "Received"
                                ? "outline"
                                : purchase.status === "Shipped"
                                  ? "secondary"
                                  : "default"
                            }
                          >
                            {purchase.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon">
                            <Settings className="h-4 w-4" />
                            <span className="sr-only">Settings</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="add-product" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Add New Product</CardTitle>
              </CardHeader>
              <CardContent>
                <AddProductForm />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
