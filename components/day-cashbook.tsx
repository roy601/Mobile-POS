// components/day-cashbook.tsx
"use client"

import { useEffect, useState } from "react"
import { DollarSign, TrendingUp, TrendingDown, Banknote } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/utils/supabase/component"

interface DayCashbookProps {
  selectedDate?: string // "YYYY-MM-DD"
}

type CashbookJSON = {
  date: string
  openingBalance: number
  closingBalance: number
  totalReceipts: number
  totalPayments: number
  netCashFlow: number
  byMethod: { cash: number; card: number; mobileBanking: number; bankTransfer: number }
  transactions: { time: string; description: string; type: "receipt" | "payment"; amount: number; reference: string }[]
}

const supabase = createClient()

export function DayCashbook({ selectedDate }: DayCashbookProps) {
  const [data, setData] = useState<CashbookJSON | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    async function load() {
      if (!selectedDate) return
      setLoading(true)
      setError(null)

      const { data, error } = await supabase.rpc("analytics_day_cashbook", { p_date: selectedDate })
      if (!mounted) return

      if (error) {
        setError(error.message)
        setData(null)
      } else {
        setData(data as CashbookJSON)
      }
      setLoading(false)
    }
    load()
    return () => { mounted = false }
  }, [selectedDate])

  const fmt = (n?: number) => `৳${Number(n ?? 0).toLocaleString()}`
  const netPositive = (data?.netCashFlow ?? 0) >= 0

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
            <div className="text-2xl font-bold">
              {loading ? "…" : fmt(data?.openingBalance)}
            </div>
            <p className="text-xs text-muted-foreground">Start of day</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Receipts</CardTitle>
            <TrendingUp className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {loading ? "…" : fmt(data?.totalReceipts)}
            </div>
            <p className="text-xs text-muted-foreground">Money received</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Payments</CardTitle>
            <TrendingDown className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {loading ? "…" : fmt(data?.totalPayments)}
            </div>
            <p className="text-xs text-muted-foreground">Money paid out</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Closing Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "…" : fmt(data?.closingBalance)}
            </div>
            <p className="text-xs text-muted-foreground">End of day</p>
          </CardContent>
        </Card>
      </div>

      {/* Net Cash Flow */}
      <Card>
        <CardHeader>
          <CardTitle>Net Cash Flow</CardTitle>
          <CardDescription>Overall cash movement for the day</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Net Change</p>
              <p className={`text-2xl font-bold ${netPositive ? "text-green-600" : "text-red-600"}`}>
                {loading ? "…" : `${netPositive ? "+" : ""}${fmt(data?.netCashFlow)}`}
              </p>
            </div>
            <div className="text-right space-y-1 text-sm">
              <p className="text-muted-foreground">By Method</p>
              <p>{loading ? "…" : `Cash ${fmt(data?.byMethod.cash)} · Card ${fmt(data?.byMethod.card)}`}</p>
              <p>{loading ? "…" : `Mobile ${fmt(data?.byMethod.mobileBanking)} · Bank ${fmt(data?.byMethod.bankTransfer)}`}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transaction Details */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction Details</CardTitle>
          <CardDescription>All cash movements for the day</CardDescription>
        </CardHeader>
        <CardContent>
          {error && <div className="text-sm text-red-600">Failed to load: {error}</div>}
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
              {loading ? (
                <TableRow><TableCell colSpan={5}>Loading…</TableCell></TableRow>
              ) : (data?.transactions ?? []).length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-muted-foreground">No transactions.</TableCell></TableRow>
              ) : (
                data!.transactions.map((t, i) => (
                  <TableRow key={i}>
                    <TableCell>{t.time}</TableCell>
                    <TableCell className="font-mono text-xs">{t.reference}</TableCell>
                    <TableCell>{t.description}</TableCell>
                    <TableCell>
                      <Badge variant={t.type === "receipt" ? "outline" : "secondary"}>
                        {t.type}
                      </Badge>
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
