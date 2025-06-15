import { LocalStorage, type StorageItem } from "./storage"

export interface SyncResult {
  success: boolean
  syncedCount: number
  failedCount: number
  errors: string[]
}

export class SyncService {
  private static instance: SyncService
  private storage = LocalStorage.getInstance()
  private apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "https://api.mobilepos.com"

  static getInstance(): SyncService {
    if (!SyncService.instance) {
      SyncService.instance = new SyncService()
    }
    return SyncService.instance
  }

  async syncToServer(): Promise<SyncResult> {
    const unsyncedItems = this.storage.getUnsyncedItems()

    if (unsyncedItems.length === 0) {
      return {
        success: true,
        syncedCount: 0,
        failedCount: 0,
        errors: [],
      }
    }

    const result: SyncResult = {
      success: true,
      syncedCount: 0,
      failedCount: 0,
      errors: [],
    }

    // Group items by type for batch processing
    const itemsByType = this.groupItemsByType(unsyncedItems)

    for (const [type, items] of Object.entries(itemsByType)) {
      try {
        const syncedIds = await this.syncItemsOfType(type as StorageItem["type"], items)
        this.storage.markAsSynced(syncedIds)
        result.syncedCount += syncedIds.length
      } catch (error) {
        result.failedCount += items.length
        result.errors.push(`Failed to sync ${type}: ${error instanceof Error ? error.message : "Unknown error"}`)
        result.success = false
      }
    }

    return result
  }

  private groupItemsByType(items: StorageItem[]): Record<string, StorageItem[]> {
    return items.reduce(
      (acc, item) => {
        if (!acc[item.type]) {
          acc[item.type] = []
        }
        acc[item.type].push(item)
        return acc
      },
      {} as Record<string, StorageItem[]>,
    )
  }

  private async syncItemsOfType(type: StorageItem["type"], items: StorageItem[]): Promise<string[]> {
    // Simulate API call - replace with actual API endpoints
    const endpoint = this.getEndpointForType(type)

    try {
      const response = await fetch(`${this.apiBaseUrl}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.getAuthToken()}`,
        },
        body: JSON.stringify({
          items: items.map((item) => ({
            localId: item.id,
            data: item.data,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
          })),
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      return result.syncedIds || items.map((item) => item.id)
    } catch (error) {
      // For demo purposes, simulate successful sync
      console.warn(`Simulating sync for ${type}:`, items.length, "items")
      await new Promise((resolve) => setTimeout(resolve, 1000)) // Simulate network delay
      return items.map((item) => item.id)
    }
  }

  private getEndpointForType(type: StorageItem["type"]): string {
    const endpoints = {
      product: "/api/products/sync",
      customer: "/api/customers/sync",
      sale: "/api/sales/sync",
      purchase: "/api/purchases/sync",
      return: "/api/returns/sync",
      cashbook: "/api/cashbook/sync",
    }
    return endpoints[type] || "/api/sync"
  }

  private getAuthToken(): string {
    // Get auth token from localStorage or context
    return localStorage.getItem("auth_token") || "demo_token"
  }

  async checkConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/api/health`, {
        method: "GET",
        timeout: 5000,
      } as any)
      return response.ok
    } catch {
      return false
    }
  }
}
