"use client"

import { useState } from "react"
import { Calendar, CalendarDays } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DayCashbook } from "@/components/day-cashbook"

export function AnalyticsClient() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0])

  const handleDateChange = (date: string) => {
    setSelectedDate(date)
  }

  return (
    <div className="flex-1 p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
      </div>

      {/* Date Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="mr-2 h-5 w-5" />
            Select Date for Cashbook
          </CardTitle>
          <CardDescription>Choose a specific date to view the day's cashbook and transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Label htmlFor="date-picker">Date:</Label>
              <Input
                id="date-picker"
                type="date"
                value={selectedDate}
                onChange={(e) => handleDateChange(e.target.value)}
                className="w-auto"
              />
            </div>
            <Button variant="outline" onClick={() => setSelectedDate(new Date().toISOString().split("T")[0])}>
              <CalendarDays className="mr-2 h-4 w-4" />
              Today
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Day Cashbook */}
      <Card>
        <CardHeader>
          <CardTitle>
            Day Cashbook -{" "}
            {new Date(selectedDate).toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </CardTitle>
          <CardDescription>Complete financial summary for the selected date</CardDescription>
        </CardHeader>
        <CardContent>
          <DayCashbook selectedDate={selectedDate} />
        </CardContent>
      </Card>
    </div>
  )
}
