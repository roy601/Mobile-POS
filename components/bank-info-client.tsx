"use client"

import { useState } from "react"
import { Plus, Edit, Trash2, Building, CreditCard, DollarSign, Download, Filter, Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useRole } from "@/components/role-provider"

type BankAccount = {
  id: string
  bankName: string
  accountName: string
  accountNumber: string
  accountType: string
  balance: number
  currency: string
  status: "active" | "inactive"
  branch: string
  swiftCode?: string
  routingNumber?: string
}

type Transaction = {
  id: string
  date: string
  time: string
  type: "card" | "mobile_banking" | "bank_transfer"
  method: string
  amount: number
  description: string
  reference: string
  source: "pos" | "purchase" | "return" | "manual" | "expense"
  status: "completed" | "pending" | "failed"
  accountId: string
  customerSupplier?: string
  invoiceNumber?: string
}

export function BankInfoClient() {
  const { hasPermission } = useRole()
  const [showAddBank, setShowAddBank] = useState(false)
  const [showEditBank, setShowEditBank] = useState(false)
  const [showAddTransaction, setShowAddTransaction] = useState(false)
  const [selectedBank, setSelectedBank] = useState<BankAccount | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [filterSource, setFilterSource] = useState("all")
  const [selectedPeriod, setSelectedPeriod] = useState("this-month")

  const [bankAccounts] = useState<BankAccount[]>([
    {
      id: "BANK-001",
      bankName: "Dutch-Bangla Bank Limited",
      accountName: "Mobile Shop Business Account",
      accountNumber: "1234567890123",
      accountType: "Current Account",
      balance: 250000,
      currency: "BDT",
      status: "active",
      branch: "Dhanmondi Branch",
      swiftCode: "DBBLBDDHXXX",
      routingNumber: "090261234",
    },
    {
      id: "BANK-002",
      bankName: "Islami Bank Bangladesh Limited",
      accountName: "Mobile Shop Savings",
      accountNumber: "2345678901234",
      accountType: "Savings Account",
      balance: 150000,
      currency: "BDT",
      status: "active",
      branch: "Gulshan Branch",
      swiftCode: "IBBLBDDHXXX",
      routingNumber: "125261234",
    },
    {
      id: "BANK-003",
      bankName: "bKash Limited",
      accountName: "Mobile Banking Account",
      accountNumber: "01712345678",
      accountType: "Mobile Banking",
      balance: 75000,
      currency: "BDT",
      status: "active",
      branch: "Digital Service",
      routingNumber: "N/A",
    },
    {
      id: "BANK-004",
      bankName: "Nagad",
      accountName: "Digital Wallet",
      accountNumber: "01812345678",
      accountType: "Mobile Banking",
      balance: 45000,
      currency: "BDT",
      status: "active",
      branch: "Digital Service",
      routingNumber: "N/A",
    },
  ])

  const [transactions] = useState<Transaction[]>([
    {
      id: "TXN-001",
      date: "2024-01-20",
      time: "14:30",
      type: "mobile_banking",
      method: "bKash",
      amount: 25000,
      description: "Sale payment from customer",
      reference: "bKash-TXN-123456",
      source: "pos",
      status: "completed",
      accountId: "BANK-003",
      customerSupplier: "Ahmed Hassan",
      invoiceNumber: "INV-2024-001",
    },
    {
      id: "TXN-002",
      date: "2024-01-20",
      time: "11:15",
      type: "card",
      method: "Visa Card",
      amount: 45000,
      description: "Customer payment via card",
      reference: "CARD-789012",
      source: "pos",
      status: "completed",
      accountId: "BANK-001",
      customerSupplier: "Fatima Khan",
      invoiceNumber: "INV-2024-002",
    },
    {
      id: "TXN-003",
      date: "2024-01-19",
      time: "16:45",
      type: "bank_transfer",
      method: "Bank Transfer",
      amount: 150000,
      description: "Supplier payment for inventory",
      reference: "TRF-345678",
      source: "purchase",
      status: "completed",
      accountId: "BANK-001",
      customerSupplier: "TechSupplies Inc.",
      invoiceNumber: "PUR-2024-005",
    },
    {
      id: "TXN-004",
      date: "2024-01-19",
      time: "10:20",
      type: "mobile_banking",
      method: "Nagad",
      amount: 15000,
      description: "Return refund to customer",
      reference: "NGD-567890",
      source: "return",
      status: "completed",
      accountId: "BANK-004",
      customerSupplier: "Mohammad Ali",
      invoiceNumber: "RET-2024-001",
    },
    {
      id: "TXN-005",
      date: "2024-01-18",
      time: "13:30",
      type: "bank_transfer",
      method: "Bank Transfer",
      amount: 8000,
      description: "Office rent payment",
      reference: "RENT-JAN-2024",
      source: "manual",
      status: "completed",
      accountId: "BANK-002",
      customerSupplier: "Property Owner",
    },
  ])

  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch =
      transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.customerSupplier?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesType = filterType === "all" || transaction.type === filterType
    const matchesSource = filterSource === "all" || transaction.source === filterSource

    return matchesSearch && matchesType && matchesSource
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
      case "failed":
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "card":
        return <CreditCard className="h-4 w-4 text-blue-600" />
      case "mobile_banking":
        return <DollarSign className="h-4 w-4 text-green-600" />
      case "bank_transfer":
        return <Building className="h-4 w-4 text-purple-600" />
      default:
        return <DollarSign className="h-4 w-4" />
    }
  }

  const getSourceBadge = (source: string) => {
    const colors = {
      pos: "bg-blue-100 text-blue-800",
      purchase: "bg-purple-100 text-purple-800",
      return: "bg-orange-100 text-orange-800",
      manual: "bg-gray-100 text-gray-800",
      expense: "bg-red-100 text-red-800",
    }
    return (
      <Badge className={colors[source as keyof typeof colors] || "bg-gray-100 text-gray-800"}>
        {source.toUpperCase()}
      </Badge>
    )
  }

  const handleAddBank = () => {
    setShowAddBank(false)
    alert("Bank account added successfully!")
  }

  const handleEditBank = (bank: BankAccount) => {
    setSelectedBank(bank)
    setShowEditBank(true)
  }

  const handleUpdateBank = () => {
    setShowEditBank(false)
    setSelectedBank(null)
    alert("Bank account updated successfully!")
  }

  const handleDeleteBank = (bank: BankAccount) => {
    if (confirm(`Are you sure you want to delete ${bank.bankName} account?`)) {
      alert("Bank account deleted successfully!")
    }
  }

  const handleAddTransaction = () => {
    setShowAddTransaction(false)
    alert("Transaction added successfully!")
  }

  const handleExportTransactions = () => {
    alert("Transactions exported successfully!")
  }

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Bank Information</h1>
          <p className="text-muted-foreground">
            Track all non-cash transactions from POS, purchases, returns and manual entries
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowAddTransaction(true)} className="bg-green-600 hover:bg-green-700">
            <Plus className="mr-2 h-4 w-4" />
            Add Transaction
          </Button>
          {hasPermission("bank_account_management") && (
            <Button onClick={() => setShowAddBank(true)} className="bg-green-600 hover:bg-green-700">
              <Plus className="mr-2 h-4 w-4" />
              Add Bank Account
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="transactions" className="space-y-6">
        <TabsList>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          {hasPermission("bank_account_management") && <TabsTrigger value="accounts">Bank Accounts</TabsTrigger>}
        </TabsList>

        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Filter className="mr-2 h-5 w-5" />
                Transaction Filters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div>
                  <Label htmlFor="search-transactions">Search</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="search-transactions"
                      placeholder="Search transactions..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="filter-type">Transaction Type</Label>
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="card">Card Payment</SelectItem>
                      <SelectItem value="mobile_banking">Mobile Banking</SelectItem>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="filter-source">Source</Label>
                  <Select value={filterSource} onValueChange={setFilterSource}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Sources" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Sources</SelectItem>
                      <SelectItem value="pos">POS Sales</SelectItem>
                      <SelectItem value="purchase">Purchases</SelectItem>
                      <SelectItem value="return">Returns</SelectItem>
                      <SelectItem value="manual">Manual Entry</SelectItem>
                      <SelectItem value="expense">Expenses</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="filter-period">Period</Label>
                  <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Period" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="this-week">This Week</SelectItem>
                      <SelectItem value="this-month">This Month</SelectItem>
                      <SelectItem value="last-month">Last Month</SelectItem>
                      <SelectItem value="this-year">This Year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button onClick={handleExportTransactions} variant="outline" className="w-full bg-transparent">
                    <Download className="mr-2 h-4 w-4" />
                    Export
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Non-Cash Transactions</CardTitle>
              <CardDescription>
                All card, mobile banking, and bank transfer transactions from various sources
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Customer/Supplier</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{transaction.date}</p>
                          <p className="text-sm text-muted-foreground">{transaction.time}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getTypeIcon(transaction.type)}
                          <span className="capitalize">{transaction.type.replace("_", " ")}</span>
                        </div>
                      </TableCell>
                      <TableCell>{transaction.method}</TableCell>
                      <TableCell className="font-medium">৳{transaction.amount.toLocaleString()}</TableCell>
                      <TableCell className="max-w-48 truncate">{transaction.description}</TableCell>
                      <TableCell className="font-mono text-sm">{transaction.reference}</TableCell>
                      <TableCell>{getSourceBadge(transaction.source)}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{transaction.customerSupplier}</p>
                          {transaction.invoiceNumber && (
                            <p className="text-sm text-muted-foreground">{transaction.invoiceNumber}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {filteredTransactions.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No transactions found matching your criteria.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {hasPermission("bank_account_management") && (
          <TabsContent value="accounts" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Bank Accounts</CardTitle>
                <CardDescription>All your bank accounts and financial information</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Bank Name</TableHead>
                      <TableHead>Account Name</TableHead>
                      <TableHead>Account Number</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Branch</TableHead>
                      <TableHead className="text-right">Balance</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bankAccounts.map((account) => (
                      <TableRow key={account.id}>
                        <TableCell className="font-medium">{account.bankName}</TableCell>
                        <TableCell>{account.accountName}</TableCell>
                        <TableCell className="font-mono">{account.accountNumber}</TableCell>
                        <TableCell>{account.accountType}</TableCell>
                        <TableCell>{account.branch}</TableCell>
                        <TableCell className="text-right font-medium">৳{account.balance.toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge variant={account.status === "active" ? "outline" : "secondary"}>
                            {account.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" onClick={() => handleEditBank(account)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteBank(account)}>
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* Add Transaction Dialog */}
      <Dialog open={showAddTransaction} onOpenChange={setShowAddTransaction}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add Manual Transaction</DialogTitle>
            <DialogDescription>Record a non-cash transaction manually</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="transaction-date">Date*</Label>
                <Input id="transaction-date" type="date" />
              </div>
              <div>
                <Label htmlFor="transaction-time">Time*</Label>
                <Input id="transaction-time" type="time" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="transaction-type">Transaction Type*</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="card">Card Payment</SelectItem>
                    <SelectItem value="mobile_banking">Mobile Banking</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="transaction-method">Payment Method*</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bkash">bKash</SelectItem>
                    <SelectItem value="nagad">Nagad</SelectItem>
                    <SelectItem value="rocket">Rocket</SelectItem>
                    <SelectItem value="upay">Upay</SelectItem>
                    <SelectItem value="visa">Visa Card</SelectItem>
                    <SelectItem value="mastercard">MasterCard</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="transaction-amount">Amount*</Label>
              <Input id="transaction-amount" type="number" placeholder="0.00" />
            </div>
            <div>
              <Label htmlFor="transaction-description">Description*</Label>
              <Textarea id="transaction-description" placeholder="Enter transaction description" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="transaction-reference">Reference Number</Label>
                <Input id="transaction-reference" placeholder="Transaction reference" />
              </div>
              <div>
                <Label htmlFor="transaction-account">Bank Account*</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select account" />
                  </SelectTrigger>
                  <SelectContent>
                    {bankAccounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.bankName} - {account.accountNumber}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="customer-supplier">Customer/Supplier</Label>
              <Input id="customer-supplier" placeholder="Enter customer or supplier name" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddTransaction(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddTransaction} className="bg-green-600 hover:bg-green-700">
              Add Transaction
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Bank Account Dialog */}
      {hasPermission("bank_account_management") && (
        <Dialog open={showAddBank} onOpenChange={setShowAddBank}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add Bank Account</DialogTitle>
              <DialogDescription>Add a new bank account to your financial records</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="bank-name">Bank Name*</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select bank" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dbbl">Dutch-Bangla Bank Limited</SelectItem>
                    <SelectItem value="ibbl">Islami Bank Bangladesh Limited</SelectItem>
                    <SelectItem value="brac">BRAC Bank Limited</SelectItem>
                    <SelectItem value="city">City Bank Limited</SelectItem>
                    <SelectItem value="bkash">bKash Limited</SelectItem>
                    <SelectItem value="nagad">Nagad</SelectItem>
                    <SelectItem value="rocket">Rocket</SelectItem>
                    <SelectItem value="upay">Upay</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="account-name">Account Name*</Label>
                <Input id="account-name" placeholder="Enter account holder name" />
              </div>
              <div>
                <Label htmlFor="account-number">Account Number*</Label>
                <Input id="account-number" placeholder="Enter account number" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="account-type">Account Type*</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="current">Current Account</SelectItem>
                      <SelectItem value="savings">Savings Account</SelectItem>
                      <SelectItem value="mobile">Mobile Banking</SelectItem>
                      <SelectItem value="fixed">Fixed Deposit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="initial-balance">Initial Balance</Label>
                  <Input id="initial-balance" type="number" placeholder="0.00" />
                </div>
              </div>
              <div>
                <Label htmlFor="branch">Branch*</Label>
                <Input id="branch" placeholder="Enter branch name" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="swift-code">SWIFT Code</Label>
                  <Input id="swift-code" placeholder="Enter SWIFT code" />
                </div>
                <div>
                  <Label htmlFor="routing-number">Routing Number</Label>
                  <Input id="routing-number" placeholder="Enter routing number" />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddBank(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddBank} className="bg-green-600 hover:bg-green-700">
                Add Account
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Edit Bank Account Dialog */}
      {hasPermission("bank_account_management") && (
        <Dialog open={showEditBank} onOpenChange={setShowEditBank}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Edit Bank Account</DialogTitle>
              <DialogDescription>Update bank account information</DialogDescription>
            </DialogHeader>
            {selectedBank && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-bank-name">Bank Name*</Label>
                  <Input id="edit-bank-name" defaultValue={selectedBank.bankName} />
                </div>
                <div>
                  <Label htmlFor="edit-account-name">Account Name*</Label>
                  <Input id="edit-account-name" defaultValue={selectedBank.accountName} />
                </div>
                <div>
                  <Label htmlFor="edit-account-number">Account Number*</Label>
                  <Input id="edit-account-number" defaultValue={selectedBank.accountNumber} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-account-type">Account Type*</Label>
                    <Select defaultValue={selectedBank.accountType.toLowerCase().replace(" ", "")}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="current">Current Account</SelectItem>
                        <SelectItem value="savings">Savings Account</SelectItem>
                        <SelectItem value="mobile">Mobile Banking</SelectItem>
                        <SelectItem value="fixed">Fixed Deposit</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="edit-balance">Current Balance</Label>
                    <Input id="edit-balance" type="number" defaultValue={selectedBank.balance} />
                  </div>
                </div>
                <div>
                  <Label htmlFor="edit-branch">Branch*</Label>
                  <Input id="edit-branch" defaultValue={selectedBank.branch} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-swift-code">SWIFT Code</Label>
                    <Input id="edit-swift-code" defaultValue={selectedBank.swiftCode || ""} />
                  </div>
                  <div>
                    <Label htmlFor="edit-routing-number">Routing Number</Label>
                    <Input id="edit-routing-number" defaultValue={selectedBank.routingNumber || ""} />
                  </div>
                </div>
                <div>
                  <Label htmlFor="edit-status">Status</Label>
                  <Select defaultValue={selectedBank.status}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEditBank(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateBank} className="bg-green-600 hover:bg-green-700">
                Update Account
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
