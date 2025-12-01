import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'

export async function getAdminUser(request: NextRequest) {
  try {
    // Use server client to get session from cookies (proper SSR way with cookie handling)
    const supabase = createSupabaseServerClient()
    
    // Get session from cookies
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError) {
      console.error('Session error:', sessionError.message)
      return null
    }

    if (!session || !session.user) {
      // No session - user not logged in
      return null
    }

    // Use admin client to check admin_users table (bypasses RLS)
    const adminSupabase = createSupabaseAdminClient()
    const { data: adminUser, error: adminError } = await adminSupabase
      .from('admin_users')
      .select('id, email, role')
      .eq('id', session.user.id)
      .single()

    if (adminError) {
      // Table might not exist or query failed
      console.error('Admin check error:', adminError.message)
      return null
    }

    if (!adminUser) {
      // User exists but is not in admin_users table
      return null
    }

    return adminUser
  } catch (error: any) {
    console.error('Error checking admin auth:', error?.message || error)
    return null
  }
}

