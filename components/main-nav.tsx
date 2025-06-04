import type React from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { BarChart3, CreditCard, Package, RotateCcw, Settings, ShoppingBag, Users } from "lucide-react"

export function MainNav({ className, ...props }: React.HTMLAttributes<HTMLElement>) {
  return (
    <nav className={cn("flex items-center space-x-4 lg:space-x-6", className)} {...props}>
      <Link href="/" className="text-lg font-medium transition-colors hover:text-primary">
        MobilePOS
      </Link>
      <Link
        href="/pos"
        className="flex items-center text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
      >
        <CreditCard className="mr-1 h-4 w-4" />
        POS
      </Link>
      <Link
        href="/inventory"
        className="flex items-center text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
      >
        <Package className="mr-1 h-4 w-4" />
        Inventory
      </Link>
      <Link
        href="/customers"
        className="flex items-center text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
      >
        <Users className="mr-1 h-4 w-4" />
        Customers
      </Link>
      <Link
        href="/purchases"
        className="flex items-center text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
      >
        <ShoppingBag className="mr-1 h-4 w-4" />
        Purchases
      </Link>
      <Link
        href="/returns"
        className="flex items-center text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
      >
        <RotateCcw className="mr-1 h-4 w-4" />
        Returns
      </Link>
      <Link
        href="/analytics"
        className="flex items-center text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
      >
        <BarChart3 className="mr-1 h-4 w-4" />
        Analytics
      </Link>
      <Link
        href="/settings"
        className="flex items-center text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
      >
        <Settings className="mr-1 h-4 w-4" />
        Settings
      </Link>
    </nav>
  )
}
