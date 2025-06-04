"use client"

import { useState } from "react"
import { Search, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface Customer {
  id: string
  name: string
  phone: string
  email: string
  dues: number
}

interface CustomerSearchProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelectCustomer: (customer: Customer) => void
}

export function CustomerSearch({ open, onOpenChange, onSelectCustomer }: CustomerSearchProps) {
  const [searchTerm, setSearchTerm] = useState("")

  // Mock customer data
  const customers: Customer[] = [
    {
      id: "1",
      name: "John Doe",
      phone: "+1 555-123-4567",
      email: "john@example.com",
      dues: 150.0,
    },
    {
      id: "2",
      name: "Sarah Davis",
      phone: "+1 555-987-6543",
      email: "sarah@example.com",
      dues: 0,
    },
    {
      id: "3",
      name: "Michael Brown",
      phone: "+1 555-456-7890",
      email: "michael@example.com",
      dues: 75.5,
    },
    {
      id: "4",
      name: "Emily Wilson",
      phone: "+1 555-234-5678",
      email: "emily@example.com",
      dues: 0,
    },
  ]

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone.includes(searchTerm) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleSelectCustomer = (customer: Customer) => {
    onSelectCustomer(customer)
    onOpenChange(false)
    setSearchTerm("")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <User className="mr-2 h-5 w-5" />
            Select Customer
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, phone, or email..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Customer List */}
          <div className="max-h-[400px] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Dues</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-medium">{customer.name}</TableCell>
                    <TableCell>{customer.phone}</TableCell>
                    <TableCell>{customer.email}</TableCell>
                    <TableCell className={customer.dues > 0 ? "text-red-600" : "text-green-600"}>
                      ${customer.dues.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Button size="sm" onClick={() => handleSelectCustomer(customer)}>
                        Select
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredCustomers.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No customers found</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
