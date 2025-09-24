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
  id?: number
  date: string
  category: string
  description: string
  amount: number
  created_at?: string
}

const expenseCategories = [
  "Office Supplies",
  "Utilities",
  "Rent",
  "Transportation",
  "Marketing",
  "Equipment",
  "Maintenance",
  "Staff Expenses",
  "Professional Services",
  "Insurance",
  "Custom"
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
    amount: 0
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
      // Simple direct query like other working pages
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

      if (queryError) {
        console.error("Database query error:", queryError)
        throw new Error("Failed to load expenses")
      }

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
      const category = newExpense.category === "Custom" ? newExpense.customCategory : newExpense.category
      
      if (!category.trim()) {
        alert("Please select or enter a category")
        return
      }

      if (!newExpense.description.trim()) {
        alert("Please enter a description")
        return
      }

      if (newExpense.amount <= 0) {
        alert("Please enter a valid amount")
        return
      }

      const expenseToAdd = {
        date: newExpense.date,
        category: category.trim(),
        description: newExpense.description.trim(),
        amount: newExpense.amount
      }

      // Simple insert like other working pages
      const { data, error } = await supabase
        .from("expenses")
        .insert(expenseToAdd)
        .select()
        .single()

      if (error) {
        console.error("Insert error:", error)
        throw new Error("Failed to add expense")
      }

      // Add to local state
      setExpenses([data, ...expenses])
      
      // Reset form
      setNewExpense({
        date: newExpense.date, // Keep the same date
        category: "",
        customCategory: "",
        description: "",
        amount: 0
      })
      
      alert("Expense added successfully!")
    } catch (err: any) {
      console.error("Error adding expense:", err)
      alert("Error adding expense")
    }
  }

  const deleteExpense = async (id: number) => {
    if (!confirm("Are you sure you want to delete this expense?")) return

    try {
      // Simple delete like other working pages
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
              <th style="width: 45%;">Description</th>
              <th style="width: 20%;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${expenses.map(expense => `
              <tr>
                <td>${formatDate(expense.date)}</td>
                <td>${expense.category}</td>
                <td>${expense.description}</td>
                <td class="amount-cell">৳${expense.amount.toFixed(2)}</td>
              </tr>
            `).join('')}
            <tr class="total-row">
              <td colspan="3" style="text-align: right; font-weight: bold;">TOTAL EXPENSES:</td>
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
                <Label htmlFor="expense-date">Date</Label>
                <Input
                  id="expense-date"
                  type="date"
                  value={newExpense.date}
                  onChange={(e) => setNewExpense({...newExpense, date: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Select 
                  value={newExpense.category} 
                  onValueChange={(value) => setNewExpense({...newExpense, category: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {expenseCategories.map(category => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {newExpense.category === "Custom" && (
                <div>
                  <Label htmlFor="custom-category">Custom Category</Label>
                  <Input
                    id="custom-category"
                    value={newExpense.customCategory}
                    onChange={(e) => setNewExpense({...newExpense, customCategory: e.target.value})}
                    placeholder="Enter custom category"
                  />
                </div>
              )}
              <div>
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={newExpense.amount}
                  onChange={(e) => setNewExpense({...newExpense, amount: Number(e.target.value) || 0})}
                />
              </div>
            </div>
            <div className="mt-4">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={newExpense.description}
                onChange={(e) => setNewExpense({...newExpense, description: e.target.value})}
                placeholder="Enter expense description"
                rows={3}
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
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenses.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell>{expense.date}</TableCell>
                      <TableCell>{expense.category}</TableCell>
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
                    <TableCell colSpan={3}>TOTAL EXPENSES</TableCell>
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