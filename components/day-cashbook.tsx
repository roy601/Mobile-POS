"use client"

import { useState, useEffect } from "react"
import { Calendar, Printer, RefreshCw, Lock } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/utils/supabase/component"
import { useToast } from "@/hooks/use-toast"

const supabase = createClient()

type CashbookEntry = {
  particulars: string
  debit: number
  credit: number
}

type CashbookData = {
  date: string
  entries: CashbookEntry[]
  totalDebit: number
  totalCredit: number
  cashInHand: number
}

export function DayCashbook() {
  const { toast } = useToast()
  
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  )
  const [cashbookData, setCashbookData] = useState<CashbookData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isAuthorized, setIsAuthorized] = useState(false)
  
  // Edit states
  const [editingEntry, setEditingEntry] = useState<number | null>(null)
  const [showAddEntry, setShowAddEntry] = useState(false)
  const [newEntry, setNewEntry] = useState({ particulars: "", debit: 0, credit: 0 })
  const [editEntry, setEditEntry] = useState({ particulars: "", debit: 0, credit: 0 })

  // Check user authorization (only admin can edit)
  useEffect(() => {
    checkAuthorization()
  }, [])

  const checkAuthorization = async () => {
    try {
      const { data: userData, error } = await supabase.auth.getUser()
      if (error) throw error
      
      // For now, assume authenticated users can edit
      // In production, check for specific admin role
      setIsAuthorized(!!userData?.user) // Set to true if user is logged in
    } catch (err) {
      console.error("Auth check error:", err)
      setIsAuthorized(false)
    }
  }

  useEffect(() => {
    if (selectedDate) {
      loadCashbookData(selectedDate)
    }
  }, [selectedDate])

  const loadCashbookData = async (date: string) => {
    setLoading(true)
    setError(null)
    
    try {
      // Get previous day's closing balance as BFC
      const prevDate = new Date(date)
      prevDate.setDate(prevDate.getDate() - 1)
      const previousDate = prevDate.toISOString().split('T')[0]
      
      // Initialize default data in case of errors
      let salesData: {
        totalSalesAmount: number
        cashAmount: number
        bankAmount: number
        duesAmount: number
        individualSales: any[]
      } = { 
        totalSalesAmount: 0, 
        cashAmount: 0, 
        bankAmount: 0, 
        duesAmount: 0, 
        individualSales: [] 
      }
      let purchaseData = { totalAmount: 0 }
      let returnsData = { salesReturns: 0, purchaseReturns: 0 }
      let expensesData: {
        individualExpenses: any[]
      } = {
        individualExpenses: []
      }
      let bfcAmount = 0

      try {
        const results = await Promise.all([
          getSalesData(date).catch(err => {
            console.warn('Sales data error:', err)
            return salesData
          }),
          getPurchaseData(date).catch(err => {
            console.warn('Purchase data error:', err)
            return purchaseData
          }),
          getReturnsData(date).catch(err => {
            console.warn('Returns data error:', err)
            return returnsData
          }),
          getExpensesData(date).catch(err => {
            console.warn('Expenses data error:', err)
            return expensesData
          }),
          getPreviousBalance(previousDate).catch(err => {
            console.warn('Previous balance error:', err)
            return 0
          })
        ])

        salesData = results[0] || salesData
        purchaseData = results[1] || purchaseData
        returnsData = results[2] || returnsData
        expensesData = results[3] || expensesData
        bfcAmount = results[4] || 0
      } catch (err) {
        console.error('Error loading data:', err)
        // Continue with default values
      }
      
      // Build entries array with fixed summary entries first
      const entries: CashbookEntry[] = [
        {
          particulars: "BFC",
          debit: bfcAmount,
          credit: 0
        },
        {
          particulars: "Total Sales Amount",
          debit: salesData.totalSalesAmount || 0,
          credit: 0
        },
        {
          particulars: "Bank Cash",
          debit: salesData.cashAmount || 0,
          credit: salesData.bankAmount || 0
        },
        {
          particulars: "Sales Dues",
          debit: 0,
          credit: salesData.duesAmount || 0
        },
        {
          particulars: "Total Purchase Amount",
          debit: 0,
          credit: purchaseData.totalAmount || 0
        }
      ]

      // Add individual sales transactions
      if (salesData.individualSales && salesData.individualSales.length > 0) {
        salesData.individualSales.forEach((sale: any) => {
          entries.push({
            particulars: `Sale #${sale.id} - ${sale.customer_name || 'Walk-in Customer'}`,
            debit: sale.total_amount || 0,
            credit: 0
          })
        })
      }

      // Add individual expense transactions
      if (expensesData.individualExpenses && expensesData.individualExpenses.length > 0) {
        expensesData.individualExpenses.forEach((expense: any) => {
          const category = expense.custom_category || expense.category || 'Other'
          entries.push({
            particulars: `${category} - ${expense.description}`,
            debit: 0,
            credit: expense.amount || 0
          })
        })
      }

      // Calculate totals
      const totalDebit = entries.reduce((sum, entry) => sum + entry.debit, 0)
      const totalCredit = entries.reduce((sum, entry) => sum + entry.credit, 0)
      const cashInHand = totalDebit - totalCredit

      const data: CashbookData = {
        date: date,
        entries: entries,
        totalDebit: totalDebit,
        totalCredit: totalCredit,
        cashInHand: cashInHand
      }

      setCashbookData(data)
      
    } catch (err: any) {
      console.error("Error loading cashbook data:", err)
      setError(err.message || "Failed to load cashbook data")
      toast({
        title: "Error",
        description: "Failed to load cashbook data",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const getSalesData = async (date: string) => {
    try {
      const { data, error } = await supabase
        .from("sales")
        .select("id, total_amount, cash_received, card_received, bank_transfer_received, bkash_received, nagad_received, rocket_received, upay_received, due_amount, invoice_number")
        .gte("created_at", date)
        .lt("created_at", `${date}T23:59:59.999Z`)
        .eq("status", "completed")

      if (error) {
        console.error("Sales data error:", error)
        throw error
      }

      const sales = data || []
      
      const totals = sales.reduce((acc, sale) => {
        const totalAmount = sale.total_amount || 0
        const cashAmount = sale.cash_received || 0
        const bankAmount = (sale.card_received || 0) + (sale.bank_transfer_received || 0) + 
                          (sale.bkash_received || 0) + (sale.nagad_received || 0) + 
                          (sale.rocket_received || 0) + (sale.upay_received || 0)
        const duesAmount = sale.due_amount || 0

        return {
          totalSalesAmount: acc.totalSalesAmount + totalAmount,
          cashAmount: acc.cashAmount + cashAmount,
          bankAmount: acc.bankAmount + bankAmount,
          duesAmount: acc.duesAmount + duesAmount
        }
      }, { totalSalesAmount: 0, cashAmount: 0, bankAmount: 0, duesAmount: 0 })

      // Add individual sales for detailed entries (simplified)
      const individualSales = sales.map(sale => ({
        id: sale.invoice_number || sale.id,
        total_amount: sale.total_amount || 0,
        customer_name: `Customer #${sale.id}` // Simplified customer name
      }))

      return {
        ...totals,
        individualSales
      }
    } catch (error) {
      console.error("getSalesData error:", error)
      return {
        totalSalesAmount: 0,
        cashAmount: 0,
        bankAmount: 0,
        duesAmount: 0,
        individualSales: []
      }
    }
  }

  const getPurchaseData = async (date: string) => {
    try {
      const { data, error } = await supabase
        .from("purchases")
        .select("cost_price")
        .gte("created_at", date)
        .lt("created_at", `${date}T23:59:59.999Z`)

      if (error) {
        console.error("Purchase data error:", error)
        return { totalAmount: 0 }
      }

      const totalAmount = (data || []).reduce((sum, purchase) => sum + (purchase.cost_price || 0), 0)
      return { totalAmount }
    } catch (error) {
      console.error("getPurchaseData error:", error)
      return { totalAmount: 0 }
    }
  }

  const getReturnsData = async (date: string) => {
    try {
      const [salesReturns, purchaseReturns] = await Promise.all([
        supabase
          .from("sales_returns")
          .select("total_refund")
          .gte("return_date", date)
          .lt("return_date", `${date}T23:59:59.999Z`)
          .then(result => result.error ? { data: [] } : result),
        supabase
          .from("purchase_returns")
          .select("total_credit_amount")
          .gte("return_date", date)
          .lt("return_date", `${date}T23:59:59.999Z`)
          .then(result => result.error ? { data: [] } : result)
      ])

      return {
        salesReturns: (salesReturns.data || []).reduce((sum, ret) => sum + (ret.total_refund || 0), 0),
        purchaseReturns: (purchaseReturns.data || []).reduce((sum, ret) => sum + (ret.total_credit_amount || 0), 0)
      }
    } catch (error) {
      console.error("getReturnsData error:", error)
      return { salesReturns: 0, purchaseReturns: 0 }
    }
  }

  const getExpensesData = async (date: string) => {
    try {
      const { data, error } = await supabase
        .from("expenses")
        .select("id, amount, category, custom_category, description, created_at")
        .gte("date", date)
        .lte("date", date)
        .order("created_at", { ascending: true })

      if (error) {
        console.error("Expenses data error:", error)
        return { individualExpenses: [] }
      }

      const expenses = data || []

      // Return individual expenses for detailed entries
      const individualExpenses = expenses.map(expense => ({
        id: expense.id,
        amount: expense.amount || 0,
        category: expense.category || 'Other',
        custom_category: expense.custom_category,
        description: expense.description || 'No description',
        created_at: expense.created_at
      }))

      return { individualExpenses }
    } catch (error) {
      console.error("getExpensesData error:", error)
      return { individualExpenses: [] }
    }
  }

  const getPreviousBalance = async (date: string) => {
    // Start BFC as 0 for simplicity
    // In production, you could store daily closing balances in a separate table
    return 0
  }

  const handlePrint = () => {
    if (!cashbookData) return

    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const printContent = generatePrintContent()
    printWindow.document.write(printContent)
    printWindow.document.close()
    printWindow.print()
  }

  const generatePrintContent = () => {
    if (!cashbookData) return ""

    const formatDate = (date: string) => {
      return new Date(date).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      })
    }

    const formatAmount = (amount: number) => amount.toFixed(2)

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Day Cash Book - ${formatDate(cashbookData.date)}</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            margin: 15px; 
            font-size: 12px;
          }
          .header { 
            text-align: center; 
            margin-bottom: 20px;
          }
          .company-name { 
            font-size: 16px; 
            font-weight: bold; 
            margin-bottom: 5px; 
          }
          .address { 
            font-size: 10px; 
            margin-bottom: 10px; 
          }
          .period {
            font-size: 11px;
            margin-bottom: 10px;
          }
          .title {
            border: 2px solid black;
            border-radius: 20px;
            padding: 5px 20px;
            display: inline-block;
            font-size: 14px;
            font-weight: bold;
          }
          .cashbook-table { 
            width: 100%; 
            border-collapse: collapse; 
            margin: 20px 0;
            border: 2px solid black;
          }
          .cashbook-table th, 
          .cashbook-table td { 
            border: 1px solid black; 
            padding: 6px; 
            text-align: left; 
            font-size: 11px;
          }
          .cashbook-table th { 
            background-color: #f0f0f0; 
            font-weight: bold; 
            text-align: center;
          }
          .amount-cell { 
            text-align: right; 
            font-family: monospace;
          }
          .total-row { 
            font-weight: bold; 
            background-color: #f0f0f0;
            border-top: 2px solid black;
          }
          .cash-in-hand {
            text-align: center;
            font-size: 16px;
            font-weight: bold;
            margin-top: 20px;
          }
          @media print {
            body { margin: 10px; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-name">STAR POWER</div>
          <div class="address">
            Shop#507/B(5th Floor) Sector-7 Road No-3,North Tower Uttara,Dhaka - 1230,Bangladesh-868/955.0
          </div>
          <div class="period">PERIOD : ${formatDate(cashbookData.date)}----${formatDate(cashbookData.date)}</div>
          <div class="title">DAY CASH BOOK</div>
        </div>

        <table class="cashbook-table">
          <thead>
            <tr>
              <th style="width: 50%;">Particulars</th>
              <th style="width: 25%;">Dr.</th>
              <th style="width: 25%;">Cr.</th>
            </tr>
          </thead>
          <tbody>
            ${(cashbookData.entries || []).map(entry => `
              <tr>
                <td>${entry.particulars}</td>
                <td class="amount-cell">${entry.debit > 0 ? formatAmount(entry.debit) : ''}</td>
                <td class="amount-cell">${entry.credit > 0 ? formatAmount(entry.credit) : ''}</td>
              </tr>
            `).join('')}
            <tr class="total-row">
              <td></td>
              <td class="amount-cell">${formatAmount(cashbookData.totalDebit || 0)}</td>
              <td class="amount-cell">${formatAmount(cashbookData.totalCredit || 0)}</td>
            </tr>
          </tbody>
        </table>

        <div class="cash-in-hand">
          Cash In Hand &nbsp;&nbsp;&nbsp;&nbsp; ${formatAmount(cashbookData.cashInHand || 0)}
        </div>
      </body>
      </html>
    `
  }

  const formatCurrency = (amount: number) => amount.toFixed(2)

  // Edit functions
  const startEditing = (index: number, entry: CashbookEntry) => {
    setEditingEntry(index)
    setEditEntry({
      particulars: entry.particulars,
      debit: entry.debit,
      credit: entry.credit
    })
  }

  const cancelEditing = () => {
    setEditingEntry(null)
    setEditEntry({ particulars: "", debit: 0, credit: 0 })
  }

  const saveEdit = async () => {
    if (!cashbookData || editingEntry === null) return

    const updatedEntries = [...cashbookData.entries]
    updatedEntries[editingEntry] = {
      particulars: editEntry.particulars,
      debit: editEntry.debit,
      credit: editEntry.credit
    }

    // Recalculate totals
    const totalDebit = updatedEntries.reduce((sum, entry) => sum + entry.debit, 0)
    const totalCredit = updatedEntries.reduce((sum, entry) => sum + entry.credit, 0)
    const cashInHand = totalDebit - totalCredit

    setCashbookData({
      ...cashbookData,
      entries: updatedEntries,
      totalDebit,
      totalCredit,
      cashInHand
    })

    setEditingEntry(null)
    setEditEntry({ particulars: "", debit: 0, credit: 0 })
    
    toast({
      title: "Entry Updated",
      description: "Cashbook entry has been updated successfully."
    })
  }

  const deleteEntry = async (index: number) => {
    if (!cashbookData || !confirm("Are you sure you want to delete this entry?")) return

    const updatedEntries = cashbookData.entries.filter((_, i) => i !== index)
    
    // Recalculate totals
    const totalDebit = updatedEntries.reduce((sum, entry) => sum + entry.debit, 0)
    const totalCredit = updatedEntries.reduce((sum, entry) => sum + entry.credit, 0)
    const cashInHand = totalDebit - totalCredit

    setCashbookData({
      ...cashbookData,
      entries: updatedEntries,
      totalDebit,
      totalCredit,
      cashInHand
    })

    toast({
      title: "Entry Deleted",
      description: "Cashbook entry has been deleted successfully."
    })
  }

  const addNewEntry = async () => {
    if (!cashbookData || !newEntry.particulars.trim()) {
      toast({
        title: "Invalid Entry",
        description: "Please enter a description for the entry.",
        variant: "destructive"
      })
      return
    }

    const updatedEntries = [...cashbookData.entries, {
      particulars: newEntry.particulars,
      debit: newEntry.debit,
      credit: newEntry.credit
    }]

    // Recalculate totals
    const totalDebit = updatedEntries.reduce((sum, entry) => sum + entry.debit, 0)
    const totalCredit = updatedEntries.reduce((sum, entry) => sum + entry.credit, 0)
    const cashInHand = totalDebit - totalCredit

    setCashbookData({
      ...cashbookData,
      entries: updatedEntries,
      totalDebit,
      totalCredit,
      cashInHand
    })

    setNewEntry({ particulars: "", debit: 0, credit: 0 })
    setShowAddEntry(false)
    
    toast({
      title: "Entry Added",
      description: "New cashbook entry has been added successfully."
    })
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Day Cash Book</h1>
        <div className="flex items-center gap-2">
          {!isAuthorized ? (
            <div className="flex items-center text-amber-600 bg-amber-50 px-3 py-1 rounded-md">
              <Lock className="h-4 w-4 mr-2" />
              Read Only
            </div>
          ) : (
            <Button 
              variant="outline" 
              onClick={() => setShowAddEntry(true)}
              className="bg-green-50 hover:bg-green-100"
            >
              Add Entry
            </Button>
          )}
          <Button variant="outline" onClick={() => loadCashbookData(selectedDate)} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            {loading ? "Refreshing..." : "Refresh"}
          </Button>
          <Button onClick={handlePrint} disabled={!cashbookData}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
        </div>
      </div>

      {/* Date Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Select Date
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div>
              <Label htmlFor="cashbook-date">Date</Label>
              <Input
                id="cashbook-date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-48"
              />
            </div>
            <div className="text-sm text-muted-foreground">
              Period: {new Date(selectedDate).toLocaleDateString('en-GB')}----{new Date(selectedDate).toLocaleDateString('en-GB')}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Card className="border-red-200">
          <CardContent className="p-4">
            <div className="text-red-600 font-medium">Error: {error}</div>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {loading && (
        <Card>
          <CardContent className="p-8 text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading cashbook data...</p>
          </CardContent>
        </Card>
      )}

      {/* Main Cashbook */}
      {cashbookData && !loading && (
        <Card>
          <CardHeader className="text-center">
            <div className="space-y-2">
              <div className="text-xl font-bold">STAR POWER</div>
              <div className="text-xs text-muted-foreground">
                Shop#507/B(5th Floor) Sector-7 Road No-3,North Tower Uttara,Dhaka - 1230,Bangladesh-868/955.0
              </div>
              <div className="text-sm">PERIOD : {new Date(cashbookData.date).toLocaleDateString('en-GB')}----{new Date(cashbookData.date).toLocaleDateString('en-GB')}</div>
              <div className="inline-block border-2 border-black rounded-full px-6 py-1 font-bold">
                DAY CASH BOOK
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-2 border-black" style={{ borderCollapse: 'collapse' }}>
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-black px-3 py-2 text-center font-bold" style={{ width: '50%' }}>
                      Particulars
                    </th>
                    <th className="border border-black px-3 py-2 text-center font-bold" style={{ width: '25%' }}>
                      Dr.
                    </th>
                    <th className="border border-black px-3 py-2 text-center font-bold" style={{ width: '25%' }}>
                      Cr.
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {(cashbookData?.entries || []).map((entry, index) => (
                    <tr key={index}>
                      <td className="border border-black px-3 py-1 text-sm">
                        {entry.particulars}
                      </td>
                      <td className="border border-black px-3 py-1 text-right text-sm font-mono">
                        {entry.debit > 0 ? formatCurrency(entry.debit) : ''}
                      </td>
                      <td className="border border-black px-3 py-1 text-right text-sm font-mono">
                        {entry.credit > 0 ? formatCurrency(entry.credit) : ''}
                      </td>
                    </tr>
                  ))}
                  
                  {/* Total Row */}
                  <tr className="bg-gray-100 font-bold border-t-2 border-black">
                    <td className="border border-black px-3 py-2"></td>
                    <td className="border border-black px-3 py-2 text-right font-mono">
                      {formatCurrency(cashbookData?.totalDebit || 0)}
                    </td>
                    <td className="border border-black px-3 py-2 text-right font-mono">
                      {formatCurrency(cashbookData?.totalCredit || 0)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            {/* Cash In Hand */}
            <div className="text-center mt-8 text-xl font-bold">
              Cash In Hand &nbsp;&nbsp;&nbsp;&nbsp; {formatCurrency(cashbookData?.cashInHand || 0)}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}