import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'

export async function middleware(req) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  // Refresh session if expired
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Debug logging (remove in production)
  // console.log('Middleware - Path:', req.nextUrl.pathname)
  // console.log('Middleware - Session exists:', !!session)

  // Auth routes - redirect to dashboard if already logged in
  const authRoutes = ['/auth/login', '/auth/signup']
  const isAuthRoute = authRoutes.includes(req.nextUrl.pathname)

  if (isAuthRoute && session) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  // Protected routes that require authentication
  const protectedRoutes = ['/dashboard', '/forms/']
  const isProtectedRoute = protectedRoutes.some(route => 
    req.nextUrl.pathname.startsWith(route)
  )

  // API routes that require authentication (responses and individual forms should be public)
  const protectedApiRoutes = ['/api/transcribe']
  const isProtectedApiRoute = protectedApiRoutes.some(route =>
    req.nextUrl.pathname.startsWith(route)
  )
  
  // Only protect the main forms API route (for creating/listing), not individual form access
  const isMainFormsRoute = req.nextUrl.pathname === '/api/forms'
  if (isMainFormsRoute && !session) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    )
  }

  // Redirect to login if accessing protected route without session
  if (isProtectedRoute && !session) {
    const redirectUrl = new URL('/auth/login', req.url)
    redirectUrl.searchParams.set('redirect', req.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // Return 401 for protected API routes without session
  if (isProtectedApiRoute && !session) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    )
  }

  // Rate limiting for OpenAI API
  if (req.nextUrl.pathname === '/api/transcribe' && session) {
    try {
      // Check user's current usage from database
      const { data: user, error: userError } = await supabase
        .from('subscriptions')
        .select('plan_type, api_calls_used, api_calls_limit, current_period_end')
        .eq('user_id', session.user.id)
        .single()

      if (userError && userError.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error fetching user:', userError)
        return new Response('Internal server error', { status: 500 })
      }

      let currentUser = user

      if (!user) {
        // Use defaults if no subscription exists (will be created by API route)
        const nextReset = new Date()
        nextReset.setMonth(nextReset.getMonth() + 1)
        
        currentUser = {
          plan_type: 'free',
          api_calls_used: 0,
          api_calls_limit: 50,
          current_period_end: nextReset.toISOString()
        }
      }

      // Check if we need to reset monthly usage
      const now = new Date()
      const resetDate = new Date(currentUser.current_period_end)
      
      if (now > resetDate) {
        // Reset usage for new month
        const nextReset = new Date(now)
        nextReset.setMonth(nextReset.getMonth() + 1)
        
        const { error: updateError } = await supabase
          .from('subscriptions')
          .update({
            api_calls_used: 0,
            current_period_end: nextReset.toISOString()
          })
          .eq('user_id', session.user.id)
        
        if (!updateError) {
          currentUser.api_calls_used = 0
        }
      }

      // Use the limit from the subscription record
      const userLimit = currentUser.api_calls_limit || 50
      
      if (currentUser.api_calls_used >= userLimit) {
        return new Response(JSON.stringify({
          error: 'API limit exceeded for your subscription tier',
          used: currentUser.api_calls_used,
          limit: userLimit,
          tier: currentUser.plan_type
        }), {
          status: 429,
          headers: { 'Content-Type': 'application/json' }
        })
      }

      // Check per-minute rate limiting (prevent abuse)
      const { data: recentCalls } = await supabase
        .from('api_usage')
        .select('created_at')
        .eq('user_id', session.user.id)
        .gte('created_at', new Date(Date.now() - 60000).toISOString()) // Last minute
      
      if (recentCalls && recentCalls.length >= 10) {
        return new Response(JSON.stringify({
          error: 'Rate limit exceeded. Maximum 10 calls per minute.'
        }), {
          status: 429,
          headers: { 'Content-Type': 'application/json' }
        })
      }

      // Add rate limiting headers
      res.headers.set('X-RateLimit-Limit', userLimit.toString())
      res.headers.set('X-RateLimit-Remaining', (userLimit - currentUser.api_calls_used).toString())
      res.headers.set('X-RateLimit-Reset', currentUser.current_period_end)

    } catch (error) {
      console.error('Rate limiting error:', error)
      // Continue without rate limiting if there's an error
    }
  }

  return res
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (Supabase auth)
     * - auth/callback (OAuth callback)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api/auth|auth/callback|_next/static|_next/image|favicon.ico).*)',
  ],
} 