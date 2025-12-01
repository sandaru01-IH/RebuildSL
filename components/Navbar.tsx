'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Map, FileText, Heart, Shield, Menu, X, Bug } from 'lucide-react'

export default function Navbar() {
  const pathname = usePathname()
  // Initialize: desktop = open, mobile = closed
  const [isOpen, setIsOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 768 // Open on desktop, closed on mobile
    }
    return true // SSR default: assume desktop
  })
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768
    }
    return false
  })

  // Update CSS variable for sidebar width immediately on mount and when state changes
  useEffect(() => {
    const root = document.documentElement
    if (isMobile) {
      root.style.setProperty('--sidebar-width', '0px')
    } else {
      root.style.setProperty('--sidebar-width', isOpen ? '256px' : '80px')
    }
  }, [isOpen, isMobile])

  // Set initial CSS variable on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const root = document.documentElement
      const mobile = window.innerWidth < 768
      const shouldBeOpen = !mobile
      root.style.setProperty('--sidebar-width', shouldBeOpen ? '256px' : '0px')
    }
  }, [])

  // Handle window resize - adjust sidebar state based on screen size
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      
      // Auto-adjust sidebar state when switching between mobile/desktop
      if (mobile) {
        // Switched to mobile - close sidebar
        setIsOpen(false)
      } else {
        // Switched to desktop - open sidebar (user can still toggle)
        setIsOpen(true)
      }
    }
    
    // Set initial state on mount
    if (typeof window !== 'undefined') {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      setIsOpen(!mobile) // Open on desktop, closed on mobile
    }
    
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const navItems = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/map', label: 'Damage Map', icon: Map },
    { href: '/report', label: 'Report Damage', icon: FileText },
    { href: '/support', label: 'Support & Rebuild', icon: Heart },
  ]

  const adminItems = [
    { href: '/admin', label: 'Admin', icon: Shield },
    { href: '/debug', label: 'Debug', icon: Bug },
  ]

  return (
    <>
      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-full bg-gradient-to-b from-gray-900 to-gray-800 text-white z-50 transition-all duration-300 ease-in-out shadow-2xl ${
          isOpen ? 'w-64' : 'w-0 md:w-20'
        } overflow-hidden border-r border-gray-700`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-700 min-h-[64px]">
            {isOpen ? (
              <Link href="/" className="flex items-center space-x-2 flex-1" onClick={() => isMobile && setIsOpen(false)}>
                <div className="text-xl font-bold text-white">
                  Rebuild Sri Lanka
                </div>
              </Link>
            ) : (
              <Link href="/" className="flex items-center justify-center w-full" onClick={() => isMobile && setIsOpen(false)}>
                <div className="text-lg font-bold text-white">RSL</div>
              </Link>
            )}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-lg hover:bg-gray-700 transition-colors flex-shrink-0"
              aria-label="Toggle sidebar"
            >
              {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 overflow-y-auto py-4">
            <div className="space-y-1 px-2">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => isMobile && setIsOpen(false)}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
                      isActive
                        ? 'bg-primary-600 text-white shadow-lg'
                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    }`}
                    title={!isOpen ? item.label : ''}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    {isOpen && <span className="font-medium">{item.label}</span>}
                  </Link>
                )
              })}
            </div>

            {/* Admin Section */}
            <div className="mt-6 pt-6 border-t border-gray-700 px-2">
              <div className="space-y-1">
                {adminItems.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => isMobile && setIsOpen(false)}
                      className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
                        isActive
                          ? 'bg-primary-600 text-white shadow-lg'
                          : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                      }`}
                      title={!isOpen ? item.label : ''}
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      {isOpen && <span className="font-medium text-sm">{item.label}</span>}
                    </Link>
                  )
                })}
              </div>
            </div>
          </nav>
        </div>
      </aside>

      {/* Mobile backdrop */}
      {isOpen && isMobile && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Mobile toggle button (when sidebar is closed) */}
      {!isOpen && isMobile && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed top-4 left-4 z-50 bg-gray-900 text-white p-3 rounded-lg shadow-lg hover:bg-gray-800 transition-colors"
          aria-label="Open menu"
        >
          <Menu className="w-6 h-6" />
        </button>
      )}

      {/* Content offset for sidebar */}
      <div className={`transition-all duration-300 ${isOpen ? 'md:ml-64' : 'md:ml-20'}`} />
    </>
  )
}

