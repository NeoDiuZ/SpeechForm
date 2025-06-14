import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET(request, { params }) {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    const { id } = params
    
    if (!id) {
      return NextResponse.json(
        { error: 'Form ID is required' },
        { status: 400 }
      )
    }

    // Get the form (public access for form filling)
    const { data: form, error } = await supabase
      .from('forms')
      .select('id, title, description, fields, is_active')
      .eq('id', id)
      .eq('is_active', true)
      .single()

    if (error || !form) {
      console.error('Error fetching form:', error)
      return NextResponse.json(
        { error: 'Form not found or inactive' },
        { status: 404 }
      )
    }

    return NextResponse.json({ form })

  } catch (error) {
    console.error('Form fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 