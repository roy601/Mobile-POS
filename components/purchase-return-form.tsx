"use client"

import { useMemo, useState } from "react"
import { Save, X, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClient } from "@/utils/supabase/component"
import { useToast } from "@/hooks/use-toast"

const supabase = createClient()

type PurchaseItem = {
  barcode: string
  color: string | null
  quantity: number
  cost_price: number | null
  imei: string | null
}

type PurchaseHit = {
  purchase_id: number
  invoice_number?: string | null
  purchase_date: string
  supplier: string | null
  product_name: string | null
  model_number: string | null
  category: string | null
  brand: string | null
  total_cost: number | null
  items: PurchaseItem[] | null
}

export function PurchaseReturnForm() {
  const { toast } = useToast()

  // Supplier / invoice info
  const [supplier, setSupplier] = useState<string>("")
  const [purchaseInvoice, setPurchaseInvoice] = useState<string>("")

  // Product Information
  const [productName, setProductName] = useState<string>("")
  const [modelNumber, setModelNumber] = useState<string>("")
  const [color, setColor] = useState<string>("")
  const [quantity, setQuantity] = useState<number | null>(null)
  const [unitCost, setUnitCost] = useState<number | null>(null)

  // Return Details
  const [returnReason, setReturnReason] = useState<string>("")
  const [returnDate, setReturnDate] = useState<string>("")
  const [notes, setNotes] = useState<string>("")

  // Credit Information
  const [creditMethod, setCreditMethod] = useState<string>("")
  const [creditAmount, setCreditAmount] = useState<number | null>(null)

  const [submitting, setSubmitting] = useState(false)
  const [loadingInvoice, setLoadingInvoice] = useState(false)

  const totalAmount = useMemo<number | null>(() => {
    if (quantity == null || unitCost == null) return null
    const n = quantity * unitCost
    return Number.isFinite(n) ? Number(n.toFixed(2)) : null
  }, [quantity, unitCost])

  const mapReasonToCondition = (reason: string): string => {
    switch (reason) {
      case "defective-batch":
      case "quality-issues":
        return "defective"
      case "wrong-specifications":
        return "wrong_spec"
      case "damaged-shipment":
        return "damaged"
      case "overstock":
        return "overstock"
      default:
        return "defective"
    }
  }

  const loadFromInvoice = async () => {
    const term = purchaseInvoice.trim() || productName.trim()
    if (!term) {
      toast({ title: "Enter a search", description: "Provide a purchase invoice or product name.", variant: "destructive" })
      return
    }

    setLoadingInvoice(true)
    try {
      const { data, error } = await supabase.rpc("get_purchases_for_return", { search_term: term })
      if (error) throw error

      const purchases: PurchaseHit[] = Array.isArray(data) ? data : []
      if (purchases.length === 0) {
        toast({ title: "Not found", description: "No matching purchase.", variant: "destructive" })
        return
      }

      // prioritize exact invoice match, then latest
      let chosen =
        purchases.find((p) => (p.invoice_number || "").toUpperCase() === purchaseInvoice.trim().toUpperCase()) ||
        purchases.slice().sort((a, b) => +new Date(b.purchase_date) - +new Date(a.purchase_date))[0]

      const items = chosen.items || []
      if (items.length === 0) {
        toast({ title: "No items", description: "Matched purchase has no items.", variant: "destructive" })
        return
      }

      // Choose item by productName if typed
      const pn = productName.trim().toLowerCase()
      const target = pn ? (items.find((i) => (chosen.product_name || "").toLowerCase().includes(pn)) || items[0]) : items[0]

      // Autofill (do NOT set quantity)
      setSupplier(chosen.supplier || supplier)
      setProductName(chosen.product_name || productName)
      setModelNumber(chosen.model_number || modelNumber)
      setColor(target.color || color)
      setUnitCost(Number(chosen.total_cost ?? target.cost_price ?? unitCost ?? 0) || 0)

      toast({ title: "Loaded", description: `Purchase ${chosen.invoice_number || `#${chosen.purchase_id}`} loaded.` })
    } catch (e: any) {
      toast({ title: "Error", description: e?.message || "Failed to load purchase.", variant: "destructive" })
    } finally {
      setLoadingInvoice(false)
    }
  }

  

 function isFiniteNum(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v)
}

async function handleSubmit(e: React.FormEvent) {
  e.preventDefault()
  if (submitting) return

  // 1) Validate required fields + types
  const _supplier = (supplier || "").trim()
  const _productName = (productName || "").trim()
  const _returnReason = (returnReason || "").trim()
  const _creditMethod = (creditMethod || "").trim()
  const _qty = quantity
  const _unit = unitCost

  const missing: string[] = []
  if (!_supplier) missing.push("Supplier")
  if (!_productName) missing.push("Product Name")
  if (!isFiniteNum(_qty) || _qty <= 0) missing.push("Quantity")
  if (!isFiniteNum(_unit) || _unit < 0) missing.push("Unit Cost")
  if (!_returnReason) missing.push("Return Reason")
  if (!_creditMethod) missing.push("Credit Method")

  if (missing.length > 0) {
    toast({
      title: "Missing fields",
      description: `Please fill: ${missing.join(", ")}`,
      variant: "destructive",
    })
    return
  }

  setSubmitting(true)
  try {
    // 2) Find the original purchase (invoice preferred)
    const term = (purchaseInvoice || "").trim() || `${_productName} ${modelNumber || ""}`.trim()
    const { data: purchasesResp, error: purchasesErr } = await supabase.rpc("get_purchases_for_return", {
      search_term: term,
    })

    if (purchasesErr) {
      console.error("[get_purchases_for_return] error:", purchasesErr)
      toast({ title: "Error", description: purchasesErr.message ?? "Failed to load purchase.", variant: "destructive" })
      return
    }

    const purchases = Array.isArray(purchasesResp) ? purchasesResp : []
    if (purchases.length === 0) {
      toast({ title: "No matching purchase", description: "Could not find a purchase for this product.", variant: "destructive" })
      return
    }

    let chosen =
      purchases.find((p: any) => (p.invoice_number || "").toUpperCase() === (purchaseInvoice || "").trim().toUpperCase()) ||
      purchases.slice().sort((a: any, b: any) => +new Date(b.purchase_date) - +new Date(a.purchase_date))[0]

    const items: any[] = chosen.items || []
    if (items.length === 0) {
      toast({ title: "No items in purchase", description: "The matched purchase has no items.", variant: "destructive" })
      return
    }

    // For now pick the first item (you can refine selection logic as needed)
    const target = items[0]
    if (!target?.barcode) {
      toast({ title: "Error", description: "Matched purchase item has no barcode.", variant: "destructive" })
      return
    }

    // 3) Build payload EXACTLY matching the SQL signature (jsonb array, not a string)
    const payload = {
      p_original_purchase_id: Number(chosen.purchase_id), // ensure integer
      p_supplier: _supplier,
      p_return_reason: _returnReason.replace("-", "_"),
      p_credit_method: _creditMethod,
      p_return_items: [
        { barcode: String(target.barcode), quantity: _qty, condition: "defective" }
      ],
      p_notes: (notes || "").trim() || null,
    }

    // 4) Call RPC and log raw result
    const { data, error } = await supabase.rpc("process_purchase_return", payload)
    console.log("[process_purchase_return] payload:", payload)
    console.log("[process_purchase_return] data:", data)
    console.log("[process_purchase_return] error:", error)

    if (error) {
      toast({ title: "Error", description: error.message ?? "Failed to process purchase return.", variant: "destructive" })
      return
    }

    // Function returns { success, return_id, total_credit, message } on success
    if (!data?.success) {
      toast({ title: "Error", description: data?.message ?? "Server reported failure.", variant: "destructive" })
      return
    }

    // Optional: compare entered creditAmount to server total
    if (isFiniteNum(creditAmount) && isFiniteNum(Number(data.total_credit)) &&
        Math.abs(creditAmount - Number(data.total_credit)) > 0.009) {
      toast({
        title: "Credit differs",
        description: `Entered ৳${creditAmount.toFixed(2)} vs server ৳${Number(data.total_credit).toFixed(2)}. Using server value.`,
      })
    }

    toast({ title: "Return processed", description: `Purchase return #${data.return_id} processed.` })

    // 5) Reset form (keep supplier)
    setProductName(""); setModelNumber(""); setColor("")
    setQuantity(null); setUnitCost(null)
    setReturnReason(""); setReturnDate(""); setNotes("")
    setCreditMethod(""); setCreditAmount(null)
    setPurchaseInvoice("")
  } catch (err: any) {
    console.error("[handleSubmit] unexpected error:", err)
    toast({ title: "Error", description: err?.message ?? "Unexpected error.", variant: "destructive" })
  } finally {
    setSubmitting(false)
  }
}


  return (
    <form className="space-y-6 h-[calc(100vh-8rem)] overflow-y-auto pr-1" onSubmit={handleSubmit}>
      {/* Supplier Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Supplier Information</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="supplier">Supplier*</Label>
            <Select value={supplier} onValueChange={setSupplier}>
              <SelectTrigger><SelectValue placeholder="Select supplier" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="TechSupplies Inc.">TechSupplies Inc.</SelectItem>
                <SelectItem value="AccessoryWorld">AccessoryWorld</SelectItem>
                <SelectItem value="MobileParts Ltd.">MobileParts Ltd.</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="purchase-invoice">Invoice Number</Label>
            <div className="flex gap-2">
              <Input
                id="purchase-invoice"
                placeholder="8-char code"
                value={purchaseInvoice}
                onChange={(e) => setPurchaseInvoice(e.target.value)}
              />
              <Button type="button" variant="outline" onClick={loadFromInvoice} disabled={loadingInvoice}>
                <Search className="mr-2 h-4 w-4" />
                {loadingInvoice ? "Loading..." : "Load"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Product Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Product Information</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="product-name">Product Name*</Label>
            <Input id="product-name" required value={productName} onChange={(e) => setProductName(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="model">Model Number</Label>
            <Input id="model" value={modelNumber} onChange={(e) => setModelNumber(e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="color">Color</Label>
            <Input id="color" value={color} onChange={(e) => setColor(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="quantity">Quantity*</Label>
            <Input
              id="quantity"
              type="number"
              min={1}
              required
              value={quantity ?? ""}
              onChange={(e) => setQuantity(e.target.value === "" ? null : Number(e.target.value))}
            />
          </div>
          <div>
            <Label htmlFor="unit-cost">Unit Cost*</Label>
            <Input
              id="unit-cost"
              type="number"
              step="0.01"
              min={0}
              required
              value={unitCost ?? ""}
              onChange={(e) => setUnitCost(e.target.value === "" ? null : Number(e.target.value))}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="total-amount">Total Amount</Label>
          <Input id="total-amount" type="number" readOnly placeholder="৳0.00" value={totalAmount ?? ""} />
        </div>
      </div>

      {/* Return Details */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Return Details</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="return-reason">Return Reason*</Label>
            <Select value={returnReason} onValueChange={setReturnReason}>
              <SelectTrigger><SelectValue placeholder="Select reason" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="defective-batch">Defective Batch</SelectItem>
                <SelectItem value="wrong-specifications">Wrong Specifications</SelectItem>
                <SelectItem value="quality-issues">Quality Issues</SelectItem>
                <SelectItem value="damaged-shipment">Damaged in Shipment</SelectItem>
                <SelectItem value="overstock">Overstock</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="return-date">Return Date*</Label>
            <Input id="return-date" type="date" required value={returnDate} onChange={(e) => setReturnDate(e.target.value)} />
          </div>
        </div>

        <div>
          <Label htmlFor="notes">Notes</Label>
          <Textarea id="notes" className="h-20" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
      </div>

      {/* Credit Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Credit Information</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="credit-method">Credit Method*</Label>
            <Select value={creditMethod} onValueChange={setCreditMethod}>
              <SelectTrigger><SelectValue placeholder="Select credit method" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="account_credit">Account Credit</SelectItem>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                <SelectItem value="replacement">Replacement Products</SelectItem>
                <SelectItem value="check">Check</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="credit-amount">Credit Amount*</Label>
            <Input
              id="credit-amount"
              type="number"
              step="0.01"
              min={0}
              required
              value={creditAmount ?? ""}
              onChange={(e) => setCreditAmount(e.target.value === "" ? null : Number(e.target.value))}
            />
          </div>
        </div>
      </div>

      {/* Actions (sticky) */}
      <div className="flex justify-end gap-2 pt-4 sticky bottom-0 bg-white/80 backdrop-blur py-3">
        <Button type="button" variant="outline" disabled={submitting}><X className="mr-2 h-4 w-4" />Cancel</Button>
        <Button type="submit" className="bg-green-600 hover:bg-green-700" disabled={submitting}>
          <Save className="mr-2 h-4 w-4" />
          {submitting ? "Processing..." : "Process Return"}
        </Button>
      </div>
    </form>
  )
}
