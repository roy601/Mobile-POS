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

type CartItem = {
  id: string
  name: string
  model: string
  color: string
  quantity: number
  price: number
  discount: number
  barcode: string
}

type Customer = {
  name: string
  phone: string
  email: string
  dues: number
}

// Mock product database with manually scanned barcodes
const productDatabase = [
  {
    barcode: "1234567890123",
    name: "Samsung Galaxy A54",
    model: "Galaxy A54 5G",
    color: "Black",
    price: 42000,
    stock: 25,
  },
  {
    barcode: "1234567890124",
    name: "Samsung Galaxy A54",
    model: "Galaxy A54 5G",
    color: "White",
    price: 42000,
    stock: 15,
  },
  {
    barcode: "9876543210987",
    name: "iPhone 14",
    model: "iPhone 14 128GB",
    color: "Black",
    price: 95000,
    stock: 10,
  },
  {
    barcode: "9876543210988",
    name: "iPhone 14",
    model: "iPhone 14 128GB",
    color: "Blue",
    price: 95000,
    stock: 8,
  },
  {
    barcode: "5555666677778",
    name: "iPad Air",
    model: "iPad Air 5th Gen",
    color: "Space Gray",
    price: 65000,
    stock: 12,
  },
]

export function POSClient() {
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [productForm, setProductForm] = useState({
    barcode: "",
    name: "",
    color: "",
    quantity: 1,
    price: 0,
    discount: 0,
  })
  const [paymentForm, setPaymentForm] = useState({
    method: "",
    cashReceived: 0,
    cardReceived: 0,
    mobileBankingReceived: 0,
    bankTransferReceived: 0,
  })
  const [showCalculator, setShowCalculator] = useState(false)
  const [showCustomerSearch, setShowCustomerSearch] = useState(false)
  const [showScanner, setShowScanner] = useState(false)
  const { toast } = useToast()

  // Calculate totals
  const subtotal = cartItems.reduce((sum, item) => sum + item.quantity * item.price, 0)
  const totalDiscount = cartItems.reduce((sum, item) => sum + (item.quantity * item.price * item.discount) / 100, 0)
  const total = subtotal - totalDiscount + (customer?.dues || 0)
  const totalReceived =
    paymentForm.cashReceived +
    paymentForm.cardReceived +
    paymentForm.mobileBankingReceived +
    paymentForm.bankTransferReceived
  const change = totalReceived - total

  // Auto-fill product information when barcode is entered or scanned
  const handleBarcodeChange = (barcode: string) => {
    setProductForm({ ...productForm, barcode })

    if (barcode.length >= 10) {
      // Look up product by scanned barcode
      const product = productDatabase.find((p) => p.barcode === barcode)
      if (product) {
        setProductForm({
          barcode,
          name: product.name,
          color: product.color,
          quantity: 1,
          price: product.price,
          discount: 0,
        })
        toast({
          title: "Product Found",
          description: `${product.name} - ${product.color} loaded from barcode`,
        })
      } else {
        toast({
          title: "Product Not Found",
          description: "Barcode not found in database. Please enter details manually.",
          variant: "destructive",
        })
      }
    }
  }

  const addToCart = () => {
    if (!productForm.name || productForm.price <= 0) {
      toast({
        title: "Error",
        description: "Please enter product name and price",
        variant: "destructive",
      })
      return
    }

    const newItem: CartItem = {
      id: Date.now().toString(),
      name: productForm.name,
      model: productForm.barcode,
      color: productForm.color,
      quantity: productForm.quantity,
      price: productForm.price,
      discount: productForm.discount,
      barcode: productForm.barcode,
    }

    setCartItems([...cartItems, newItem])
    setProductForm({
      barcode: "",
      name: "",
      color: "",
      quantity: 1,
      price: 0,
      discount: 0,
    })

    toast({
      title: "Product Added",
      description: `${newItem.name} added to cart`,
    })
  }

  const removeFromCart = (id: string) => {
    setCartItems(cartItems.filter((item) => item.id !== id))
  }

  const updateQuantity = (id: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(id)
      return
    }
    setCartItems(cartItems.map((item) => (item.id === id ? { ...item, quantity: newQuantity } : item)))
  }

  const clearCart = () => {
    setCartItems([])
    setCustomer(null)
    setPaymentForm({
      method: "",
      cashReceived: 0,
      cardReceived: 0,
      mobileBankingReceived: 0,
      bankTransferReceived: 0,
    })
  }

  const newSale = () => {
    clearCart()
    setProductForm({
      barcode: "",
      name: "",
      color: "",
      quantity: 1,
      price: 0,
      discount: 0,
    })
  }

  const completeSale = () => {
    if (cartItems.length === 0) return

    toast({
      title: "Sale Completed",
      description: `Sale completed successfully! Total: ৳${total.toFixed(2)}`,
    })
    clearCart()
  }

  const holdSale = () => {
    if (cartItems.length === 0) return
    toast({
      title: "Sale Held",
      description: "Sale held successfully!",
    })
  }

  const printReceipt = () => {
    toast({
      title: "Receipt Printed",
      description: "Receipt printed successfully!",
    })
  }

  return (
    <div className="flex-1 p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Point of Sale</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={newSale} className="bg-green-50 hover:bg-green-100">
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
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setCustomer(null)}>
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
                  <Button variant="outline" className="flex-1 bg-transparent">
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
            <div className="flex gap-2">
              <div className="flex-1">
                <Label htmlFor="barcode">Barcode</Label>
                <Input
                  id="barcode"
                  placeholder="Scan or enter barcode from product box"
                  value={productForm.barcode}
                  onChange={(e) => handleBarcodeChange(e.target.value)}
                />
              </div>
              <div className="flex items-end">
                <Button size="icon" onClick={() => setShowScanner(true)}>
                  <QrCode className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div>
              <Label htmlFor="product-name">Product Name</Label>
              <Input
                id="product-name"
                placeholder="Auto-filled from barcode"
                value={productForm.name}
                onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                className={productForm.barcode && productForm.name ? "bg-green-50" : ""}
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
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <Input
                    className="text-center mx-1"
                    value={productForm.quantity}
                    onChange={(e) =>
                      setProductForm({ ...productForm, quantity: Math.max(1, Number.parseInt(e.target.value) || 1) })
                    }
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 bg-transparent"
                    onClick={() => setProductForm({ ...productForm, quantity: productForm.quantity + 1 })}
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
                />
              </div>
              <div>
                <Label htmlFor="discount">Discount (%)</Label>
                <Input
                  id="discount"
                  type="number"
                  placeholder="0"
                  value={productForm.discount}
                  onChange={(e) => setProductForm({ ...productForm, discount: Number.parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

            {productForm.barcode && (
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800 font-medium">✓ Product loaded from barcode scan</p>
                <p className="text-xs text-blue-600 mt-1">Barcode: {productForm.barcode}</p>
              </div>
            )}

            <Button className="w-full bg-green-600 hover:bg-green-700" onClick={addToCart}>
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
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-red-500"
                          onClick={() => removeFromCart(item.id)}
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

            {/* Totals */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>৳{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Discount:</span>
                <span>-৳{totalDiscount.toFixed(2)}</span>
              </div>
              {customer?.dues && customer.dues > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>Previous Dues:</span>
                  <span>৳{customer.dues.toFixed(2)}</span>
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
                onValueChange={(value) => setPaymentForm({ ...paymentForm, method: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="card">Credit/Debit Card</SelectItem>
                  <SelectItem value="bkash">bKash</SelectItem>
                  <SelectItem value="nagad">Nagad</SelectItem>
                  <SelectItem value="rocket">Rocket</SelectItem>
                  <SelectItem value="upay">Upay</SelectItem>
                  <SelectItem value="bank-transfer">Bank Transfer</SelectItem>
                  <SelectItem value="split">Split Payment</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Payment Amounts */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="cash-received">Cash</Label>
                <Input
                  id="cash-received"
                  type="number"
                  placeholder="0.00"
                  value={paymentForm.cashReceived}
                  onChange={(e) =>
                    setPaymentForm({ ...paymentForm, cashReceived: Number.parseFloat(e.target.value) || 0 })
                  }
                />
              </div>
              <div>
                <Label htmlFor="card-received">Card</Label>
                <Input
                  id="card-received"
                  type="number"
                  placeholder="0.00"
                  value={paymentForm.cardReceived}
                  onChange={(e) =>
                    setPaymentForm({ ...paymentForm, cardReceived: Number.parseFloat(e.target.value) || 0 })
                  }
                />
              </div>
              <div>
                <Label htmlFor="mobile-banking">Mobile Banking</Label>
                <Input
                  id="mobile-banking"
                  type="number"
                  placeholder="0.00"
                  value={paymentForm.mobileBankingReceived}
                  onChange={(e) =>
                    setPaymentForm({ ...paymentForm, mobileBankingReceived: Number.parseFloat(e.target.value) || 0 })
                  }
                />
              </div>
              <div>
                <Label htmlFor="bank-transfer">Bank Transfer</Label>
                <Input
                  id="bank-transfer"
                  type="number"
                  placeholder="0.00"
                  value={paymentForm.bankTransferReceived}
                  onChange={(e) =>
                    setPaymentForm({ ...paymentForm, bankTransferReceived: Number.parseFloat(e.target.value) || 0 })
                  }
                />
              </div>
            </div>

            {/* Change */}
            <div className="bg-muted p-3 rounded-lg">
              <div className="flex justify-between font-bold">
                <span>Change to Return:</span>
                <span className={change >= 0 ? "text-green-600" : "text-red-600"}>৳{change.toFixed(2)}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              <Button
                className="w-full bg-blue-600 hover:bg-blue-700"
                size="lg"
                onClick={completeSale}
                disabled={cartItems.length === 0 || totalReceived < total}
              >
                <CreditCard className="mr-2 h-5 w-5" />
                Complete Sale
              </Button>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" onClick={holdSale} disabled={cartItems.length === 0}>
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
            <Button variant="outline" className="h-16 bg-transparent" onClick={newSale}>
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
      <CustomerSearch open={showCustomerSearch} onOpenChange={setShowCustomerSearch} onSelectCustomer={setCustomer} />
      <ProductScanner
        open={showScanner}
        onOpenChange={setShowScanner}
        onScanResult={(result) => handleBarcodeChange(result)}
      />
    </div>
  )
}
