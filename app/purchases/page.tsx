"use client"

import { useEffect, useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Download, Filter, Search, ShoppingBag, Plus } from "lucide-react"

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
import { createClient } from "@/utils/supabase/component"

type DBPurchase = {
  id: number
  product_name: string | null
  model_number: string | null
  category: string | null
  brand: string | null
  supplier: string | null
  cost_price: number | null
  sale_price: number | null
  description: string | null
  created_at: string // ISO
}

const supabase = createClient()

function formatBDT(n: number | null | undefined) {
  const val = typeof n === "number" ? n : 0
  return `৳${val.toLocaleString("en-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export default function PurchasesPage() {
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState("purchases")

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [purchases, setPurchases] = useState<DBPurchase[]>([])
  const [supplierFilter, setSupplierFilter] = useState<string>("all-suppliers")
  const [query, setQuery] = useState("")

  // Load purchases from Supabase
  useEffect(() => {
    const tab = searchParams.get("tab")
    if (tab === "add-product") setActiveTab("add-product")
  }, [searchParams])

  useEffect(() => {
    let isMounted = true
    ;(async () => {
      setLoading(true)
      setError(null)
      const { data, error } = await supabase
        .from("purchases")
        .select("*")
        .order("created_at", { ascending: false })

      if (!isMounted) return
      if (error) {
        setError(error.message)
        setPurchases([])
      } else {
        setPurchases((data ?? []) as DBPurchase[])
      }
      setLoading(false)
    })()
    return () => {
      isMounted = false
    }
  }, [])

  // Derived filters
  const suppliers = useMemo(() => {
    const set = new Set(
      purchases
        .map(p => (p.supplier ?? "").trim())
        .filter(Boolean)
    )
    return ["All Suppliers", ...Array.from(set)]
  }, [purchases])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return purchases.filter(p => {
      const supplierOk = supplierFilter === "all-suppliers" || (p.supplier ?? "") === supplierFilter
      const text =
        `${p.product_name ?? ""} ${p.model_number ?? ""} ${p.brand ?? ""} ${p.category ?? ""} ${p.supplier ?? ""}`.toLowerCase()
      const queryOk = !q || text.includes(q)
      return supplierOk && queryOk
    })
  }, [purchases, supplierFilter, query])

  // KPI cards
  const { totalCount, monthCount, monthValue, distinctSuppliers } = useMemo(() => {
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    let countThisMonth = 0
    let valueThisMonth = 0
    const supSet = new Set<string>()

    for (const p of purchases) {
      const dt = new Date(p.created_at)
      if (dt >= monthStart) {
        countThisMonth++
        // Prefer sale_price if present, else cost_price
        valueThisMonth += (p.sale_price ?? p.cost_price ?? 0)
      }
      if (p.supplier) supSet.add(p.supplier)
    }

    return {
      totalCount: purchases.length,
      monthCount: countThisMonth,
      monthValue: valueThisMonth,
      distinctSuppliers: supSet.size,
    }
  }, [purchases])

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
          <Button onClick={() => setActiveTab("add-product")} className="bg-green-600 hover:bg-green-700">
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Purchases</CardTitle>
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? "…" : totalCount}</div>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Month</CardTitle>
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? "…" : monthCount}</div>
              <p className="text-xs text-muted-foreground">
                {loading ? "…" : `${formatBDT(monthValue)} total value`}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Suppliers</CardTitle>
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? "…" : distinctSuppliers}</div>
              <p className="text-xs text-muted-foreground">Active suppliers</p>
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
                  <Input
                    placeholder="Search purchases..."
                    className="pl-8 w-[200px] lg:w-[300px]"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </div>

                <Button variant="outline" size="icon" disabled>
                  <Filter className="h-4 w-4" />
                </Button>

                <Button variant="outline" size="icon" disabled>
                  <Download className="h-4 w-4" />
                </Button>

                <Select
                  value={supplierFilter}
                  onValueChange={(v) => setSupplierFilter(v)}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Select Supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all-suppliers">All Suppliers</SelectItem>
                    {suppliers
                      .filter((s) => s !== "All Suppliers")
                      .map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Card>
              <CardContent className="p-0">
                {error ? (
                  <div className="p-6 text-sm text-red-600">Failed to load purchases: {error}</div>
                ) : (
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
                      {loading ? (
                        <TableRow>
                          <TableCell colSpan={8} className="p-6 text-sm text-muted-foreground">
                            Loading purchases…
                          </TableCell>
                        </TableRow>
                      ) : filtered.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="p-6 text-sm text-muted-foreground">
                            No purchases found.
                          </TableCell>
                        </TableRow>
                      ) : (
                        filtered.map((p) => {
                          const total = p.sale_price ?? p.cost_price ?? 0
                          return (
                            <TableRow key={p.id}>
                              <TableCell className="font-medium">{`PO-${String(p.id).padStart(4, "0")}`}</TableCell>
                              <TableCell>{p.supplier ?? "—"}</TableCell>
                              <TableCell>{new Date(p.created_at).toLocaleDateString()}</TableCell>
                              <TableCell>—</TableCell>
                              <TableCell>{formatBDT(total)}</TableCell>
                              <TableCell>
                                <Badge variant="secondary">N/A</Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">Received</Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <Button variant="ghost" size="icon" title="View">
                                  <Search className="h-4 w-4" />
                                  <span className="sr-only">View</span>
                                </Button>
                              </TableCell>
                            </TableRow>
                          )
                        })
                      )}
                    </TableBody>
                  </Table>
                )}
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
