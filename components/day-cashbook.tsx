"use client"

import { useEffect, useMemo, useState } from "react"
import { DollarSign, TrendingUp, TrendingDown, Banknote } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/utils/supabase/component"

interface DayCashbookProps {
  selectedDate?: string // "YYYY-MM-DD"
}

const supabase = createClient()

// ---------- Types ----------
type SaleRow = {
  id: number
  created_at: string
  status: string | null
  payment_method: string | null
  total_amount: number | null
}

type SoldProductRow = {
  id: number
  sales_id: number
  quantity: number | null
  unit_price: number | null
  discount_amount: number | null
  total_price: number | null
  cost_price: number | null
}

type PurchaseRow = {
  id: number
  created_at: string
  supplier: string | null
  cost_price: number | null
  color_variants: { quantity: number | null }[] | null
}

type PurchaseReturnRow = {
  id: number
  created_at: string
  credit_method: string | null
  total_credit_amount: number | null
}

type SalesReturnRow = {
  id: number
  return_date: string
  refund_method: string | null
  total_refund_amount: number | null
}

type ExpenseRow = {
  id: number
  created_at: string
  description: string | null
  category: string | null
  amount: number | null
  payment_method: string | null
}

export function DayCashbook({ selectedDate }: DayCashbookProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [sales, setSales] = useState<SaleRow[]>([])
  const [soldProducts, setSoldProducts] = useState<SoldProductRow[]>([])
  const [purchases, setPurchases] = useState<PurchaseRow[]>([])
  const [purchaseReturns, setPurchaseReturns] = useState<PurchaseReturnRow[]>([])
  const [salesReturns, setSalesReturns] = useState<SalesReturnRow[]>([])
  const [expenses, setExpenses] = useState<ExpenseRow[]>([])

  useEffect(() => {
    let mounted = true

    async function load() {
      if (!selectedDate) {
        setLoading(false)
        return
      }
      
      setLoading(true)
      setError(null)

      try {
        // FIXED: Proper date range handling for the selected date
        const startOfDay = `${selectedDate}T00:00:00.000Z`
        const endOfDay = `${selectedDate}T23:59:59.999Z`

        // SALES - FIXED: Proper error handling and type casting
        const { data: salesData, error: salesErr } = await supabase
          .from("sales")
          .select("id, created_at, status, payment_method, total_amount")
          .gte("created_at", startOfDay)
          .lte("created_at", endOfDay)
        
        if (salesErr) {
          console.error("Sales fetch error:", salesErr)
          throw new Error(`Failed to fetch sales: ${salesErr.message}`)
        }

        const safeSalesData = Array.isArray(salesData) ? salesData as SaleRow[] : []

        // SOLD PRODUCTS - FIXED: Only fetch if we have sales
        let safeSoldData: SoldProductRow[] = []
        if (safeSalesData.length > 0) {
          const saleIds = safeSalesData.map((s) => s.id)
          const { data: sp, error: spErr } = await supabase
            .from("sold_products")
            .select("id, sales_id, quantity, unit_price, discount_amount, total_price, cost_price")
            .in("sales_id", saleIds)
          
          if (spErr) {
            console.warn("Sold products fetch error:", spErr)
            // Don't throw - this is supplementary data
          } else {
            safeSoldData = Array.isArray(sp) ? sp as SoldProductRow[] : []
          }
        }

        // PURCHASES - FIXED: Proper nested select and error handling
        const { data: purData, error: purErr } = await supabase
          .from("purchases")
          .select(`
            id, 
            created_at, 
            supplier, 
            cost_price,
            color_variants!inner(quantity)
          `)
          .gte("created_at", startOfDay)
          .lte("created_at", endOfDay)

        if (purErr) {
          console.warn("Purchases fetch error:", purErr)
          // Don't throw - continue with empty array
        }

        const safePurData = Array.isArray(purData) ? purData as PurchaseRow[] : []

        // PURCHASE RETURNS - FIXED: Handle created_at vs return_date
        const { data: pretData, error: pretErr } = await supabase
          .from("purchase_returns")
          .select("id, created_at, credit_method, total_credit_amount")
          .gte("created_at", startOfDay)
          .lte("created_at", endOfDay)

        if (pretErr) {
          console.warn("Purchase returns fetch error:", pretErr)
        }

        const safePretData = Array.isArray(pretData) ? pretData as PurchaseReturnRow[] : []

        // SALES RETURNS - FIXED: Use return_date field consistently
        const { data: sretData, error: sretErr } = await supabase
          .from("sales_returns")
          .select("id, return_date, refund_method, total_refund_amount")
          .gte("return_date", startOfDay)
          .lte("return_date", endOfDay)

        if (sretErr) {
          console.warn("Sales returns fetch error:", sretErr)
        }

        const safeSretData = Array.isArray(sretData) ? sretData as SalesReturnRow[] : []

        // EXPENSES - FIXED: Graceful handling if table doesn't exist
        let safeExpData: ExpenseRow[] = []
        try {
          const { data: exp, error: expErr } = await supabase
            .from("expenses")
            .select("id, created_at, description, category, amount, payment_method")
            .gte("created_at", startOfDay)
            .lte("created_at", endOfDay)
          
          if (expErr) {
            if (expErr.message.includes("does not exist")) {
              console.info("Expenses table does not exist - skipping")
            } else {
              console.warn("Expenses fetch error:", expErr)
            }
          } else {
            safeExpData = Array.isArray(exp) ? exp as ExpenseRow[] : []
          }
        } catch (expError) {
          console.warn("Expenses table access failed:", expError)
        }

        if (!mounted) return

        setSales(safeSalesData)
        setSoldProducts(safeSoldData)
        setPurchases(safePurData)
        setPurchaseReturns(safePretData)
        setSalesReturns(safeSretData)
        setExpenses(safeExpData)

      } catch (e: any) {
        if (!mounted) return
        console.error("Day cashbook load error:", e)
        setError(e.message ?? String(e))
        // Reset all data on error
        setSales([])
        setSoldProducts([])
        setPurchases([])
        setPurchaseReturns([])
        setSalesReturns([])
        setExpenses([])
      } finally {
        if (mounted) setLoading(false)
      }
    }

    load()
    return () => {
      mounted = false
    }
  }, [selectedDate])

  // ---------- Helpers ----------
  const fmt = (n?: number) => `৳${Number(n ?? 0).toLocaleString()}`
  const timeOf = (iso: string) => {
    try {
      return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    } catch {
      return "Invalid"
    }
  }

  // Map sold_products by sale to get net revenue (after discounts)
  const revenueBySaleId = useMemo(() => {
    const map = new Map<number, { revenue: number; cogs: number }>()
    for (const sp of soldProducts) {
      const qty = Number(sp.quantity ?? 0)
      const unit = Number(sp.unit_price ?? 0)
      const tot = sp.total_price != null ? Number(sp.total_price) : unit * qty - Number(sp.discount_amount ?? 0)
      const cogs = Number(sp.cost_price ?? 0) * qty
      const prev = map.get(sp.sales_id) ?? { revenue: 0, cogs: 0 }
      prev.revenue += tot
      prev.cogs += cogs
      map.set(sp.sales_id, prev)
    }
    return map
  }, [soldProducts])

  // RECEIPTS: Sales receipts (completed) + Purchase returns credit
  const receiptItems = useMemo(() => {
    const saleReceipts = sales
      .filter((s) => s.status === "completed")
      .map((s) => {
        const sums = revenueBySaleId.get(s.id)
        const revenue = sums?.revenue ?? Number(s.total_amount ?? 0)
        return {
          t_type: "receipt" as const,
          t_time: timeOf(s.created_at),
          description: "POS Sale",
          amount: revenue,
          method: (s.payment_method ?? "Cash").toLowerCase(),
          ref: `SALE-${s.id}`,
        }
      })

    const purchaseReturnReceipts = purchaseReturns.map((r) => ({
      t_type: "receipt" as const,
      t_time: timeOf(r.created_at),
      description: "Purchase Return Credit",
      amount: Number(r.total_credit_amount ?? 0),
      method: (r.credit_method ?? "bank").toLowerCase(),
      ref: `PRET-${r.id}`,
    }))

    return [...saleReceipts, ...purchaseReturnReceipts].sort((a, b) => a.t_time.localeCompare(b.t_time))
  }, [sales, revenueBySaleId, purchaseReturns])

  // PAYMENTS: Purchases + Sales returns (refunds) + Expenses
  const paymentItems = useMemo(() => {
    const purchasePayments = purchases.map((p) => {
      const qty = (p.color_variants ?? []).reduce((sum, cv) => sum + Number(cv.quantity ?? 0), 0)
      const amount = qty * Number(p.cost_price ?? 0)
      return {
        t_type: "payment" as const,
        t_time: timeOf(p.created_at),
        description: p.supplier ? `Purchase from ${p.supplier}` : "Purchase",
        amount,
        method: "bank",
        ref: `PUR-${p.id}`,
      }
    })

    const salesReturnPayments = salesReturns.map((r) => ({
      t_type: "payment" as const,
      t_time: timeOf(r.return_date),
      description: "Sales Return Refund",
      amount: Number(r.total_refund_amount ?? 0),
      method: (r.refund_method ?? "cash").toLowerCase(),
      ref: `SRET-${r.id}`,
    }))

    const expensePayments = expenses.map((e) => ({
      t_type: "payment" as const,
      t_time: timeOf(e.created_at),
      description: e.description || e.category || "Expense",
      amount: Number(e.amount ?? 0),
      method: (e.payment_method ?? "cash").toLowerCase(),
      ref: `EXP-${e.id}`,
    }))

    return [...purchasePayments, ...salesReturnPayments, ...expensePayments].sort((a, b) =>
      a.t_time.localeCompare(b.t_time)
    )
  }, [purchases, salesReturns, expenses])

  // Totals + breakdown by method
  const receiptsTotal = receiptItems.reduce((s, r) => s + r.amount, 0)
  const paymentsTotal = paymentItems.reduce((s, p) => s + p.amount, 0)
  const netCashFlow = receiptsTotal - paymentsTotal

  const byMethod = useMemo(() => {
    const init = { cash: 0, card: 0, mobileBanking: 0, bank: 0 }
    for (const r of receiptItems) {
      if (r.method.includes("cash")) init.cash += r.amount
      else if (r.method.includes("card")) init.card += r.amount
      else if (r.method.includes("mobile")) init.mobileBanking += r.amount
      else init.bank += r.amount
    }
    return init
  }, [receiptItems])

  const transactions = useMemo(
    () => [...receiptItems, ...paymentItems].sort((a, b) => a.t_time.localeCompare(b.t_time)),
    [receiptItems, paymentItems]
  )

  // FIXED: Show loading state properly
  if (loading) {
    return (
      <div className="space-y-6">
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
      </div>
    )
  }

  // FIXED: Show error state properly
  if (error) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">Error Loading Data</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-red-600">{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Opening Balance</CardTitle>
            <Banknote className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">৳0</div>
            <p className="text-xs text-muted-foreground">Start of day (static)</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Receipts</CardTitle>
            <TrendingUp className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{fmt(receiptsTotal)}</div>
            <p className="text-xs text-muted-foreground">Sales + Purchase Returns</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Payments</CardTitle>
            <TrendingDown className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{fmt(paymentsTotal)}</div>
            <p className="text-xs text-muted-foreground">Purchases + Sales Returns + Expenses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Closing Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fmt(netCashFlow)}</div>
            <p className="text-xs text-muted-foreground">Opening + Net Flow</p>
          </CardContent>
        </Card>
      </div>

      {/* Net Cash Flow + method */}
      <Card>
        <CardHeader>
          <CardTitle>Net Cash Flow</CardTitle>
          <CardDescription>Includes discounts in revenue; COGS from purchase cost (used in ledger)</CardDescription>
        </CardHeader>
        <CardContent className="text-sm">
          <div>By Method: Cash {fmt(byMethod.cash)} · Card {fmt(byMethod.card)} · Mobile {fmt(byMethod.mobileBanking)} · Bank {fmt(byMethod.bank)}</div>
        </CardContent>
      </Card>

      {/* Transaction Details */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction Details</CardTitle>
          <CardDescription>Sales / Purchases / Returns / Expenses for {selectedDate}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No transactions for {selectedDate}
                  </TableCell>
                </TableRow>
              ) : (
                transactions.map((t, idx) => (
                  <TableRow key={`${t.ref}-${idx}`}>
                    <TableCell>{t.t_time}</TableCell>
                    <TableCell className="font-mono text-sm">{t.ref}</TableCell>
                    <TableCell>{t.description}</TableCell>
                    <TableCell>
                      <Badge variant={t.t_type === "receipt" ? "outline" : "secondary"}>{t.t_type}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">{fmt(t.amount)}</TableCell>
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
