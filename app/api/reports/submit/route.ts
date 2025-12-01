import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase/server'
import { validateDamageReport } from '@/lib/utils/validation'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const errors = validateDamageReport(body)

    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ errors }, { status: 400 })
    }

    const supabase = createSupabaseAdminClient()

    // Use GND code and name from form submission (user selected)
    const gndCode = body.gnd_code || null
    const gndName = body.gnd_name || null

    if (!gndCode || !gndName) {
      return NextResponse.json(
        { errors: { gnd: 'GND selection is required' } },
        { status: 400 }
      )
    }

    // Insert damage report
    const { data, error } = await supabase
      .from('damage_reports')
      .insert({
        gnd_code: gndCode,
        gnd_name: gndName,
        location: body.location
          ? `POINT(${body.location.lng} ${body.location.lat})`
          : null,
        property_type: body.property_type,
        property_condition: body.property_condition,
        damage_level: body.damage_level,
        estimated_damage_lkr: body.estimated_damage_lkr,
        affected_residents: body.affected_residents,
        description: body.description,
        contact_name: body.contact_name || null,
        contact_phone: body.contact_phone || null,
        contact_email: body.contact_email || null,
        photos: body.photos || [],
        status: 'verified' // Auto-verify all submissions - no approval needed
      })
      .select()
      .single()

    if (error) {
      console.error('Error inserting damage report:', error)
      return NextResponse.json(
        { error: 'Failed to submit report' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, id: data.id }, { status: 201 })
  } catch (error) {
    console.error('Error in submit report:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

