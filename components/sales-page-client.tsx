"use client"

import { useEffect, useMemo, useState } from "react"
import { CalendarDays, DollarSign, ShoppingCart, TrendingUp, Calendar, RefreshCw, Download } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/utils/supabase/component"
import { useToast } from "@/hooks/use-toast"
import { MainNav } from "@/components/main-nav"

// FIXED: Better type definitions matching actual Supabase response
type CustomerJoined = {
  id: number
  name: string | null
  phone_number: string | null
  email: string | null
}

type SaleCustomerJoined = {
  customer_id?: number | null
  customer_name: string | null
  customer_phone: string | null
  customer_email: string | null
  customers: CustomerJoined[] | null // FIXED: Array as returned by Supabase
}

type SaleRow = {
  id: string | number
  created_at: string
  total_amount: number | null
  payment_method: string | null
  status: string | null
  sale_customers: SaleCustomerJoined[] | null
  sold_products: { id: number }[] | null
}

type UiSale = {
  id: string
  dateISO: string
  timeLabel: string
  customer: string | null
  itemsCount: number
  total: number
  payment: string | null
  status: string | null
}

const supabase = createClient()

function bdAmount(n: number) {
  return `৳${n.toLocaleString("en-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

// FIXED: Better parsing with enhanced error handling and correct customer data handling
function parseSupabaseRows(rows: SaleRow[]): UiSale[] {
  return rows.map((r) => {
    let created: Date
    try {
      created = new Date(r.created_at ?? Date.now())
    } catch {
      created = new Date() // Fallback to current date
    }
    
    const dateISO = created.toISOString().slice(0, 10)
    const timeLabel = created.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })

    // FIXED: Handle both snapshot fields and nested customer array properly
    const sc = Array.isArray(r.sale_customers) && r.sale_customers.length > 0 ? r.sale_customers[0] : null
    let customerName: string | null = null
    
    if (sc) {
      // Try snapshot fields first
      customerName = sc.customer_name || sc.customer_phone
      
      // FIXED: Handle customers array correctly
      if (!customerName && Array.isArray(sc.customers) && sc.customers.length > 0) {
        const customer = sc.customers[0]
        customerName = customer.name || customer.phone_number
      }
    }

    const itemsCount = Array.isArray(r.sold_products) ? r.sold_products.length : 0
    const total = Number(r.total_amount ?? 0)

    return {
      id: String(r.id),
      dateISO,
      timeLabel,
      customer: customerName,
      itemsCount,
      total,
      payment: r.payment_method,
      status: r.status,
    }
  })
}

export default function SalesPageClient() {
  const { toast } = useToast()
  
  // filters
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [query, setQuery] = useState("")

  // data
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [uiSales, setUiSales] = useState<UiSale[]>([])

  // FIXED: Better data loading with comprehensive error handling
  async function loadSales() {
    setLoading(true)
    setError(null)

    try {
      // FIXED: Better query structure with proper error handling
      const { data, error } = await supabase
        .from("sales")
        .select(`
          id,
          created_at,
          total_amount,
          payment_method,
          status,
          sale_customers (
            customer_id,
            customer_name,
            customer_phone,
            customer_email,
            customers (
              id, name, phone_number, email
            )
          ),
          sold_products ( id )
        `)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Sales fetch error:", error)
        throw new Error(`Failed to fetch sales: ${error.message}`)
      }

      // FIXED: Better data validation and parsing
      const rows = Array.isArray(data) ? data as SaleRow[] : []
      const parsedSales = parseSupabaseRows(rows)
      
      setUiSales(parsedSales)
      setError(null)
      
    } catch (e: any) {
      console.error("Load sales error:", e)
      setError(e.message || "Failed to load sales data")
      setUiSales([])
      
      toast({
        title: "Error loading sales",
        description: e.message || "Failed to fetch sales data",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let mounted = true
    
    const initLoad = async () => {
      await loadSales()
      if (!mounted) return
    }
    
    initLoad()
    return () => {
      mounted = false
    }
  }, [])

  // FIXED: Better client-side filtering with date validation
  const filteredSales = useMemo(() => {
    let start: Date | null = null
    let end: Date | null = null
    
    try {
      if (startDate) start = new Date(startDate)
      if (endDate) end = new Date(endDate)
    } catch {
      // Invalid dates - ignore filters
    }
    
    const q = query.trim().toLowerCase()

    return uiSales.filter((s) => {
      let saleDate: Date
      try {
        saleDate = new Date(s.dateISO)
      } catch {
        return false // Skip invalid dates
      }
      
      const inStart = !start || saleDate >= start
      const inEnd = !end || saleDate <= end
      
      const searchText = `${s.id} ${s.customer ?? ""} ${s.payment ?? ""} ${s.status ?? ""}`.toLowerCase()
      const matchQ = !q || searchText.includes(q)
      
      return inStart && inEnd && matchQ
    })
  }, [uiSales, startDate, endDate, query])

  // FIXED: Better KPI calculations with error handling
  const totalSales = filteredSales.length
  const totalRevenue = filteredSales.reduce((sum, s) => sum + (Number.isFinite(s.total) ? s.total : 0), 0)
  const todayISO = new Date().toISOString().slice(0, 10)
  const todaySales = filteredSales.filter((s) => s.dateISO === todayISO).length
  const completedSales = filteredSales.filter((s) => s.status === "completed")
  const completedCount = completedSales.length
  const completedRevenue = completedSales.reduce((sum, s) => sum + s.total, 0)
  const avgSaleValue = completedCount > 0 ? completedRevenue / completedCount : 0

  const clearFilters = () => {
    setStartDate("")
    setEndDate("")
    setQuery("")
  }

  // FIXED: Implement CSV export functionality
  const handleExportCSV = () => {
    try {
      const rows = filteredSales.map(s => 
        [
          s.id,
          s.dateISO,
          s.timeLabel,
          `"${s.customer || ''}"`, // Quote to handle commas
          s.itemsCount,
          `"${s.payment || ''}"`,
          `"${s.status || ''}"`,
          s.total.toFixed(2)
        ].join(',')
      )
      const csv = [
        'ID,Date,Time,Customer,Items,Payment Method,Status,Total',
        ...rows
      ].join('\n')
      
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `sales-report-${new Date().toISOString().slice(0,10)}.csv`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      
      toast({
        title: "Export successful",
        description: `Exported ${filteredSales.length} sales records`
      })
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Could not export sales data",
        variant: "destructive"
      })
    }
  }

  // FIXED: Handle loading state
  if (loading) {
    return (
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Sales</h2>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Loading...</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">—</div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <Card>
          <CardContent className="p-8 text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading sales data...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        
        <h2 className="text-3xl font-bold tracking-tight">Sales</h2>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={loadSales} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? "Refreshing…" : "Refresh"}
          </Button>
          <Button 
            variant="outline" 
            onClick={handleExportCSV}
            disabled={filteredSales.length === 0}
          >
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button 
            onClick={() => {
              window.print()
            }}
          >
            Print Report
          </Button>
        </div>
      </div>

      {/* Filter Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Filter by Date Range
          </CardTitle>
          <CardDescription>Select date range or search to filter sales transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
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

            <div className="flex-1">
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                placeholder="Invoice, customer, method…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="mt-1"
              />
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
            </div>
          </div>

          {(startDate || endDate || query) && (
            <div className="mt-3 text-sm text-muted-foreground">
              Showing {filteredSales.length} of {uiSales.length} transactions
              {startDate && endDate && ` from ${startDate} to ${endDate}`}
              {startDate && !endDate && ` from ${startDate} onwards`}
              {!startDate && endDate && ` up to ${endDate}`}
              {query && ` matching "${query}"`}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSales}</div>
            <p className="text-xs text-muted-foreground">
              {startDate || endDate || query ? "Filtered transactions" : "All time transactions"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bdAmount(totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">From all sales (including pending)</p>
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
            <div className="text-2xl font-bold">
              {bdAmount(Math.round(avgSaleValue))}
            </div>
            <p className="text-xs text-muted-foreground">Per completed transaction</p>
          </CardContent>
        </Card>
      </div>

      {/* Sales Table */}
      <Card>
        <CardHeader>
          <CardTitle>Sales History</CardTitle>
          <CardDescription>
            {error 
              ? `Error: ${error}`
              : startDate || endDate || query
                ? `Filtered sales transactions (${filteredSales.length} results)`
                : "Complete list of all sales transactions"
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3">
              <div className="flex items-center justify-between">
                <div className="text-sm text-red-700">Failed to load: {error}</div>
                <Button onClick={loadSales} variant="outline" size="sm">
                  <RefreshCw className="h-4 w-4" />
                  Retry
                </Button>
              </div>
            </div>
          )}

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice / ID</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Payment Method</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSales.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="p-6 text-sm text-muted-foreground">
                    {error ? "Failed to load sales data." : "No sales found for the selected filters."}
                  </TableCell>
                </TableRow>
              ) : (
                filteredSales.map((sale, idx) => (
                  <TableRow key={`${sale.id}-${idx}`}>
                    <TableCell className="font-medium">{sale.id}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm">{sale.dateISO}</span>
                        <span className="text-xs text-muted-foreground">{sale.timeLabel}</span>
                      </div>
                    </TableCell>
                    <TableCell>{sale.customer ?? "—"}</TableCell>
                    <TableCell>{sale.itemsCount} item{sale.itemsCount === 1 ? "" : "s"}</TableCell>
                    <TableCell>{sale.payment ?? "—"}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          sale.status === "completed"
                            ? "outline"
                            : sale.status === "refunded"
                            ? "destructive"
                            : sale.status === "pending"
                            ? "secondary"
                            : "secondary"
                        }
                      >
                        {sale.status ?? "—"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">{bdAmount(sale.total)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}