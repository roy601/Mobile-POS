"use client"

import { useMemo, useState } from "react"
import { Save, X, Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/utils/supabase/component"

type SaleItem = {
  id: number
  barcode: string | null
  product_name: string
  model_number: string | null
  color: string | null
  quantity: number
  unit_price: number
  total_price: number
}

type SaleHit = {
  sale_id: number
  invoice_number?: string | null
  sale_date: string
  total_amount: number | null
  customer_name?: string | null
  customer_phone?: string | null
  items: SaleItem[] | null
}

const supabase = createClient()

export function SalesReturnForm() {
  const { toast } = useToast()

  // voucher load state
  const [invoice, setInvoice] = useState("")
  const [loading, setLoading] = useState(false)

  // loaded sale & item
  const [sale, setSale] = useState<SaleHit | null>(null)
  const [selectedItem, setSelectedItem] = useState<SaleItem | null>(null)
  const [customerId, setCustomerId] = useState<number | null>(null)

  // form fields
  const [customerName, setCustomerName] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")
  const [productName, setProductName] = useState("")
  const [modelNumber, setModelNumber] = useState("")
  const [color, setColor] = useState("")
  const [quantity, setQuantity] = useState<number>(1)
  const [unitPrice, setUnitPrice] = useState<number>(0)
  const [reason, setReason] = useState("")
  const [returnDate, setReturnDate] = useState<string>("")
  const [notes, setNotes] = useState("")
  const [refundMethod, setRefundMethod] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const totalAmount = useMemo(() => Number((quantity * unitPrice || 0).toFixed(2)), [quantity, unitPrice])

  async function loadModelFromInventory(barcode: string) {
    // fallback lookup for legacy sold_products rows missing model_number
    const { data, error } = await supabase
      .from("inventory")
      .select("model_number")
      .eq("barcode", barcode)
      .limit(1)
      .maybeSingle()

    if (!error && data?.model_number) {
      setModelNumber(data.model_number)
    }
  }

  async function loadByInvoice() {
    const term = invoice.trim()
    if (!term) {
      toast({ title: "Enter voucher", description: "Please type a voucher/invoice number.", variant: "destructive" })
      return
    }

    setLoading(true)
    try {
      const { data, error } = await supabase.rpc("get_sales_for_return", { search_term: term })
      if (error) throw error

      const list: SaleHit[] = Array.isArray(data) ? data : []
      if (list.length === 0) {
        toast({ title: "Not found", description: "No matching sale for that voucher.", variant: "destructive" })
        return
      }

      const hit =
        list.find((s) => (s.invoice_number || "").toUpperCase() === term.toUpperCase()) ||
        list.sort((a, b) => +new Date(b.sale_date) - +new Date(a.sale_date))[0]

      // customer info
      const cname = hit.customer_name || ""
      const cphone = hit.customer_phone || ""
      setCustomerName(cname)
      setCustomerPhone(cphone)

      if (cphone) {
        const { data: found } = await supabase
          .from("customers")
          .select("id")
          .eq("phone_number", cphone)
          .limit(1)
          .maybeSingle()
        setCustomerId(found?.id ?? null)
      } else {
        setCustomerId(null)
      }

      // choose first item
      const first = hit.items?.[0] ?? null
      setSelectedItem(first || null)

      setProductName(first?.product_name || "")
      setModelNumber(first?.model_number || "")
      setColor(first?.color || "")
      setUnitPrice(first?.unit_price || 0)
      setQuantity(1)

      // 🔁 If model_number is missing but barcode exists, fetch it from inventory
      if (!first?.model_number && first?.barcode) {
        await loadModelFromInventory(first.barcode)
      }

      setSale(hit)
      toast({ title: "Loaded", description: `Loaded sale ${hit.invoice_number || `#${hit.sale_id}`}.` })
    } catch (e: any) {
      toast({ title: "Error", description: e?.message || "Failed to load voucher.", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  async function processReturn(e: React.FormEvent) {
    e.preventDefault()
    if (submitting) return

    if (!sale) {
      toast({ title: "No sale loaded", description: "Load a voucher first.", variant: "destructive" })
      return
    }
    if (!selectedItem) {
      toast({ title: "Select item", description: "No sold product selected.", variant: "destructive" })
      return
    }
    if (!reason || !refundMethod) {
      toast({ title: "Missing fields", description: "Return reason and refund method are required.", variant: "destructive" })
      return
    }
    if (quantity <= 0) {
      toast({ title: "Invalid quantity", description: "Quantity must be at least 1.", variant: "destructive" })
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        p_original_sale_id: sale.sale_id,
        p_return_reason: reason,
        p_refund_method: refundMethod,
        p_return_items: [
          {
            sold_product_id: selectedItem.id,
            quantity,
            condition: "good",
            restock: true,
          },
        ],
        p_customer_id: customerId,
        p_notes: notes || null,
      }

      const { data, error } = await supabase.rpc("process_sales_return", payload)
      if (error) throw error

      if (!data?.success) {
        toast({ title: "Error", description: data?.message || "Return failed.", variant: "destructive" })
        return
      }

      toast({
        title: "Return processed",
        description: `Refund ৳${Number(data.total_refund).toFixed(2)} • Return #${data.return_id}`,
      })

      // keep voucher loaded; clear mutable fields
      setQuantity(1)
      setReason("")
      setRefundMethod("")
      setNotes("")
    } catch (err: any) {
      toast({ title: "Error", description: err?.message ?? "Unexpected error.", variant: "destructive" })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form className="space-y-6 h-[calc(100vh-8rem)] overflow-y-auto pr-1" onSubmit={processReturn}>
      {/* Customer Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Customer Information</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <Label htmlFor="voucher">Voucher / Invoice #</Label>
            <div className="flex gap-2">
              <Input
                id="voucher"
                placeholder="Enter voucher/invoice"
                value={invoice}
                onChange={(e) => setInvoice(e.target.value)}
              />
              <Button type="button" variant="outline" onClick={loadByInvoice} disabled={loading}>
                <Search className="mr-2 h-4 w-4" />
                {loading ? "Loading..." : "Load"}
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="customer-name">Customer Name*</Label>
            <Input
              id="customer-name"
              placeholder="Auto-filled from voucher"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="customer-phone">Phone Number</Label>
            <Input
              id="customer-phone"
              placeholder="Auto-filled from voucher"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Product Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Product Information</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="product-name">Product Name*</Label>
            <Input
              id="product-name"
              placeholder="Auto-filled from voucher"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="model">Model Number</Label>
            <Input
              id="model"
              placeholder="Auto-filled from voucher"
              value={modelNumber}
              onChange={(e) => setModelNumber(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="quantity">Quantity*</Label>
            <Input
              id="quantity"
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
              required
            />
          </div>
          <div>
            <Label htmlFor="unit-price">Unit Price*</Label>
            <Input
              id="unit-price"
              type="number"
              value={unitPrice}
              onChange={(e) => setUnitPrice(Number(e.target.value) || 0)}
              required
            />
          </div>
          <div>
            <Label htmlFor="total-amount">Total Amount</Label>
            <Input id="total-amount" type="number" value={totalAmount} readOnly />
          </div>
        </div>
      </div>

      {/* Return Details */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Return Details</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="return-reason">Return Reason*</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger>
                <SelectValue placeholder="Select reason" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="defective">Defective Product</SelectItem>
                <SelectItem value="wrong_item">Wrong Item</SelectItem>
                <SelectItem value="not_satisfied">Customer Not Satisfied</SelectItem>
                <SelectItem value="damaged">Damaged in Transit</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="return-date">Return Date*</Label>
            <Input
              id="return-date"
              type="date"
              value={returnDate}
              onChange={(e) => setReturnDate(e.target.value)}
              required
            />
          </div>
        </div>

        <div>
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            placeholder="Additional notes about the return"
            className="h-20"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
      </div>

      {/* Refund Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Refund Information</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="refund-method">Refund Method*</Label>
            <Select value={refundMethod} onValueChange={setRefundMethod}>
              <SelectTrigger>
                <SelectValue placeholder="Select refund method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="card">Credit/Debit Card</SelectItem>
                <SelectItem value="mobile_banking">Mobile Banking</SelectItem>
                <SelectItem value="store_credit">Store Credit</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="refund-amount">Refund Amount*</Label>
            <Input id="refund-amount" type="number" value={totalAmount} readOnly />
          </div>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-2 pt-4 sticky bottom-0 bg-white/80 backdrop-blur">
        <Button type="button" variant="outline">
          <X className="mr-2 h-4 w-4" />
          Cancel
        </Button>
        <Button type="submit" className="bg-green-600 hover:bg-green-700" disabled={submitting}>
          <Save className="mr-2 h-4 w-4" />
          {submitting ? "Processing..." : "Process Return"}
        </Button>
      </div>
    </form>
  )
}
