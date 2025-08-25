"use client"

import { useEffect, useMemo, useState } from "react"
import { CalendarDays, DollarSign, ShoppingCart, TrendingUp, Calendar } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MainNav } from "@/components/main-nav"
import { Search as GlobalSearch } from "@/components/search"
import { UserNav } from "@/components/user-nav"
import { createClient } from "@/utils/supabase/component"

// ---------- Types that match Supabase response shape ----------

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
  customers: CustomerJoined[] | null // Supabase returns an array for nested relation
}

type SaleRow = {
  id: string
  created_at: string
  total_amount: number | null
  payment_method: string | null
  status: string | null
  sale_customers: SaleCustomerJoined[] | null
  sold_products: { id: number }[] | null
}

// ---------- Normalized UI row ----------

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

// ---------- Supabase client ----------

const supabase = createClient()

// ---------- Helpers ----------

function bdAmount(n: number) {
  return `৳${n.toLocaleString("en-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function parseSupabaseRows(rows: SaleRow[]): UiSale[] {
  return rows.map((r) => {
    const created = new Date(r.created_at ?? Date.now())
    const dateISO = created.toISOString().slice(0, 10)
    const timeLabel = created.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })

    // Prefer snapshot fields on sale_customers[0], fallback to nested customers[0]
    const sc = r.sale_customers?.[0] ?? null
    const nestedCustomer =
      sc && Array.isArray(sc.customers) && sc.customers.length > 0 ? sc.customers[0] : null

    const customerName =
      sc?.customer_name ??
      nestedCustomer?.name ??
      null

    const itemsCount = r.sold_products?.length ?? 0
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

// ---------- Component ----------

export default function SalesPageClient() {
  // filters
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [query, setQuery] = useState("")

  // data
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [uiSales, setUiSales] = useState<UiSale[]>([])

  // load from Supabase
  async function loadSales() {
    setLoading(true)
    setError(null)

    // Select sales with joined customers + sold_products (only need id to count items)
    const { data, error } = await supabase
      .from("sales")
      .select(
        `
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
      `
      )
      .order("created_at", { ascending: false })

    if (error) {
      setError(error.message)
      setUiSales([])
      setLoading(false)
      return
    }

    const rows = (data ?? []) as SaleRow[]
    setUiSales(parseSupabaseRows(rows))
    setLoading(false)
  }

  useEffect(() => {
    let mounted = true
    ;(async () => {
      await loadSales()
      if (!mounted) return
    })()
    return () => {
      mounted = false
    }
  }, [])

  // client-side date + text filters
  const filteredSales = useMemo(() => {
    const start = startDate ? new Date(startDate) : null
    const end = endDate ? new Date(endDate) : null
    const q = query.trim().toLowerCase()

    return uiSales.filter((s) => {
      const saleDate = new Date(s.dateISO)
      const inStart = start ? saleDate >= start : true
      const inEnd = end ? saleDate <= end : true
      const hay = `${s.id} ${s.customer ?? ""} ${s.payment ?? ""}`.toLowerCase()
      const matchQ = !q || hay.includes(q)
      return inStart && inEnd && matchQ
    })
  }, [uiSales, startDate, endDate, query])

  // KPIs
  const totalSales = filteredSales.length
  const totalRevenue = filteredSales.reduce((sum, s) => sum + s.total, 0)
  const todayISO = new Date().toISOString().slice(0, 10)
  const todaySales = filteredSales.filter((s) => s.dateISO === todayISO).length
  const completedCount = filteredSales.filter((s) => s.status === "completed").length
  const avgSaleValue = completedCount > 0 ? totalRevenue / completedCount : 0

  const clearFilters = () => {
    setStartDate("")
    setEndDate("")
    setQuery("")
  }

  return (
    <div className="flex min-h-screen flex-col">
      <div className="border-b">
        <div className="flex h-16 items-center px-4">
          <MainNav className="mx-6" />
          <div className="ml-auto flex items-center space-x-4">
            <GlobalSearch />
            <UserNav />
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Sales</h2>
          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={loadSales} disabled={loading}>
              {loading ? "Refreshing…" : "Refresh"}
            </Button>
            <Button variant="outline">Export CSV</Button>
            <Button>Print Report</Button>
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
              <div className="text-2xl font-bold">{loading ? "—" : totalSales}</div>
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
              <div className="text-2xl font-bold">{loading ? "—" : bdAmount(totalRevenue)}</div>
              <p className="text-xs text-muted-foreground">From completed & recorded sales</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Sales</CardTitle>
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? "—" : todaySales}</div>
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
                {loading ? "—" : bdAmount(Math.round(avgSaleValue))}
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
              {startDate || endDate || query
                ? `Filtered sales transactions (${filteredSales.length} results)`
                : "Complete list of all sales transactions"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                Failed to load: {error}
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
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="p-6 text-sm text-muted-foreground">
                      Loading sales…
                    </TableCell>
                  </TableRow>
                ) : filteredSales.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="p-6 text-sm text-muted-foreground">
                      No sales found for the selected filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSales.map((sale) => (
                    <TableRow key={sale.id}>
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
    </div>
  )
}
