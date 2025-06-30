"use client"

import type React from "react"

import { Eye, EyeOff, Lock, User } from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useRole } from "@/components/role-provider"
import { useToast } from "@/hooks/use-toast"

// Mock user database - in real app this would be from a database
const USERS = {
  admin: {
    username: "admin",
    password: "admin123",
    role: "admin" as const,
    name: "System Administrator",
    email: "admin@mobilepos.com",
    avatar: "SA",
  },
  manager: {
    username: "manager",
    password: "manager123",
    role: "manager" as const,
    name: "Store Manager",
    email: "manager@mobilepos.com",
    avatar: "SM",
  },
}

export default function ClientLoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [selectedRole, setSelectedRole] = useState<"admin" | "manager">("admin")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const { login } = useRole()
  const { toast } = useToast()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Check credentials
      const user = USERS[selectedRole]

      if (username === user.username && password === user.password) {
        // Successful login
        login({
          id: selectedRole,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
        })

        toast({
          title: "Login Successful",
          description: `Welcome back, ${user.name}!`,
        })

        // Redirect to dashboard
        router.push("/")
      } else {
        setError("Invalid username or password")
      }
    } catch (err) {
      setError("Login failed. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  // Auto-fill credentials when role changes
  const handleRoleChange = (role: "admin" | "manager") => {
    setSelectedRole(role)
    setUsername(USERS[role].username)
    setPassword(USERS[role].password)
    setError("")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-green-600">MobilePOS</CardTitle>
          <CardDescription>Sign in to your account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="role">Login As</Label>
              <Select value={selectedRole} onValueChange={handleRoleChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">
                    <div className="flex items-center">
                      <Lock className="mr-2 h-4 w-4" />
                      Admin
                    </div>
                  </SelectItem>
                  <SelectItem value="manager">
                    <div className="flex items-center">
                      <User className="mr-2 h-4 w-4" />
                      Manager
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button className="w-full bg-green-600 hover:bg-green-700" size="lg" type="submit" disabled={isLoading}>
              {isLoading ? "Signing In..." : "Sign In"}
            </Button>

            {/* Demo credentials info */}
            <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm">
              <p className="font-medium text-blue-800 mb-2">Demo Credentials:</p>
              <div className="space-y-1 text-blue-700">
                <p>
                  <strong>Admin:</strong> admin / admin123
                </p>
                <p>
                  <strong>Manager:</strong> manager / manager123
                </p>
              </div>
              <p className="text-xs text-blue-600 mt-2">Credentials auto-fill when you select a role</p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
