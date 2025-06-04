import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { RoleProvider } from "@/components/role-provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Mobile POS - Point of Sale System",
  description: "Complete mobile point of sale system for retail businesses",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <RoleProvider>{children}</RoleProvider>
      </body>
    </html>
  )
}
