"use client"

import { useState } from "react"
import { Download, Filter, Plus, Search, Users, Edit, Eye, Trash2, Phone, Mail, CreditCard } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type Customer = {
  id: number
  name: string
  email: string
  phone: string
  totalSpent: number
  orders: number
  lastPurchase: string
  status: string
  avatar: string
  address?: string
  dateJoined?: string
  notes?: string
}

export function CustomerClient() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [showCustomerDetails, setShowCustomerDetails] = useState(false)
  const [showAddCustomer, setShowAddCustomer] = useState(false)
  const [showEditCustomer, setShowEditCustomer] = useState(false)
  const [activeTab, setActiveTab] = useState("all")

  const [customers] = useState<Customer[]>([
    {
      id: 1,
      name: "John Doe",
      email: "john.doe@example.com",
      phone: "+1 555-123-4567",
      totalSpent: 1245.5,
      orders: 12,
      lastPurchase: "2023-05-15",
      status: "Active",
      avatar: "JD",
      address: "123 Main St, City, State 12345",
      dateJoined: "2023-01-15",
      notes: "Prefers premium products",
    },
    {
      id: 2,
      name: "Sarah Davis",
      email: "sarah.davis@example.com",
      phone: "+1 555-987-6543",
      totalSpent: 3456.75,
      orders: 8,
      lastPurchase: "2023-05-12",
      status: "Loyalty",
      avatar: "SD",
      address: "456 Oak Ave, City, State 12345",
      dateJoined: "2022-11-20",
      notes: "Frequent buyer, excellent customer",
    },
    {
      id: 3,
      name: "Robert Kim",
      email: "robert.kim@example.com",
      phone: "+1 555-456-7890",
      totalSpent: 876.25,
      orders: 6,
      lastPurchase: "2023-05-10",
      status: "Active",
      avatar: "RK",
      address: "789 Pine St, City, State 12345",
      dateJoined: "2023-02-28",
      notes: "Interested in accessories",
    },
    {
      id: 4,
      name: "Alicia Martinez",
      email: "alicia.martinez@example.com",
      phone: "+1 555-789-0123",
      totalSpent: 2345.0,
      orders: 15,
      lastPurchase: "2023-05-08",
      status: "Loyalty",
      avatar: "AM",
      address: "321 Elm St, City, State 12345",
      dateJoined: "2022-08-10",
      notes: "VIP customer, bulk purchases",
    },
    {
      id: 5,
      name: "Thomas Johnson",
      email: "thomas.johnson@example.com",
      phone: "+1 555-234-5678",
      totalSpent: 567.5,
      orders: 3,
      lastPurchase: "2023-05-05",
      status: "Inactive",
      avatar: "TJ",
      address: "654 Maple Ave, City, State 12345",
      dateJoined: "2023-04-01",
      notes: "New customer, potential for growth",
    },
  ])

  const filteredCustomers = customers.filter((customer) => {
    const matchesSearch =
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone.includes(searchTerm)

    const matchesTab =
      activeTab === "all" ||
      (activeTab === "active" && customer.status === "Active") ||
      (activeTab === "loyalty" && customer.status === "Loyalty")

    return matchesSearch && matchesTab
  })

  const handleViewCustomer = (customer: Customer) => {
    setSelectedCustomer(customer)
    setShowCustomerDetails(true)
  }

  const handleEditCustomer = (customer: Customer) => {
    setSelectedCustomer(customer)
    setShowEditCustomer(true)
  }

  const handleDeleteCustomer = (customer: Customer) => {
    if (confirm(`Are you sure you want to delete ${customer.name}?`)) {
      alert("Customer deleted successfully!")
    }
  }

  const handleCallCustomer = (phone: string) => {
    window.open(`tel:${phone}`)
  }

  const handleEmailCustomer = (email: string) => {
    window.open(`mailto:${email}`)
  }

  const handleExportData = () => {
    alert("Customer data exported successfully!")
  }

  const totalCustomers = customers.length
  const activeCustomers = customers.filter((c) => c.status === "Active").length
  const loyaltyCustomers = customers.filter((c) => c.status === "Loyalty").length
  const averagePurchase = customers.reduce((sum, c) => sum + c.totalSpent, 0) / customers.length

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Customer Management</h2>
        <div className="flex items-center space-x-2">
          <Button onClick={() => setShowAddCustomer(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Customer
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCustomers}</div>
            <p className="text-xs text-muted-foreground">+180 this month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCustomers}</div>
            <p className="text-xs text-muted-foreground">
              {((activeCustomers / totalCustomers) * 100).toFixed(1)}% of total
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Purchase</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">৳{averagePurchase.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">+12% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Loyalty Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loyaltyCustomers}</div>
            <p className="text-xs text-muted-foreground">
              {((loyaltyCustomers / totalCustomers) * 100).toFixed(0)}% of total customers
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-between items-center">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList>
            <TabsTrigger value="all">All Customers</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="loyalty">Loyalty Members</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search customers..."
              className="pl-8 w-[200px] lg:w-[300px]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>

          <Button variant="outline" size="icon" onClick={handleExportData}>
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Total Spent</TableHead>
                <TableHead>Orders</TableHead>
                <TableHead>Last Purchase</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={`/placeholder.svg?height=32&width=32&text=${customer.avatar}`} />
                        <AvatarFallback>{customer.avatar}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{customer.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>{customer.email}</TableCell>
                  <TableCell>{customer.phone}</TableCell>
                  <TableCell>৳{customer.totalSpent.toFixed(2)}</TableCell>
                  <TableCell>{customer.orders}</TableCell>
                  <TableCell>{customer.lastPurchase}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        customer.status === "Active"
                          ? "outline"
                          : customer.status === "Loyalty"
                            ? "secondary"
                            : "default"
                      }
                    >
                      {customer.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleCallCustomer(customer.phone)}>
                        <Phone className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleEmailCustomer(customer.email)}>
                        <Mail className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleViewCustomer(customer)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleEditCustomer(customer)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteCustomer(customer)}>
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

      {/* Customer Details Dialog */}
      <Dialog open={showCustomerDetails} onOpenChange={setShowCustomerDetails}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Customer Details</DialogTitle>
            <DialogDescription>Complete customer information and purchase history</DialogDescription>
          </DialogHeader>
          {selectedCustomer && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={`/placeholder.svg?height=64&width=64&text=${selectedCustomer.avatar}`} />
                  <AvatarFallback className="text-lg">{selectedCustomer.avatar}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-semibold">{selectedCustomer.name}</h3>
                  <p className="text-sm text-muted-foreground">{selectedCustomer.email}</p>
                  <p className="text-sm text-muted-foreground">{selectedCustomer.phone}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Total Spent</Label>
                  <p className="text-lg font-semibold">৳{selectedCustomer.totalSpent.toFixed(2)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Total Orders</Label>
                  <p className="text-lg font-semibold">{selectedCustomer.orders}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Last Purchase</Label>
                  <p className="text-sm text-muted-foreground">{selectedCustomer.lastPurchase}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Date Joined</Label>
                  <p className="text-sm text-muted-foreground">{selectedCustomer.dateJoined}</p>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Address</Label>
                <p className="text-sm text-muted-foreground">{selectedCustomer.address}</p>
              </div>

              <div>
                <Label className="text-sm font-medium">Notes</Label>
                <p className="text-sm text-muted-foreground">{selectedCustomer.notes}</p>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => handleCallCustomer(selectedCustomer.phone)}>
                  <Phone className="mr-2 h-4 w-4" />
                  Call
                </Button>
                <Button variant="outline" onClick={() => handleEmailCustomer(selectedCustomer.email)}>
                  <Mail className="mr-2 h-4 w-4" />
                  Email
                </Button>
                <Button variant="outline">
                  <CreditCard className="mr-2 h-4 w-4" />
                  View Orders
                </Button>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCustomerDetails(false)}>
              Close
            </Button>
            <Button
              onClick={() => {
                setShowCustomerDetails(false)
                handleEditCustomer(selectedCustomer!)
              }}
            >
              Edit Customer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Customer Dialog */}
      <Dialog open={showAddCustomer} onOpenChange={setShowAddCustomer}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Customer</DialogTitle>
            <DialogDescription>Enter customer information to create a new account</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="add-name">Full Name*</Label>
                <Input id="add-name" placeholder="Enter full name" />
              </div>
              <div>
                <Label htmlFor="add-phone">Phone Number*</Label>
                <Input id="add-phone" placeholder="Enter phone number" />
              </div>
            </div>
            <div>
              <Label htmlFor="add-email">Email Address</Label>
              <Input id="add-email" type="email" placeholder="Enter email address" />
            </div>
            <div>
              <Label htmlFor="add-address">Address</Label>
              <Input id="add-address" placeholder="Enter address" />
            </div>
            <div>
              <Label htmlFor="add-notes">Notes</Label>
              <Input id="add-notes" placeholder="Additional notes" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddCustomer(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                setShowAddCustomer(false)
                alert("Customer added successfully!")
              }}
            >
              Add Customer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Customer Dialog */}
      <Dialog open={showEditCustomer} onOpenChange={setShowEditCustomer}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Customer</DialogTitle>
            <DialogDescription>Update customer information</DialogDescription>
          </DialogHeader>
          {selectedCustomer && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-name">Full Name*</Label>
                  <Input id="edit-name" defaultValue={selectedCustomer.name} />
                </div>
                <div>
                  <Label htmlFor="edit-phone">Phone Number*</Label>
                  <Input id="edit-phone" defaultValue={selectedCustomer.phone} />
                </div>
              </div>
              <div>
                <Label htmlFor="edit-email">Email Address</Label>
                <Input id="edit-email" type="email" defaultValue={selectedCustomer.email} />
              </div>
              <div>
                <Label htmlFor="edit-address">Address</Label>
                <Input id="edit-address" defaultValue={selectedCustomer.address} />
              </div>
              <div>
                <Label htmlFor="edit-status">Status</Label>
                <Select defaultValue={selectedCustomer.status}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Loyalty">Loyalty</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-notes">Notes</Label>
                <Input id="edit-notes" defaultValue={selectedCustomer.notes} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditCustomer(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                setShowEditCustomer(false)
                alert("Customer updated successfully!")
              }}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
