import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number | null | undefined): string {
  if (amount == null) return 'Not specified'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatSalaryRange(min: number | null | undefined, max: number | null | undefined): string {
  if (!min && !max) return 'Not specified'
  if (min && max) return `${formatCurrency(min)} - ${formatCurrency(max)}`
  if (min) return `From ${formatCurrency(min)}`
  return `Up to ${formatCurrency(max)}`
}

// Alias used by components
export function formatSalary(min: number | null | undefined, max: number | null | undefined): string {
  return formatSalaryRange(min, max)
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return 'N/A'
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date))
}

export function formatRelativeTime(date: Date | string): string {
  const now = new Date()
  const then = new Date(date)
  const diffMs = now.getTime() - then.getTime()
  const diffDays = Math.floor(diffMs / 86400000)
  const diffHours = Math.floor((diffMs % 86400000) / 3600000)
  const diffMins = Math.floor((diffMs % 3600000) / 60000)
  if (diffDays > 30) return formatDate(date)
  if (diffDays > 0) return `${diffDays}d ago`
  if (diffHours > 0) return `${diffHours}h ago`
  if (diffMins > 0) return `${diffMins}m ago`
  return 'Just now'
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str
  return str.slice(0, length) + '...'
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function stageColor(stage: string): string {
  const map: Record<string, string> = {
    APPLIED: 'bg-blue-100 text-blue-800',
    UNDER_REVIEW: 'bg-yellow-100 text-yellow-800',
    SHORTLISTED: 'bg-purple-100 text-purple-800',
    INTERVIEW_SCHEDULED: 'bg-indigo-100 text-indigo-800',
    OFFER_SENT: 'bg-orange-100 text-orange-800',
    HIRED: 'bg-green-100 text-green-800',
    REJECTED: 'bg-red-100 text-red-800',
  }
  return map[stage] ?? 'bg-gray-100 text-gray-800'
}

export function stageLabel(stage: string): string {
  return stage.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

// API response helpers — used by all API routes
export function apiResponse<T>(data: T, status = 200, meta?: Record<string, unknown>): Response {
  return Response.json(
    { success: true, data, error: null, ...(meta ? { meta } : {}) },
    { status }
  )
}

export function apiError(message: string, status = 400): Response {
  return Response.json({ success: false, data: null, error: message }, { status })
}
