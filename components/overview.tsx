"use client"

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts"

const data = [
  {
    name: "Jan",
    total: 4500,
  },
  {
    name: "Feb",
    total: 3800,
  },
  {
    name: "Mar",
    total: 5000,
  },
  {
    name: "Apr",
    total: 4780,
  },
  {
    name: "May",
    total: 5890,
  },
  {
    name: "Jun",
    total: 6390,
  },
  {
    name: "Jul",
    total: 7490,
  },
]

export function Overview() {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={data}>
        <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `৳${value}`}
        />
        <Bar dataKey="total" fill="#16a34a" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
