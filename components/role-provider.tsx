"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

type UserRole = "admin" | "manager"

type User = {
  id: string
  name: string
  email: string
  role: UserRole
  avatar: string
  permissions: string[]
}

type RoleContextType = {
  currentUser: User
  setCurrentUser: (user: User) => void
  hasPermission: (permission: string) => boolean
  isAdmin: () => boolean
  isManager: () => boolean
}

const RoleContext = createContext<RoleContextType | undefined>(undefined)

const ADMIN_PERMISSIONS = [
  "user_management",
  "security_settings",
  "backup_restore",
  "system_config",
  "store_settings",
  "pos_access",
  "inventory_full",
  "customer_management",
  "sales_returns",
  "purchase_returns",
  "analytics_full",
  "delete_records",
]

const MANAGER_PERMISSIONS = [
  "store_settings",
  "pos_access",
  "inventory_view",
  "inventory_edit",
  "customer_management",
  "sales_returns",
  "purchase_returns",
  "analytics_view",
  "system_config_limited",
]

export function RoleProvider({ children }: { children: ReactNode }) {
  // This would normally come from authentication
  const [currentUser, setCurrentUser] = useState<User>({
    id: "1",
    name: "Store Manager", // Change this to test different roles
    email: "manager@mobilepos.com",
    role: "manager", // Change to "admin" to test admin access
    avatar: "SM",
    permissions: MANAGER_PERMISSIONS,
  })

  const hasPermission = (permission: string): boolean => {
    return currentUser.permissions.includes(permission) || currentUser.role === "admin"
  }

  const isAdmin = (): boolean => currentUser.role === "admin"
  const isManager = (): boolean => currentUser.role === "manager"

  return (
    <RoleContext.Provider value={{ currentUser, setCurrentUser, hasPermission, isAdmin, isManager }}>
      {children}
    </RoleContext.Provider>
  )
}

export function useRole() {
  const context = useContext(RoleContext)
  if (context === undefined) {
    throw new Error("useRole must be used within a RoleProvider")
  }
  return context
}
