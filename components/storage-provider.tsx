"use client"

import { createContext, useContext, type ReactNode } from "react"
import { LocalStorage } from "@/lib/storage"
import { SyncService } from "@/lib/sync-service"

type StorageContextType = {
  storage: LocalStorage
  syncService: SyncService
}

const StorageContext = createContext<StorageContextType | undefined>(undefined)

export function StorageProvider({ children }: { children: ReactNode }) {
  const storage = LocalStorage.getInstance()
  const syncService = SyncService.getInstance()

  return <StorageContext.Provider value={{ storage, syncService }}>{children}</StorageContext.Provider>
}

export function useStorage() {
  const context = useContext(StorageContext)
  if (context === undefined) {
    throw new Error("useStorage must be used within a StorageProvider")
  }
  return context
}
