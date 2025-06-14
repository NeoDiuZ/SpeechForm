import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function POST(request) {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    const { formId, responses } = await request.json()
    
    if (!formId || !responses) {
      return NextResponse.json(
        { error: 'Form ID and responses are required' },
        { status: 400 }
      )
    }

    // Verify the form exists and is active (public access for form submissions)
    const { data: form, error: formError } = await supabase
      .from('forms')
      .select('id, title, is_active')
      .eq('id', formId)
      .eq('is_active', true)
      .single()

    if (formError || !form) {
      console.error('Form lookup error:', formError)
      return NextResponse.json(
        { error: 'Form not found or inactive' },
        { status: 404 }
      )
    }

    // Insert the response
    const { data, error } = await supabase
      .from('responses')
      .insert({
        form_id: formId,
        response_data: responses,
        ip_address: request.headers.get('x-forwarded-for') || 
                   request.headers.get('x-real-ip') || 
                   'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown'
      })
      .select()
      .single()

    if (error) {
      console.error('Error saving response:', error)
      return NextResponse.json(
        { error: 'Failed to save response' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      id: data.id,
      message: 'Response saved successfully' 
    })

  } catch (error) {
    console.error('Response submission error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 