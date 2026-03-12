import React from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: { value: number; label: string };
  color?: 'indigo' | 'green' | 'blue' | 'orange' | 'purple' | 'red';
  className?: string;
}

const colorStyles = {
  indigo: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20',
  green:  'bg-green-50 text-green-600 dark:bg-green-900/20',
  blue:   'bg-blue-50 text-blue-600 dark:bg-blue-900/20',
  orange: 'bg-orange-50 text-orange-600 dark:bg-orange-900/20',
  purple: 'bg-purple-50 text-purple-600 dark:bg-purple-900/20',
  red:    'bg-red-50 text-red-600 dark:bg-red-900/20',
};

export function StatsCard({ title, value, icon: Icon, trend, color = 'indigo', className }: StatsCardProps) {
  return (
    <div className={cn('rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900 p-6', className)}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
          <p className="mt-1 text-3xl font-bold text-gray-900 dark:text-gray-100">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          {trend && (
            <p className={cn('mt-1 text-sm', trend.value >= 0 ? 'text-green-600' : 'text-red-600')}>
              {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}% {trend.label}
            </p>
          )}
        </div>
        <div className={cn('rounded-xl p-3', colorStyles[color])}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}
