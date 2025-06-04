"use client"

import { useState } from "react"
import { Plus, Settings, Shield, Store, Users, Save, Upload, AlertTriangle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { useRole } from "@/components/role-provider"

type User = {
  id: number
  name: string
  username: string
  email: string
  role: "admin" | "manager"
  status: "active" | "inactive"
  lastLogin: string
  permissions: string[]
}

export function SettingsClient() {
  const { toast } = useToast()
  const { currentUser, isAdmin, hasPermission } = useRole()
  const [showAddUser, setShowAddUser] = useState(false)
  const [showEditUser, setShowEditUser] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)

  const [users, setUsers] = useState<User[]>([
    {
      id: 1,
      name: "John Admin",
      username: "admin",
      email: "admin@mobilepos.com",
      role: "admin",
      status: "active",
      lastLogin: "2023-05-18 10:30 AM",
      permissions: ["all"],
    },
    {
      id: 2,
      name: "Sarah Manager",
      username: "manager",
      email: "manager@mobilepos.com",
      role: "manager",
      status: "active",
      lastLogin: "2023-05-18 09:15 AM",
      permissions: ["sales", "inventory", "customers", "reports"],
    },
  ])

  const [storeSettings, setStoreSettings] = useState({
    name: "Mobile Shop Pro",
    phone: "+880 1712-345678",
    address: "123 Dhanmondi, Dhaka, Bangladesh",
    email: "info@mobileshoppro.com",
    taxId: "TAX123456789",
    currency: "BDT",
    timezone: "Asia/Dhaka",
    receiptFooter: "Thank you for your business!",
  })

  const [systemSettings, setSystemSettings] = useState({
    lowStockAlert: true,
    dailySalesReport: true,
    barcodeScanner: true,
    autoLogout: "30",
    loginAttempts: "5",
    strongPasswords: true,
    twoFactorAuth: false,
    auditLogging: true,
    ipRestriction: false,
    autoBackup: true,
    backupFrequency: "daily",
    autoPrintReceipt: true,
    includeLogo: true,
  })

  const handleSaveStoreSettings = () => {
    if (!hasPermission("store_settings")) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to modify store settings.",
        variant: "destructive",
      })
      return
    }
    toast({
      title: "Settings Saved",
      description: "Store settings have been updated successfully.",
    })
  }

  const handleSaveSystemSettings = () => {
    if (!hasPermission("system_config") && !hasPermission("system_config_limited")) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to modify system settings.",
        variant: "destructive",
      })
      return
    }
    toast({
      title: "Settings Saved",
      description: "System settings have been updated successfully.",
    })
  }

  const handleAddUser = (userData: any) => {
    if (!hasPermission("user_management")) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to add users.",
        variant: "destructive",
      })
      return
    }
    const newUser: User = {
      id: users.length + 1,
      ...userData,
      status: "active",
      lastLogin: "Never",
      permissions: userData.role === "admin" ? ["all"] : ["sales", "inventory", "customers"],
    }
    setUsers([...users, newUser])
    setShowAddUser(false)
    toast({
      title: "User Added",
      description: `${userData.name} has been added successfully.`,
    })
  }

  const handleUploadLogo = () => {
    if (!hasPermission("store_settings")) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to upload logo.",
        variant: "destructive",
      })
      return
    }
    toast({
      title: "Logo Uploaded",
      description: "Store logo has been updated successfully.",
    })
  }

  const handleBackupNow = () => {
    if (!hasPermission("backup_restore")) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to create backups.",
        variant: "destructive",
      })
      return
    }
    toast({
      title: "Backup Started",
      description: "Creating backup... This may take a few minutes.",
    })
  }

  // Determine available tabs based on role
  const getAvailableTabs = () => {
    const tabs = []

    if (hasPermission("user_management")) {
      tabs.push({ value: "users", label: "Users" })
    }

    if (hasPermission("store_settings")) {
      tabs.push({ value: "store", label: "Store" })
    }

    if (hasPermission("system_config") || hasPermission("system_config_limited")) {
      tabs.push({ value: "system", label: "System" })
    }

    if (hasPermission("security_settings")) {
      tabs.push({ value: "security", label: "Security" })
    }

    if (hasPermission("backup_restore")) {
      tabs.push({ value: "backup", label: "Backup" })
    }

    return tabs
  }

  const availableTabs = getAvailableTabs()
  const defaultTab = availableTabs.length > 0 ? availableTabs[0].value : "store"

  if (availableTabs.length === 0) {
    return (
      <div className="flex-1 p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Settings</h1>
        </div>
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            You don't have permission to access any settings. Please contact your administrator.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="flex-1 p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Settings</h1>
        {!isAdmin() && (
          <Badge variant="secondary" className="text-sm">
            Manager Access - Limited Permissions
          </Badge>
        )}
      </div>

      <Tabs defaultValue={defaultTab} className="space-y-6">
        <TabsList className={`grid w-full max-w-2xl grid-cols-${availableTabs.length}`}>
          {availableTabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* User Management - Admin Only */}
        {hasPermission("user_management") && (
          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center">
                      <Users className="mr-2 h-5 w-5" />
                      User Management
                    </CardTitle>
                    <CardDescription>Manage admin and manager accounts</CardDescription>
                  </div>
                  <Button onClick={() => setShowAddUser(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add User
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Username</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Login</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>{user.username}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge variant={user.role === "admin" ? "destructive" : "secondary"}>{user.role}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.status === "active" ? "outline" : "secondary"}>{user.status}</Badge>
                        </TableCell>
                        <TableCell>{user.lastLogin}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm">
                            Edit
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Store Settings */}
        {hasPermission("store_settings") && (
          <TabsContent value="store" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Store className="mr-2 h-5 w-5" />
                  Store Information
                </CardTitle>
                <CardDescription>Configure your store details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="store-name">Store Name</Label>
                    <Input
                      id="store-name"
                      value={storeSettings.name}
                      onChange={(e) => setStoreSettings({ ...storeSettings, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="store-phone">Phone Number</Label>
                    <Input
                      id="store-phone"
                      value={storeSettings.phone}
                      onChange={(e) => setStoreSettings({ ...storeSettings, phone: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="store-address">Address</Label>
                  <Input
                    id="store-address"
                    value={storeSettings.address}
                    onChange={(e) => setStoreSettings({ ...storeSettings, address: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="store-email">Email</Label>
                    <Input
                      id="store-email"
                      value={storeSettings.email}
                      onChange={(e) => setStoreSettings({ ...storeSettings, email: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="tax-id">Tax ID</Label>
                    <Input
                      id="tax-id"
                      value={storeSettings.taxId}
                      onChange={(e) => setStoreSettings({ ...storeSettings, taxId: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="currency">Currency</Label>
                    <Select
                      value={storeSettings.currency}
                      onValueChange={(value) => setStoreSettings({ ...storeSettings, currency: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BDT">BDT (৳)</SelectItem>
                        <SelectItem value="USD">USD ($)</SelectItem>
                        <SelectItem value="EUR">EUR (€)</SelectItem>
                        <SelectItem value="GBP">GBP (£)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="timezone">Timezone</Label>
                    <Select
                      value={storeSettings.timezone}
                      onValueChange={(value) => setStoreSettings({ ...storeSettings, timezone: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Asia/Dhaka">Asia/Dhaka</SelectItem>
                        <SelectItem value="Asia/Karachi">Asia/Karachi</SelectItem>
                        <SelectItem value="Asia/Kolkata">Asia/Kolkata</SelectItem>
                        <SelectItem value="UTC">UTC</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button onClick={handleSaveStoreSettings}>
                  <Save className="mr-2 h-4 w-4" />
                  Save Store Settings
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Receipt Settings</CardTitle>
                <CardDescription>Configure receipt printing options</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Print Receipt Automatically</Label>
                    <p className="text-sm text-muted-foreground">Auto-print receipt after each sale</p>
                  </div>
                  <Switch
                    checked={systemSettings.autoPrintReceipt}
                    onCheckedChange={(checked) => setSystemSettings({ ...systemSettings, autoPrintReceipt: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Include Store Logo</Label>
                    <p className="text-sm text-muted-foreground">Show store logo on receipts</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={systemSettings.includeLogo}
                      onCheckedChange={(checked) => setSystemSettings({ ...systemSettings, includeLogo: checked })}
                    />
                    <Button variant="outline" size="sm" onClick={handleUploadLogo}>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Logo
                    </Button>
                  </div>
                </div>
                <div>
                  <Label htmlFor="receipt-footer">Receipt Footer Message</Label>
                  <Input
                    id="receipt-footer"
                    value={storeSettings.receiptFooter}
                    onChange={(e) => setStoreSettings({ ...storeSettings, receiptFooter: e.target.value })}
                  />
                </div>
                <Button onClick={handleSaveStoreSettings}>
                  <Save className="mr-2 h-4 w-4" />
                  Save Receipt Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* System Settings - Limited for Manager */}
        {(hasPermission("system_config") || hasPermission("system_config_limited")) && (
          <TabsContent value="system" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="mr-2 h-5 w-5" />
                  System Configuration
                  {!isAdmin() && (
                    <Badge variant="secondary" className="ml-2">
                      Limited Access
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>Configure system-wide settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Low Stock Alerts</Label>
                    <p className="text-sm text-muted-foreground">Send notifications when stock is low</p>
                  </div>
                  <Switch
                    checked={systemSettings.lowStockAlert}
                    onCheckedChange={(checked) => setSystemSettings({ ...systemSettings, lowStockAlert: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Daily Sales Report</Label>
                    <p className="text-sm text-muted-foreground">Email daily sales summary</p>
                  </div>
                  <Switch
                    checked={systemSettings.dailySalesReport}
                    onCheckedChange={(checked) => setSystemSettings({ ...systemSettings, dailySalesReport: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Barcode Scanner</Label>
                    <p className="text-sm text-muted-foreground">Enable barcode scanning functionality</p>
                  </div>
                  <Switch
                    checked={systemSettings.barcodeScanner}
                    onCheckedChange={(checked) => setSystemSettings({ ...systemSettings, barcodeScanner: checked })}
                    disabled={!hasPermission("system_config")}
                  />
                </div>
                {/* Advanced settings only for admin */}
                {hasPermission("system_config") && (
                  <div>
                    <Label htmlFor="backup-frequency">Backup Frequency</Label>
                    <Select
                      value={systemSettings.backupFrequency}
                      onValueChange={(value) => setSystemSettings({ ...systemSettings, backupFrequency: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hourly">Hourly</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <Button onClick={handleSaveSystemSettings}>
                  <Save className="mr-2 h-4 w-4" />
                  Save System Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Security Settings - Admin Only */}
        {hasPermission("security_settings") && (
          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="mr-2 h-5 w-5" />
                  Security Settings
                </CardTitle>
                <CardDescription>Manage security and access controls</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Role Permissions</Label>
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center justify-between p-2 border rounded">
                      <span>Admin - Full Access</span>
                      <Badge variant="destructive">All Permissions</Badge>
                    </div>
                    <div className="flex items-center justify-between p-2 border rounded">
                      <span>Manager - Limited Access</span>
                      <Badge variant="secondary">Sales, Inventory, Customers, Reports</Badge>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Audit Logging</Label>
                    <p className="text-sm text-muted-foreground">Log all user activities</p>
                  </div>
                  <Switch
                    checked={systemSettings.auditLogging}
                    onCheckedChange={(checked) => setSystemSettings({ ...systemSettings, auditLogging: checked })}
                  />
                </div>
                <Button onClick={handleSaveSystemSettings}>
                  <Save className="mr-2 h-4 w-4" />
                  Save Security Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Backup Settings - Admin Only */}
        {hasPermission("backup_restore") && (
          <TabsContent value="backup" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Data Backup & Recovery</CardTitle>
                <CardDescription>Manage your data backups</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Automatic Backup</Label>
                    <p className="text-sm text-muted-foreground">Automatically backup data daily</p>
                  </div>
                  <Switch
                    checked={systemSettings.autoBackup}
                    onCheckedChange={(checked) => setSystemSettings({ ...systemSettings, autoBackup: checked })}
                  />
                </div>
                <div>
                  <Label>Last Backup</Label>
                  <p className="text-sm text-muted-foreground">May 18, 2023 at 2:00 AM</p>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleBackupNow}>Create Backup Now</Button>
                  <Button variant="outline">Restore from Backup</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* Add User Dialog - Admin Only */}
      {hasPermission("user_management") && (
        <Dialog open={showAddUser} onOpenChange={setShowAddUser}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add New User</DialogTitle>
              <DialogDescription>Create a new admin or manager account.</DialogDescription>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                const formData = new FormData(e.currentTarget)
                handleAddUser({
                  name: formData.get("name"),
                  username: formData.get("username"),
                  email: formData.get("email"),
                  role: formData.get("role"),
                })
              }}
            >
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Name
                  </Label>
                  <Input id="name" name="name" placeholder="Full name" className="col-span-3" required />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="email" className="text-right">
                    Email
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="email@example.com"
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="username" className="text-right">
                    Username
                  </Label>
                  <Input id="username" name="username" placeholder="username" className="col-span-3" required />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="password" className="text-right">
                    Password
                  </Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Password"
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="role" className="text-right">
                    Role
                  </Label>
                  <Select name="role" required>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowAddUser(false)}>
                  Cancel
                </Button>
                <Button type="submit">Create User</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
