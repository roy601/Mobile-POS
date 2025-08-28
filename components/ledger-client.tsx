"use client"

import { useEffect, useMemo, useState } from "react"
import { Plus, Filter, Download, Search, BookOpen, TrendingUp, TrendingDown, DollarSign, Loader2 } from "lucide-react"
import { createClient } from "@/utils/supabase/component"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"

type EntryType = "sales" | "purchase" | "sales_return" | "purchase_return"

type GLEntry = {
  id: string
  date: string
  description: string
  account: string
  debit: number
  credit: number
  reference?: string | null
  type: EntryType
}

type SalesRow = {
  id: number
  created_at: string
  status: string | null
  total_amount: number | null
  payment_method: string | null
}

type PurchaseRow = {
  id: number
  created_at: string
  supplier: string | null
  cost_price: number | null
  color_variants: { quantity: number | null }[] | null
}

type SalesReturnRow = {
  id: number
  return_date: string
  refund_method: string | null
  total_refund_amount: number | null
}

type PurchaseReturnRow = {
  id: number
  created_at?: string | null
  credit_method: string | null
  total_credit_amount: number | null
}

const supabase = createClient()

// Chart for grouping in Trial Balance / Balance Sheet
const ACCOUNT_TYPES: Record<string, "asset" | "liability" | "equity" | "revenue" | "expense"> = {
  // Assets
  Cash: "asset",
  "Bank Account": "asset",
  Inventory: "asset",
  "Accounts Receivable": "asset",

  // Liabilities
  "Accounts Payable": "liability",

  // Equity
  "Owner Equity": "equity",
  "Retained Earnings": "equity",

  // Revenue / Contra
  "Sales Revenue": "revenue",
  "Sales Returns": "expense", // treat as expense/contra for P&L

  // Expenses
  "Cost of Goods Sold": "expense",
}

