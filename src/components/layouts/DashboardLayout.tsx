'use client'

import React, { useState } from 'react'
import { Sidebar } from './Sidebar'
import { Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'

interface NavItem {
  label: string
  href: string
  icon: LucideIcon
  badge?: number
}

interface DashboardLayoutProps {
  children: React.ReactNode
  sidebarItems: NavItem[]
  sidebarTitle?: string
}

export function DashboardLayout({ children, sidebarItems, sidebarTitle }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Mobile sidebar toggle */}
        <button
          className="lg:hidden mb-4 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          {sidebarOpen ? 'Close Menu' : 'Menu'}
        </button>

        <div className="flex gap-8">
          {/* Sidebar - always visible on desktop, toggle on mobile */}
          <div className={cn(
            'lg:block flex-shrink-0',
            sidebarOpen ? 'block' : 'hidden'
          )}>
            <Sidebar items={sidebarItems} title={sidebarTitle} />
          </div>

          {/* Main content */}
          <main className="flex-1 min-w-0">{children}</main>
        </div>
      </div>
    </div>
  )
}
