import type { Metadata } from "next"
import SalesPageClient from "@/components/sales-page-client"

export const metadata: Metadata = {
  title: "Sales - MobilePOS",
  description: "View all sales transactions and history",
}

export default function SalesPage() {
  return <SalesPageClient />
}
