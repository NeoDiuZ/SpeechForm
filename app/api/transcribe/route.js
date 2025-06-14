import { OpenAI } from 'openai'
import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request) {
  try {
    // Initialize Supabase client with awaited cookies
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

    const userId = session.user.id

    // Check user's subscription and usage
    let { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('api_calls_used, api_calls_limit, plan_type')
      .eq('user_id', userId)
      .single()

    // If no subscription exists, create one
    if (subError && subError.code === 'PGRST116') {
      console.log('Creating subscription for user:', userId)
      
      const { data: newSub, error: createError } = await supabase
        .from('subscriptions')
        .insert({
          user_id: userId,
          plan_type: 'free',
          api_calls_used: 0,
          api_calls_limit: 50
        })
        .select('api_calls_used, api_calls_limit, plan_type')
        .single()

      if (createError) {
        console.error('Error creating subscription:', createError)
        // Use defaults if creation fails
        subscription = {
          api_calls_used: 0,
          api_calls_limit: 50,
          plan_type: 'free'
        }
      } else {
        subscription = newSub
      }
    } else if (subError) {
      console.error('Error fetching subscription:', subError)
      return NextResponse.json(
        { error: 'Failed to check usage limits' }, 
        { status: 500 }
      )
    }

    // Check if user has exceeded their limit
    if (subscription.api_calls_used >= subscription.api_calls_limit) {
      return NextResponse.json(
        { 
          error: 'API limit exceeded for your subscription tier',
          used: subscription.api_calls_used,
          limit: subscription.api_calls_limit,
          tier: subscription.plan_type
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': subscription.api_calls_limit.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(Date.now() + 60000).toISOString()
          }
        }
      )
    }

    const formData = await request.formData()
    const audioFile = formData.get('audio')
    
    if (!audioFile) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 })
    }

    // Validate file size (5MB limit)
    if (audioFile.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Audio file too large. Maximum size is 5MB.' },
        { status: 400 }
      )
    }

    // Validate file type - be more permissive for mobile formats
    const allowedTypes = [
      'audio/webm', 'audio/mp4', 'audio/mpeg', 'audio/wav', 'audio/ogg',
      'audio/webm;codecs=opus', 'audio/mp4;codecs=mp4a.40.2', 'audio/ogg;codecs=opus',
      'audio/x-wav', 'audio/wave' // Additional formats for mobile compatibility
    ]
    
    const isValidType = allowedTypes.some(type => 
      audioFile.type === type || audioFile.type.startsWith(type.split(';')[0])
    )
    
    if (!isValidType) {
      console.log('Rejected audio type:', audioFile.type)
      return NextResponse.json(
        { error: `Invalid audio format: ${audioFile.type}. Supported formats: WebM, MP4, MP3, WAV, OGG` },
        { status: 400 }
      )
    }
    
    console.log('Processing audio file:', {
      type: audioFile.type,
      size: audioFile.size,
      name: audioFile.name
    })

    // Convert File to format that OpenAI expects
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      language: 'en', // You can make this dynamic based on user preference
      response_format: 'json',
      temperature: 0.2, // Lower temperature for more consistent results
    })

    // Increment usage counter
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({ 
        api_calls_used: subscription.api_calls_used + 1 
      })
      .eq('user_id', userId)

    if (updateError) {
      console.error('Error updating usage:', updateError)
    }

    // Log API usage
    await supabase
      .from('api_usage')
      .insert({
        user_id: userId,
        endpoint: 'transcribe',
        cost_cents: 2,
        metadata: { 
          file_size: audioFile.size,
          file_type: audioFile.type 
        }
      })

    const remaining = subscription.api_calls_limit - subscription.api_calls_used - 1

    return NextResponse.json({ 
      text: transcription.text,
      success: true 
    }, { 
      headers: {
        'X-RateLimit-Limit': subscription.api_calls_limit.toString(),
        'X-RateLimit-Remaining': Math.max(0, remaining).toString(),
        'X-RateLimit-Reset': new Date(Date.now() + 60000).toISOString()
      }
    })

  } catch (error) {
    console.error('Transcription error:', error)
    
    // Handle specific OpenAI errors
    if (error.code === 'insufficient_quota') {
      return NextResponse.json(
        { error: 'OpenAI API quota exceeded. Please try again later.' }, 
        { status: 503 }
      )
    }
    
    if (error.code === 'invalid_request_error') {
      return NextResponse.json(
        { error: 'Invalid audio file format or corrupted file.' }, 
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to transcribe audio', details: error.message }, 
      { status: 500 }
    )
  }
} 