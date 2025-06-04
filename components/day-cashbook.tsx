"use client"

import { useState } from "react"
import { Plus, Edit, Trash2, DollarSign, TrendingDown, TrendingUp } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

type CashEntry = {
  id: string
  date: string
  type: "income" | "expense"
  category: string
  description: string
  amount: number
}

export function DayCashbook() {
  const [entries] = useState<CashEntry[]>([
    {
      id: "1",
      date: "2023-05-18",
      type: "income",
      category: "Sales",
      description: "Daily Sales Revenue",
      amount: 2450.75,
    },
    {
      id: "2",
      date: "2023-05-18",
      type: "expense",
      category: "Store Rent",
      description: "Monthly Store Rent",
      amount: 1200.0,
    },
    {
      id: "3",
      date: "2023-05-18",
      type: "expense",
      category: "Worker Salary",
      description: "Daily Worker Payment",
      amount: 150.0,
    },
    {
      id: "4",
      date: "2023-05-18",
      type: "expense",
      category: "Electricity Bill",
      description: "Monthly Electricity Bill",
      amount: 85.5,
    },
    {
      id: "5",
      date: "2023-05-18",
      type: "expense",
      category: "Internet Bill",
      description: "Monthly Internet Bill",
      amount: 45.0,
    },
    {
      id: "6",
      date: "2023-05-18",
      type: "expense",
      category: "Transportation",
      description: "Product Delivery Cost",
      amount: 25.0,
    },
  ])

  const totalIncome = entries.filter((e) => e.type === "income").reduce((sum, e) => sum + e.amount, 0)
  const totalExpenses = entries.filter((e) => e.type === "expense").reduce((sum, e) => sum + e.amount, 0)
  const netCash = totalIncome - totalExpenses

  return (
    <div className="grid gap-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">৳{totalIncome.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Today's total income</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">৳{totalExpenses.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Today's total expenses</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Cash Flow</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${netCash >= 0 ? "text-green-600" : "text-red-600"}`}>
              ৳{netCash.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">Income - Expenses</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cash in Hand</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">৳{(netCash + 500).toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Available cash</p>
          </CardContent>
        </Card>
      </div>

      {/* Add Entry Dialog */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Day Cashbook</CardTitle>
              <CardDescription>Track daily income and expenses</CardDescription>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Entry
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Add Cash Entry</DialogTitle>
                  <DialogDescription>Add a new income or expense entry to the cashbook.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="entry-type" className="text-right">
                      Type
                    </Label>
                    <Select>
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="income">Income</SelectItem>
                        <SelectItem value="expense">Expense</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="category" className="text-right">
                      Category
                    </Label>
                    <Select>
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sales">Sales</SelectItem>
                        <SelectItem value="store-rent">Store Rent</SelectItem>
                        <SelectItem value="worker-salary">Worker Salary</SelectItem>
                        <SelectItem value="electricity">Electricity Bill</SelectItem>
                        <SelectItem value="internet">Internet Bill</SelectItem>
                        <SelectItem value="transportation">Transportation</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                        <SelectItem value="supplies">Office Supplies</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="description" className="text-right">
                      Description
                    </Label>
                    <Input id="description" placeholder="Enter description" className="col-span-3" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="amount" className="text-right">
                      Amount
                    </Label>
                    <Input id="amount" type="number" placeholder="0.00" className="col-span-3" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="date" className="text-right">
                      Date
                    </Label>
                    <Input id="date" type="date" className="col-span-3" />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline">Cancel</Button>
                  <Button>Add Entry</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell>{entry.date}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        entry.type === "income" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                      }`}
                    >
                      {entry.type === "income" ? (
                        <TrendingUp className="w-3 h-3 mr-1" />
                      ) : (
                        <TrendingDown className="w-3 h-3 mr-1" />
                      )}
                      {entry.type}
                    </span>
                  </TableCell>
                  <TableCell>{entry.category}</TableCell>
                  <TableCell>{entry.description}</TableCell>
                  <TableCell className={entry.type === "income" ? "text-green-600" : "text-red-600"}>
                    {entry.type === "income" ? "+" : "-"}৳{entry.amount.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-red-500">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Expense Breakdown */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Expense Breakdown</CardTitle>
            <CardDescription>Today's expenses by category</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm">Store Rent</span>
                <span className="font-medium">৳1,200.00</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Worker Salary</span>
                <span className="font-medium">৳150.00</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Electricity Bill</span>
                <span className="font-medium">৳85.50</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Internet Bill</span>
                <span className="font-medium">৳45.00</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Transportation</span>
                <span className="font-medium">৳25.00</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Monthly Summary</CardTitle>
            <CardDescription>This month's cash flow summary</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm">Total Income</span>
                <span className="font-medium text-green-600">৳45,231.89</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Total Expenses</span>
                <span className="font-medium text-red-600">৳32,781.14</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Net Profit</span>
                <span className="font-medium text-green-600">৳12,450.75</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Profit Margin</span>
                <span className="font-medium">27.5%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
