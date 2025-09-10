"use client"

import { useState } from "react"
import { Save, X, Plus, Minus, Camera, QrCode, Barcode } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/utils/supabase/component"

const supabase = createClient();

type ColorVariant = {
  id: string
  color: string
  quantity: number
  barcodes: string[]  // Changed from single barcode to array of barcodes
}

export function AddProductForm() {
  const [showAddSupplier, setShowAddSupplier] = useState(false)
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false)
  const [selectedSupplier, setSelectedSupplier] = useState("")
  const [productName, setProductName] = useState("")
  const [modelNumber, setModelNumber] = useState("")
  const [currentVariantId, setCurrentVariantId] = useState("")
  const [currentBarcodeIndex, setCurrentBarcodeIndex] = useState(0)
  const [category, setCategory] = useState("")
  const [brand, setBrand] = useState("")
  const [costPrice, setCostPrice] = useState("")
  const [sellPrice, setSellPrice] = useState("")
  const [description, setDescription] = useState("")
  const [colorVariants, setColorVariants] = useState<ColorVariant[]>([
    { id: "1", color: "", quantity: 0, barcodes: [] },
  ])
  const { toast } = useToast()

  const addColorVariant = () => {
    const newId = (Date.now()).toString()
    setColorVariants([...colorVariants, { id: newId, color: "", quantity: 0, barcodes: [] }])
  }

  const removeColorVariant = (id: string) => {
    if (colorVariants.length > 1) {
      setColorVariants(colorVariants.filter((variant) => variant.id !== id))
    }
  }

  const updateColorVariant = (id: string, field: keyof Omit<ColorVariant, 'barcodes'>, value: string | number) => {
    setColorVariants(colorVariants.map((variant) => 
      variant.id === id ? { ...variant, [field]: value } : variant
    ))
  }

  const updateColorVariantBarcodes = (id: string, barcodes: string[]) => {
    setColorVariants(colorVariants.map((variant) => 
      variant.id === id ? { ...variant, barcodes } : variant
    ))
  }

  const updateIndividualBarcode = (variantId: string, index: number, value: string) => {
    setColorVariants(colorVariants.map(variant => {
      if (variant.id === variantId) {
        const newBarcodes = [...variant.barcodes]
        newBarcodes[index] = value
        return { ...variant, barcodes: newBarcodes }
      }
      return variant
    }))
  }

  const generateBarcodesForVariant = (variantId: string, quantity: number) => {
    setColorVariants(colorVariants.map(variant => {
      if (variant.id === variantId) {
        // If we're increasing quantity, add empty barcode slots
        if (quantity > variant.barcodes.length) {
          const newBarcodes = [...variant.barcodes]
          while (newBarcodes.length < quantity) {
            newBarcodes.push("")
          }
          return { ...variant, quantity, barcodes: newBarcodes }
        } 
        // If decreasing quantity, remove extra barcodes
        else if (quantity < variant.barcodes.length) {
          return { 
            ...variant, 
            quantity, 
            barcodes: variant.barcodes.slice(0, quantity) 
          }
        }
      }
      return variant
    }))
  }

  const openBarcodeScanner = (variantId: string, barcodeIndex: number) => {
    setCurrentVariantId(variantId)
    setCurrentBarcodeIndex(barcodeIndex)
    setShowBarcodeScanner(true)
  }

  const handleBarcodeScanned = (scannedBarcode: string) => {
    if (currentVariantId) {
      updateIndividualBarcode(currentVariantId, currentBarcodeIndex, scannedBarcode)
      setShowBarcodeScanner(false)
      setCurrentVariantId("")
      setCurrentBarcodeIndex(0)
      toast({
        title: "Barcode Captured",
        description: `Barcode ${scannedBarcode} has been saved`,
      })
    }
  }

  const handleAddSupplier = () => {
    setShowAddSupplier(false)
    toast({
      title: "Supplier Added",
      description: "New supplier added successfully!",
    })
  }

  const handleSaveProduct = async () => {
    // Validation
    if (!productName || !modelNumber) {
      toast({ title: "Error", description: "Please fill in product name and model number", variant: "destructive" })
      return
    }

    const validVariants = colorVariants.filter((v) => v.color && v.quantity > 0)
    const totalQuantity = validVariants.reduce((sum, v) => sum + v.quantity, 0)

    if (totalQuantity === 0) {
      toast({ title: "Error", description: "Please add at least one color variant with quantity", variant: "destructive" })
      return
    }

    // Check if all barcodes are filled
    const missingBarcodes = validVariants.some(variant => 
      variant.barcodes.some(barcode => !barcode.trim())
    )
    
    if (missingBarcodes) {
      toast({
        title: "Missing barcodes",
        description: "Please scan barcodes for all product units.",
        variant: "destructive",
      })
      return
    }

    if (!category || !costPrice || !sellPrice) {
      toast({
        title: "Error",
        description: "Please fill in all required fields (category, cost price, selling price)",
        variant: "destructive",
      })
      return
    }

    // Check for duplicate barcodes
    const allBarcodes = validVariants.flatMap(v => v.barcodes)
    const uniqueBarcodes = new Set(allBarcodes)
    
    if (allBarcodes.length !== uniqueBarcodes.size) {
      toast({
        title: "Duplicate barcodes",
        description: "Please ensure all barcodes are unique.",
        variant: "destructive",
      })
      return
    }

    try {
      // Check for existing barcodes in database
      const { data: existing, error: checkErr } = await supabase
        .from("color_variants")
        .select("barcode")
        .in("barcode", allBarcodes)

      if (checkErr) {
        console.error("Barcode check error:", checkErr)
        toast({ 
          title: "Database Error", 
          description: "Failed to check barcode uniqueness", 
          variant: "destructive" 
        })
        return
      }

      if (existing && existing.length > 0) {
        const found = existing.map((r: any) => r.barcode)
        toast({
          title: "Duplicate barcodes in database",
          description: `Already used: ${found.join(", ")}`,
          variant: "destructive",
        })
        return
      }

      // Create purchase
      const { data: purchaseData, error: purchaseError } = await supabase
        .from("purchases")
        .insert([{
          product_name: productName,
          model_number: modelNumber,
          category,
          brand,
          supplier: selectedSupplier || null,
          cost_price: parseFloat(costPrice),
          sale_price: parseFloat(sellPrice),
          description: description || null
        }])
        .select("id")
        .single()

      if (purchaseError) {
        console.error("Purchase insert failed:", purchaseError)
        toast({ title: "Database Error", description: `Failed to save product: ${purchaseError.message}`, variant: "destructive" })
        return
      }

      const purchaseId = purchaseData?.id
      if (!purchaseId) {
        toast({ title: "Database Error", description: "Failed to save product: No purchase ID returned", variant: "destructive" })
        return
      }

      // Insert variants - one for each barcode (each representing one physical unit)
      const variantInserts = validVariants.flatMap((v) => 
        v.barcodes.map(barcode => ({
          barcode: barcode.trim(),
          purchase_id: purchaseId,
          color: v.color,
          quantity: 1,  // Each barcode represents one unit
          imei: barcode.trim()  // IMEI same as barcode as requested
        }))
      )

      const { error: variantError } = await supabase.from("color_variants").insert(variantInserts)

      if (variantError) {
        console.error("Variant insert error:", variantError)
        toast({ title: "Database Error", description: `Failed to save variants: ${variantError.message}`, variant: "destructive" })
        return
      }

      toast({ 
        title: "Success", 
        description: `Product saved with ${variantInserts.length} individual units!` 
      })
      resetForm()
    } catch (err: any) {
      console.error("Unexpected error:", err)
      toast({ title: "Error", description: "An unexpected error occurred while saving the product", variant: "destructive" })
    }
  }

  const resetForm = () => {
    setProductName("")
    setModelNumber("")
    setCategory("")
    setBrand("")
    setCostPrice("")
    setSellPrice("")
    setDescription("")
    setSelectedSupplier("")
    setColorVariants([{ id: "1", color: "", quantity: 0, barcodes: [] }])
  }

  return (
    <>
      <form className="space-y-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Basic Information</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="product-name">Product Name*</Label>
              <Input
                id="product-name"
                placeholder="Enter product name"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="model">Model Number*</Label>
              <Input
                id="model"
                placeholder="Enter model number"
                value={modelNumber}
                onChange={(e) => setModelNumber(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="category">Category*</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="phones">Phones</SelectItem>
                  <SelectItem value="demo-phones">Demo Phones</SelectItem>
                  <SelectItem value="tablets">Tablets</SelectItem>
                  <SelectItem value="accessories">Accessories</SelectItem>
                  <SelectItem value="cases">Cases & Covers</SelectItem>
                  <SelectItem value="chargers">Chargers & Cables</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="brand">Brand</Label>
              <Input 
                id="brand" 
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                required
                />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="cost-price">Cost Price*</Label>
              <Input 
                id="cost-price" 
                type="number" 
                placeholder="0.00 ৳" 
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value)}
                required />
            </div>
            <div>
              <Label htmlFor="selling-price">Selling Price*</Label>
              <Input 
                id="selling-price" 
                type="number" 
                placeholder="0.00 ৳" 
                value={sellPrice}
                onChange={(e) => setSellPrice(e.target.value)}
                required />
            </div>
          </div>

          <div>
            <Label htmlFor="supplier">Supplier</Label>
            <div className="flex gap-2">
              <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select supplier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="techsupplies">TechSupplies Inc.</SelectItem>
                  <SelectItem value="accessoryworld">AccessoryWorld</SelectItem>
                  <SelectItem value="mobileparts">MobileParts Ltd.</SelectItem>
                </SelectContent>
              </Select>
              <Button type="button" variant="outline" size="icon" onClick={() => setShowAddSupplier(true)}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description" 
              placeholder="Enter product description" 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="h-20" />
          </div>
        </div>

        {/* Color Variants */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Color Variants & Stock</h3>
            <Button type="button" variant="outline" onClick={addColorVariant}>
              <Plus className="mr-2 h-4 w-4" />
              Add Color
            </Button>
          </div>

          <div className="space-y-4">
            {colorVariants.map((variant, index) => (
              <Card key={variant.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Color Variant {index + 1}</CardTitle>
                    {colorVariants.length > 1 && (
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeColorVariant(variant.id)}>
                        <Minus className="h-4 w-4 text-red-500" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Color*</Label>
                      <Input
                        placeholder="Enter color name"
                        value={variant.color}
                        onChange={(e) => updateColorVariant(variant.id, "color", e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label>Quantity*</Label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={variant.quantity || ""}
                        onChange={(e) => {
                          const newQuantity = Number.parseInt(e.target.value) || 0
                          updateColorVariant(variant.id, "quantity", newQuantity)
                          generateBarcodesForVariant(variant.id, newQuantity)
                        }}
                        required
                      />
                    </div>
                  </div>

                  {/* Barcode Section - One for each unit */}
                  {variant.quantity > 0 && (
                    <div className="space-y-3">
                      <Label>Product Barcodes* ({variant.quantity} units)</Label>
                      <div className="space-y-2">
                        {Array.from({ length: variant.quantity }).map((_, i) => (
                          <div key={i} className="flex gap-2 items-center">
                            <Label className="w-20">Unit {i + 1}:</Label>
                            <Input
                              placeholder="Scan barcode"
                              value={variant.barcodes[i] || ""}
                              onChange={(e) => updateIndividualBarcode(variant.id, i, e.target.value)}
                              className="flex-1"
                              required
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={() => openBarcodeScanner(variant.id, i)}
                            >
                              <Camera className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                      <div className="bg-muted p-3 rounded-lg">
                        <div className="flex items-center gap-2">
                          <QrCode className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">Barcodes: </span>
                        </div>
                        <div className="mt-2 space-y-1">
                          {variant.barcodes.map((barcode, i) => (
                            barcode && (
                              <div key={i} className="flex items-center gap-2">
                                <Barcode className="h-3 w-3" />
                                <code className="bg-background px-2 py-1 rounded text-xs font-mono">
                                  {barcode}
                                </code>
                              </div>
                            )
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          Each barcode represents one physical unit. Barcode and IMEI will be the same.
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="bg-muted p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="font-medium">Total Quantity:</span>
              <span className="text-lg font-bold">
                {colorVariants.reduce((sum, variant) => sum + variant.quantity, 0)} units
              </span>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={resetForm}>
            <X className="mr-2 h-4 w-4" />
            Cancel
          </Button>
          <Button type="button" onClick={handleSaveProduct} className="bg-green-600 hover:bg-green-700">
            <Save className="mr-2 h-4 w-4" />
            Save Product
          </Button>
        </div>
      </form>

      {/* Add Supplier Dialog */}
      <Dialog open={showAddSupplier} onOpenChange={setShowAddSupplier}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Supplier</DialogTitle>
            <DialogDescription>Enter supplier information to add to your supplier list.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label htmlFor="supplier-name">Supplier Name*</Label>
              <Input id="supplier-name" placeholder="Enter supplier name" required />
            </div>
            <div>
              <Label htmlFor="supplier-contact">Contact Person</Label>
              <Input id="supplier-contact" placeholder="Enter contact person name" />
            </div>
            <div>
              <Label htmlFor="supplier-phone">Phone Number</Label>
              <Input id="supplier-phone" placeholder="Enter phone number" />
            </div>
            <div>
              <Label htmlFor="supplier-email">Email</Label>
              <Input id="supplier-email" type="email" placeholder="Enter email address" />
            </div>
            <div>
              <Label htmlFor="supplier-address">Address</Label>
              <Textarea id="supplier-address" placeholder="Enter supplier address" className="h-20" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddSupplier(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddSupplier}>Add Supplier</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Barcode Scanner Dialog */}
      <Dialog open={showBarcodeScanner} onOpenChange={setShowBarcodeScanner}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Scan Product Barcode</DialogTitle>
            <DialogDescription>
              Use your camera to scan the barcode from the product box. Make sure the barcode is clearly visible.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-muted p-8 rounded-lg text-center">
              <Camera className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-4">Camera scanner will appear here</p>
              <p className="text-xs text-muted-foreground">
                Position the barcode within the camera frame to scan automatically
              </p>
            </div>
            <div className="space-y-2">
              <Label>Or enter barcode manually:</Label>
              <Input
                placeholder="Enter barcode manually"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && e.currentTarget.value.trim()) {
                    handleBarcodeScanned(e.currentTarget.value.trim())
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBarcodeScanner(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                // Simulate barcode scan for demo
                const demoBarcode = `${Date.now()}`
                handleBarcodeScanned(demoBarcode)
              }}
            >
              Demo Scan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}