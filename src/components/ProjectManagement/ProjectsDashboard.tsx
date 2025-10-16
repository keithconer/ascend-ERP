// src/components/ProjectManagement/ProjectsDashboard.tsx

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FolderOpen } from 'lucide-react';

// Chart data (you can later fetch dynamically from API)
const data = [
  { name: 'Overdue', value: 3, color: '#ef4444' }, // red-500
  { name: 'Completed', value: 12, color: '#22c55e' }, // green-500
  { name: 'Total Projects', value: 18, color: '#3b82f6' }, // blue-500
];

export default function ProjectsDashboard() {
  return (
    <section className="bg-card border rounded-2xl p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <h2 className="text-2xl font-semibold flex items-center gap-2 text-foreground">
          <FolderOpen className="w-6 h-6 text-primary" />
          Projects Dashboard
        </h2>
        <p className="text-sm text-muted-foreground">
          Overview of ongoing project status
        </p>
      </div>

      <Card className="border-none shadow-none">
        <CardHeader className="pb-0">
          <CardTitle className="text-muted-foreground text-sm font-medium">
            Project Distribution
          </CardTitle>
        </CardHeader>

        <CardContent className="flex justify-center items-center p-0 pt-4">
          <div className="w-full h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  dataKey="value"
                  label={({ name, value }) => `${name} (${value})`}
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  align="center"
                  iconType="circle"
                  formatter={(value, entry) => (
                    <span className="text-sm text-muted-foreground">{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
