'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AdminDashboard from '@/components/AdminDashboard'
import AdminLogin from '@/components/AdminLogin'
import { createSupabaseClient } from '@/lib/supabase/client'

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const supabase = createSupabaseClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session) {
        // Check if user is admin using API route
        try {
          const response = await fetch('/api/admin/check', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId: session.user.id })
          })

          const result = await response.json()

          if (result.isAdmin) {
            setIsAuthenticated(true)
          } else {
            setIsAuthenticated(false)
          }
        } catch (err) {
          console.error('Admin check error:', err)
          setIsAuthenticated(false)
        }
      } else {
        setIsAuthenticated(false)
      }
    } catch (error) {
      console.error('Error checking auth:', error)
      setIsAuthenticated(false)
    } finally {
      setLoading(false)
    }
  }

  const handleLoginSuccess = () => {
    setIsAuthenticated(true)
  }

  const handleLogout = async () => {
    const supabase = createSupabaseClient()
    await supabase.auth.signOut()
    setIsAuthenticated(false)
    router.push('/admin')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <AdminLogin onSuccess={handleLoginSuccess} />
  }

  return <AdminDashboard onLogout={handleLogout} />
}

