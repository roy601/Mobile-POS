"use client"

import { useEffect, useMemo, useState } from "react"
import { Calendar, Printer, Download, Search, BookOpen, TrendingUp, TrendingDown, DollarSign, Loader2, RefreshCw } from "lucide-react"
import { createClient } from "@/utils/supabase/component"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"

const supabase = createClient()

type LedgerEntry = {
  id: string
  date: string
  description: string
  voucherType: string
  debit: number
  credit: number
  balance: number
  reference?: string
  supplier?: string
  customer?: string
}

type BalanceSheetData = {
  totalPurchaseAmount: number
  totalSalesAmount: number
  totalPartyPaymentAmount: number
  totalOwnExpenseAmount: number
  totalCustomerDuesReceiveAmount: number
  totalIncomeAmount: number
}

export function LedgerClient() {
  const { toast } = useToast()
  
  const today = new Date().toISOString().split('T')[0]
  
  const [startDate, setStartDate] = useState<string>(today)
  const [endDate, setEndDate] = useState<string>(today)
  const [dateFilterEnabled, setDateFilterEnabled] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedSupplierGeneral, setSelectedSupplierGeneral] = useState<string>("all")
  const [selectedSupplierPurchase, setSelectedSupplierPurchase] = useState<string>("all")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [purchaseEntries, setPurchaseEntries] = useState<LedgerEntry[]>([])
  const [salesEntries, setSalesEntries] = useState<LedgerEntry[]>([])
  const [generalEntries, setGeneralEntries] = useState<LedgerEntry[]>([])
  const [balanceSheetData, setBalanceSheetData] = useState<BalanceSheetData | null>(null)
  
  // Store expense and income data for voucher tabs
  const [expensesResult, setExpensesResult] = useState<any>({ individualExpenses: [], totalAmount: 0, partyPaymentAmount: 0 })
  const [incomeResult, setIncomeResult] = useState<any>({ individualIncomes: [], totalAmount: 0 })
  
  const [cashbookBalance, setCashbookBalance] = useState<number>(0)

  useEffect(() => {
    if (dateFilterEnabled) {
      let effectiveStart = startDate
      let effectiveEnd = endDate

      // Handle flexible dates
      if (!startDate && !endDate) {
        // No dates - use all time
        effectiveStart = '2000-01-01'
        effectiveEnd = today
      } else if (!startDate && endDate) {
        // Only end date - from beginning
        effectiveStart = '2000-01-01'
      } else if (startDate && !endDate) {
        // Only start date - to today
        effectiveEnd = today
      }

      if (new Date(effectiveStart) > new Date(effectiveEnd)) {
        setError("Start date cannot be after end date")
        return
      }
      loadLedgerData(effectiveStart, effectiveEnd)
    }
  }, [startDate, endDate, dateFilterEnabled])

  // Get the date range description
  const getDateRangeDescription = () => {
    if (!dateFilterEnabled) return "Date filter disabled"
    if (!startDate && !endDate) return "All time"
    if (!startDate && endDate) return `All data up to ${new Date(endDate).toLocaleDateString('en-GB')}`
    if (startDate && !endDate) return `From ${new Date(startDate).toLocaleDateString('en-GB')} onwards`
    return `${new Date(startDate).toLocaleDateString('en-GB')} to ${new Date(endDate).toLocaleDateString('en-GB')}`
  }

  const loadLedgerData = async (start: string, end: string) => {
    setLoading(true)
    setError(null)
    
    try {
      // Get opening balance (BFC) from day before start date
      const prevDate = new Date(start)
      prevDate.setDate(prevDate.getDate() - 1)
      const previousDate = prevDate.toISOString().split('T')[0]

      // ✅ UPDATED: Removed getPurchaseData from Promise.all
      const [salesResult, returnsResult, expensesData, incomeData, openingBalance] = await Promise.all([
        getSalesData(start, end),
        // ❌ REMOVED: getPurchaseData(start, end)
        getReturnsData(start, end),
        getExpensesData(start, end),
        getIncomeData(start, end),
        getPreviousBalance(previousDate)
      ])

      // Store for voucher tabs
      setExpensesResult(expensesData)
      setIncomeResult(incomeData)

      // ============================================
      // GENERAL LEDGER - Detailed individual transactions
      // ============================================
      const generalLedger: LedgerEntry[] = []
      let balance = openingBalance

      // 1. Opening Balance (BFC)
      generalLedger.push({
        id: 'opening',
        date: start,
        description: 'Opening Balance (BFC)',
        voucherType: 'Opening',
        debit: balance >= 0 ? balance : 0,
        credit: balance < 0 ? Math.abs(balance) : 0,
        balance: balance
      })

      // 2. Individual Sales - CASH ONLY (DEBIT - Money IN)
      if (salesResult.individualSales && salesResult.individualSales.length > 0) {
        salesResult.individualSales.forEach((sale: any) => {
          if (sale.cashAmount > 0) {
            balance += sale.cashAmount
            generalLedger.push({
              id: `sale-cash-${sale.id}`,
              date: sale.date,
              description: `Cash Sale ${sale.invoiceNumber ? `#${sale.invoiceNumber}` : ''}`,
              voucherType: 'Sales Receipt',
              debit: sale.cashAmount,
              credit: 0,
              balance: balance,
              customer: sale.customerName,
              reference: sale.invoiceNumber
            })
          }
        })
      }

      // 2b. Bank/Digital Payments (CREDIT - Money OUT to bank)
      if (salesResult.individualSales && salesResult.individualSales.length > 0) {
        salesResult.individualSales.forEach((sale: any) => {
          if (sale.bankAmount > 0) {
            balance -= sale.bankAmount
            generalLedger.push({
              id: `sale-bank-${sale.id}`,
              date: sale.date,
              description: `Bank/Digital Payment ${sale.invoiceNumber ? `#${sale.invoiceNumber}` : ''}`,
              voucherType: 'Bank Payment',
              debit: 0,
              credit: sale.bankAmount,
              balance: balance,
              customer: sale.customerName,
              reference: sale.invoiceNumber
            })
          }
        })
      }

      // 3. Purchase Returns (DEBIT - Money IN)
      if (returnsResult.purchaseReturns > 0) {
        balance += returnsResult.purchaseReturns
        generalLedger.push({
          id: 'purchase-returns',
          date: end,
          description: 'Purchase Returns',
          voucherType: 'Purchase Return',
          debit: returnsResult.purchaseReturns,
          credit: 0,
          balance: balance
        })
      }

      // 4. Individual Income entries (DEBIT - Money IN)
      // ✅ UPDATED: Changed "Party Income" to "Supplier Income"
        if (incomeData.individualIncomes && incomeData.individualIncomes.length > 0) {
          incomeData.individualIncomes.forEach((income: any, idx: number) => {
            balance += income.amount
            const incomeTypeLabel = income.income_type === 'owner_income' ? 'Owner Income' : 'Supplier Income'
            const destinationLabel = income.destination_type === 'bank' ? 'Bank' : 'Cash'
            
            generalLedger.push({
              id: `income-${idx}`,
              date: income.created_at,
              description: `${incomeTypeLabel} (${destinationLabel})${income.description ? ' - ' + income.description : ''}`,
              voucherType: 'Income',
              debit: income.amount,
              credit: 0,
              balance: balance,
              supplier: income.supplier_name || undefined
            })
          })
        }

      // ❌ REMOVED: Individual Purchases - no longer tracked in ledger

      // 5. Sales Returns (CREDIT - Money OUT)
      if (returnsResult.salesReturns > 0) {
        balance -= returnsResult.salesReturns
        generalLedger.push({
          id: 'sales-returns',
          date: end,
          description: 'Sales Returns (Refunds)',
          voucherType: 'Sales Return',
          debit: 0,
          credit: returnsResult.salesReturns,
          balance: balance
        })
      }

      // 6. Individual Expenses (CREDIT - Money OUT) - EXCLUDING supplier payments
      if (expensesData.individualExpenses && expensesData.individualExpenses.length > 0) {
        expensesData.individualExpenses
          .filter((expense: any) => expense.category !== 'party_payment') // Exclude supplier payments
          .forEach((expense: any, idx: number) => {
            balance -= expense.amount
            const category = expense.custom_category || expense.category || 'Other'
            
            generalLedger.push({
              id: `expense-${idx}`,
              date: expense.created_at,
              description: `${category} - ${expense.description}`,
              voucherType: 'Expense',
              debit: 0,
              credit: expense.amount,
              balance: balance,
              supplier: expense.supplier || undefined
            })
          })
      }

      // 7. ✅ UPDATED: Supplier Payments (CREDIT - Money OUT)
      if (expensesData.supplierPayments && expensesData.supplierPayments.length > 0) {
        expensesData.supplierPayments.forEach((payment: any, idx: number) => {
          balance -= payment.amount  // ✅ CHANGED: reduces balance
          
          generalLedger.push({
            id: `supplier-payment-${idx}`,
            date: payment.created_at,
            description: payment.description || 'Supplier Payment',
            voucherType: 'Supplier Payment',
            debit: 0,                  // ✅ CHANGED
            credit: payment.amount,    // ✅ CHANGED
            balance: balance,
            supplier: payment.supplier || undefined,
            reference: `PAY-${payment.id}`
          })
        })
      }

      // Sort General Ledger by date
      const sortByDate = (a: LedgerEntry, b: LedgerEntry) => new Date(a.date).getTime() - new Date(b.date).getTime()
      generalLedger.sort(sortByDate)

      // Recalculate balances after sorting to ensure accuracy
      let runningBalance = openingBalance
      generalLedger.forEach((entry, index) => {
        if (index === 0) {
          entry.balance = runningBalance
        } else {
          runningBalance = runningBalance + entry.debit - entry.credit
          entry.balance = runningBalance
        }
      })

      // Store the final balance for comparison
      const finalBalance = generalLedger.length > 0 ? generalLedger[generalLedger.length - 1].balance : openingBalance
      setCashbookBalance(finalBalance)

      // ============================================
      // PURCHASE LEDGER
      // ============================================
      const purchaseLedger: LedgerEntry[] = []
      let purchaseBalance = openingBalance

      purchaseLedger.push({
        id: 'opening',
        date: start,
        description: 'Opening Balance (BFC)',
        voucherType: 'Opening',
        debit: purchaseBalance >= 0 ? purchaseBalance : 0,
        credit: purchaseBalance < 0 ? Math.abs(purchaseBalance) : 0,
        balance: purchaseBalance
      })

      // ❌ REMOVED: Individual Purchases - no longer tracked

      // ✅ UPDATED: Supplier Payments (CREDIT - cash going out)
      if (expensesData.supplierPayments && expensesData.supplierPayments.length > 0) {
        expensesData.supplierPayments.forEach((payment: any, idx: number) => {
          purchaseBalance -= payment.amount  // ✅ CHANGED: reduces balance
          
          purchaseLedger.push({
            id: `supplier-payment-${idx}`,
            date: payment.created_at,
            description: payment.description || 'Supplier Payment',
            voucherType: 'Supplier Payment',
            debit: 0,                  // ✅ CHANGED
            credit: payment.amount,    // ✅ CHANGED
            balance: purchaseBalance,
            supplier: payment.supplier || undefined,
            reference: `PAY-${payment.id}`
          })
        })
      }

      if (returnsResult.purchaseReturns > 0) {
        purchaseBalance += returnsResult.purchaseReturns
        purchaseLedger.push({
          id: 'purchase-returns',
          date: end,
          description: 'Purchase Returns',
          voucherType: 'Purchase Return',
          debit: returnsResult.purchaseReturns,
          credit: 0,
          balance: purchaseBalance
        })
      }

      // Sort Purchase Ledger by date
      purchaseLedger.sort(sortByDate)

      // Recalculate balances after sorting
      let purchaseRunningBalance = openingBalance
      purchaseLedger.forEach((entry, index) => {
        if (index === 0) {
          entry.balance = purchaseRunningBalance
        } else {
          purchaseRunningBalance = purchaseRunningBalance + entry.debit - entry.credit
          entry.balance = purchaseRunningBalance
        }
      })

      // ============================================
      // SALES LEDGER
      // ============================================
      const salesLedger: LedgerEntry[] = []
      let salesBalance = openingBalance

      salesLedger.push({
        id: 'opening',
        date: start,
        description: 'Opening Balance (BFC)',
        voucherType: 'Opening',
        debit: salesBalance >= 0 ? salesBalance : 0,
        credit: salesBalance < 0 ? Math.abs(salesBalance) : 0,
        balance: salesBalance
      })

      // Individual Sales - Cash in Debit
      if (salesResult.individualSales && salesResult.individualSales.length > 0) {
        salesResult.individualSales.forEach((sale: any) => {
          if (sale.cashAmount > 0) {
            salesBalance += sale.cashAmount
            salesLedger.push({
              id: `sale-cash-${sale.id}`,
              date: sale.date,
              description: `Cash Sale ${sale.invoiceNumber ? `#${sale.invoiceNumber}` : ''}`,
              voucherType: 'Sales Receipt',
              debit: sale.cashAmount,
              credit: 0,
              balance: salesBalance,
              customer: sale.customerName,
              reference: sale.invoiceNumber
            })
          }

          // Bank/Digital in Credit
          if (sale.bankAmount > 0) {
            salesBalance -= sale.bankAmount
            salesLedger.push({
              id: `sale-bank-${sale.id}`,
              date: sale.date,
              description: `Bank/Digital Payment ${sale.invoiceNumber ? `#${sale.invoiceNumber}` : ''}`,
              voucherType: 'Bank Payment',
              debit: 0,
              credit: sale.bankAmount,
              balance: salesBalance,
              customer: sale.customerName,
              reference: sale.invoiceNumber
            })
          }
        })
      }

      if (returnsResult.salesReturns > 0) {
        salesBalance -= returnsResult.salesReturns
        salesLedger.push({
          id: 'sales-returns',
          date: end,
          description: 'Sales Returns (Refunds)',
          voucherType: 'Sales Return',
          debit: 0,
          credit: returnsResult.salesReturns,
          balance: salesBalance
        })
      }

      setPurchaseEntries(purchaseLedger)
      setSalesEntries(salesLedger.sort(sortByDate))
      setGeneralEntries(generalLedger)

      // ✅ UPDATED: Calculate Balance Sheet Data (purchases = 0)
      const bsData: BalanceSheetData = {
        totalPurchaseAmount: 0,  // ✅ CHANGED: purchases no longer tracked
        totalSalesAmount: salesResult.totalSalesAmount,
        totalPartyPaymentAmount: expensesData.partyPaymentAmount,
        totalOwnExpenseAmount: expensesData.totalAmount - expensesData.partyPaymentAmount,
        totalCustomerDuesReceiveAmount: 0,
        totalIncomeAmount: incomeData.totalAmount
      }
      setBalanceSheetData(bsData)
      
    } catch (err: any) {
      console.error("Error loading ledger data:", err)
      setError(err.message || "Failed to load ledger data")
      toast({
        title: "Error",
        description: "Failed to load ledger data",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Data fetching functions
  const getSalesData = async (start: string, end: string) => {
    try {
      const { data, error } = await supabase
        .from("sales")
        .select(`
          id, 
          created_at, 
          invoice_number,
          total_amount, 
          cash_received, 
          card_received, 
          bank_transfer_received, 
          bkash_received, 
          nagad_received, 
          rocket_received, 
          upay_received,
          sale_customers(customer_name)
        `)
        .gte("created_at", start)
        .lte("created_at", `${end}T23:59:59.999Z`)
        .eq("status", "completed")
        .order("created_at", { ascending: true })

      if (error) throw error

      const sales = data || []
      
      const individualSales = sales.map(sale => {
        const cashAmount = sale.cash_received || 0
        const bankAmount = (sale.card_received || 0) + (sale.bank_transfer_received || 0) + 
                          (sale.bkash_received || 0) + (sale.nagad_received || 0) + 
                          (sale.rocket_received || 0) + (sale.upay_received || 0)
        
        return {
          id: sale.id,
          date: sale.created_at,
          invoiceNumber: sale.invoice_number,
          cashAmount,
          bankAmount,
          customerName: sale.sale_customers?.[0]?.customer_name || null
        }
      })

      const totals = sales.reduce((acc, sale) => {
        const totalAmount = sale.total_amount || 0
        const cashAmount = sale.cash_received || 0
        const bankAmount = (sale.card_received || 0) + (sale.bank_transfer_received || 0) + 
                          (sale.bkash_received || 0) + (sale.nagad_received || 0) + 
                          (sale.rocket_received || 0) + (sale.upay_received || 0)
        
        return {
          totalSalesAmount: acc.totalSalesAmount + totalAmount,
          cashAmount: acc.cashAmount + cashAmount,
          bankAmount: acc.bankAmount + bankAmount
        }
      }, { totalSalesAmount: 0, cashAmount: 0, bankAmount: 0 })

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
        individualSales: []
      }
    }
  }

  const getReturnsData = async (start: string, end: string) => {
    try {
      const [salesReturnsResult, purchaseReturnsResult] = await Promise.all([
        supabase
          .from("sales_returns")
          .select("total_refund_amount")
          .gte("return_date", start)
          .lte("return_date", `${end}T23:59:59.999Z`)
          .eq("status", "processed"),
        supabase
          .from("purchase_returns")
          .select("total_credit_amount")
          .gte("return_date", start)
          .lte("return_date", end)
          .eq("status", "processed")
      ])

      const salesReturns = (salesReturnsResult.data || []).reduce(
        (sum, ret) => sum + (ret.total_refund_amount || 0), 0
      )
      
      const purchaseReturns = (purchaseReturnsResult.data || []).reduce(
        (sum, ret) => sum + (ret.total_credit_amount || 0), 0
      )

      return { salesReturns, purchaseReturns }
    } catch (error) {
      console.error("getReturnsData error:", error)
      return { salesReturns: 0, purchaseReturns: 0 }
    }
  }

  const getExpensesData = async (start: string, end: string) => {
    try {
      const { data, error } = await supabase
        .from("expenses")
        .select("id, amount, category, custom_category, description, created_at")
        .gte("date", start)
        .lte("date", end)
        .order("created_at", { ascending: true })

      if (error) throw error

      const individualExpenses = (data || []).map(expense => {
        // Extract supplier name from description for party_payment
        let supplierName = null
        if (expense.category === 'party_payment' && expense.description) {
          const desc = expense.description.trim()
          
          // Try multiple patterns to extract supplier name
          
          // Pattern 1: "Payment to [Supplier Name]"
          let match = desc.match(/^Payment to\s+(.+?)(?:\s*-|$)/i)
          if (match) {
            supplierName = match[1].trim()
          }
          
          // Pattern 2: "Paid to [Supplier Name]"
          if (!supplierName) {
            match = desc.match(/^Paid to\s+(.+?)(?:\s*-|$)/i)
            if (match) {
              supplierName = match[1].trim()
            }
          }
          
          // Pattern 3: "[Supplier Name] - Payment" or "[Supplier Name] Payment"
          if (!supplierName) {
            match = desc.match(/^(.+?)(?:\s*-\s*Payment|\s+Payment)/i)
            if (match) {
              supplierName = match[1].trim()
            }
          }
          
          // Pattern 4: If description doesn't have keywords, use first substantial part
          if (!supplierName && desc.length > 0) {
            // Remove common keywords and take first part
            const cleaned = desc
              .replace(/^(payment|paid|pay|to|from|for)\s+/gi, '')
              .split(/[-–—:,]/)[0] // Split by common delimiters
              .trim()
            
            if (cleaned.length > 2) {
              supplierName = cleaned
            }
          }
          
          // Pattern 5: Last resort - use full description if it's not too long
          if (!supplierName && desc.length <= 50) {
            supplierName = desc
          }
        }
        
        return {
          id: expense.id,
          amount: expense.amount || 0,
          category: expense.category || 'Other',
          custom_category: expense.custom_category,
          description: expense.description || 'No description',
          created_at: expense.created_at,
          supplier: supplierName // Add extracted supplier name
        }
      })

      const totalAmount = individualExpenses.reduce((sum, exp) => sum + exp.amount, 0)
      const partyPaymentAmount = individualExpenses
        .filter(exp => exp.category === 'party_payment')
        .reduce((sum, exp) => sum + exp.amount, 0)
      
      // Separate supplier payments for Purchase Ledger
      const supplierPayments = individualExpenses.filter(exp => exp.category === 'party_payment')

      return { 
        individualExpenses,
        totalAmount,
        partyPaymentAmount,
        supplierPayments // New: array of supplier payment expenses
      }
    } catch (error) {
      console.error("getExpensesData error:", error)
      return { 
        individualExpenses: [],
        totalAmount: 0,
        partyPaymentAmount: 0,
        supplierPayments: []
      }
    }
  }

const getIncomeData = async (start: string, end: string) => {
  try {
    const { data, error } = await supabase
      .from("income_owner")
      .select(`
        id, 
        amount, 
        income_type, 
        destination_type, 
        description, 
        created_at,
        supplier_id,
        suppliers (
          id,
          name
        )
      `)
      .gte("date", start)
      .lte("date", end)
      .order("created_at", { ascending: true })

    if (error) throw error

    const individualIncomes = (data || []).map((income: any) => ({
      id: income.id,
      amount: income.amount || 0,
      income_type: income.income_type || 'owner_income',
      destination_type: income.destination_type || 'cash',
      description: income.description || '',
      created_at: income.created_at,
      supplier_id: income.supplier_id || null,
      supplier_name: income.suppliers?.name || null
    }))

    const totalAmount = individualIncomes.reduce((sum, income) => sum + income.amount, 0)

    return {
      individualIncomes,
      totalAmount
    }
  } catch (error) {
    console.error("getIncomeData error:", error)
    return {
      individualIncomes: [],
      totalAmount: 0
    }
  }
}

  // ✅ UPDATED: getPreviousBalance - removed purchases, updated calculations
  const getPreviousBalance = async (date: string) => {
    try {
      const [salesResult, returnsResult, expensesResult, incomeResult] = await Promise.all([
        getSalesData('2000-01-01', date),
        // ❌ REMOVED: getPurchaseData('2000-01-01', date)
        getReturnsData('2000-01-01', date),
        getExpensesData('2000-01-01', date),
        getIncomeData('2000-01-01', date)
      ])

      // ✅ UPDATED: Total debits (money in) - excluding supplier payments
      const totalDebits = salesResult.cashAmount + returnsResult.purchaseReturns + 
                         incomeResult.totalAmount
      
      // ✅ UPDATED: Total credits (money out) - including ALL expenses (which includes supplier payments)
      const totalCredits = returnsResult.salesReturns + 
                          expensesResult.totalAmount +  // ALL expenses including supplier payments
                          salesResult.bankAmount
      // ❌ REMOVED: purchaseResult.totalAmount

      return totalDebits - totalCredits
    } catch (error) {
      console.error("getPreviousBalance error:", error)
      return 0
    }
  }

  // Get unique suppliers from entries
  const getUniqueSuppliers = (entries: LedgerEntry[]) => {
    const suppliers = entries
      .map(e => e.supplier)
      .filter((s): s is string => Boolean(s) && s.trim() !== '')
    return Array.from(new Set(suppliers)).sort()
  }

  // Filtered entries based on search and supplier selection
  const filteredPurchaseEntries = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    let filtered = purchaseEntries
    
    // Apply supplier filter
    if (selectedSupplierPurchase && selectedSupplierPurchase !== "all") {
      filtered = filtered.filter(e => e.supplier === selectedSupplierPurchase)
    }
    
    // Apply search filter
    if (term) {
      filtered = filtered.filter(e => 
        e.description.toLowerCase().includes(term) ||
        (e.supplier && e.supplier.toLowerCase().includes(term)) ||
        (e.reference && e.reference.toLowerCase().includes(term)) ||
        e.voucherType.toLowerCase().includes(term)
      )
    }
    
    return filtered
  }, [purchaseEntries, searchTerm, selectedSupplierPurchase])

  const filteredSalesEntries = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    if (!term) return salesEntries
    
    return salesEntries.filter(e => 
      e.description.toLowerCase().includes(term) ||
      (e.customer && e.customer.toLowerCase().includes(term)) ||
      (e.reference && e.reference.toLowerCase().includes(term)) ||
      e.voucherType.toLowerCase().includes(term)
    )
  }, [salesEntries, searchTerm])

  const filteredGeneralEntries = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    let filtered = generalEntries
    
    // Apply supplier filter
    if (selectedSupplierGeneral && selectedSupplierGeneral !== "all") {
      filtered = filtered.filter(e => e.supplier === selectedSupplierGeneral)
    }
    
    // Apply search filter
    if (term) {
      filtered = filtered.filter(e => 
        e.description.toLowerCase().includes(term) ||
        (e.supplier && e.supplier.toLowerCase().includes(term)) ||
        (e.customer && e.customer.toLowerCase().includes(term)) ||
        (e.reference && e.reference.toLowerCase().includes(term)) ||
        e.voucherType.toLowerCase().includes(term)
      )
    }
    
    return filtered
  }, [generalEntries, searchTerm, selectedSupplierGeneral])

  // Calculate totals for P&L
  const profitLoss = useMemo(() => {
    const revenue = generalEntries
      .filter(e => e.voucherType === 'Sales Receipt' || e.voucherType === 'Income')
      .reduce((sum, e) => sum + e.debit, 0)
    
    const expenses = generalEntries
      .filter(e => e.voucherType === 'Expense' || e.voucherType === 'Supplier Payment' ||
                   e.voucherType === 'Sales Return' || e.voucherType === 'Bank Payment')
      .reduce((sum, e) => sum + e.credit, 0)
    
    return { revenue, expenses, net: revenue - expenses }
  }, [generalEntries])

  // Helper function to get expense category display
  const getExpenseCategory = (expense: any) => {
    if (expense.category === 'party_payment') return 'Supplier Payment'
    return expense.custom_category || expense.category || 'Other'
  }

  // Print functions
  const handlePrintPurchaseLedger = () => {
    printLedger('Purchase Ledger', filteredPurchaseEntries, true)
  }

  const handlePrintSalesLedger = () => {
    printLedger('Sales Ledger', filteredSalesEntries, true)
  }

  const handlePrintGeneralLedger = () => {
    printLedger('General Ledger', filteredGeneralEntries, true)
  }

  const handlePrintExpenseVoucher = () => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const content = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Expense Voucher</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 15px; font-size: 12px; }
          .header { text-align: center; margin-bottom: 20px; }
          .company-name { font-size: 16px; font-weight: bold; margin-bottom: 5px; }
          .title { font-size: 14px; font-weight: bold; margin-bottom: 5px; }
          .period { font-size: 11px; margin-bottom: 10px; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; border: 2px solid black; }
          th, td { border: 1px solid black; padding: 6px; text-align: left; font-size: 11px; }
          th { background-color: #f0f0f0; font-weight: bold; text-align: center; }
          .amount-cell { text-align: right; font-family: monospace; }
          .total-row { font-weight: bold; background-color: #f0f0f0; }
          @media print { body { margin: 10px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-name">STAR POWER</div>
          <div class="title">Expense Voucher</div>
          <div class="period">${getDateRangeDescription()}</div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Category</th>
              <th>Description</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            ${expensesResult.individualExpenses.map((expense: any) => `
              <tr>
                <td>${new Date(expense.created_at).toLocaleDateString('en-GB')}</td>
                <td>${getExpenseCategory(expense)}</td>
                <td>${expense.description}</td>
                <td class="amount-cell">${expense.amount.toFixed(2)}</td>
              </tr>
            `).join('')}
            <tr class="total-row">
              <td colspan="3">Total Expenses</td>
              <td class="amount-cell">${expensesResult.totalAmount.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
      </body>
      </html>
    `

    printWindow.document.write(content)
    printWindow.document.close()
    printWindow.print()
  }

  const handlePrintIncomeVoucher = () => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    // ✅ UPDATED: Changed "Party Income" to "Supplier Income"
    const content = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Income Voucher</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 15px; font-size: 12px; }
          .header { text-align: center; margin-bottom: 20px; }
          .company-name { font-size: 16px; font-weight: bold; margin-bottom: 5px; }
          .title { font-size: 14px; font-weight: bold; margin-bottom: 5px; }
          .period { font-size: 11px; margin-bottom: 10px; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; border: 2px solid black; }
          th, td { border: 1px solid black; padding: 6px; text-align: left; font-size: 11px; }
          th { background-color: #f0f0f0; font-weight: bold; text-align: center; }
          .amount-cell { text-align: right; font-family: monospace; }
          .total-row { font-weight: bold; background-color: #f0f0f0; }
          @media print { body { margin: 10px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-name">STAR POWER</div>
          <div class="title">Income Voucher</div>
          <div class="period">${getDateRangeDescription()}</div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Type</th>
              <th>Destination</th>
              <th>Description</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            ${incomeResult.individualIncomes.map((income: any) => `
              <tr>
                <td>${new Date(income.created_at).toLocaleDateString('en-GB')}</td>
                <td>${income.income_type === 'owner_income' ? 'Owner Income' : 'Supplier Income'}</td>
                <td>${income.destination_type === 'bank' ? 'Bank' : 'Cash'}</td>
                <td>${income.description || '—'}</td>
                <td class="amount-cell">${income.amount.toFixed(2)}</td>
              </tr>
            `).join('')}
            <tr class="total-row">
              <td colspan="4">Total Income</td>
              <td class="amount-cell">${incomeResult.totalAmount.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
      </body>
      </html>
    `

    printWindow.document.write(content)
    printWindow.document.close()
    printWindow.print()
  }

  const handlePrintProfitLoss = () => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const content = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Profit & Loss Statement</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .company-name { font-size: 20px; font-weight: bold; margin-bottom: 10px; }
          .period { font-size: 14px; margin-bottom: 20px; }
          .section { margin: 20px 0; }
          .section-title { font-size: 16px; font-weight: bold; margin-bottom: 10px; border-bottom: 2px solid black; padding-bottom: 5px; }
          .row { display: flex; justify-content: space-between; padding: 8px 0; }
          .total-row { font-weight: bold; border-top: 2px solid black; padding-top: 10px; margin-top: 10px; }
          .net-profit { font-size: 18px; font-weight: bold; text-align: center; margin-top: 30px; padding: 15px; background: #f0f0f0; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-name">STAR POWER</div>
          <div>Profit & Loss Statement</div>
          <div class="period">${getDateRangeDescription()}</div>
        </div>

        <div class="section">
          <div class="section-title">Revenue</div>
          <div class="row">
            <span>Sales Revenue & Income</span>
            <span>৳${profitLoss.revenue.toFixed(2)}</span>
          </div>
          <div class="row total-row">
            <span>Total Revenue</span>
            <span>৳${profitLoss.revenue.toFixed(2)}</span>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Expenses</div>
          <div class="row">
            <span>Total Expenses</span>
            <span>৳${profitLoss.expenses.toFixed(2)}</span>
          </div>
          <div class="row total-row">
            <span>Total Expenses</span>
            <span>৳${profitLoss.expenses.toFixed(2)}</span>
          </div>
        </div>

        <div class="net-profit">
          Net Profit: ৳${profitLoss.net.toFixed(2)}
        </div>
      </body>
      </html>
    `

    printWindow.document.write(content)
    printWindow.document.close()
    printWindow.print()
  }

  const handlePrintBalanceSheet = () => {
    if (!balanceSheetData) return

    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const content = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Balance Sheet</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .company-name { font-size: 20px; font-weight: bold; margin-bottom: 10px; }
          .period { font-size: 14px; margin-bottom: 10px; color: green; }
          .title { font-size: 18px; font-weight: bold; margin-bottom: 20px; color: purple; }
          .section { margin: 20px 0; }
          .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #ccc; }
          .row-label { font-weight: normal; }
          .row-value { font-weight: normal; text-align: right; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="period">${getDateRangeDescription()}</div>
          <div class="title">BALANCE SHEET</div>
        </div>

        <div class="section">
          <div class="row">
            <span class="row-label">Total Purchase Amount</span>
            <span class="row-value">${balanceSheetData.totalPurchaseAmount.toFixed(2)}</span>
          </div>
          <div class="row">
            <span class="row-label">Total Sales Amount</span>
            <span class="row-value">${balanceSheetData.totalSalesAmount.toFixed(2)}</span>
          </div>
          <div class="row">
            <span class="row-label">Total Supplier Payment Amount</span>
            <span class="row-value">${balanceSheetData.totalPartyPaymentAmount.toFixed(2)}</span>
          </div>
          <div class="row">
            <span class="row-label">Total Own Expense Amount</span>
            <span class="row-value">${balanceSheetData.totalOwnExpenseAmount.toFixed(2)}</span>
          </div>
          <div class="row">
            <span class="row-label">Total Customer Dues Receive Amt</span>
            <span class="row-value">${balanceSheetData.totalCustomerDuesReceiveAmount.toFixed(2)}</span>
          </div>
          <div class="row">
            <span class="row-label">Total Income Amount</span>
            <span class="row-value">${balanceSheetData.totalIncomeAmount.toFixed(2)}</span>
          </div>
        </div>
      </body>
      </html>
    `

    printWindow.document.write(content)
    printWindow.document.close()
    printWindow.print()
  }

  const printLedger = (title: string, entries: LedgerEntry[], includeParty: boolean) => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const content = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${title}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 15px; font-size: 12px; }
          .header { text-align: center; margin-bottom: 20px; }
          .company-name { font-size: 16px; font-weight: bold; margin-bottom: 5px; }
          .title { font-size: 14px; font-weight: bold; margin-bottom: 5px; }
          .period { font-size: 11px; margin-bottom: 10px; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; border: 2px solid black; }
          th, td { border: 1px solid black; padding: 6px; text-align: left; font-size: 11px; }
          th { background-color: #f0f0f0; font-weight: bold; text-align: center; }
          .amount-cell { text-align: right; font-family: monospace; }
          .total-row { font-weight: bold; background-color: #f0f0f0; }
          @media print { body { margin: 10px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-name">STAR POWER</div>
          <div class="title">${title}</div>
          <div class="period">${getDateRangeDescription()}</div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Date</th>
              ${includeParty ? '<th>Supplier</th>' : ''}
              <th>Description</th>
              <th>Voucher Type</th>
              <th>Dr.</th>
              <th>Cr.</th>
              <th>Balance</th>
            </tr>
          </thead>
          <tbody>
            ${entries.map(entry => `
              <tr>
                <td>${new Date(entry.date).toLocaleDateString('en-GB')}</td>
                ${includeParty ? `<td>${entry.supplier || '—'}</td>` : ''}
                <td>${entry.description}</td>
                <td>${entry.voucherType}</td>
                <td class="amount-cell">${entry.debit > 0 ? entry.debit.toFixed(2) : ''}</td>
                <td class="amount-cell">${entry.credit > 0 ? entry.credit.toFixed(2) : ''}</td>
                <td class="amount-cell">${entry.balance.toFixed(2)}</td>
              </tr>
            `).join('')}
            <tr class="total-row">
              <td colspan="${includeParty ? '4' : '3'}">Total</td>
              <td class="amount-cell">${entries.reduce((s, e) => s + e.debit, 0).toFixed(2)}</td>
              <td class="amount-cell">${entries.reduce((s, e) => s + e.credit, 0).toFixed(2)}</td>
              <td class="amount-cell">${entries.length > 0 ? entries[entries.length - 1].balance.toFixed(2) : '0.00'}</td>
            </tr>
          </tbody>
        </table>

        <div style="text-align: center; margin-top: 20px; font-weight: bold; font-size: 14px;">
          Closing Balance (Cash In Hand): ৳${entries.length > 0 ? entries[entries.length - 1].balance.toFixed(2) : '0.00'}
        </div>
      </body>
      </html>
    `

    printWindow.document.write(content)
    printWindow.document.close()
    printWindow.print()
  }

  // Export CSV
  const handleExportCSV = (type: 'purchase' | 'sales' | 'general' | 'expense' | 'income') => {
    let filename = ''
    let rows: string[] = []
    
    try {
      switch(type) {
        case 'purchase':
          filename = 'purchase-ledger'
          rows = filteredPurchaseEntries.map(e => [
            new Date(e.date).toLocaleDateString(),
            e.supplier || '-',
            `"${e.description}"`,
            e.voucherType,
            e.debit || 0,
            e.credit || 0,
            e.balance.toFixed(2)
          ].join(','))
          break
          
        case 'sales':
          filename = 'sales-ledger'
          rows = filteredSalesEntries.map(e => [
            new Date(e.date).toLocaleDateString(),
            e.customer || '-',
            `"${e.description}"`,
            e.voucherType,
            e.debit || 0,
            e.credit || 0,
            e.balance.toFixed(2)
          ].join(','))
          break
          
        case 'general':
          filename = 'general-ledger'
          rows = filteredGeneralEntries.map(e => [
            new Date(e.date).toLocaleDateString(),
            e.supplier || '-',
            `"${e.description}"`,
            e.voucherType,
            e.debit || 0,
            e.credit || 0,
            e.balance.toFixed(2)
          ].join(','))
          break
          
        case 'expense':
          filename = 'expense-voucher'
          rows = expensesResult.individualExpenses.map((e: any) => [
            new Date(e.created_at).toLocaleDateString(),
            getExpenseCategory(e),
            `"${e.description}"`,
            e.amount.toFixed(2)
          ].join(','))
          break
          
        case 'income':
          filename = 'income-voucher'
          rows = incomeResult.individualIncomes.map((e: any) => [
            new Date(e.created_at).toLocaleDateString(),
            e.income_type === 'owner_income' ? 'Owner Income' : 'Supplier Income',  // ✅ CHANGED
            e.destination_type === 'bank' ? 'Bank' : 'Cash',
            `"${e.description || '-'}"`,
            e.amount.toFixed(2)
          ].join(','))
          break
      }
      
      let header = ''
      if (type === 'expense') {
        header = 'Date,Category,Description,Amount'
      } else if (type === 'income') {
        header = 'Date,Type,Destination,Description,Amount'
      } else if (type === 'general') {
        header = 'Date,Supplier,Description,Voucher Type,Debit,Credit,Balance'
      } else {
        header = 'Date,Party,Description,Voucher Type,Debit,Credit,Balance'
      }
      
      const csv = [header, ...rows].join('\n')
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${filename}-${new Date().toISOString().slice(0,10)}.csv`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      
      toast({
        title: "Export successful",
        description: `Exported ${rows.length} entries`
      })
    } catch (err) {
      toast({
        title: "Export failed",
        description: "Could not export data",
        variant: "destructive"
      })
    }
  }

  const formatCurrency = (amount: number) => `৳${amount.toFixed(2)}`

  if (loading) {
    return (
      <div className="flex-1 space-y-6 p-8 pt-6">
        <div className="flex items-center justify-center h-32">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading ledger…</span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Accounting Ledger</h1>
          <p className="text-muted-foreground">Complete accounting records with detailed transactions</p>
        </div>
        <Button variant="outline" onClick={() => dateFilterEnabled && loadLedgerData(startDate || '2000-01-01', endDate || today)} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Date Range Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Select Date Range
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="enable-date-filter"
                checked={dateFilterEnabled}
                onChange={(e) => setDateFilterEnabled(e.target.checked)}
                className="h-4 w-4"
                title="Enable date filter"
              />
              <Label htmlFor="enable-date-filter" className="cursor-pointer">
                Enable Date Filter
              </Label>
            </div>
            
            {dateFilterEnabled && (
              <>
                <div className="flex items-center gap-4 flex-wrap">
                  <div>
                    <Label htmlFor="start-date">From Date (optional)</Label>
                    <Input
                      id="start-date"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-48"
                    />
                  </div>
                  <div>
                    <Label htmlFor="end-date">To Date (optional)</Label>
                    <Input
                      id="end-date"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-48"
                    />
                  </div>
                  <div className="flex-1 mt-6">
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="search"
                        placeholder="Search transactions..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8"
                      />
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setStartDate(today)
                      setEndDate(today)
                    }}
                    className="mt-6"
                  >
                    Today
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setStartDate("")
                      setEndDate("")
                    }}
                    className="mt-6"
                  >
                    Clear Dates
                  </Button>
                </div>
                <div className="text-sm text-muted-foreground">
                  <strong>Showing: </strong>{getDateRangeDescription()}
                </div>
              </>
            )}
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

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(profitLoss.revenue)}</div>
            <p className="text-xs text-muted-foreground">Sales + Income</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(profitLoss.expenses)}</div>
            <p className="text-xs text-muted-foreground">All Operating Costs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${profitLoss.net >= 0 ? "text-green-600" : "text-red-600"}`}>
              {formatCurrency(profitLoss.net)}
            </div>
            <p className="text-xs text-muted-foreground">Revenue - Expenses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cash In Hand</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(cashbookBalance)}
            </div>
            <p className="text-xs text-muted-foreground">= Day Cashbook balance</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="general-ledger" className="space-y-6">
        <TabsList>
          <TabsTrigger value="general-ledger">General Ledger</TabsTrigger>
          <TabsTrigger value="purchase-ledger">Purchase Ledger</TabsTrigger>
          <TabsTrigger value="sales-ledger">Sales Ledger</TabsTrigger>
          <TabsTrigger value="expense-voucher">Expense Voucher</TabsTrigger>
          <TabsTrigger value="income-voucher">Income Voucher</TabsTrigger>
          <TabsTrigger value="profit-loss">Profit & Loss</TabsTrigger>
          <TabsTrigger value="balance-sheet">Balance Sheet</TabsTrigger>
        </TabsList>

        {/* General Ledger */}
        <TabsContent value="general-ledger" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>General Ledger</CardTitle>
                  <CardDescription>All individual transactions with complete details</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => handleExportCSV('general')}>
                    <Download className="mr-2 h-4 w-4" />
                    Export
                  </Button>
                  <Button onClick={handlePrintGeneralLedger}>
                    <Printer className="mr-2 h-4 w-4" />
                    Print
                  </Button>
                </div>
              </div>
              {/* Supplier Filter Dropdown */}
              <div className="mt-4 flex items-center gap-4">
                <Label htmlFor="supplier-filter-general" className="whitespace-nowrap">Filter by Supplier:</Label>
                <Select value={selectedSupplierGeneral} onValueChange={setSelectedSupplierGeneral}>
                  <SelectTrigger id="supplier-filter-general" className="w-64">
                    <SelectValue placeholder="All Suppliers" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Suppliers</SelectItem>
                    {getUniqueSuppliers(generalEntries).filter(s => s && s.trim() !== '').map(supplier => (
                      <SelectItem key={supplier} value={supplier}>
                        {supplier}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedSupplierGeneral !== "all" && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setSelectedSupplierGeneral("all")}
                  >
                    Clear
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Voucher Type</TableHead>
                    <TableHead className="text-right">Debit (Dr.)</TableHead>
                    <TableHead className="text-right">Credit (Cr.)</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredGeneralEntries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>{new Date(entry.date).toLocaleDateString('en-GB')}</TableCell>
                      <TableCell>{entry.supplier || '—'}</TableCell>
                      <TableCell className="max-w-md">{entry.description}</TableCell>
                      <TableCell>
                        <Badge variant={
                          entry.voucherType === 'Supplier Payment' ? 'secondary' :
                          entry.voucherType === 'Sales Receipt' ? 'outline' :
                          entry.voucherType === 'Income' ? 'outline' :
                          entry.voucherType === 'Expense' ? 'secondary' :
                          'outline'
                        }>
                          {entry.voucherType}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-green-600 font-mono">
                        {entry.debit > 0 ? formatCurrency(entry.debit) : '—'}
                      </TableCell>
                      <TableCell className="text-right text-red-600 font-mono">
                        {entry.credit > 0 ? formatCurrency(entry.credit) : '—'}
                      </TableCell>
                      <TableCell className="text-right font-medium font-mono">
                        {formatCurrency(entry.balance)}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-muted font-bold">
                    <TableCell colSpan={4}>Total</TableCell>
                    <TableCell className="text-right text-green-600 font-mono">
                      {formatCurrency(filteredGeneralEntries.reduce((s, e) => s + e.debit, 0))}
                    </TableCell>
                    <TableCell className="text-right text-red-600 font-mono">
                      {formatCurrency(filteredGeneralEntries.reduce((s, e) => s + e.credit, 0))}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {filteredGeneralEntries.length > 0 ? formatCurrency(filteredGeneralEntries[filteredGeneralEntries.length - 1].balance) : formatCurrency(0)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-sm font-semibold text-blue-900">
                  ✓ {selectedSupplierGeneral !== "all" ? `Showing transactions for: ${selectedSupplierGeneral}` : 'Showing all transactions'}
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  {filteredGeneralEntries.length > 0 
                    ? `Closing Balance: ${formatCurrency(filteredGeneralEntries[filteredGeneralEntries.length - 1].balance)}`
                    : 'No transactions to display'}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Purchase Ledger */}
        <TabsContent value="purchase-ledger" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Purchase Ledger</CardTitle>
                  <CardDescription>Supplier payments and returns</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => handleExportCSV('purchase')}>
                    <Download className="mr-2 h-4 w-4" />
                    Export
                  </Button>
                  <Button onClick={handlePrintPurchaseLedger}>
                    <Printer className="mr-2 h-4 w-4" />
                    Print
                  </Button>
                </div>
              </div>
              {/* Supplier Filter Dropdown */}
              <div className="mt-4 flex items-center gap-4">
                <Label htmlFor="supplier-filter-purchase" className="whitespace-nowrap">Filter by Supplier:</Label>
                <Select value={selectedSupplierPurchase} onValueChange={setSelectedSupplierPurchase}>
                  <SelectTrigger id="supplier-filter-purchase" className="w-64">
                    <SelectValue placeholder="All Suppliers" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Suppliers</SelectItem>
                    {getUniqueSuppliers(purchaseEntries).filter(s => s && s.trim() !== '').map(supplier => (
                      <SelectItem key={supplier} value={supplier}>
                        {supplier}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedSupplierPurchase !== "all" && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setSelectedSupplierPurchase("all")}
                  >
                    Clear
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Voucher Type</TableHead>
                    <TableHead className="text-right">Debit</TableHead>
                    <TableHead className="text-right">Credit</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPurchaseEntries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>{new Date(entry.date).toLocaleDateString('en-GB')}</TableCell>
                      <TableCell>{entry.supplier || '—'}</TableCell>
                      <TableCell>{entry.description}</TableCell>
                      <TableCell>
                        <Badge variant={
                          entry.voucherType === 'Supplier Payment' ? 'secondary' :
                          'outline'
                        }>
                          {entry.voucherType}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-green-600">
                        {entry.debit > 0 ? formatCurrency(entry.debit) : '—'}
                      </TableCell>
                      <TableCell className="text-right text-red-600">
                        {entry.credit > 0 ? formatCurrency(entry.credit) : '—'}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(entry.balance)}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-muted font-bold">
                    <TableCell colSpan={4}>Total</TableCell>
                    <TableCell className="text-right text-green-600">
                      {formatCurrency(filteredPurchaseEntries.reduce((s, e) => s + e.debit, 0))}
                    </TableCell>
                    <TableCell className="text-right text-red-600">
                      {formatCurrency(filteredPurchaseEntries.reduce((s, e) => s + e.credit, 0))}
                    </TableCell>
                    <TableCell className="text-right">
                      {filteredPurchaseEntries.length > 0 ? formatCurrency(filteredPurchaseEntries[filteredPurchaseEntries.length - 1].balance) : formatCurrency(0)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
              {selectedSupplierPurchase !== "all" && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-sm font-semibold text-blue-900">
                    ✓ Showing transactions for: {selectedSupplierPurchase}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sales Ledger */}
        <TabsContent value="sales-ledger" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Sales Ledger</CardTitle>
                  <CardDescription>All sales transactions with customer and payment details</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => handleExportCSV('sales')}>
                    <Download className="mr-2 h-4 w-4" />
                    Export
                  </Button>
                  <Button onClick={handlePrintSalesLedger}>
                    <Printer className="mr-2 h-4 w-4" />
                    Print
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Voucher Type</TableHead>
                    <TableHead className="text-right">Debit</TableHead>
                    <TableHead className="text-right">Credit</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSalesEntries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>{new Date(entry.date).toLocaleDateString('en-GB')}</TableCell>
                      <TableCell>{entry.customer || '—'}</TableCell>
                      <TableCell className="max-w-md">{entry.description}</TableCell>
                      <TableCell>
                        <Badge variant={entry.voucherType === 'Sales Receipt' ? 'outline' : entry.voucherType === 'Bank Payment' ? 'secondary' : 'destructive'}>
                          {entry.voucherType}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-green-600">
                        {entry.debit > 0 ? formatCurrency(entry.debit) : '—'}
                      </TableCell>
                      <TableCell className="text-right text-red-600">
                        {entry.credit > 0 ? formatCurrency(entry.credit) : '—'}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(entry.balance)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Expense Voucher Tab */}
        <TabsContent value="expense-voucher" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Expense Voucher</CardTitle>
                  <CardDescription>All expense transactions for the period</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => handleExportCSV('expense')}>
                    <Download className="mr-2 h-4 w-4" />
                    Export
                  </Button>
                  <Button onClick={handlePrintExpenseVoucher}>
                    <Printer className="mr-2 h-4 w-4" />
                    Print
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expensesResult.individualExpenses.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
                        No expenses found for this period
                      </TableCell>
                    </TableRow>
                  ) : (
                    <>
                      {expensesResult.individualExpenses.map((expense: any, idx: number) => (
                        <TableRow key={`expense-${idx}`}>
                          <TableCell>{new Date(expense.created_at).toLocaleDateString('en-GB')}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{getExpenseCategory(expense)}</Badge>
                          </TableCell>
                          <TableCell>{expense.description}</TableCell>
                          <TableCell className="text-right font-medium text-red-600">
                            {formatCurrency(expense.amount)}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="font-bold bg-muted">
                        <TableCell colSpan={3}>Total Expenses</TableCell>
                        <TableCell className="text-right text-red-600">
                          {formatCurrency(expensesResult.totalAmount)}
                        </TableCell>
                      </TableRow>
                    </>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Income Voucher Tab */}
        <TabsContent value="income-voucher" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Income Voucher</CardTitle>
                  <CardDescription>All income transactions for the period</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => handleExportCSV('income')}>
                    <Download className="mr-2 h-4 w-4" />
                    Export
                  </Button>
                  <Button onClick={handlePrintIncomeVoucher}>
                    <Printer className="mr-2 h-4 w-4" />
                    Print
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Destination</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {incomeResult.individualIncomes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        No income found for this period
                      </TableCell>
                    </TableRow>
                  ) : (
                    <>
                      {incomeResult.individualIncomes.map((income: any, idx: number) => (
                        <TableRow key={`income-${idx}`}>
                          <TableCell>{new Date(income.created_at).toLocaleDateString('en-GB')}</TableCell>
                          <TableCell>
                            <Badge variant={income.income_type === 'owner_income' ? 'default' : 'secondary'}>
                              {income.income_type === 'owner_income' ? 'Owner Income' : 'Supplier Income'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {income.destination_type === 'bank' ? 'Bank' : 'Cash'}
                            </Badge>
                          </TableCell>
                          <TableCell>{income.description || '—'}</TableCell>
                          <TableCell className="text-right font-medium text-green-600">
                            {formatCurrency(income.amount)}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="font-bold bg-muted">
                        <TableCell colSpan={4}>Total Income</TableCell>
                        <TableCell className="text-right text-green-600">
                          {formatCurrency(incomeResult.totalAmount)}
                        </TableCell>
                      </TableRow>
                    </>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Profit & Loss */}
        <TabsContent value="profit-loss" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Profit & Loss Statement</CardTitle>
                  <CardDescription>Revenue and expense summary</CardDescription>
                </div>
                <Button onClick={handlePrintProfitLoss}>
                  <Printer className="mr-2 h-4 w-4" />
                  Print
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Revenue</h3>
                  <div className="flex justify-between py-2">
                    <span>Sales Revenue & Income</span>
                    <span className="font-medium">{formatCurrency(profitLoss.revenue)}</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between font-semibold">
                    <span>Total Revenue</span>
                    <span>{formatCurrency(profitLoss.revenue)}</span>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">Expenses</h3>
                  <div className="flex justify-between py-2">
                    <span>Total Expenses</span>
                    <span className="font-medium">{formatCurrency(profitLoss.expenses)}</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between font-semibold">
                    <span>Total Expenses</span>
                    <span>{formatCurrency(profitLoss.expenses)}</span>
                  </div>
                </div>

                <div className="border-t-2 pt-4 flex justify-between text-xl font-bold">
                  <span>Net Profit</span>
                  <span className={profitLoss.net >= 0 ? "text-green-600" : "text-red-600"}>
                    {formatCurrency(profitLoss.net)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Balance Sheet */}
        <TabsContent value="balance-sheet" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Balance Sheet</CardTitle>
                  <CardDescription>Financial summary for the period</CardDescription>
                </div>
                <Button onClick={handlePrintBalanceSheet}>
                  <Printer className="mr-2 h-4 w-4" />
                  Print
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {balanceSheetData && (
                <div className="space-y-4">
                  <div className="text-center mb-6">
                    <div className="text-sm text-green-600 mb-2">
                      {getDateRangeDescription()}
                    </div>
                    <div className="text-xl font-bold text-purple-600">BALANCE SHEET</div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between py-3 border-b">
                      <span className="font-medium">Total Purchase Amount</span>
                      <span className="font-semibold">{formatCurrency(balanceSheetData.totalPurchaseAmount)}</span>
                    </div>
                    <div className="flex justify-between py-3 border-b">
                      <span className="font-medium">Total Sales Amount</span>
                      <span className="font-semibold">{formatCurrency(balanceSheetData.totalSalesAmount)}</span>
                    </div>
                    <div className="flex justify-between py-3 border-b">
                      <span className="font-medium">Total Supplier Payment Amount</span>
                      <span className="font-semibold">{formatCurrency(balanceSheetData.totalPartyPaymentAmount)}</span>
                    </div>
                    <div className="flex justify-between py-3 border-b">
                      <span className="font-medium">Total Own Expense Amount</span>
                      <span className="font-semibold">{formatCurrency(balanceSheetData.totalOwnExpenseAmount)}</span>
                    </div>
                    <div className="flex justify-between py-3 border-b">
                      <span className="font-medium">Total Customer Dues Receive Amt</span>
                      <span className="font-semibold">{formatCurrency(balanceSheetData.totalCustomerDuesReceiveAmount)}</span>
                    </div>
                    <div className="flex justify-between py-3 border-b">
                      <span className="font-medium">Total Income Amount</span>
                      <span className="font-semibold">{formatCurrency(balanceSheetData.totalIncomeAmount)}</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}