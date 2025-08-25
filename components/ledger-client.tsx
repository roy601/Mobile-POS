"use client"

import { useState, useEffect } from "react"
import { Plus, Filter, Download, Search, BookOpen, TrendingUp, TrendingDown, DollarSign, Loader2 } from "lucide-react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

type LedgerEntry = {
  id: string
  date: string
  description: string
  account: string
  debit: number
  credit: number
  balance: number
  reference: string
  type: "sales" | "purchase" | "expense" | "income" | "transfer"
  created_at?: string
  updated_at?: string
}

type Account = {
  id: string
  name: string
  type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense'
  created_at?: string
}

export function LedgerClient() {
  const [showAddEntry, setShowAddEntry] = useState(false)
  const [selectedAccount, setSelectedAccount] = useState("all")
  const [selectedPeriod, setSelectedPeriod] = useState("this-month")
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  
  // Form state
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    account: '',
    debit: '',
    credit: '',
    reference: '',
    type: '' as LedgerEntry['type'] | ''
  })

  const supabase = createClientComponentClient()
  const { toast } = useToast()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Load accounts
      const { data: accountsData, error: accountsError } = await supabase
        .from('accounts')
        .select('*')
        .order('name')

      if (accountsError) throw accountsError
      setAccounts(accountsData || [])

      // Load ledger entries
      const { data: entriesData, error: entriesError } = await supabase
        .from('ledger_entries')
        .select('*')
        .order('date', { ascending: false })
        .order('created_at', { ascending: false })

      if (entriesError) throw entriesError
      setLedgerEntries(entriesData || [])

    } catch (error) {
      console.error('Error loading data:', error)
      toast({
        title: "Error",
        description: "Failed to load ledger data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAddEntry = async () => {
    if (!formData.date || !formData.description || !formData.account || !formData.type) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }

    if (!formData.debit && !formData.credit) {
      toast({
        title: "Validation Error",
        description: "Please enter either a debit or credit amount.",
        variant: "destructive",
      })
      return
    }

    if (formData.debit && formData.credit) {
      toast({
        title: "Validation Error",
        description: "Please enter either debit OR credit, not both.",
        variant: "destructive",
      })
      return
    }

    try {
      setSubmitting(true)

      const debitAmount = parseFloat(formData.debit) || 0
      const creditAmount = parseFloat(formData.credit) || 0
      
      // Calculate balance (this is a simplified approach - in real accounting, you'd need running balances per account)
      const balance = creditAmount - debitAmount

      const newEntry = {
        date: formData.date,
        description: formData.description,
        account: formData.account,
        debit: debitAmount,
        credit: creditAmount,
        balance: balance,
        reference: formData.reference || null,
        type: formData.type
      }

      const { error } = await supabase
        .from('ledger_entries')
        .insert([newEntry])

      if (error) throw error

      toast({
        title: "Success",
        description: "Ledger entry added successfully!",
      })

      setFormData({
        date: new Date().toISOString().split('T')[0],
        description: '',
        account: '',
        debit: '',
        credit: '',
        reference: '',
        type: ''
      })
      setShowAddEntry(false)
      loadData() // Reload data

    } catch (error) {
      console.error('Error adding entry:', error)
      toast({
        title: "Error",
        description: "Failed to add ledger entry. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleExportLedger = () => {
    try {
      const csvContent = [
        ['Date', 'Reference', 'Description', 'Account', 'Debit', 'Credit', 'Balance', 'Type'],
        ...filteredEntries.map(entry => [
          entry.date,
          entry.reference,
          entry.description,
          entry.account,
          entry.debit,
          entry.credit,
          entry.balance,
          entry.type
        ])
      ].map(row => row.join(',')).join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `ledger-export-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)

      toast({
        title: "Success",
        description: "Ledger exported successfully!",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export ledger. Please try again.",
        variant: "destructive",
      })
    }
  }

  const filteredEntries = ledgerEntries.filter((entry) => {
    const matchesSearch =
      entry.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.account.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.reference?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesAccount = selectedAccount === "all" || entry.account === selectedAccount

    // Filter by period
    const entryDate = new Date(entry.date)
    const now = new Date()
    let matchesPeriod = true

    switch (selectedPeriod) {
      case 'today':
        matchesPeriod = entryDate.toDateString() === now.toDateString()
        break
      case 'this-week':
        const weekStart = new Date(now.setDate(now.getDate() - now.getDay()))
        matchesPeriod = entryDate >= weekStart
        break
      case 'this-month':
        matchesPeriod = entryDate.getMonth() === now.getMonth() && entryDate.getFullYear() === now.getFullYear()
        break
      case 'this-year':
        matchesPeriod = entryDate.getFullYear() === now.getFullYear()
        break
      default:
        matchesPeriod = true
    }

    return matchesSearch && matchesAccount && matchesPeriod
  })

  const totalDebits = filteredEntries.reduce((sum, entry) => sum + entry.debit, 0)
  const totalCredits = filteredEntries.reduce((sum, entry) => sum + entry.credit, 0)
  const netBalance = totalCredits - totalDebits

  // Calculate financial summaries from actual data
  const salesEntries = ledgerEntries.filter(entry => entry.type === 'sales')
  const purchaseEntries = ledgerEntries.filter(entry => entry.type === 'purchase')
  const expenseEntries = ledgerEntries.filter(entry => entry.type === 'expense')
  const incomeEntries = ledgerEntries.filter(entry => entry.type === 'income')

  const totalSalesAmount = salesEntries.reduce((sum, entry) => sum + entry.credit, 0)
  const totalPurchaseAmount = purchaseEntries.reduce((sum, entry) => sum + entry.debit, 0)
  const totalExpenseAmount = expenseEntries.reduce((sum, entry) => sum + entry.debit, 0)
  const totalIncomeAmount = incomeEntries.reduce((sum, entry) => sum + entry.credit, 0)

  if (loading) {
    return (
      <div className="flex-1 space-y-6 p-8 pt-6">
        <div className="flex items-center justify-center h-32">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading ledger data...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Ledger</h1>
          <p className="text-muted-foreground">Complete accounting ledger and transaction history</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleExportLedger} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button onClick={() => setShowAddEntry(true)} className="bg-green-600 hover:bg-green-700">
            <Plus className="mr-2 h-4 w-4" />
            Add Entry
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Debits</CardTitle>
            <TrendingUp className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">৳{totalDebits.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Money going out</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Credits</CardTitle>
            <TrendingDown className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">৳{totalCredits.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Money coming in</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${netBalance >= 0 ? "text-green-600" : "text-red-600"}`}>
              ৳{netBalance.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Credits - Debits</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Entries</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredEntries.length}</div>
            <p className="text-xs text-muted-foreground">Ledger transactions</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="general-ledger" className="space-y-6">
        <TabsList>
          <TabsTrigger value="general-ledger">General Ledger</TabsTrigger>
          <TabsTrigger value="trial-balance">Trial Balance</TabsTrigger>
          <TabsTrigger value="profit-loss">Profit & Loss</TabsTrigger>
          <TabsTrigger value="balance-sheet">Balance Sheet</TabsTrigger>
        </TabsList>

        <TabsContent value="general-ledger" className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={selectedAccount} onValueChange={setSelectedAccount}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select Account" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Accounts</SelectItem>
                {accounts.map((account) => (
                  <SelectItem key={account.id} value={account.name}>
                    {account.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select Period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="this-week">This Week</SelectItem>
                <SelectItem value="this-month">This Month</SelectItem>
                <SelectItem value="this-year">This Year</SelectItem>
                <SelectItem value="all-time">All Time</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </div>

          {/* Ledger Table */}
          <Card>
            <CardHeader>
              <CardTitle>General Ledger</CardTitle>
              <CardDescription>All accounting transactions and entries</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Account</TableHead>
                    <TableHead className="text-right">Debit</TableHead>
                    <TableHead className="text-right">Credit</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                    <TableHead>Type</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEntries.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        No ledger entries found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredEntries.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell>{new Date(entry.date).toLocaleDateString()}</TableCell>
                        <TableCell className="font-medium">{entry.reference || '-'}</TableCell>
                        <TableCell>{entry.description}</TableCell>
                        <TableCell>{entry.account}</TableCell>
                        <TableCell className="text-right text-red-600">
                          {entry.debit > 0 ? `৳${entry.debit.toLocaleString()}` : "-"}
                        </TableCell>
                        <TableCell className="text-right text-green-600">
                          {entry.credit > 0 ? `৳${entry.credit.toLocaleString()}` : "-"}
                        </TableCell>
                        <TableCell className="text-right font-medium">৳{entry.balance.toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              entry.type === "sales"
                                ? "outline"
                                : entry.type === "purchase"
                                  ? "secondary"
                                  : entry.type === "income"
                                    ? "default"
                                    : entry.type === "expense"
                                      ? "destructive"
                                      : "outline"
                            }
                          >
                            {entry.type}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trial-balance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Trial Balance</CardTitle>
              <CardDescription>Summary of all account balances</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Account Name</TableHead>
                    <TableHead className="text-right">Debit Balance</TableHead>
                    <TableHead className="text-right">Credit Balance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {accounts.map((account) => {
                    const accountEntries = ledgerEntries.filter((entry) => entry.account === account.name)
                    const debitTotal = accountEntries.reduce((sum, entry) => sum + entry.debit, 0)
                    const creditTotal = accountEntries.reduce((sum, entry) => sum + entry.credit, 0)
                    const balance = creditTotal - debitTotal

                    if (debitTotal === 0 && creditTotal === 0) return null

                    return (
                      <TableRow key={account.id}>
                        <TableCell className="font-medium">{account.name}</TableCell>
                        <TableCell className="text-right">
                          {balance < 0 ? `৳${Math.abs(balance).toLocaleString()}` : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          {balance > 0 ? `৳${balance.toLocaleString()}` : "-"}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                  <TableRow className="border-t-2 font-bold">
                    <TableCell>Total</TableCell>
                    <TableCell className="text-right">৳{totalDebits.toLocaleString()}</TableCell>
                    <TableCell className="text-right">৳{totalCredits.toLocaleString()}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profit-loss" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Profit & Loss Statement</CardTitle>
              <CardDescription>Revenue and expenses summary</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Revenue</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Sales Revenue</span>
                      <span className="font-medium">৳{totalSalesAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Other Income</span>
                      <span className="font-medium">৳{totalIncomeAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2 font-bold">
                      <span>Total Revenue</span>
                      <span>৳{(totalSalesAmount + totalIncomeAmount).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">Expenses</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Cost of Goods Sold</span>
                      <span className="font-medium">৳{totalPurchaseAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Operating Expenses</span>
                      <span className="font-medium">৳{totalExpenseAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2 font-bold">
                      <span>Total Expenses</span>
                      <span>৳{(totalPurchaseAmount + totalExpenseAmount).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="border-t-2 pt-4">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Net Profit/Loss</span>
                    <span className={`${(totalSalesAmount + totalIncomeAmount - totalPurchaseAmount - totalExpenseAmount) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ৳{(totalSalesAmount + totalIncomeAmount - totalPurchaseAmount - totalExpenseAmount).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="balance-sheet" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Balance Sheet</CardTitle>
              <CardDescription>Assets, liabilities, and equity summary</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Assets</h3>
                  <div className="space-y-2">
                    {accounts
                      .filter(account => account.type === 'asset')
                      .map(account => {
                        const accountEntries = ledgerEntries.filter(entry => entry.account === account.name)
                        const balance = accountEntries.reduce((sum, entry) => sum + entry.debit - entry.credit, 0)
                        return (
                          <div key={account.id} className="flex justify-between">
                            <span>{account.name}</span>
                            <span className="font-medium">৳{balance.toLocaleString()}</span>
                          </div>
                        )
                      })}
                    <div className="flex justify-between border-t pt-2 font-bold">
                      <span>Total Assets</span>
                      <span>
                        ৳{accounts
                          .filter(account => account.type === 'asset')
                          .reduce((total, account) => {
                            const accountEntries = ledgerEntries.filter(entry => entry.account === account.name)
                            return total + accountEntries.reduce((sum, entry) => sum + entry.debit - entry.credit, 0)
                          }, 0)
                          .toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">Liabilities & Equity</h3>
                  <div className="space-y-2">
                    {accounts
                      .filter(account => account.type === 'liability' || account.type === 'equity')
                      .map(account => {
                        const accountEntries = ledgerEntries.filter(entry => entry.account === account.name)
                        const balance = accountEntries.reduce((sum, entry) => sum + entry.credit - entry.debit, 0)
                        return (
                          <div key={account.id} className="flex justify-between">
                            <span>{account.name}</span>
                            <span className="font-medium">৳{balance.toLocaleString()}</span>
                          </div>
                        )
                      })}
                    <div className="flex justify-between border-t pt-2 font-bold">
                      <span>Total Liabilities & Equity</span>
                      <span>
                        ৳{accounts
                          .filter(account => account.type === 'liability' || account.type === 'equity')
                          .reduce((total, account) => {
                            const accountEntries = ledgerEntries.filter(entry => entry.account === account.name)
                            return total + accountEntries.reduce((sum, entry) => sum + entry.credit - entry.debit, 0)
                          }, 0)
                          .toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Entry Dialog */}
      <Dialog open={showAddEntry} onOpenChange={setShowAddEntry}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Ledger Entry</DialogTitle>
            <DialogDescription>Create a new accounting entry</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="entry-date">Date*</Label>
              <Input
                id="entry-date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="entry-description">Description*</Label>
              <Input
                id="entry-description"
                placeholder="Enter transaction description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="entry-account">Account*</Label>
              <Select value={formData.account} onValueChange={(value) => setFormData(prev => ({ ...prev, account: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.name}>
                      {account.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="entry-debit">Debit Amount</Label>
                <Input
                  id="entry-debit"
                  type="number"
                  placeholder="0.00"
                  value={formData.debit}
                  onChange={(e) => setFormData(prev => ({ ...prev, debit: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="entry-credit">Credit Amount</Label>
                <Input
                  id="entry-credit"
                  type="number"
                  placeholder="0.00"
                  value={formData.credit}
                  onChange={(e) => setFormData(prev => ({ ...prev, credit: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="entry-reference">Reference</Label>
              <Input
                id="entry-reference"
                placeholder="Invoice/Receipt number"
                value={formData.reference}
                onChange={(e) => setFormData(prev => ({ ...prev, reference: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="entry-type">Transaction Type*</Label>
              <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value as LedgerEntry['type'] }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sales">Sales</SelectItem>
                  <SelectItem value="purchase">Purchase</SelectItem>
                  <SelectItem value="expense">Expense</SelectItem>
                  <SelectItem value="income">Income</SelectItem>
                  <SelectItem value="transfer">Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddEntry(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={handleAddEntry} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add Entry'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}