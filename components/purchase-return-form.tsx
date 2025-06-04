"use client"

import { Save, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function PurchaseReturnForm() {
  return (
    <form className="space-y-6">
      {/* Supplier Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Supplier Information</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="supplier">Supplier*</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Select supplier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="techsupplies">TechSupplies Inc.</SelectItem>
                <SelectItem value="accessoryworld">AccessoryWorld</SelectItem>
                <SelectItem value="mobileparts">MobileParts Ltd.</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="purchase-order">Purchase Order Number</Label>
            <Input id="purchase-order" placeholder="Enter PO number" />
          </div>
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
            <Label htmlFor="unit-cost">Unit Cost*</Label>
            <Input id="unit-cost" type="number" placeholder="৳0.00" required />
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
            <Input id="return-date" type="date" required />
          </div>
        </div>

        <div>
          <Label htmlFor="notes">Notes</Label>
          <Textarea id="notes" placeholder="Additional notes about the return" className="h-20" />
        </div>
      </div>

      {/* Credit Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Credit Information</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="credit-method">Credit Method*</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Select credit method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="account-credit">Account Credit</SelectItem>
                <SelectItem value="bank-transfer">Bank Transfer</SelectItem>
                <SelectItem value="replacement">Replacement Products</SelectItem>
                <SelectItem value="check">Check</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="credit-amount">Credit Amount*</Label>
            <Input id="credit-amount" type="number" placeholder="৳0.00" required />
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
