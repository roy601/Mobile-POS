"use client"

import { DollarSign, TrendingUp, TrendingDown, Banknote } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

interface DayCashbookProps {
  selectedDate?: string
}

export function DayCashbook({ selectedDate }: DayCashbookProps) {
  // Sample data - in real app, this would be fetched based on selectedDate
  const cashbookData = {
    openingBalance: 50000,
    closingBalance: 67500,
    totalSales: 125000,
    totalPurchases: 85000,
    totalExpenses: 12500,
    totalReceipts: 110000,
    totalPayments: 97500,
    netCashFlow: 17500,
  }

  const transactions = [
    {
      id: "TXN-001",
      time: "09:30 AM",
      description: "Cash Sale - iPhone 14",
      type: "receipt",
      amount: 120000,
      balance: 170000,
    },
    {
      id: "TXN-002",
      time: "10:15 AM",
      description: "Purchase Payment - Samsung Stock",
      type: "payment",
      amount: 85000,
      balance: 85000,
    },
    {
      id: "TXN-003",
      time: "11:00 AM",
      description: "Customer Payment - John Doe",
      type: "receipt",
      amount: 25000,
      balance: 110000,
    },
    {
      id: "TXN-004",
      time: "02:30 PM",
      description: "Store Rent Payment",
      type: "payment",
      amount: 25000,
      balance: 85000,
    },
    {
      id: "TXN-005",
      time: "03:45 PM",
      description: "Card Sale - Accessories",
      type: "receipt",
      amount: 15000,
      balance: 100000,
    },
    {
      id: "TXN-006",
      time: "04:20 PM",
      description: "Utility Bill Payment",
      type: "payment",
      amount: 7500,
      balance: 92500,
    },
  ]

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Opening Balance</CardTitle>
            <Banknote className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">৳{cashbookData.openingBalance.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Start of day</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Receipts</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">৳{cashbookData.totalReceipts.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Money received</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Payments</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">৳{cashbookData.totalPayments.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Money paid out</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Closing Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">৳{cashbookData.closingBalance.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">End of day</p>
          </CardContent>
        </Card>
      </div>

      {/* Net Cash Flow */}
      <Card>
        <CardHeader>
          <CardTitle>Net Cash Flow</CardTitle>
          <CardDescription>Overall cash movement for the day</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Net Change</p>
              <p className={`text-2xl font-bold ${cashbookData.netCashFlow >= 0 ? "text-green-600" : "text-red-600"}`}>
                {cashbookData.netCashFlow >= 0 ? "+" : ""}৳{cashbookData.netCashFlow.toLocaleString()}
              </p>
            </div>
            <div className="text-right space-y-1">
              <p className="text-sm text-muted-foreground">Calculation</p>
              <p className="text-sm">
                ৳{cashbookData.totalReceipts.toLocaleString()} - ৳{cashbookData.totalPayments.toLocaleString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transaction Details */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction Details</CardTitle>
          <CardDescription>All cash movements throughout the day</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Transaction ID</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Running Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow className="bg-muted/50">
                <TableCell className="font-medium">Start</TableCell>
                <TableCell>-</TableCell>
                <TableCell>Opening Balance</TableCell>
                <TableCell>
                  <Badge variant="outline">Opening</Badge>
                </TableCell>
                <TableCell className="text-right">-</TableCell>
                <TableCell className="text-right font-medium">
                  ৳{cashbookData.openingBalance.toLocaleString()}
                </TableCell>
              </TableRow>
              {transactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell className="font-medium">{transaction.time}</TableCell>
                  <TableCell>{transaction.id}</TableCell>
                  <TableCell>{transaction.description}</TableCell>
                  <TableCell>
                    <Badge variant={transaction.type === "receipt" ? "default" : "secondary"}>
                      {transaction.type === "receipt" ? "Receipt" : "Payment"}
                    </Badge>
                  </TableCell>
                  <TableCell
                    className={`text-right font-medium ${
                      transaction.type === "receipt" ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {transaction.type === "receipt" ? "+" : "-"}৳{transaction.amount.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right font-medium">৳{transaction.balance.toLocaleString()}</TableCell>
                </TableRow>
              ))}
              <TableRow className="bg-muted/50 border-t-2">
                <TableCell className="font-medium">End</TableCell>
                <TableCell>-</TableCell>
                <TableCell>Closing Balance</TableCell>
                <TableCell>
                  <Badge variant="outline">Closing</Badge>
                </TableCell>
                <TableCell className="text-right">-</TableCell>
                <TableCell className="text-right font-bold">৳{cashbookData.closingBalance.toLocaleString()}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
