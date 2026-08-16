"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function StatusChart({
  data,
}: {
  data: { status: string; count: number }[];
}) {
  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 8%)" />
          <XAxis dataKey="status" tick={{ fill: "oklch(0.72 0.02 80)", fontSize: 11 }} />
          <YAxis tick={{ fill: "oklch(0.72 0.02 80)", fontSize: 11 }} allowDecimals={false} />
          <Tooltip
            contentStyle={{
              background: "oklch(0.2 0.014 70)",
              border: "1px solid oklch(1 0 0 / 10%)",
              borderRadius: 8,
            }}
          />
          <Bar dataKey="count" fill="oklch(0.82 0.07 85)" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