export function LedgerClient() {
  const { toast } = useToast()

  const [selectedAccount, setSelectedAccount] = useState("all")
  const [selectedPeriod, setSelectedPeriod] = useState("this-month")
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [entries, setEntries] = useState<GLEntry[]>([])

  useEffect(() => {
    let mounted = true

    async function load() {
      setLoading(true)
      setError(null)
      
      try {
        // FIXED: Better error handling for each query with Promise.allSettled
        const queries = await Promise.allSettled([
          supabase.from("sales").select("id, created_at, status, total_amount, payment_method"),
          supabase.from("purchases").select("id, created_at, supplier, cost_price, color_variants(quantity)"),
          supabase.from("sales_returns").select("id, return_date, refund_method, total_refund_amount"),
          supabase.from("purchase_returns").select("id, created_at, credit_method, total_credit_amount")
        ])

        // FIXED: Extract results with proper error handling
        const [salesResult, purchasesResult, sReturnsResult, pReturnsResult] = queries

        let sales: SalesRow[] = []
        let purchases: PurchaseRow[] = []
        let srets: SalesReturnRow[] = []
        let prets: PurchaseReturnRow[] = []

        if (salesResult.status === 'fulfilled' && !salesResult.value.error) {
          sales = (salesResult.value.data ?? []) as SalesRow[]
        } else {
          const errorMsg = salesResult.status === 'fulfilled' ? salesResult.value.error?.message : 'Promise rejected'
          console.warn("Sales fetch failed:", errorMsg)
        }

        if (purchasesResult.status === 'fulfilled' && !purchasesResult.value.error) {
          purchases = (purchasesResult.value.data ?? []) as PurchaseRow[]
        } else {
          const errorMsg = purchasesResult.status === 'fulfilled' ? purchasesResult.value.error?.message : 'Promise rejected'
          console.warn("Purchases fetch failed:", errorMsg)
        }

        if (sReturnsResult.status === 'fulfilled' && !sReturnsResult.value.error) {
          srets = (sReturnsResult.value.data ?? []) as SalesReturnRow[]
        } else {
          const errorMsg = sReturnsResult.status === 'fulfilled' ? sReturnsResult.value.error?.message : 'Promise rejected'
          console.warn("Sales returns fetch failed:", errorMsg)
        }

        if (pReturnsResult.status === 'fulfilled' && !pReturnsResult.value.error) {
          prets = (pReturnsResult.value.data ?? []) as PurchaseReturnRow[]
        } else {
          const errorMsg = pReturnsResult.status === 'fulfilled' ? pReturnsResult.value.error?.message : 'Promise rejected'
          console.warn("Purchase returns fetch failed:", errorMsg)
        }

        // Build double-entry style rows
        const gl: GLEntry[] = []

        // SALES → Dr Cash/Bank, Cr Sales Revenue (completed only)
        for (const s of sales) {
          if (s.status !== "completed") continue
          const amt = Number(s.total_amount ?? 0)
          if (!amt || !Number.isFinite(amt)) continue

          const pm = (s.payment_method ?? "Cash").toLowerCase()
          // FIXED: Better payment method matching
          const cashAccount =
            pm.includes("card") || pm.includes("bank") || pm.includes("transfer")
              ? "Bank Account"
              : pm.includes("mobile")
                ? "Bank Account"
                : "Cash"

          gl.push({
            id: `S-${s.id}-DR`,
            date: s.created_at,
            description: "POS Sale",
            account: cashAccount,
            debit: amt,
            credit: 0,
            reference: `SALE-${s.id}`,
            type: "sales",
          })
          gl.push({
            id: `S-${s.id}-CR`,
            date: s.created_at,
            description: "POS Sale",
            account: "Sales Revenue",
            debit: 0,
            credit: amt,
            reference: `SALE-${s.id}`,
            type: "sales",
          })
        }

        // PURCHASES → Dr Inventory, Cr Accounts Payable
        for (const p of purchases) {
          const qty = (p.color_variants ?? []).reduce((sum, cv) => sum + Number(cv?.quantity ?? 0), 0)
          const unitCost = Number(p.cost_price ?? 0)
          const amt = qty * unitCost
          if (!amt || !Number.isFinite(amt)) continue

          gl.push({
            id: `P-${p.id}-DR`,
            date: p.created_at,
            description: p.supplier ? `Purchase from ${p.supplier}` : "Inventory Purchase",
            account: "Inventory",
            debit: amt,
            credit: 0,
            reference: `PUR-${p.id}`,
            type: "purchase",
          })
          gl.push({
            id: `P-${p.id}-CR`,
            date: p.created_at,
            description: p.supplier ? `Purchase from ${p.supplier}` : "Inventory Purchase",
            account: "Accounts Payable",
            debit: 0,
            credit: amt,
            reference: `PUR-${p.id}`,
            type: "purchase",
          })
        }

        // SALES RETURNS → Dr Sales Returns, Cr Cash/Bank (refund out)
        for (const r of srets) {
          const amt = Number(r.total_refund_amount ?? 0)
          if (!amt || !Number.isFinite(amt)) continue

          const rm = (r.refund_method ?? "Cash").toLowerCase()
          // FIXED: Better refund method matching
          const bankOrCash =
            rm.includes("card") || rm.includes("bank") || rm.includes("transfer") || rm.includes("mobile") 
              ? "Bank Account" 
              : "Cash"

          gl.push({
            id: `SR-${r.id}-DR`,
            date: r.return_date,
            description: "Sales Return",
            account: "Sales Returns",
            debit: amt,
            credit: 0,
            reference: `SRET-${r.id}`,
            type: "sales_return",
          })
          gl.push({
            id: `SR-${r.id}-CR`,
            date: r.return_date,
            description: "Sales Return Refund",
            account: bankOrCash,
            debit: 0,
            credit: amt,
            reference: `SRET-${r.id}`,
            type: "sales_return",
          })
        }

        // PURCHASE RETURNS → Dr Accounts Payable/Bank, Cr Inventory
        for (const r of prets) {
          const date = r.created_at ?? new Date().toISOString()
          const amt = Number(r.total_credit_amount ?? 0)
          if (!amt || !Number.isFinite(amt)) continue

          const cm = (r.credit_method ?? "").toLowerCase()
          // FIXED: Better credit method matching
          const debitAccount =
            cm.includes("cash") || cm.includes("bank") || cm.includes("transfer") || cm.includes("mobile") 
              ? "Bank Account" 
              : "Accounts Payable"

          gl.push({
            id: `PR-${r.id}-DR`,
            date,
            description: "Purchase Return",
            account: debitAccount,
            debit: amt,
            credit: 0,
            reference: `PRET-${r.id}`,
            type: "purchase_return",
          })
          gl.push({
            id: `PR-${r.id}-CR`,
            date,
            description: "Purchase Return",
            account: "Inventory",
            debit: 0,
            credit: amt,
            reference: `PRET-${r.id}`,
            type: "purchase_return",
          })
        }

        if (!mounted) return
        setEntries(gl.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()))
        
      } catch (e: any) {
        if (!mounted) return
        console.error("Ledger load error:", e)
        setError(e.message ?? "Failed to load operational data")
        setEntries([])
        toast({
          title: "Error loading ledger",
          description: e.message ?? "Failed to load operational data",
          variant: "destructive",
        })
      } finally {
        if (mounted) setLoading(false)
      }
    }

    load()
    return () => {
      mounted = false
    }
  }, [toast])

  // FIXED: Better period filtering logic
  const filteredEntries = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    const now = new Date()
    
    // FIXED: Proper date calculations
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const startOfWeek = new Date(today)
    startOfWeek.setDate(today.getDate() - today.getDay())
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfYear = new Date(now.getFullYear(), 0, 1)

    return entries.filter((e) => {
      let entryDate: Date
      try {
        entryDate = new Date(e.date)
      } catch {
        return false // Skip entries with invalid dates
      }

      // account filter
      const accountOK = selectedAccount === "all" || e.account === selectedAccount
      
      // text filter
      const textOK =
        !term ||
        e.description.toLowerCase().includes(term) ||
        e.account.toLowerCase().includes(term) ||
        (e.reference ?? "").toLowerCase().includes(term)
      
      // period filter
      let periodOK = true
      switch (selectedPeriod) {
        case "today":
          periodOK = entryDate >= today
          break
        case "this-week":
          periodOK = entryDate >= startOfWeek
          break
        case "this-month":
          periodOK = entryDate >= startOfMonth
          break
        case "this-year":
          periodOK = entryDate >= startOfYear
          break
        case "all-time":
        default:
          periodOK = true
      }
      return accountOK && textOK && periodOK
    })
  }, [entries, searchTerm, selectedAccount, selectedPeriod])

  const totalDebits = filteredEntries.reduce((s, e) => s + e.debit, 0)
  const totalCredits = filteredEntries.reduce((s, e) => s + e.credit, 0)
  const netBalance = totalCredits - totalDebits

  // Trial Balance / P&L / Balance Sheet calculations
  const accountsList = useMemo(() => {
    return Array.from(new Set(entries.map((e) => e.account))).sort()
  }, [entries])

  const accountBalances = useMemo(() => {
    const map = new Map<string, { debit: number; credit: number }>()
    for (const e of entries) {
      const rec = map.get(e.account) ?? { debit: 0, credit: 0 }
      rec.debit += e.debit
      rec.credit += e.credit
      map.set(e.account, rec)
    }
    return map
  }, [entries])

  const trialRows = useMemo(() => {
    return accountsList.map((name) => {
      const t = accountBalances.get(name) ?? { debit: 0, credit: 0 }
      const type = ACCOUNT_TYPES[name] ?? "asset"
      const balance =
        type === "asset" || type === "expense" ? t.debit - t.credit : t.credit - t.debit
      return { name, type, debit: Math.max(0, -balance), credit: Math.max(0, balance) }
    })
  }, [accountsList, accountBalances])

  const pl = useMemo(() => {
    let revenue = 0
    let expense = 0
    for (const [name, t] of accountBalances) {
      const type = ACCOUNT_TYPES[name]
      if (type === "revenue") revenue += t.credit - t.debit
      if (type === "expense") expense += t.debit - t.credit
    }
    return { revenue, expense, net: revenue - expense }
  }, [accountBalances])

  const balanceSheet = useMemo(() => {
    let assets = 0
    let liabilities = 0
    let equity = 0
    for (const [name, t] of accountBalances) {
      const type = ACCOUNT_TYPES[name]
      if (type === "asset") assets += t.debit - t.credit
      else if (type === "liability") liabilities += t.credit - t.debit
      else if (type === "equity") equity += t.credit - t.debit
    }
    const retained = pl.net
    return { assets, liabilities, equity: equity + retained, retained }
  }, [accountBalances, pl.net])

  // FIXED: Better loading state
  if (loading) {
    return (
      <div className="flex-1 space-y-6 p-8 pt-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Ledger</h1>
            <p className="text-muted-foreground">Loading accounting data...</p>
          </div>
        </div>
        <div className="flex items-center justify-center h-32">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading ledger…</span>
        </div>
      </div>
    )
  }

  // FIXED: Better error state
  if (error) {
    return (
      <div className="flex-1 space-y-6 p-8 pt-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Ledger</h1>
            <p className="text-muted-foreground">Error loading accounting data</p>
          </div>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">Error Loading Ledger</CardTitle>
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
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Ledger</h1>
          <p className="text-muted-foreground">Complete accounting ledger and transaction history</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => {
              try {
                const rows = filteredEntries.map((e) =>
                  [
                    new Date(e.date).toLocaleDateString(),
                    e.reference ?? "-", 
                    `"${e.description}"`, // Quote description to handle commas
                    e.account, 
                    e.debit || 0, 
                    e.credit || 0, 
                    e.type
                  ].join(",")
                )
                const csv = ["Date,Reference,Description,Account,Debit,Credit,Type", ...rows].join("\n")
                const blob = new Blob([csv], { type: "text/csv" })
                const url = URL.createObjectURL(blob)
                const a = document.createElement("a")
                a.href = url
                a.download = `ledger-${new Date().toISOString().slice(0,10)}.csv`
                document.body.appendChild(a)
                a.click()
                a.remove()
                URL.revokeObjectURL(url)
                
                toast({
                  title: "Export successful",
                  description: `Exported ${filteredEntries.length} ledger entries`
                })
              } catch (err) {
                toast({
                  title: "Export failed",
                  description: "Could not export ledger data",
                  variant: "destructive"
                })
              }
            }}
            variant="outline"
          >
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Debits</CardTitle>
            <TrendingUp className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">৳{totalDebits.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Money going out</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Credits</CardTitle>
            <TrendingDown className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">৳{totalCredits.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Money coming in</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${netBalance >= 0 ? "text-green-600" : "text-red-600"}`}>
              ৳{netBalance.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Credits - Debits</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Entries</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredEntries.length}</div>
            <p className="text-xs text-muted-foreground">Ledger transactions</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="general-ledger" className="space-y-6">
        <TabsList>
          <TabsTrigger value="general-ledger">General Ledger</TabsTrigger>
          <TabsTrigger value="trial-balance">Trial Balance</TabsTrigger>
          <TabsTrigger value="profit-loss">Profit & Loss</TabsTrigger>
          <TabsTrigger value="balance-sheet">Balance Sheet</TabsTrigger>
        </TabsList>

        {/* General Ledger */}
        <TabsContent value="general-ledger" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={selectedAccount} onValueChange={setSelectedAccount}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select Account" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Accounts</SelectItem>
                {accountsList.map((a) => (
                  <SelectItem key={a} value={a}>{a}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select Period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="this-week">This Week</SelectItem>
                <SelectItem value="this-month">This Month</SelectItem>
                <SelectItem value="this-year">This Year</SelectItem>
                <SelectItem value="all-time">All Time</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>General Ledger</CardTitle>
              <CardDescription>
                All accounting transactions and entries (computed from operational data)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Account</TableHead>
                    <TableHead className="text-right">Debit</TableHead>
                    <TableHead className="text-right">Credit</TableHead>
                    <TableHead>Type</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEntries.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        {entries.length === 0 ? "No transactions found" : "No entries match your filters"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredEntries.map((e) => (
                      <TableRow key={e.id}>
                        <TableCell>
                          {new Date(e.date).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="font-mono text-sm">{e.reference ?? "-"}</TableCell>
                        <TableCell>{e.description}</TableCell>
                        <TableCell>{e.account}</TableCell>
                        <TableCell className="text-right text-red-600">
                          {e.debit ? `৳${e.debit.toLocaleString()}` : "-"}
                        </TableCell>
                        <TableCell className="text-right text-green-600">
                          {e.credit ? `৳${e.credit.toLocaleString()}` : "-"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              e.type === "sales"
                                ? "outline"
                                : e.type === "purchase"
                                  ? "secondary"
                                  : e.type === "sales_return"
                                    ? "destructive"
                                    : "outline"
                            }
                          >
                            {e.type.replace("_", " ")}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trial Balance */}
        <TabsContent value="trial-balance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Trial Balance</CardTitle>
              <CardDescription>Summary of all account balances (computed)</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Account Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Debit</TableHead>
                    <TableHead className="text-right">Credit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trialRows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        No account balances available
                      </TableCell>
                    </TableRow>
                  ) : (
                    <>
                      {trialRows.map((r) => (
                        <TableRow key={r.name}>
                          <TableCell className="font-medium">{r.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {r.type}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {r.debit ? `৳${r.debit.toLocaleString()}` : "-"}
                          </TableCell>
                          <TableCell className="text-right">
                            {r.credit ? `৳${r.credit.toLocaleString()}` : "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="border-t-2 font-bold">
                        <TableCell colSpan={2}>Total</TableCell>
                        <TableCell className="text-right">
                          ৳{trialRows.reduce((s, r) => s + r.debit, 0).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          ৳{trialRows.reduce((s, r) => s + r.credit, 0).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    </>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Profit & Loss */}
        <TabsContent value="profit-loss" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Profit & Loss Statement</CardTitle>
              <CardDescription>Revenue and expense summary (computed)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Revenue</h3>
                  <div className="flex justify-between py-2">
                    <span>Sales Revenue</span>
                    <span className="font-medium">৳{(entries
                      .filter((e) => e.account === "Sales Revenue")
                      .reduce((s, e) => s + (e.credit - e.debit), 0)
                    ).toLocaleString()}</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between font-semibold">
                    <span>Total Revenue</span>
                    <span>৳{pl.revenue.toLocaleString()}</span>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">Expenses</h3>
                  <div className="flex justify-between py-2">
                    <span>Cost of Goods Sold</span>
                    <span className="font-medium">৳{(entries
                      .filter((e) => e.account === "Cost of Goods Sold")
                      .reduce((s, e) => s + (e.debit - e.credit), 0)
                    ).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span>Sales Returns</span>
                    <span className="font-medium">৳{(entries
                      .filter((e) => e.account === "Sales Returns")
                      .reduce((s, e) => s + (e.debit - e.credit), 0)
                    ).toLocaleString()}</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between font-semibold">
                    <span>Total Expenses</span>
                    <span>৳{pl.expense.toLocaleString()}</span>
                  </div>
                </div>

                <div className="border-t-2 pt-4 flex justify-between text-xl font-bold">
                  <span>Net Profit</span>
                  <span className={pl.net >= 0 ? "text-green-600" : "text-red-600"}>
                    ৳{pl.net.toLocaleString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Balance Sheet */}
        <TabsContent value="balance-sheet" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Balance Sheet</CardTitle>
              <CardDescription>Assets, Liabilities & Equity (computed)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid md:grid-cols-3 gap-6">
                  <div>
                    <h3 className="font-semibold mb-4">Assets</h3>
                    {accountsList
                      .filter(name => ACCOUNT_TYPES[name] === "asset")
                      .map(name => {
                        const balance = accountBalances.get(name)
                        const amount = balance ? balance.debit - balance.credit : 0
                        return (
                          <div key={name} className="flex justify-between py-1">
                            <span className="text-sm">{name}</span>
                            <span className="text-sm font-medium">৳{amount.toLocaleString()}</span>
                          </div>
                        )
                      })}
                    <div className="border-t pt-2 flex justify-between font-bold">
                      <span>Total Assets</span>
                      <span>৳{balanceSheet.assets.toLocaleString()}</span>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-4">Liabilities</h3>
                    {accountsList
                      .filter(name => ACCOUNT_TYPES[name] === "liability")
                      .map(name => {
                        const balance = accountBalances.get(name)
                        const amount = balance ? balance.credit - balance.debit : 0
                        return (
                          <div key={name} className="flex justify-between py-1">
                            <span className="text-sm">{name}</span>
                            <span className="text-sm font-medium">৳{amount.toLocaleString()}</span>
                          </div>
                        )
                      })}
                    <div className="border-t pt-2 flex justify-between font-bold">
                      <span>Total Liabilities</span>
                      <span>৳{balanceSheet.liabilities.toLocaleString()}</span>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-4">Equity</h3>
                    {accountsList
                      .filter(name => ACCOUNT_TYPES[name] === "equity")
                      .map(name => {
                        const balance = accountBalances.get(name)
                        const amount = balance ? balance.credit - balance.debit : 0
                        return (
                          <div key={name} className="flex justify-between py-1">
                            <span className="text-sm">{name}</span>
                            <span className="text-sm font-medium">৳{amount.toLocaleString()}</span>
                          </div>
                        )
                      })}
                    <div className="flex justify-between py-1">
                      <span className="text-sm">Retained Earnings</span>
                      <span className="text-sm font-medium">৳{balanceSheet.retained.toLocaleString()}</span>
                    </div>
                    <div className="border-t pt-2 flex justify-between font-bold">
                      <span>Total Equity</span>
                      <span>৳{balanceSheet.equity.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                
                {/* Balance Check */}
                <div className="border-t-2 pt-4">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Assets vs Liabilities + Equity</span>
                    <span className={Math.abs(balanceSheet.assets - (balanceSheet.liabilities + balanceSheet.equity)) < 0.01 ? "text-green-600" : "text-red-600"}>
                      {Math.abs(balanceSheet.assets - (balanceSheet.liabilities + balanceSheet.equity)) < 0.01 ? "Balanced" : "Unbalanced"}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Assets: ৳{balanceSheet.assets.toLocaleString()} | 
                    Liab + Equity: ৳{(balanceSheet.liabilities + balanceSheet.equity).toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}