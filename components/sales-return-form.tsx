"use client"

import { Save, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function SalesReturnForm() {
  return (
    <form className="space-y-6">
      {/* Customer Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Customer Information</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="customer-name">Customer Name*</Label>
            <Input id="customer-name" placeholder="Enter customer name" required />
          </div>
          <div>
            <Label htmlFor="customer-phone">Phone Number</Label>
            <Input id="customer-phone" placeholder="Enter phone number" />
          </div>
        </div>

        <div>
          <Label htmlFor="original-invoice">Original Invoice Number</Label>
          <Input id="original-invoice" placeholder="Enter invoice number" />
        </div>
      </div>

      {/* Product Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Product Information</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="product-name">Product Name*</Label>
            <Input id="product-name" placeholder="Enter product name" required />
          </div>
          <div>
            <Label htmlFor="model">Model Number</Label>
            <Input id="model" placeholder="Enter model number" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="quantity">Quantity*</Label>
            <Input id="quantity" type="number" placeholder="1" required />
          </div>
          <div>
            <Label htmlFor="unit-price">Unit Price*</Label>
            <Input id="unit-price" type="number" placeholder="৳0.00" required />
          </div>
          <div>
            <Label htmlFor="total-amount">Total Amount</Label>
            <Input id="total-amount" type="number" placeholder="৳0.00" readOnly />
          </div>
        </div>
      </div>

      {/* Return Details */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Return Details</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="return-reason">Return Reason*</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Select reason" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="defective">Defective Product</SelectItem>
                <SelectItem value="wrong-item">Wrong Item</SelectItem>
                <SelectItem value="not-satisfied">Customer Not Satisfied</SelectItem>
                <SelectItem value="damaged">Damaged in Transit</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="return-date">Return Date*</Label>
            <Input id="return-date" type="date" required />
          </div>
        </div>

        <div>
          <Label htmlFor="notes">Notes</Label>
          <Textarea id="notes" placeholder="Additional notes about the return" className="h-20" />
        </div>
      </div>

      {/* Refund Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Refund Information</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="refund-method">Refund Method*</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Select refund method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="card">Credit/Debit Card</SelectItem>
                <SelectItem value="mobile-banking">Mobile Banking</SelectItem>
                <SelectItem value="store-credit">Store Credit</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="refund-amount">Refund Amount*</Label>
            <Input id="refund-amount" type="number" placeholder="৳0.00" required />
          </div>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-2 pt-4">
        <Button variant="outline">
          <X className="mr-2 h-4 w-4" />
          Cancel
        </Button>
        <Button className="bg-green-600 hover:bg-green-700">
          <Save className="mr-2 h-4 w-4" />
          Process Return
        </Button>
      </div>
    </form>
  )
}
