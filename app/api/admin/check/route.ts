import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId } = body

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    const supabase = createSupabaseAdminClient()

    // Check if user is admin using service role (bypasses RLS)
    const { data: adminUser, error } = await supabase
      .from('admin_users')
      .select('id, email, role')
      .eq('id', userId)
      .single()

    if (error || !adminUser) {
      return NextResponse.json({ isAdmin: false }, { status: 200 })
    }

    return NextResponse.json({ isAdmin: true, user: adminUser }, { status: 200 })
  } catch (error) {
    console.error('Error checking admin:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

