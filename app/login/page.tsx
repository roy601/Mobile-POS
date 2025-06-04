import type { Metadata } from "next"
import ClientLoginPage from "./ClientPage"

export const metadata: Metadata = {
  title: "Login - MobilePOS",
  description: "Login to MobilePOS system",
}

export default function LoginPage() {
  return <ClientLoginPage />
}
