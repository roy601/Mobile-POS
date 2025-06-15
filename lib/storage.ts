export interface StorageItem {
  id: string
  type: "product" | "customer" | "sale" | "purchase" | "return" | "cashbook"
  data: any
  createdAt: string
  updatedAt: string
  synced: boolean
  syncedAt?: string
}

export class LocalStorage {
  private static instance: LocalStorage
  private storageKey = "mobilepos_data"

  static getInstance(): LocalStorage {
    if (!LocalStorage.instance) {
      LocalStorage.instance = new LocalStorage()
    }
    return LocalStorage.instance
  }

  private getStorage(): StorageItem[] {
    if (typeof window === "undefined") return []
    const data = localStorage.getItem(this.storageKey)
    return data ? JSON.parse(data) : []
  }

  private setStorage(data: StorageItem[]): void {
    if (typeof window === "undefined") return
    localStorage.setItem(this.storageKey, JSON.stringify(data))
  }

  // Create or update item
  save(type: StorageItem["type"], data: any, id?: string): string {
    const items = this.getStorage()
    const itemId = id || this.generateId()
    const now = new Date().toISOString()

    const existingIndex = items.findIndex((item) => item.id === itemId)

    const item: StorageItem = {
      id: itemId,
      type,
      data,
      createdAt: existingIndex === -1 ? now : items[existingIndex].createdAt,
      updatedAt: now,
      synced: false,
    }

    if (existingIndex === -1) {
      items.push(item)
    } else {
      items[existingIndex] = item
    }

    this.setStorage(items)
    return itemId
  }

  // Get items by type
  getByType(type: StorageItem["type"]): StorageItem[] {
    return this.getStorage().filter((item) => item.type === type)
  }

  // Get single item
  getById(id: string): StorageItem | null {
    return this.getStorage().find((item) => item.id === id) || null
  }

  // Delete item
  delete(id: string): boolean {
    const items = this.getStorage()
    const filteredItems = items.filter((item) => item.id !== id)
    this.setStorage(filteredItems)
    return filteredItems.length < items.length
  }

  // Get unsynced items
  getUnsyncedItems(): StorageItem[] {
    return this.getStorage().filter((item) => !item.synced)
  }

  // Mark items as synced
  markAsSynced(ids: string[]): void {
    const items = this.getStorage()
    const now = new Date().toISOString()

    items.forEach((item) => {
      if (ids.includes(item.id)) {
        item.synced = true
        item.syncedAt = now
      }
    })

    this.setStorage(items)
  }

  // Get sync statistics
  getSyncStats(): { total: number; synced: number; unsynced: number } {
    const items = this.getStorage()
    const synced = items.filter((item) => item.synced).length
    return {
      total: items.length,
      synced,
      unsynced: items.length - synced,
    }
  }

  // Clear all data
  clearAll(): void {
    if (typeof window !== "undefined") {
      localStorage.removeItem(this.storageKey)
    }
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }
}
