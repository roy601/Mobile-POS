"use client"

import { use, useState } from "react"
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
import { createClient } from "@/utils/supabase/component";
import { id } from "date-fns/locale"

const supabase = createClient();


type ColorVariant = {
  id: string
  color: string
  quantity: number
  imei?: string
  barcode: string
}

export function AddProductForm() {

  const [showAddSupplier, setShowAddSupplier] = useState(false)
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false)
  const [selectedSupplier, setSelectedSupplier] = useState("")
  const [productName, setProductName] = useState("")
  const [modelNumber, setModelNumber] = useState("")
  const [currentVariantId, setCurrentVariantId] = useState("")
  const [category, setCategory] = useState("")
  const [brand, setBrand] = useState("")
  const [costPrice, setCostPrice] = useState("")
  const [sellPrice, setSellPrice] = useState("")
  const [description, setDescription] = useState("")
  const [colorVariants, setColorVariants] = useState<ColorVariant[]>([
    { id: "1", color: "", quantity: 0, imei: "", barcode: "" },
  ])
  const { toast } = useToast()

  const addColorVariant = () => {
    const newId = (colorVariants.length + 1).toString()
    setColorVariants([...colorVariants, { id: newId, color: "", quantity: 0, imei: "", barcode: "" }])
  }

  const removeColorVariant = (id: string) => {
    if (colorVariants.length > 1) {
      setColorVariants(colorVariants.filter((variant) => variant.id !== id))
    }
  }

  const updateColorVariant = (id: string, field: keyof ColorVariant, value: string | number) => {
    setColorVariants(colorVariants.map((variant) => (variant.id === id ? { ...variant, [field]: value } : variant)))
  }

  const openBarcodeScanner = (variantId: string) => {
    setCurrentVariantId(variantId)
    setShowBarcodeScanner(true)
  }

  const handleBarcodeScanned = (scannedBarcode: string) => {
    if (currentVariantId) {
      updateColorVariant(currentVariantId, "barcode", scannedBarcode)
      setShowBarcodeScanner(false)
      setCurrentVariantId("")
      toast({
        title: "Barcode Captured",
        description: `Barcode ${scannedBarcode} has been saved for this product variant`,
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
  // --- VALIDATIONS FIRST ---
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

  // Must have barcodes for all valid variants
  const variantsWithoutBarcode = validVariants.filter((v) => !v.barcode?.trim())
  if (variantsWithoutBarcode.length > 0) {
    toast({
      title: "Missing barcodes",
      description: "Please scan barcodes for all variants.",
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

  // ---  A) CHECK DUPES INSIDE THE FORM ---
  const inputBarcodes = validVariants.map((v) => v.barcode.trim())
  const dupesInForm = inputBarcodes.filter((b, i) => inputBarcodes.indexOf(b) !== i)
  if (dupesInForm.length > 0) {
    const uniq = Array.from(new Set(dupesInForm))
    toast({
      title: "Duplicate barcodes in form",
      description: `These barcodes are repeated: ${uniq.join(", ")}`,
      variant: "destructive",
    })
    return
  }

  // ---  B) CHECK DUPES AGAINST DB BEFORE INSERT ---
  try {
    const { data: existing, error: checkErr } = await supabase
      .from("color_variants")
      .select("barcode")
      .in("barcode", inputBarcodes)

    if (checkErr) {
      // If this fails, we still can rely on DB PK during insert, but we'll warn.
      console.warn("Preflight barcode check failed:", checkErr)
    } else if (existing && existing.length > 0) {
      const found = existing.map((r: any) => r.barcode)
      toast({
        title: "Duplicate barcodes in database",
        description: `Already used: ${found.join(", ")}`,
        variant: "destructive",
      })
      return
    }

    // --- CREATE PURCHASE FIRST ---
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

    // --- INSERT VARIANTS (may still hit race-condition PK violation) ---
    const variantInserts = validVariants.map((v) => ({
      barcode: v.barcode.trim(),
      purchase_id: purchaseId,
      color: v.color,
      quantity: v.quantity,
      imei: v.imei || null
    }))

    const { error: variantError } = await supabase.from("color_variants").insert(variantInserts)

    if (variantError) {
      // Handle unique violation nicely
      const msg = (variantError as any)?.message || ""
      const isUnique = (variantError as any)?.code === "23505" || /duplicate key|unique/i.test(msg)
      if (isUnique) {
        // Try to pull the conflicting barcode from the message
        const conflict = inputBarcodes.find((b) => msg.includes(b)) || "one of the barcodes"
        toast({
          title: "Duplicate barcode",
          description: `Barcode ${conflict} already exists. Please scan a different code.`,
          variant: "destructive",
        })
      } else {
        toast({ title: "Database Error", description: `Failed to save variants: ${msg}`, variant: "destructive" })
      }
      return
    }

    toast({ title: "Success", description: `Product saved with ${validVariants.length} color variants!` })
    resetForm()
  } catch (err: any) {
    console.error("Unexpected error:", err)
    toast({ title: "Error", description: "An unexpected error occurred while saving the product", variant: "destructive" })
  }
}


// Add this helper function to reset the form
const resetForm = () => {
  setProductName("")
  setModelNumber("")
  setCategory("")
  setBrand("")
  setCostPrice("")
  setSellPrice("")
  setDescription("")
  setSelectedSupplier("")
  setColorVariants([{ id: "1", color: "", quantity: 0, imei: "", barcode: "" }])
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
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                        onChange={(e) =>
                          updateColorVariant(variant.id, "quantity", Number.parseInt(e.target.value) || 0)
                        }
                        required
                      />
                    </div>
                    <div>
                      <Label>IMEI/Voucher Code</Label>
                      <Input
                        placeholder="Enter IMEI or code"
                        value={variant.imei || ""}
                        onChange={(e) => updateColorVariant(variant.id, "imei", e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Barcode Section */}
                  <div className="space-y-3">
                    <Label>Product Barcode*</Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Scan barcode from product box"
                        value={variant.barcode}
                        onChange={(e) => updateColorVariant(variant.id, "barcode", e.target.value)}
                        className="flex-1"
                        required
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => openBarcodeScanner(variant.id)}
                      >
                        <Camera className="h-4 w-4" />
                      </Button>
                    </div>
                    {variant.barcode && (
                      <div className="bg-muted p-3 rounded-lg">
                        <div className="flex items-center gap-2">
                          <QrCode className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">Barcode: </span>
                          <code className="bg-background px-2 py-1 rounded text-sm font-mono">{variant.barcode}</code>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          This barcode will auto-fill product information when scanned in POS
                        </p>
                      </div>
                    )}
                  </div>
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
          <Button type="button" variant="outline">
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
