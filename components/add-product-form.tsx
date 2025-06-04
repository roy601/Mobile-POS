"use client"

import { Save, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function AddProductForm() {
  return (
    <form className="space-y-6">
      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Basic Information</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="product-name">Product Name*</Label>
            <Input id="product-name" placeholder="Enter product name" required />
          </div>
          <div>
            <Label htmlFor="model">Model Number*</Label>
            <Input id="model" placeholder="Enter model number" required />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="barcode">Barcode</Label>
            <Input id="barcode" placeholder="Enter or scan barcode" />
          </div>
          <div>
            <Label htmlFor="category">Category*</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="phones">Phones</SelectItem>
                <SelectItem value="tablets">Tablets</SelectItem>
                <SelectItem value="accessories">Accessories</SelectItem>
                <SelectItem value="cases">Cases & Covers</SelectItem>
                <SelectItem value="chargers">Chargers & Cables</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Pricing & Inventory */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Pricing & Inventory</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="cost-price">Cost Price*</Label>
            <Input id="cost-price" type="number" placeholder="0.00 ৳" required />
          </div>
          <div>
            <Label htmlFor="selling-price">Selling Price*</Label>
            <Input id="selling-price" type="number" placeholder="0.00 ৳" required />
          </div>
          <div>
            <Label htmlFor="quantity">Quantity*</Label>
            <Input id="quantity" type="number" placeholder="0" required />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="color">Available Colors</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Select colors" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="black">Black</SelectItem>
                <SelectItem value="white">White</SelectItem>
                <SelectItem value="blue">Blue</SelectItem>
                <SelectItem value="red">Red</SelectItem>
                <SelectItem value="gold">Gold</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="supplier">Supplier</Label>
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
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" placeholder="Enter product description" className="h-20" />
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
          Save Product
        </Button>
      </div>
    </form>
  )
}
