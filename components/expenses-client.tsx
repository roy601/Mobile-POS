"use client"

import { useState, useEffect } from "react"
import { Calendar, Plus, Printer, Search, Trash2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/utils/supabase/component"

const supabase = createClient()

type ExpenseEntry = {
  id?: string
  date: string
  category: string
  custom_category?: string
  description: string
  amount: number
  payment_method: string
  reference?: string
  notes?: string
  user_id?: string
  organization_id?: string
  created_at?: string
  updated_at?: string
}

// Updated categories to match your simplified database schema
const expenseCategories = [
  { value: "salaries", label: "Salaries" },
  { value: "printer_papers", label: "Printer Papers" },
  { value: "water_bill", label: "Water Bill" },
  { value: "mobile_bill", label: "Mobile Bill" },
  { value: "internet_bill", label: "Internet Bill" },
  { value: "land_bill", label: "Land Bill" },
  { value: "bank_charge", label: "Bank Charge" },
  { value: "shopping_bag", label: "Shopping Bag" },
  { value: "office_supplies", label: "Office Supplies" },
  { value: "utilities", label: "Utilities" },
  { value: "rent", label: "Rent" },
  { value: "transportation", label: "Transportation" },
  { value: "marketing", label: "Marketing" },
  { value: "equipment", label: "Equipment" },
  { value: "maintenance", label: "Maintenance" },
  { value: "staff_expenses", label: "Staff Expenses" },
  { value: "professional_services", label: "Professional Services" },
  { value: "insurance", label: "Insurance" },
  { value: "other", label: "Other (Custom)" }
]

// Payment methods from your schema
const paymentMethods = [
  { value: "cash", label: "Cash" },
  { value: "card", label: "Card" },
  { value: "mobile_banking", label: "Mobile Banking" },
  { value: "bank_transfer", label: "Bank Transfer" }
]

export function ExpensesClient() {
  const [expenses, setExpenses] = useState<ExpenseEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Search filters
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  
  // Add expense form
  const [showAddForm, setShowAddForm] = useState(false)
  const [newExpense, setNewExpense] = useState({
    date: new Date().toISOString().split('T')[0],
    category: "",
    customCategory: "",
    description: "",
    amount: 0,
    payment_method: "",
    notes: ""
  })

  useEffect(() => {
    // Load today's expenses by default
    const today = new Date().toISOString().split('T')[0]
    setStartDate(today)
    setEndDate(today)
    searchExpenses(today, today)
  }, [])

  const searchExpenses = async (start?: string, end?: string) => {
    const searchStart = start || startDate
    const searchEnd = end || endDate
    
    if (!searchStart) {
      setError("Please select a start date")
      return
    }

    setLoading(true)
    setError(null)
    
    try {
      // Check authentication first
      const { data: userData, error: userError } = await supabase.auth.getUser()
      
      if (userError) {
        console.error("Auth error:", userError)
        throw new Error("Please sign in to view expenses")
      }

      if (!userData?.user) {
        console.error("No authenticated user found")
        throw new Error("Please sign in to view expenses")
      }

      console.log("Searching expenses for user:", userData.user.id)

      // Build query - RLS policies will handle user filtering
      let query = supabase
        .from("expenses")
        .select("*")
        .gte("date", searchStart)
        .order("date", { ascending: false })

      if (searchEnd && searchEnd !== searchStart) {
        query = query.lte("date", searchEnd)
      } else {
        query = query.lte("date", searchStart)
      }

      const { data, error: queryError } = await query

      console.log("Search result:", { data, queryError, count: data?.length })

      if (queryError) {
        console.error("Database query error:", {
          message: queryError.message,
          details: queryError.details,
          code: queryError.code
        })
        
        if (queryError.message?.includes("row-level security")) {
          throw new Error("Access denied. Please check your permissions.")
        } else {
          throw new Error(`Database error: ${queryError.message}`)
        }
      }

      console.log(`Found ${data?.length || 0} expenses`)
      setExpenses(data || [])
      
    } catch (err: any) {
      const errorMessage = err?.message || "Error loading expenses"
      console.error("Error loading expenses:", err)
      setError(errorMessage)
      setExpenses([])
    } finally {
      setLoading(false)
    }
  }

  const addExpense = async () => {
    try {
      // Check authentication (still needed for RLS policies)
      const { data: userData, error: userError } = await supabase.auth.getUser()
      
      if (userError) {
        console.error("Auth error:", userError)
        alert("Authentication error. Please sign in.")
        return
      }

      if (!userData?.user) {
        console.error("No authenticated user found")
        alert("Please sign in to add expenses.")
        return
      }

      console.log("Adding expense for authenticated user")

      // Validation based on your simplified schema constraints
      let finalCategory = newExpense.category
      let customCategory = null

      if (newExpense.category === "other") {
        if (!newExpense.customCategory.trim()) {
          alert("Please enter a custom category when selecting 'other'")
          return
        }
        finalCategory = "other"
        customCategory = newExpense.customCategory.trim()
      } else if (!newExpense.category) {
        alert("Please select a category")
        return
      }

      if (!newExpense.description.trim()) {
        alert("Please enter a description")
        return
      }

      if (newExpense.amount <= 0) {
        alert("Please enter a valid amount greater than 0")
        return
      }

      if (!newExpense.payment_method) {
        alert("Please select a payment method")
        return
      }

      // Build expense object according to your simplified schema (no user_id or organization_id)
      const expenseToAdd = {
        date: newExpense.date,
        category: finalCategory,
        custom_category: customCategory,
        description: newExpense.description.trim(),
        amount: newExpense.amount,
        payment_method: newExpense.payment_method,
        notes: newExpense.notes || null
        // No user_id or organization_id - these have been removed
      }

      console.log("Inserting expense:", expenseToAdd)

      const { data, error } = await supabase
        .from("expenses")
        .insert(expenseToAdd)
        .select()
        .single()

      console.log("Insert result:", { data, error })

      if (error) {
        console.error("Insert error details:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })

        // Handle specific errors
        if (error.message?.includes("row-level security")) {
          alert("Access denied. Please check database permissions.")
        } else if (error.message?.includes("payment_method_check")) {
          alert("Invalid payment method. Please select: cash, card, mobile_banking, or bank_transfer")
        } else if (error.message?.includes("category_check")) {
          alert("Invalid category. Please select from the available options.")
        } else if (error.message?.includes("amount_check")) {
          alert("Amount must be greater than 0")
        } else if (error.message?.includes("custom_category")) {
          alert("Custom category is required when selecting 'other'")
        } else {
          alert(`Failed to add expense: ${error.message}`)
        }
        return
      }

      if (!data) {
        alert("Failed to add expense: No data returned")
        return
      }

      // Add to local state
      setExpenses([data, ...expenses])
      
      // Reset form
      setNewExpense({
        date: newExpense.date, // Keep the same date
        category: "",
        customCategory: "",
        description: "",
        amount: 0,
        payment_method: "",
        notes: ""
      })
      
      console.log("Expense added successfully:", data)
      alert("Expense added successfully!")
      
    } catch (err: any) {
      console.error("Unexpected error adding expense:", err)
      alert(`Error adding expense: ${err?.message || "Unknown error"}`)
    }
  }

  const deleteExpense = async (id: string) => {
    if (!confirm("Are you sure you want to delete this expense?")) return

    try {
      const { error } = await supabase
        .from("expenses")
        .delete()
        .eq("id", id)

      if (error) {
        console.error("Delete error:", error)
        throw new Error("Failed to delete expense")
      }

      setExpenses(expenses.filter(e => e.id !== id))
      alert("Expense deleted successfully!")
    } catch (err: any) {
      console.error("Error deleting expense:", err)
      alert("Error deleting expense")
    }
  }

  const handlePrint = () => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const printContent = generatePrintContent()
    printWindow.document.write(printContent)
    printWindow.document.close()
    printWindow.print()
  }

  const generatePrintContent = () => {
    const formatDate = (date: string) => {
      return new Date(date).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short', 
        year: 'numeric'
      })
    }

    const totalAmount = expenses.reduce((sum, expense) => sum + (expense.amount || 0), 0)

    const dateRange = startDate === endDate 
      ? formatDate(startDate)
      : `${formatDate(startDate)} --- ${formatDate(endDate)}`

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Expense Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-center; margin-bottom: 30px; }
          .company-name { font-size: 24px; font-weight: bold; margin-bottom: 8px; }
          .address { font-size: 12px; margin-bottom: 8px; }
          .period { font-size: 12px; margin-bottom: 20px; }
          .title-oval { 
            border: 2px solid black; 
            border-radius: 50px; 
            padding: 8px 30px; 
            display: inline-block; 
            font-size: 18px; 
            font-weight: bold; 
          }
          .expense-table { 
            width: 100%; 
            border-collapse: collapse; 
            border: 2px solid black; 
            margin-bottom: 30px; 
          }
          .expense-table th, .expense-table td { 
            border: 1px solid black; 
            padding: 8px; 
            text-align: left; 
          }
          .expense-table th { 
            background-color: #f0f0f0; 
            font-weight: bold; 
            text-align: center;
          }
          .amount-cell { text-align: right; }
          .total-row { 
            font-weight: bold; 
            background-color: #f0f0f0; 
          }
          .total-amount { 
            text-align: center; 
            margin: 30px 0; 
          }
          .total-title { 
            font-size: 20px; 
            font-weight: bold; 
            margin-bottom: 10px; 
          }
          .total-value { 
            font-size: 36px; 
            font-weight: bold; 
            border-top: 2px solid black; 
            padding-top: 10px; 
            display: inline-block; 
            min-width: 200px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-name">STAR POWER</div>
          <div class="address">
            Shojiptorabagh,Fazlu/Section/Azad No-91, North Tower Uttara,Dhaka - 1230,Bangladesh:863/955.0
          </div>
          <div class="period">PERIOD : ${dateRange}</div>
          <div class="title-oval">EXPENSE REPORT</div>
        </div>

        <table class="expense-table">
          <thead>
            <tr>
              <th style="width: 15%;">Date</th>
              <th style="width: 20%;">Category</th>
              <th style="width: 20%;">Payment Method</th>
              <th style="width: 25%;">Description</th>
              <th style="width: 20%;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${expenses.map(expense => `
              <tr>
                <td>${formatDate(expense.date)}</td>
                <td>${expense.category === 'other' ? expense.custom_category || 'Other' : expense.category}</td>
                <td>${expense.payment_method}</td>
                <td>${expense.description}</td>
                <td class="amount-cell">৳${expense.amount.toFixed(2)}</td>
              </tr>
            `).join('')}
            <tr class="total-row">
              <td colspan="4" style="text-align: right; font-weight: bold;">TOTAL EXPENSES:</td>
              <td class="amount-cell">৳${totalAmount.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>

        <div class="total-amount">
          <div class="total-title">Total Expenses ৳${totalAmount.toFixed(2)}</div>
        </div>

      </body>
      </html>
    `
  }

  const totalAmount = expenses.reduce((sum, expense) => sum + (expense.amount || 0), 0)

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Error Display */}
      {error && (
        <Card className="border-red-200">
          <CardContent className="p-4">
            <div className="text-red-600 font-medium">Error: {error}</div>
          </CardContent>
        </Card>
      )}

      {/* Search Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Expense Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="start-date">Start Date</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="end-date">End Date</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div className="flex items-end gap-2">
              <Button onClick={() => searchExpenses()} disabled={loading}>
                <Search className="h-4 w-4 mr-2" />
                {loading ? "Searching..." : "Search"}
              </Button>
              <Button onClick={handlePrint} variant="outline" disabled={expenses.length === 0}>
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Expense Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Add Expense
            </CardTitle>
            <Button onClick={() => setShowAddForm(!showAddForm)} variant="outline">
              {showAddForm ? "Hide Form" : "Show Form"}
            </Button>
          </div>
        </CardHeader>
        {showAddForm && (
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="expense-date">Date*</Label>
                <Input
                  id="expense-date"
                  type="date"
                  value={newExpense.date}
                  onChange={(e) => setNewExpense({...newExpense, date: e.target.value})}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="category">Category*</Label>
                <Select 
                  value={newExpense.category} 
                  onValueChange={(value) => setNewExpense({...newExpense, category: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {expenseCategories.map(category => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {newExpense.category === "other" && (
                <div>
                  <Label htmlFor="custom-category">Custom Category*</Label>
                  <Input
                    id="custom-category"
                    value={newExpense.customCategory}
                    onChange={(e) => setNewExpense({...newExpense, customCategory: e.target.value})}
                    placeholder="Enter custom category"
                    required
                  />
                </div>
              )}

              <div>
                <Label htmlFor="payment-method">Payment Method*</Label>
                <Select 
                  value={newExpense.payment_method} 
                  onValueChange={(value) => setNewExpense({...newExpense, payment_method: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentMethods.map(method => (
                      <SelectItem key={method.value} value={method.value}>
                        {method.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="amount">Amount (৳)*</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={newExpense.amount}
                  onChange={(e) => setNewExpense({...newExpense, amount: Number(e.target.value) || 0})}
                  placeholder="0.00"
                  required
                />
              </div>
            </div>

            <div className="mt-4">
              <Label htmlFor="description">Description*</Label>
              <Textarea
                id="description"
                value={newExpense.description}
                onChange={(e) => setNewExpense({...newExpense, description: e.target.value})}
                placeholder="Enter expense description"
                rows={3}
                required
              />
            </div>

            <div className="mt-4">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={newExpense.notes}
                onChange={(e) => setNewExpense({...newExpense, notes: e.target.value})}
                placeholder="Additional notes about this expense"
                rows={2}
              />
            </div>

            <div className="mt-4">
              <Button onClick={addExpense} className="bg-green-600 hover:bg-green-700">
                <Plus className="h-4 w-4 mr-2" />
                Add Expense
              </Button>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Expenses Table */}
      <Card>
        <CardHeader>
          <CardTitle>Expense Records</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading expenses...
            </div>
          ) : expenses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No expenses found for the selected date range
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Payment Method</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenses.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell>{expense.date}</TableCell>
                      <TableCell>
                        {expense.category === 'other' 
                          ? expense.custom_category || 'Other'
                          : expense.category
                        }
                      </TableCell>
                      <TableCell>{expense.payment_method}</TableCell>
                      <TableCell>{expense.description}</TableCell>
                      <TableCell className="text-right">
                        ৳{expense.amount.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          onClick={() => deleteExpense(expense.id!)}
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="font-bold bg-gray-50">
                    <TableCell colSpan={4}>TOTAL EXPENSES</TableCell>
                    <TableCell className="text-right">৳{totalAmount.toFixed(2)}</TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
              
              <div className="mt-6 text-center">
                <div className="inline-block border-t-2 border-black pt-4">
                  <div className="text-lg font-semibold">Total Expenses ৳{totalAmount.toFixed(2)}</div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}