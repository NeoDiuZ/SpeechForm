import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET(request) {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    // Get the authenticated user
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    
    if (authError || !session) {
      return NextResponse.json(
        { error: 'Authentication required' }, 
        { status: 401 }
      )
    }

    // Get user's forms
    const { data: forms, error } = await supabase
      .from('forms')
      .select(`
        *,
        responses:responses(count)
      `)
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching forms:', error)
      return NextResponse.json(
        { error: 'Failed to fetch forms' },
        { status: 500 }
      )
    }

    return NextResponse.json({ forms })

  } catch (error) {
    console.error('Forms API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request) {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    // Get the authenticated user
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    
    if (authError || !session) {
      return NextResponse.json(
        { error: 'Authentication required' }, 
        { status: 401 }
      )
    }

    const { title, description, fields } = await request.json()
    
    if (!title || !fields) {
      return NextResponse.json(
        { error: 'Title and fields are required' },
        { status: 400 }
      )
    }

    // Insert the form
    const { data, error } = await supabase
      .from('forms')
      .insert({
        user_id: session.user.id,
        title,
        description: description || '',
        fields
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating form:', error)
      return NextResponse.json(
        { error: 'Failed to create form' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      form: data,
      message: 'Form created successfully' 
    })

  } catch (error) {
    console.error('Form creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 