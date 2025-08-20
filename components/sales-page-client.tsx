"use client"

import { useState } from "react"
import { CalendarDays, DollarSign, ShoppingCart, TrendingUp, Calendar } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MainNav } from "@/components/main-nav"
import { Search } from "@/components/search"
import { UserNav } from "@/components/user-nav"

// Sample sales data - in a real app, this would come from your database
const salesData = [
  {
    id: "INV-001",
    date: "2024-01-15",
    time: "10:30 AM",
    customer: "Olivia Martin",
    items: 3,
    total: "৳1,999.00",
    payment: "Cash",
    status: "completed",
  },
  {
    id: "INV-002",
    date: "2024-01-15",
    time: "11:45 AM",
    customer: "Jackson Lee",
    items: 1,
    total: "৳39.00",
    payment: "Card",
    status: "completed",
  },
  {
    id: "INV-003",
    date: "2024-01-15",
    time: "02:15 PM",
    customer: "Isabella Nguyen",
    items: 2,
    total: "৳299.00",
    payment: "Mobile Banking",
    status: "completed",
  },
  {
    id: "INV-004",
    date: "2024-01-15",
    time: "03:20 PM",
    customer: "William Kim",
    items: 1,
    total: "৳99.00",
    payment: "Cash",
    status: "completed",
  },
  {
    id: "INV-005",
    date: "2024-01-15",
    time: "04:10 PM",
    customer: "Sofia Davis",
    items: 1,
    total: "৳39.00",
    payment: "Card",
    status: "completed",
  },
  {
    id: "INV-006",
    date: "2024-01-14",
    time: "09:15 AM",
    customer: "Ahmed Rahman",
    items: 4,
    total: "৳2,450.00",
    payment: "Mobile Banking",
    status: "completed",
  },
  {
    id: "INV-007",
    date: "2024-01-14",
    time: "01:30 PM",
    customer: "Fatima Khan",
    items: 2,
    total: "৳850.00",
    payment: "Cash",
    status: "completed",
  },
  {
    id: "INV-008",
    date: "2024-01-14",
    time: "05:45 PM",
    customer: "Mohammad Ali",
    items: 1,
    total: "৳199.00",
    payment: "Card",
    status: "refunded",
  },
]

export default function SalesPageClient() {
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

  const filteredSalesData = salesData.filter((sale) => {
    if (!startDate && !endDate) return true

    const saleDate = new Date(sale.date)
    const start = startDate ? new Date(startDate) : null
    const end = endDate ? new Date(endDate) : null

    if (start && end) {
      return saleDate >= start && saleDate <= end
    } else if (start) {
      return saleDate >= start
    } else if (end) {
      return saleDate <= end
    }

    return true
  })

  const totalSales = filteredSalesData.length
  const totalRevenue = filteredSalesData
    .filter((sale) => sale.status === "completed")
    .reduce((sum, sale) => sum + Number.parseFloat(sale.total.replace("৳", "").replace(",", "")), 0)
  const todaySales = filteredSalesData.filter((sale) => sale.date === "2024-01-15").length
  const avgSaleValue =
    filteredSalesData.filter((sale) => sale.status === "completed").length > 0
      ? totalRevenue / filteredSalesData.filter((sale) => sale.status === "completed").length
      : 0

  const clearFilters = () => {
    setStartDate("")
    setEndDate("")
  }

  return (
    <div className="flex min-h-screen flex-col">
      <div className="border-b">
        <div className="flex h-16 items-center px-4">
          <MainNav className="mx-6" />
          <div className="ml-auto flex items-center space-x-4">
            <Search />
            <UserNav />
          </div>
        </div>
      </div>
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Sales</h2>
          <div className="flex items-center space-x-2">
            <Button variant="outline">Export CSV</Button>
            <Button>Print Report</Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Filter by Date Range
            </CardTitle>
            <CardDescription>Select date range to filter sales transactions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 items-end">
              <div className="flex-1">
                <Label htmlFor="start-date">Start Date</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div className="flex-1">
                <Label htmlFor="end-date">End Date</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={clearFilters}>
                  Clear Filters
                </Button>
              </div>
            </div>
            {(startDate || endDate) && (
              <div className="mt-3 text-sm text-muted-foreground">
                Showing {filteredSalesData.length} of {salesData.length} transactions
                {startDate && endDate && ` from ${startDate} to ${endDate}`}
                {startDate && !endDate && ` from ${startDate} onwards`}
                {!startDate && endDate && ` up to ${endDate}`}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sales Summary Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalSales}</div>
              <p className="text-xs text-muted-foreground">
                {startDate || endDate ? "Filtered transactions" : "All time transactions"}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">৳{totalRevenue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">From completed sales</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Sales</CardTitle>
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{todaySales}</div>
              <p className="text-xs text-muted-foreground">Transactions today</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Sale Value</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">৳{Math.round(avgSaleValue)}</div>
              <p className="text-xs text-muted-foreground">Per transaction</p>
            </CardContent>
          </Card>
        </div>

        {/* Sales Table */}
        <Card>
          <CardHeader>
            <CardTitle>Sales History</CardTitle>
            <CardDescription>
              {startDate || endDate
                ? `Filtered sales transactions (${filteredSalesData.length} results)`
                : "Complete list of all sales transactions"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice ID</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Payment Method</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSalesData.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell className="font-medium">{sale.id}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm">{sale.date}</span>
                        <span className="text-xs text-muted-foreground">{sale.time}</span>
                      </div>
                    </TableCell>
                    <TableCell>{sale.customer}</TableCell>
                    <TableCell>{sale.items} items</TableCell>
                    <TableCell>{sale.payment}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          sale.status === "completed"
                            ? "outline"
                            : sale.status === "refunded"
                              ? "destructive"
                              : "secondary"
                        }
                      >
                        {sale.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">{sale.total}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {filteredSalesData.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">No sales found for the selected date range.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
