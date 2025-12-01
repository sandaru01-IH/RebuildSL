import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase/server'
import { validateSupportPost } from '@/lib/utils/validation'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const errors = validateSupportPost(body)

    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ errors }, { status: 400 })
    }

    const supabase = createSupabaseAdminClient()

    const { data, error } = await supabase
      .from('support_posts')
      .insert({
        organization_name: body.organization_name,
        contact_name: body.contact_name,
        contact_phone: body.contact_phone,
        contact_email: body.contact_email || null,
        support_type: body.support_type,
        description: body.description,
        location_preference: body.location_preference || null,
        status: 'active'
      })
      .select()
      .single()

    if (error) {
      console.error('Error inserting support post:', error)
      return NextResponse.json(
        { error: 'Failed to submit support post' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, id: data.id }, { status: 201 })
  } catch (error) {
    console.error('Error in submit support post:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

