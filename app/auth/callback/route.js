import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') ?? '/dashboard'

  if (code) {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    try {
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (!error) {
        // Successful authentication - redirect to dashboard
        return NextResponse.redirect(`${requestUrl.origin}${next}`)
      } else {
        console.error('Auth exchange error:', error)
        return NextResponse.redirect(`${requestUrl.origin}/auth/login?error=${encodeURIComponent(error.message)}`)
      }
    } catch (err) {
      console.error('Callback error:', err)
      return NextResponse.redirect(`${requestUrl.origin}/auth/login?error=${encodeURIComponent('Authentication failed')}`)
    }
  }

  // No code parameter - redirect to login
  return NextResponse.redirect(`${requestUrl.origin}/auth/login?error=${encodeURIComponent('No authorization code provided')}`)
} 