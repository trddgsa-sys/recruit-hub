'use client';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899'];

interface ApplicationsBarChartProps {
  data: { jobTitle: string; count: number }[];
}

export function ApplicationsBarChart({ data }: ApplicationsBarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 60 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis
          dataKey="jobTitle"
          tick={{ fontSize: 11 }}
          angle={-35}
          textAnchor="end"
          height={70}
        />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip />
        <Bar dataKey="count" name="Applications" fill="#4f46e5" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

interface PipelineChartProps {
  data: { stage: string; count: number }[];
}

export function PipelinePieChart({ data }: PipelineChartProps) {
  const formatted = data.map((d) => ({
    ...d,
    name: d.stage.replace(/_/g, ' '),
  }));
  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={formatted}
          dataKey="count"
          nameKey="name"
          cx="50%"
          cy="50%"
          outerRadius={100}
          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          labelLine={false}
        >
          {formatted.map((_, index) => (
            <Cell key={index} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}

interface HiresLineChartProps {
  data: { month: string; hires: number }[];
}

export function HiresLineChart({ data }: HiresLineChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="month" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip />
        <Line
          type="monotone"
          dataKey="hires"
          name="Hires"
          stroke="#10b981"
          strokeWidth={2}
          dot={{ r: 4, fill: '#10b981' }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

interface ApplicationsLineChartProps {
  data: { date: string; count: number }[];
}

export function ApplicationsLineChart({ data }: ApplicationsLineChartProps) {
  // Show every 5th label to avoid crowding
  const labelData = data.map((d, i) => ({ ...d, label: i % 5 === 0 ? d.date : '' }));
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={labelData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="label" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip labelFormatter={(_, payload) => payload?.[0]?.payload?.date ?? ''} />
        <Line
          type="monotone"
          dataKey="count"
          name="Applications"
          stroke="#4f46e5"
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
