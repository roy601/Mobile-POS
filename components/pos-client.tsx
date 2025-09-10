"use client"

import { useState } from "react"
import { Calculator, CreditCard, Receipt, QrCode, User, Trash2, Plus, Minus, RotateCcw } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { POSCalculator } from "@/components/pos-calculator"
import { CustomerSearch } from "@/components/customer-search"
import { ProductScanner } from "@/components/product-scanner"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/utils/supabase/component"

type CartItem = {
  id: string
  name: string
  model: string
  color: string
  quantity: number
  price: number
  discount: number
  barcode: string
  cost_price?: number
}

type Customer = {
  id?: number
  name: string
  phone: string
  email: string
  dues: number
}

type ProductResponse = {
  success: boolean
  barcode?: string
  name?: string
  model?: string
  color?: string
  price?: number
  available_quantity?: number
  category?: string
  brand?: string
  message?: string
}

type BankAccount = {
  id: string
  bankName: string
  accountName: string
  accountNumber: string
  accountType: string
  balance: number
  currency: string
  status: "active" | "inactive"
  branch: string
  swiftCode?: string
  routingNumber?: string
}

export function POSClient() {
  const supabase = createClient()
  const { toast } = useToast()

  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [currentSaleId, setCurrentSaleId] = useState<number | null>(null)
  const [invoiceNumber, setInvoiceNumber] = useState<string | null>(null)

  const [productForm, setProductForm] = useState({
    barcode: "",
    name: "",
    model: "",
    color: "",
    quantity: 1,
    price: 0,
    discount: 0,
  })
  
  const [paymentForm, setPaymentForm] = useState({
    method: "",
    cashReceived: 0,
    cardReceived: 0,
    bkashReceived: 0,
    nagadReceived: 0,
    rocketReceived: 0,
    upayReceived: 0,
    bankTransferReceived: 0,
    due: 0,
    cardBank: "",
    bankTransferBank: "",
    mobileBankingMethod: ""
  })

  const [showCalculator, setShowCalculator] = useState(false)
  const [showCustomerSearch, setShowCustomerSearch] = useState(false)
  const [showScanner, setShowScanner] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Sample bank accounts - in a real app, these would come from a database
  const [bankAccounts] = useState<BankAccount[]>([
    {
      id: "BANK-001",
      bankName: "Dutch-Bangla Bank Limited",
      accountName: "Mobile Shop Business Account",
      accountNumber: "1234567890123",
      accountType: "Current Account",
      balance: 250000,
      currency: "BDT",
      status: "active",
      branch: "Dhanmondi Branch",
      swiftCode: "DBBLBDDHXXX",
      routingNumber: "090261234",
    },
    {
      id: "BANK-002",
      bankName: "Islami Bank Bangladesh Limited",
      accountName: "Mobile Shop Savings",
      accountNumber: "2345678901234",
      accountType: "Savings Account",
      balance: 150000,
      currency: "BDT",
      status: "active",
      branch: "Gulshan Branch",
      swiftCode: "IBBLBDDHXXX",
      routingNumber: "125261234",
    },
    {
      id: "BANK-003",
      bankName: "BRAC Bank Limited",
      accountName: "Business Account",
      accountNumber: "3456789012345",
      accountType: "Current Account",
      balance: 180000,
      currency: "BDT",
      status: "active",
      branch: "Banani Branch",
      swiftCode: "BRAKBDDHXXX",
      routingNumber: "060261234",
    },
  ])

  const saleStarted = currentSaleId != null

  // Totals with improved due logic
  const subtotal = cartItems.reduce((sum, item) => sum + item.quantity * item.price, 0)
  const totalDiscount = cartItems.reduce((sum, item) => sum + (item.quantity * item.discount), 0)
  const netAmount = subtotal - totalDiscount
  const previousDues = customer?.dues || 0
  const total = netAmount + previousDues
  
  const totalReceived =
    paymentForm.cashReceived +
    paymentForm.cardReceived +
    paymentForm.bkashReceived +
    paymentForm.nagadReceived +
    paymentForm.rocketReceived +
    paymentForm.upayReceived +
    paymentForm.bankTransferReceived;
  
  // Updated due calculation logic
  const totalPaid = totalReceived + paymentForm.due
  const change = totalPaid > total ? totalPaid - total : 0
  const remainingDue = Math.max(0, total - totalReceived)
  const newDuesForCustomer = remainingDue > 0 ? remainingDue : 0

  // Check if payment method requires bank selection
  const requiresBankSelection = () => {
    return paymentForm.method === "card" || paymentForm.method === "bank-transfer"
  }

  // Check if payment method should show amount input immediately
  const showsAmountImmediately = () => {
    return ["cash", "mobile-banking"].includes(paymentForm.method)
  }

  // Handle payment method change
  const handlePaymentMethodChange = (method: string) => {
    setPaymentForm({
      ...paymentForm,
      method,
      cashReceived: 0,
      cardReceived: 0,
      bkashReceived: 0,
      nagadReceived: 0,
      rocketReceived: 0,
      upayReceived: 0,
      bankTransferReceived: 0,
      due: 0,
      cardBank: "",
      bankTransferBank: "",
      mobileBankingMethod: ""
    })
  }

  // Handle payment amount changes with auto-calculation
  const handlePaymentChange = (field: keyof typeof paymentForm, value: number | string) => {
    const updatedPayment = { ...paymentForm, [field]: value }
    
    // For number fields, recalculate due amount
    if (typeof value === 'number') {
      const newTotalReceived = 
        (field === 'cashReceived' ? value : updatedPayment.cashReceived) +
        (field === 'cardReceived' ? value : updatedPayment.cardReceived) +
        (field === 'bkashReceived' ? value : updatedPayment.bkashReceived) +
        (field === 'nagadReceived' ? value : updatedPayment.nagadReceived) +
        (field === 'rocketReceived' ? value : updatedPayment.rocketReceived) +
        (field === 'upayReceived' ? value : updatedPayment.upayReceived) +
        (field === 'bankTransferReceived' ? value : updatedPayment.bankTransferReceived)
      
      const autoCalculatedDue = Math.max(0, total - newTotalReceived)
      
      setPaymentForm({
        ...updatedPayment,
        due: field === 'due' ? value : autoCalculatedDue
      })
    } else {
      setPaymentForm(updatedPayment)
    }
  }

  // ---- Supabase helpers

  const startSaleForCustomer = async (cust: { id: number; name: string; phone?: string; email?: string }) => {
    const { data, error } = await supabase.rpc("start_sale", {
      p_customer_id: cust.id,
      p_customer_name: cust.name,
      p_customer_phone: cust.phone || null,
      p_customer_email: cust.email || null,
    })
    if (error) throw new Error(error.message || "start_sale failed")

    const saleId = (data?.sale_id as number) || null
    const inv = (data?.invoice_number as string) || (saleId ? `INV-${String(saleId).padStart(6, "0")}` : null)
    if (!saleId) throw new Error("start_sale returned no sale_id")

    setCurrentSaleId(saleId)
    setInvoiceNumber(inv)
    return { saleId, invoiceNumber: inv }
  }

  const getProductByBarcode = async (barcode: string): Promise<ProductResponse> => {
    try {
      const { data, error } = await supabase.rpc("get_product_by_barcode", { p_barcode: barcode })
      if (error) throw error
      return data as ProductResponse
    } catch (error) {
      console.error("Error fetching product:", error)
      return { success: false, message: "Failed to fetch product from database" }
    }
  }

  // ---- Update customer dues
  const updateCustomerDues = async (customerId: number, newDuesAmount: number) => {
    try {
      const { error } = await supabase
        .from("customers")
        .update({ dues: newDuesAmount })
        .eq("id", customerId)
      
      if (error) throw error
      
      // Update local customer state
      if (customer && customer.id === customerId) {
        setCustomer({ ...customer, dues: newDuesAmount })
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Failed to update customer dues"
      throw new Error(errorMsg)
    }
  }

  // ---- Printable receipt

  const openPrintableReceipt = async (saleId: number) => {
    const [{ data: sale }, { data: cust }, { data: items }] = await Promise.all([
      supabase.from("sales").select("*").eq("id", saleId).single(),
      supabase.from("sale_customers").select("*").eq("sales_id", saleId).single(),
      supabase.from("sold_products").select("*").eq("sales_id", saleId),
    ])

    const inv = sale?.invoice_number || `INV-${String(saleId).padStart(6, "0")}`
    const dateStr = new Date(sale?.sale_date || sale?.created_at || Date.now()).toLocaleString()

    const rows =
      (items || [])
        .map(
          (it: any) => `
        <tr>
          <td>${it.product_name || ""}</td>
          <td>${it.color || ""}</td>
          <td style="text-align:right">${it.quantity}</td>
          <td style="text-align:right">৳${Number(it.unit_price).toFixed(2)}</td>
          <td style="text-align:right">৳${Number(it.total_price).toFixed(2)}</td>
        </tr>`
        )
        .join("") || ""

    const html = `
<!doctype html><html><head><meta charset="utf-8" />
<title>${inv}</title>
<style>
  body { font-family: -apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif; padding:16px; }
  h2 { margin: 0 0 8px; }
  .muted { color:#666; }
  table { width:100%; border-collapse:collapse; margin-top:12px; }
  th, td { border-bottom:1px solid #ddd; padding:8px; font-size:12px; }
  th { text-align:left; background:#f7f7f7; }
  .totals { margin-top:12px; float:right; width:320px; }
  .totals div { display:flex; justify-content:space-between; padding:6px 0; }
  @media print { button { display:none; } }
</style>
</head><body>
  <div>
    <h2>Receipt</h2>
    <div class="muted">${dateStr}</div>
    <div><strong>Invoice:</strong> ${inv}</div>
    <div><strong>Customer:</strong> ${cust?.customer_name || ""} ${cust?.customer_phone ? `(${cust.customer_phone})` : ""}</div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Product</th><th>Color</th><th style="text-align:right">Qty</th>
        <th style="text-align:right">Unit</th><th style="text-align:right">Total</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>

  <div class="totals">
    <div><span>Subtotal</span><span>৳${Number(sale?.subtotal || 0).toFixed(2)}</span></div>
    <div><span>Discount</span><span>-৳${Number(sale?.total_discount || 0).toFixed(2)}</span></div>
    ${sale?.previous_dues > 0 ? `<div><span>Previous Dues</span><span>৳${Number(sale?.previous_dues || 0).toFixed(2)}</span></div>` : ''}
    <div style="font-weight:bold;"><span>Grand Total</span><span>৳${Number(sale?.total_amount || 0).toFixed(2)}</span></div>
    <div><span>Received</span><span>৳${Number(sale?.total_received || 0).toFixed(2)}</span></div>
    ${sale?.due_amount > 0 ? `<div style="color:red;"><span>Remaining Due</span><span>৳${Number(sale?.due_amount || 0).toFixed(2)}</span></div>` : ''}
    ${sale?.change_amount > 0 ? `<div><span>Change</span><span>৳${Number(sale?.change_amount || 0).toFixed(2)}</span></div>` : ''}
  </div>

  <div style="clear:both; margin-top:24px;">
    <button onclick="window.print()">Print</button>
  </div>
</body></html>
`
    const w = window.open("", "_blank", "width=720,height=960")
    if (!w) return
    w.document.open()
    w.document.write(html)
    w.document.close()
    // w.onload = () => w.print() // uncomment to auto-print
  }

  // ---- Barcode behavior

  // typing only (no fetch)
  const handleBarcodeInput = (value: string) => {
    setProductForm((f) => ({ ...f, barcode: value }))
  }

  // lookup on click / scanner confirm
  const lookupByBarcode = async (rawBarcode: string) => {
    const barcode = rawBarcode.trim()
    if (!barcode) return

    if (!saleStarted) {
      toast({
        title: "Select customer first",
        description: "Save/select a customer to start a sale before loading products.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const res = await getProductByBarcode(barcode)
      if (res.success && res.name) {
        setProductForm((prev) => ({
          ...prev,
          barcode: res.barcode ?? barcode,
          name: res.name ?? prev.name,
          model: res.model ?? prev.model,
          color: res.color ?? prev.color,
          price: res.price ?? prev.price,
          // quantity remains prev.quantity
        }))
        toast({ title: "Product Loaded", description: `${res.name}${res.color ? ` - ${res.color}` : ""}` })
      } else {
        toast({
          title: "Not Found",
          description: res.message || "Barcode not found in inventory.",
          variant: "destructive",
        })
      }
    } catch {
      toast({ title: "Error", description: "Lookup failed", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  // ---- Cart / sale

  const processSaleItem = async (item: CartItem) => {
    if (!currentSaleId) {
      toast({ title: "Error", description: "No active sale session", variant: "destructive" })
      return false
    }
    try {
      const { data, error } = await supabase.rpc("process_sale_item", {
        p_barcode: item.barcode,
        p_quantity: item.quantity,
        p_sales_id: currentSaleId,
      })
      if (error) throw error
      if (!data.success) {
        toast({ title: "Error", description: data.message || "Failed to process item", variant: "destructive" })
        return false
      }
      return true
    } catch (error) {
      console.error("Error processing sale item:", error)
      toast({ title: "Error", description: "Failed to process sale item", variant: "destructive" })
      return false
    }
  }

  const addToCart = async () => {
    if (!customer) {
      toast({
        title: "Select customer first",
        description: "Save/select a customer before adding items.",
        variant: "destructive",
      })
      return
    }
    // Lazy-start sale if needed
    if (!saleStarted) {
      try {
        const { saleId, invoiceNumber: inv } = await startSaleForCustomer(customer as Required<Customer>)
        toast({ title: "Sale Started", description: `Sale #${saleId}${inv ? ` • ${inv}` : ""}` })
      } catch (e: any) {
        toast({ title: "Couldn't start sale", description: e?.message ?? "start_sale failed", variant: "destructive" })
        return
      }
    }

    if (!productForm.name || productForm.price <= 0) {
      toast({ title: "Error", description: "Please enter product name and price", variant: "destructive" })
      return
    }

    // Optional stock check (for barcoded items)
    if (productForm.barcode.trim().length > 0) {
      const productResponse = await getProductByBarcode(productForm.barcode.trim())
      if (productResponse.success && productResponse.available_quantity !== undefined) {
        if (productResponse.available_quantity < productForm.quantity) {
          toast({
            title: "Insufficient Stock",
            description: `Only ${productResponse.available_quantity} units available in inventory`,
            variant: "destructive",
          })
          return
        }
      }
    }

    const newItem: CartItem = {
      id: Date.now().toString(),
      name: productForm.name,
      model: productForm.model,
      color: productForm.color,
      quantity: productForm.quantity,
      price: productForm.price,
      discount: productForm.discount,
      barcode: productForm.barcode.trim(),
    }

    setCartItems((prev) => [...prev, newItem])
    setProductForm((prev) => ({ ...prev, barcode: "", name: "", model: "", color: "", price: 0, discount: 0 }))
    toast({ title: "Product Added", description: `${newItem.name} added to cart` })
  }

  const removeFromCart = (id: string) => setCartItems((prev) => prev.filter((item) => item.id !== id))

  const updateQuantity = (id: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(id)
      return
    }
    setCartItems((prev) => prev.map((item) => (item.id === id ? { ...item, quantity: newQuantity } : item)))
  }

  const clearCart = () => {
    setCartItems([])
    setPaymentForm({ 
      method: "", 
      cashReceived: 0, 
      cardReceived: 0, 
      bkashReceived: 0,
      nagadReceived: 0,
      rocketReceived: 0,
      upayReceived: 0,
      bankTransferReceived: 0, 
      due: 0,
      cardBank: "",
      bankTransferBank: "",
      mobileBankingMethod: ""
    })
  }

  const newSale = async () => {
    clearCart()
    setProductForm({ barcode: "", name: "", model: "", color: "", quantity: 1, price: 0, discount: 0 })
    setCustomer(null)
    setCurrentSaleId(null)
    setInvoiceNumber(null)
    toast({ title: "New Sale", description: "Select or save a customer to begin." })
  }

  const completeSale = async () => {
    if (!saleStarted || cartItems.length === 0) return
    
    // Validation: ensure payment is sufficient or due is acknowledged
    if (totalReceived < total && remainingDue === 0) {
      toast({
        title: "Insufficient Payment",
        description: `Payment received (৳${totalReceived.toFixed(2)}) is less than total (৳${total.toFixed(2)}). Please add remaining amount to due or increase payment.`,
        variant: "destructive",
      })
      return
    }

    // Validation for card/bank transfer methods
    if ((paymentForm.method === "card" || paymentForm.method === "bank-transfer") && 
        !paymentForm.cardBank && !paymentForm.bankTransferBank) {
      toast({
        title: "Bank Selection Required",
        description: "Please select a bank for card or bank transfer payment.",
        variant: "destructive",
      })
      return
    }

    // Validation for mobile banking method
    if (paymentForm.method === "mobile-banking" && !paymentForm.mobileBankingMethod) {
      toast({
        title: "Mobile Banking Method Required",
        description: "Please select a mobile banking method.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      // Process each cart item
      let allProcessed = true
      for (const item of cartItems) {
        if (item.barcode) {
          const ok = await processSaleItem(item)
          if (!ok) {
            allProcessed = false
            break
          }
        } else {
          const { error } = await supabase.from("sold_products").insert({
            sales_id: currentSaleId,
            barcode: item.barcode || null,
            product_name: item.name,
            color: item.color,
            quantity: item.quantity,
            unit_price: item.price,
            discount_percentage: item.discount,
            discount_amount: (item.quantity * item.price * item.discount) / 100,
            total_price: item.quantity * item.price - (item.quantity * item.price * item.discount) / 100,
          })
          if (error) {
            console.error("Error adding sold product:", error)
            allProcessed = false
            break
          }
        }
      }
      if (!allProcessed) {
        toast({ title: "Error", description: "Some items could not be processed", variant: "destructive" })
        return
      }

      // Determine the final payment method for the database
      let finalPaymentMethod = paymentForm.method;
      if (paymentForm.method === "mobile-banking") {
        finalPaymentMethod = paymentForm.mobileBankingMethod;
      }

      // Update sale totals and status with improved due handling
      const { error: saleError } = await supabase
        .from("sales")
        .update({
          subtotal,
          total_discount: totalDiscount,
          previous_dues: previousDues,
          net_amount: netAmount,
          total_amount: total,
          cash_received: paymentForm.cashReceived,
          card_received: paymentForm.cardReceived,
          bkash_received: paymentForm.bkashReceived,
          nagad_received: paymentForm.nagadReceived,
          rocket_received: paymentForm.rocketReceived,
          upay_received: paymentForm.upayReceived,
          bank_transfer_received: paymentForm.bankTransferReceived,
          total_received: totalReceived,
          due_amount: remainingDue,
          change_amount: change,
          payment_method: finalPaymentMethod,
          card_bank: paymentForm.cardBank,
          bank_transfer_bank: paymentForm.bankTransferBank,
          status: "completed",
        })
        .eq("id", currentSaleId)
      if (saleError) throw saleError

      // Update customer dues if there's remaining due or previous dues were cleared
      if (customer?.id) {
        await updateCustomerDues(customer.id, newDuesForCustomer)
      }

      // Ensure invoice number is present
      let inv = invoiceNumber
      if (!inv && currentSaleId) {
        const { data: sRow } = await supabase
          .from("sales")
          .select("invoice_number")
          .eq("id", currentSaleId)
          .single()
        inv = sRow?.invoice_number || `INV-${String(currentSaleId).padStart(6, "0")}`
        setInvoiceNumber(inv)
      }

      const completionMessage = remainingDue > 0 
        ? `Sale completed with ৳${remainingDue.toFixed(2)} due remaining`
        : "Sale completed successfully"
      
      toast({ 
        title: "Sale Completed", 
        description: `Invoice: ${inv} • ${completionMessage}`
      })

      // Open printable receipt
      if (currentSaleId) await openPrintableReceipt(currentSaleId)

      // Reset for next transaction
      await newSale()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to complete sale"
      
      // More specific error handling
      if (errorMessage.includes("column") && errorMessage.includes("does not exist")) {
        toast({ 
          title: "Database Schema Error", 
          description: "Some database columns are missing. Please check your sales table schema.",
          variant: "destructive" 
        })
      } else if (errorMessage.includes("permission")) {
        toast({ 
          title: "Permission Error", 
          description: "Insufficient permissions to complete sale. Contact administrator.",
          variant: "destructive" 
        })
      } else {
        toast({ 
          title: "Sale Error", 
          description: `Sale may have partially completed. Error: ${errorMessage}`,
          variant: "destructive" 
        })
      }
    } finally {
      setIsLoading(false)
    }
  }

  const holdSale = async () => {
    if (!saleStarted || cartItems.length === 0) return
    try {
      const { error } = await supabase
        .from("sales")
        .update({ 
          subtotal, 
          total_discount: totalDiscount, 
          previous_dues: previousDues,
          net_amount: netAmount,
          total_amount: total, 
          status: "held" 
        })
        .eq("id", currentSaleId)
      if (error) throw error
      toast({ title: "Sale Held", description: "Sale held successfully!" })
      await newSale()
    } catch (error) {
      console.error("Error holding sale:", error)
      toast({ title: "Error", description: "Failed to hold sale", variant: "destructive" })
    }
  }

  const printReceipt = async () => {
    if (!currentSaleId) {
      toast({ title: "No active sale", description: "Start or complete a sale first." })
      return
    }
    await openPrintableReceipt(currentSaleId)
  }

  // ---- Customer selection / save

  const handleCustomerSelect = async (selectedCustomer: Customer) => {
    if (!selectedCustomer.id) {
      toast({ title: "Missing customer ID", description: "Selected customer must have an ID.", variant: "destructive" })
      return
    }
    setCustomer(selectedCustomer)
    setShowCustomerSearch(false)
    // Do NOT auto-start sale; start on button or when adding first item
  }

  const saveCustomer = async () => {
    const customerName = (document.getElementById("customer-name") as HTMLInputElement)?.value
    const customerPhone = (document.getElementById("customer-phone") as HTMLInputElement)?.value
    const customerEmail = (document.getElementById("customer-email") as HTMLInputElement)?.value

    if (!customerName) {
      toast({ title: "Error", description: "Customer name is required", variant: "destructive" })
      return
    }

    try {
      const { data, error } = await supabase.rpc("upsert_customer", {
        p_name: customerName,
        p_phone: customerPhone || null,
        p_email: customerPhone || null,
      })
      if (error) throw new Error(error.message || "upsert_customer failed")
      if (!data?.success || !data?.customer?.id) throw new Error("upsert_customer returned no customer id")

      const saved: Customer = {
        id: data.customer.id,
        name: data.customer.name,
        phone: data.customer.phone,
        email: data.customer.email,
        dues: data.customer.dues ?? 0,
      }
      setCustomer(saved)
      toast({ title: "Customer Saved", description: `Saved ${saved.name}.` })
    } catch (e: any) {
      console.error("Error saving customer:", e)
      toast({ title: "Error saving customer", description: e?.message ?? "Failed", variant: "destructive" })
    }
  }

  return (
    <div className="flex-1 p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Point of Sale</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={newSale} className="bg-green-50 hover:bg-green-100" disabled={isLoading}>
            <RotateCcw className="mr-2 h-4 w-4" />
            New Sale
          </Button>
          <Button variant="outline" onClick={printReceipt}>
            <Receipt className="mr-2 h-4 w-4" />
            Last Receipt
          </Button>
          <Button variant="outline" onClick={() => setShowCalculator(true)}>
            <Calculator className="mr-2 h-4 w-4" />
            Calculator
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="mr-2 h-5 w-5" />
              Customer Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {customer ? (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">{customer.name}</p>
                    <p className="text-sm text-muted-foreground">{customer.phone}</p>
                    <p className="text-sm text-muted-foreground">{customer.email}</p>
                    {customer.dues > 0 && (
                      <p className="text-sm text-red-600">Previous Dues: ৳{customer.dues.toFixed(2)}</p>
                    )}
                    {saleStarted ? (
                      <p className="text-xs text-green-700 mt-1">
                        Sale started (ID: {currentSaleId}){invoiceNumber ? ` • Invoice: ${invoiceNumber}` : ""}
                      </p>
                    ) : (
                      <div className="flex items-center gap-2 mt-2">
                        <p className="text-xs text-amber-700">No sale started</p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            try {
                              const { saleId, invoiceNumber: inv } = await startSaleForCustomer(
                                customer as Required<Customer>
                              )
                              toast({ title: "Sale Started", description: `Sale #${saleId}${inv ? ` • ${inv}` : ""}` })
                            } catch (e: any) {
                              toast({
                                title: "Couldn't start sale",
                                description: e?.message ?? "start_sale failed",
                                variant: "destructive",
                              })
                            }
                          }}
                        >
                          Start Sale
                        </Button>
                      </div>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setCustomer(null)
                      setCurrentSaleId(null)
                      setInvoiceNumber(null)
                    }}
                  >
                    Clear
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="customer-name">Customer Name</Label>
                  <Input id="customer-name" placeholder="Enter customer name" />
                </div>
                <div>
                  <Label htmlFor="customer-phone">Phone Number</Label>
                  <Input id="customer-phone" placeholder="Enter phone number" />
                </div>
                <div>
                  <Label htmlFor="customer-email">Email Address</Label>
                  <Input id="customer-email" type="email" placeholder="Enter email address" />
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1 bg-transparent" onClick={saveCustomer}>
                    Save Customer
                  </Button>
                  <Button variant="outline" onClick={() => setShowCustomerSearch(true)}>
                    Search
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Product Entry */}
        <Card>
          <CardHeader>
            <CardTitle>Product Entry</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!saleStarted && (
              <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 text-amber-800 text-sm">
                Select or save a customer to start a sale before adding products.
              </div>
            )}

            <div className="flex gap-2">
              <div className="flex-1">
                <Label htmlFor="barcode">Barcode</Label>
                <Input
                  id="barcode"
                  placeholder="Scan or enter barcode"
                  value={productForm.barcode}
                  onChange={(e) => handleBarcodeInput(e.target.value)}
                  disabled={isLoading || !saleStarted}
                />
              </div>
              <div className="flex items-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => lookupByBarcode(productForm.barcode)}
                  disabled={isLoading || !saleStarted || !productForm.barcode.trim()}
                >
                  Load
                </Button>
                <Button size="icon" onClick={() => setShowScanner(true)} disabled={isLoading || !saleStarted}>
                  <QrCode className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {isLoading && (
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800">🔍 Looking up product...</p>
              </div>
            )}

            <div>
              <Label htmlFor="product-name">Product Name</Label>
              <Input
                id="product-name"
                placeholder="Auto-filled from barcode"
                value={productForm.name}
                onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                className={productForm.barcode && productForm.name ? "bg-green-50" : ""}
                disabled={!saleStarted}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="color">Color</Label>
                <Input
                  id="color"
                  placeholder="Auto-filled from barcode"
                  value={productForm.color}
                  onChange={(e) => setProductForm({ ...productForm, color: e.target.value })}
                  className={productForm.barcode && productForm.color ? "bg-green-50" : ""}
                  disabled={!saleStarted}
                />
              </div>
              <div>
                <Label htmlFor="quantity">Quantity</Label>
                <div className="flex items-center">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 bg-transparent"
                    onClick={() => setProductForm({ ...productForm, quantity: Math.max(1, productForm.quantity - 1) })}
                    disabled={!saleStarted}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <Input
                    className="text-center mx-1"
                    value={productForm.quantity}
                    onChange={(e) =>
                      setProductForm({
                        ...productForm,
                        quantity: Math.max(1, Number.parseInt(e.target.value) || 1),
                      })
                    }
                    disabled={!saleStarted}
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 bg-transparent"
                    onClick={() => setProductForm({ ...productForm, quantity: productForm.quantity + 1 })}
                    disabled={!saleStarted}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="sale-price">Sale Price</Label>
                <Input
                  id="sale-price"
                  type="number"
                  placeholder="Auto-filled from barcode"
                  value={productForm.price}
                  onChange={(e) => setProductForm({ ...productForm, price: Number.parseFloat(e.target.value) || 0 })}
                  className={productForm.barcode && productForm.price > 0 ? "bg-green-50" : ""}
                  disabled={!saleStarted}
                />
              </div>
              <div>
                <Label htmlFor="discount">Discount (TK)</Label>
                <Input
                  id="discount"
                  type="number"
                  placeholder="0"
                  value={productForm.discount}
                  onChange={(e) => setProductForm({ ...productForm, discount: Number.parseFloat(e.target.value) || 0 })}
                  disabled={!saleStarted}
                />
              </div>
            </div>

            {productForm.barcode && saleStarted && (
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800 font-medium">✓ Product loaded from inventory</p>
                <p className="text-xs text-blue-600 mt-1">
                  Barcode: {productForm.barcode}
                  {productForm.model ? ` • Model: ${productForm.model}` : ""}
                </p>
              </div>
            )}

            <Button className="w-full bg-green-600 hover:bg-green-700" onClick={addToCart} disabled={isLoading || !saleStarted}>
              Add to Cart
            </Button>
          </CardContent>
        </Card>

        {/* Cart & Payment */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Cart & Payment</CardTitle>
              {cartItems.length > 0 && (
                <Button variant="outline" size="sm" onClick={clearCart}>
                  Clear All
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Cart Items */}
            <div className="border rounded-lg p-3 max-h-48 overflow-y-auto">
              <div className="space-y-2">
                {cartItems.length > 0 ? (
                  cartItems.map((item) => (
                    <div key={item.id} className="flex justify-between items-center text-sm border-b pb-2">
                      <div className="flex-1">
                        <p className="font-medium">
                          {item.name} - {item.color}
                        </p>
                        <p className="text-muted-foreground">
                          ৳{item.price.toFixed(2)} × {item.quantity}
                          {item.discount > 0 && ` (-${item.discount}%)`}
                        </p>
                        {item.barcode && <p className="text-xs text-muted-foreground">Barcode: {item.barcode}</p>}
                        {item.model && <p className="text-xs text-muted-foreground">Model: {item.model}</p>}
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          disabled={!saleStarted}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          disabled={!saleStarted}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-red-500"
                          onClick={() => removeFromCart(item.id)}
                          disabled={!saleStarted}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-4">No items in cart</p>
                )}
              </div>
            </div>

            {/* Totals with improved due display */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>৳{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Discount:</span>
                <span>-৳{totalDiscount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Net Amount:</span>
                <span>৳{netAmount.toFixed(2)}</span>
              </div>
              {previousDues > 0 && (
                <div className="flex justify-between text-orange-600">
                  <span>Previous Dues:</span>
                  <span>৳{previousDues.toFixed(2)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>Total:</span>
                <span>৳{total.toFixed(2)}</span>
              </div>
            </div>

            {/* Payment Method */}
            <div>
              <Label>Payment Method</Label>
              <Select
                value={paymentForm.method}
                onValueChange={handlePaymentMethodChange}
                disabled={!saleStarted}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="card">Credit/Debit Card</SelectItem>
                  <SelectItem value="mobile-banking">Mobile Banking</SelectItem>
                  <SelectItem value="bank-transfer">Bank Transfer</SelectItem>
                  <SelectItem value="split">Split Payment</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Mobile Banking Method Selection */}
            {paymentForm.method === "mobile-banking" && (
              <div>
                <Label htmlFor="mobile-banking-method">Mobile Banking Method</Label>
                <Select
                  value={paymentForm.mobileBankingMethod}
                  onValueChange={(value) => handlePaymentChange("mobileBankingMethod", value)}
                  disabled={!saleStarted}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select mobile banking" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bkash">bKash</SelectItem>
                    <SelectItem value="nagad">Nagad</SelectItem>
                    <SelectItem value="rocket">Rocket</SelectItem>
                    <SelectItem value="upay">Upay</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Bank Selection for Card and Bank Transfer */}
            {requiresBankSelection() && (
              <div>
                <Label htmlFor="bank-select">
                  {paymentForm.method === "card" ? "Select Card Bank" : "Select Bank for Transfer"}
                </Label>
                <Select
                  value={paymentForm.method === "card" ? paymentForm.cardBank : paymentForm.bankTransferBank}
                  onValueChange={(value) => {
                    if (paymentForm.method === "card") {
                      handlePaymentChange("cardBank", value)
                    } else {
                      handlePaymentChange("bankTransferBank", value)
                    }
                  }}
                  disabled={!saleStarted}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select bank" />
                  </SelectTrigger>
                  <SelectContent>
                    {bankAccounts.map((bank) => (
                      <SelectItem key={bank.id} value={bank.bankName}>
                        {bank.bankName} - {bank.accountNumber}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Payment Amounts */}
            {paymentForm.method === "split" ? (
              // Split Payment - Show all payment methods
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="cash-received">Cash</Label>
                    <Input
                      id="cash-received"
                      type="number"
                      placeholder="0.00"
                      value={paymentForm.cashReceived}
                      onChange={(e) => handlePaymentChange('cashReceived', Number.parseFloat(e.target.value) || 0)}
                      disabled={!saleStarted}
                    />
                  </div>
                  <div>
                    <Label htmlFor="card-received">Card</Label>
                    <div className="space-y-2">
                      <Select
                        value={paymentForm.cardBank}
                        onValueChange={(value) => handlePaymentChange("cardBank", value)}
                        disabled={!saleStarted}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select bank" />
                        </SelectTrigger>
                        <SelectContent>
                          {bankAccounts.map((bank) => (
                            <SelectItem key={bank.id} value={bank.bankName}>
                              {bank.bankName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        id="card-received"
                        type="number"
                        placeholder="0.00"
                        value={paymentForm.cardReceived}
                        onChange={(e) => handlePaymentChange('cardReceived', Number.parseFloat(e.target.value) || 0)}
                        disabled={!saleStarted || !paymentForm.cardBank}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="bkash-received">bKash</Label>
                    <Input
                      id="bkash-received"
                      type="number"
                      placeholder="0.00"
                      value={paymentForm.bkashReceived}
                      onChange={(e) => handlePaymentChange('bkashReceived', Number.parseFloat(e.target.value) || 0)}
                      disabled={!saleStarted}
                    />
                  </div>
                  <div>
                    <Label htmlFor="nagad-received">Nagad</Label>
                    <Input
                      id="nagad-received"
                      type="number"
                      placeholder="0.00"
                      value={paymentForm.nagadReceived}
                      onChange={(e) => handlePaymentChange('nagadReceived', Number.parseFloat(e.target.value) || 0)}
                      disabled={!saleStarted}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="rocket-received">Rocket</Label>
                    <Input
                      id="rocket-received"
                      type="number"
                      placeholder="0.00"
                      value={paymentForm.rocketReceived}
                      onChange={(e) => handlePaymentChange('rocketReceived', Number.parseFloat(e.target.value) || 0)}
                      disabled={!saleStarted}
                    />
                  </div>
                  <div>
                    <Label htmlFor="upay-received">Upay</Label>
                    <Input
                      id="upay-received"
                      type="number"
                      placeholder="0.00"
                      value={paymentForm.upayReceived}
                      onChange={(e) => handlePaymentChange('upayReceived', Number.parseFloat(e.target.value) || 0)}
                      disabled={!saleStarted}
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="bank-transfer-received">Bank Transfer</Label>
                  <div className="space-y-2">
                    <Select
                      value={paymentForm.bankTransferBank}
                      onValueChange={(value) => handlePaymentChange("bankTransferBank", value)}
                      disabled={!saleStarted}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select bank" />
                      </SelectTrigger>
                      <SelectContent>
                        {bankAccounts.map((bank) => (
                          <SelectItem key={bank.id} value={bank.bankName}>
                            {bank.bankName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      id="bank-transfer-received"
                      type="number"
                      placeholder="0.00"
                      value={paymentForm.bankTransferReceived}
                      onChange={(e) => handlePaymentChange('bankTransferReceived', Number.parseFloat(e.target.value) || 0)}
                      disabled={!saleStarted || !paymentForm.bankTransferBank}
                    />
                  </div>
                </div>
              </div>
            ) : (
              // Single Payment Method
              <>
                {showsAmountImmediately() && (
                  <div>
                    <Label htmlFor="payment-amount">
                      {paymentForm.method === "cash" 
                        ? "Cash Amount" 
                        : `Mobile Banking (${paymentForm.mobileBankingMethod}) Amount`}
                    </Label>
                    <Input
                      id="payment-amount"
                      type="number"
                      placeholder="0.00"
                      value={
                        paymentForm.method === "cash" ? paymentForm.cashReceived :
                        paymentForm.bkashReceived + paymentForm.nagadReceived + 
                        paymentForm.rocketReceived + paymentForm.upayReceived
                      }
                      onChange={(e) => {
                        const value = Number.parseFloat(e.target.value) || 0
                        if (paymentForm.method === "cash") {
                          handlePaymentChange('cashReceived', value)
                        } else if (paymentForm.method === "mobile-banking") {
                          // Distribute the amount to the selected mobile banking method
                          const method = paymentForm.mobileBankingMethod
                          if (method === "bkash") handlePaymentChange('bkashReceived', value)
                          else if (method === "nagad") handlePaymentChange('nagadReceived', value)
                          else if (method === "rocket") handlePaymentChange('rocketReceived', value)
                          else if (method === "upay") handlePaymentChange('upayReceived', value)
                        }
                      }}
                      disabled={!saleStarted || (paymentForm.method === "mobile-banking" && !paymentForm.mobileBankingMethod)}
                    />
                  </div>
                )}
                
                {requiresBankSelection() && (paymentForm.cardBank || paymentForm.bankTransferBank) && (
                  <div>
                    <Label htmlFor="payment-amount">
                      {paymentForm.method === "card" ? "Card" : "Bank Transfer"} Amount
                    </Label>
                    <Input
                      id="payment-amount"
                      type="number"
                      placeholder="0.00"
                      value={
                        paymentForm.method === "card" ? paymentForm.cardReceived :
                        paymentForm.bankTransferReceived
                      }
                      onChange={(e) => {
                        const value = Number.parseFloat(e.target.value) || 0
                        if (paymentForm.method === "card") {
                          handlePaymentChange('cardReceived', value)
                        } else {
                          handlePaymentChange('bankTransferReceived', value)
                        }
                      }}
                      disabled={!saleStarted}
                    />
                  </div>
                )}
              </>
            )}

            {/* Due Amount */}
            <div>
              <Label htmlFor="due">Due Amount</Label>
              <Input
                id="due"
                type="number"
                placeholder="0.00"
                value={paymentForm.due}
                onChange={(e) => handlePaymentChange('due', Number.parseFloat(e.target.value) || 0)}
                disabled={!saleStarted}
                className={remainingDue > 0 ? "bg-yellow-50 border-yellow-300" : ""}
              />
              {remainingDue > 0 && (
                <p className="text-xs text-yellow-700 mt-1">
                  Suggested due: ৳{remainingDue.toFixed(2)}
                </p>
              )}
            </div>

            {/* Payment Summary */}
            <div className="bg-muted p-3 rounded-lg space-y-1">
              <div className="flex justify-between text-sm">
                <span>Total Received:</span>
                <span>৳{totalReceived.toFixed(2)}</span>
              </div>
              {remainingDue > 0 ? (
                <div className="flex justify-between font-bold text-orange-600">
                  <span>Remaining Due:</span>
                  <span>৳{remainingDue.toFixed(2)}</span>
                </div>
              ) : change > 0 ? (
                <div className="flex justify-between font-bold text-green-600">
                  <span>Change to Return:</span>
                  <span>৳{change.toFixed(2)}</span>
                </div>
              ) : (
                <div className="flex justify-between font-bold text-green-600">
                  <span>Fully Paid</span>
                  <span>✓</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <Button
                className="w-full bg-blue-600 hover:bg-blue-700"
                size="lg"
                onClick={completeSale}
                disabled={!saleStarted || cartItems.length === 0 || isLoading}
              >
                <CreditCard className="mr-2 h-5 w-5" />
                {isLoading ? "Processing..." : "Complete Sale"}
              </Button>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" onClick={holdSale} disabled={!saleStarted || cartItems.length === 0 || isLoading}>
                  Hold Sale
                </Button>
                <Button variant="outline" onClick={printReceipt}>
                  Print Receipt
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-16 bg-transparent" onClick={newSale} disabled={isLoading}>
              <div className="text-center">
                <RotateCcw className="h-6 w-6 mx-auto mb-1" />
                <span className="text-sm">New Sale</span>
              </div>
            </Button>
            <Button variant="outline" className="h-16 bg-transparent" onClick={() => setShowCalculator(true)}>
              <div className="text-center">
                <Calculator className="h-6 w-6 mx-auto mb-1" />
                <span className="text-sm">Calculator</span>
              </div>
            </Button>
            <Button variant="outline" className="h-16 bg-transparent" onClick={() => setShowCustomerSearch(true)}>
              <div className="text-center">
                <User className="h-6 w-6 mx-auto mb-1" />
                <span className="text-sm">Customer List</span>
              </div>
            </Button>
            <Button variant="outline" className="h-16 bg-transparent" onClick={() => setShowScanner(true)}>
              <div className="text-center">
                <QrCode className="h-6 w-6 mx-auto mb-1" />
                <span className="text-sm">Scan Product</span>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>


      {/* Dialogs */}
      <POSCalculator open={showCalculator} onOpenChange={setShowCalculator} />
      <CustomerSearch
        open={showCustomerSearch}
        onOpenChange={setShowCustomerSearch}
        onSelectCustomer={handleCustomerSelect}
        supabase={supabase}
      />
      <ProductScanner
        open={showScanner}
        onOpenChange={setShowScanner}
        onScanResult={(result) => lookupByBarcode(result)}
      />
    </div>
  )
}