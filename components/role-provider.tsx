"use client"

import { createContext, useContext, type ReactNode } from "react"

type Role = "admin" | "manager" | "cashier"

interface User {
  id: string
  name: string
  email: string
  role: Role
  avatar?: string
}

interface RoleContextType {
  user: User | null
  role: Role
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  isAdmin: () => boolean
  isManager: () => boolean
  isCashier: () => boolean
  hasPermission: (permission: string) => boolean
}

const RoleContext = createContext<RoleContextType | undefined>(undefined)

const alwaysTrue = () => true

export function RoleProvider({ children }: { children: ReactNode }) {
  // Since authentication is removed, provide default admin access
  const defaultUser: User = {
    id: "1",
    name: "System User",
    email: "system@mobilepos.com",
    role: "admin",
  }

  const contextValue: RoleContextType = {
    user: defaultUser,
    role: "admin",
    login: async () => true,
    logout: () => {},
    isAdmin: () => true,
    isManager: () => true,
    isCashier: () => true,
    hasPermission: () => true,
  }

  return <RoleContext.Provider value={contextValue}>{children}</RoleContext.Provider>
}

export function useRole(): RoleContextType {
  const context = useContext(RoleContext)

  // Return default context if no provider (no authentication mode)
  if (context === undefined) {
    return {
      user: {
        id: "1",
        name: "System User",
        email: "system@mobilepos.com",
        role: "admin",
      },
      role: "admin",
      login: async () => true,
      logout: () => {},
      isAdmin: () => true,
      isManager: () => true,
      isCashier: () => true,
      hasPermission: () => true,
    }
  }

  return context
}
