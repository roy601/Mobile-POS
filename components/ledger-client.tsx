"use client"

import { useState } from "react"
import { Plus, Filter, Download, Search, BookOpen, TrendingUp, TrendingDown, DollarSign } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
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
}

export function LedgerClient() {
  const [showAddEntry, setShowAddEntry] = useState(false)
  const [selectedAccount, setSelectedAccount] = useState("all")
  const [selectedPeriod, setSelectedPeriod] = useState("this-month")
  const [searchTerm, setSearchTerm] = useState("")

  const [ledgerEntries] = useState<LedgerEntry[]>([
    {
      id: "LED-001",
      date: "2023-05-18",
      description: "Sales - iPhone 14 Pro",
      account: "Sales Revenue",
      debit: 0,
      credit: 120000,
      balance: 120000,
      reference: "INV-001",
      type: "sales",
    },
    {
      id: "LED-002",
      date: "2023-05-18",
      description: "Purchase - Samsung Galaxy S23",
      account: "Inventory",
      debit: 95000,
      credit: 0,
      balance: 95000,
      reference: "PO-001",
      type: "purchase",
    },
    {
      id: "LED-003",
      date: "2023-05-18",
      description: "Store Rent Payment",
      account: "Rent Expense",
      debit: 25000,
      credit: 0,
      balance: 25000,
      reference: "EXP-001",
      type: "expense",
    },
    {
      id: "LED-004",
      date: "2023-05-17",
      description: "Cash Sales",
      account: "Cash",
      debit: 85000,
      credit: 0,
      balance: 85000,
      reference: "CASH-001",
      type: "sales",
    },
    {
      id: "LED-005",
      date: "2023-05-17",
      description: "Bank Transfer",
      account: "Bank Account",
      debit: 50000,
      credit: 0,
      balance: 50000,
      reference: "TRF-001",
      type: "transfer",
    },
  ])

  const accounts = [
    "Cash",
    "Bank Account",
    "Sales Revenue",
    "Inventory",
    "Rent Expense",
    "Salary Expense",
    "Utilities Expense",
    "Accounts Receivable",
    "Accounts Payable",
  ]

  // Financial summary calculations
  const totalPurchaseAmount = 950000
  const totalSalesAmount = 205000
  const totalSupplierPaymentAmount = 85000
  const totalOwnExpenseAmount = 25000
  const totalCustomerDuesReceiveAmount = 85000
  const totalIncomeAmount = 120000

  const filteredEntries = ledgerEntries.filter((entry) => {
    const matchesSearch =
      entry.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.account.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.reference.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesAccount = selectedAccount === "all" || entry.account === selectedAccount

    return matchesSearch && matchesAccount
  })

  const totalDebits = filteredEntries.reduce((sum, entry) => sum + entry.debit, 0)
  const totalCredits = filteredEntries.reduce((sum, entry) => sum + entry.credit, 0)
  const netBalance = totalCredits - totalDebits

  const handleAddEntry = () => {
    setShowAddEntry(false)
    alert("Ledger entry added successfully!")
  }

  const handleExportLedger = () => {
    alert("Ledger exported successfully!")
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
                  <SelectItem key={account} value={account}>
                    {account}
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
                  {filteredEntries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>{entry.date}</TableCell>
                      <TableCell className="font-medium">{entry.reference}</TableCell>
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
                  ))}
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
                    const accountEntries = ledgerEntries.filter((entry) => entry.account === account)
                    const debitTotal = accountEntries.reduce((sum, entry) => sum + entry.debit, 0)
                    const creditTotal = accountEntries.reduce((sum, entry) => sum + entry.credit, 0)
                    const balance = creditTotal - debitTotal

                    if (debitTotal === 0 && creditTotal === 0) return null

                    return (
                      <TableRow key={account}>
                        <TableCell className="font-medium">{account}</TableCell>
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
                      <span className="font-medium">৳{totalOwnExpenseAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2 font-bold">
                      <span>Total Expenses</span>
                      <span>৳{(totalPurchaseAmount + totalOwnExpenseAmount).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="border-t-2 pt-4">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Net Profit/Loss</span>
                    <span className="text-green-600">
                      ৳
                      {(
                        totalSalesAmount +
                        totalIncomeAmount -
                        (totalPurchaseAmount + totalOwnExpenseAmount)
                      ).toLocaleString()}
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
              <CardDescription>Assets, liabilities, and equity with detailed financial breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Assets</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Cash</span>
                      <span className="font-medium">৳{totalCustomerDuesReceiveAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Bank Account</span>
                      <span className="font-medium">৳50,000</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Inventory</span>
                      <span className="font-medium">৳{totalPurchaseAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2 font-bold">
                      <span>Total Assets</span>
                      <span>৳{(totalCustomerDuesReceiveAmount + 50000 + totalPurchaseAmount).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">Financial Summary</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Total Purchase Amount</span>
                      <span className="font-medium text-red-600">৳{totalPurchaseAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Sales Amount</span>
                      <span className="font-medium text-green-600">৳{totalSalesAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Supplier Payment</span>
                      <span className="font-medium text-red-600">৳{totalSupplierPaymentAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Own Expense</span>
                      <span className="font-medium text-red-600">৳{totalOwnExpenseAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Customer Dues Received</span>
                      <span className="font-medium text-green-600">
                        ৳{totalCustomerDuesReceiveAmount.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Income Amount</span>
                      <span className="font-medium text-green-600">৳{totalIncomeAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2 font-bold">
                      <span>Net Position</span>
                      <span className="text-green-600">
                        ৳
                        {(
                          totalSalesAmount +
                          totalIncomeAmount +
                          totalCustomerDuesReceiveAmount -
                          (totalPurchaseAmount + totalSupplierPaymentAmount + totalOwnExpenseAmount)
                        ).toLocaleString()}
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
              <Input id="entry-date" type="date" />
            </div>
            <div>
              <Label htmlFor="entry-description">Description*</Label>
              <Input id="entry-description" placeholder="Enter transaction description" />
            </div>
            <div>
              <Label htmlFor="entry-account">Account*</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem key={account} value={account}>
                      {account}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="entry-debit">Debit Amount</Label>
                <Input id="entry-debit" type="number" placeholder="0.00" />
              </div>
              <div>
                <Label htmlFor="entry-credit">Credit Amount</Label>
                <Input id="entry-credit" type="number" placeholder="0.00" />
              </div>
            </div>
            <div>
              <Label htmlFor="entry-reference">Reference</Label>
              <Input id="entry-reference" placeholder="Invoice/Receipt number" />
            </div>
            <div>
              <Label htmlFor="entry-type">Transaction Type</Label>
              <Select>
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
            <Button variant="outline" onClick={() => setShowAddEntry(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddEntry}>Add Entry</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
