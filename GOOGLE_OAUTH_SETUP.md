# Google OAuth Setup for Supabase

To enable Google sign-in, you need to configure Google OAuth in your Supabase project:

## 1. Create Google OAuth App

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the "Google+ API" or "People API"
4. Go to "Credentials" → "Create Credentials" → "OAuth client ID"
5. Choose "Web application"
6. Add these URLs:

**Authorized JavaScript origins:**
- `http://localhost:3000` (for development)
- `https://yourdomain.com` (for production)

**Authorized redirect URIs:**
- `https://your-project-ref.supabase.co/auth/v1/callback`
- Replace `your-project-ref` with your actual Supabase project reference

## 2. Configure Supabase

1. Go to your Supabase dashboard
2. Navigate to Authentication → Providers
3. Enable Google provider
4. Add your Google OAuth credentials:
   - **Client ID**: From Google Cloud Console
   - **Client Secret**: From Google Cloud Console

## 3. Update Environment Variables

Make sure your `.env.local` has:
```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## 4. Test the Integration

1. Start your Next.js app: `npm run dev`
2. Go to `/auth/login` or `/auth/signup`
3. Click "Continue with Google"
4. Complete the OAuth flow

## Troubleshooting

- **"Error 400: redirect_uri_mismatch"**: Make sure your redirect URI in Google Console matches exactly with Supabase
- **"Error 403: access_blocked"**: Your OAuth app might be in testing mode, publish it or add test users
- **Authentication not working**: Check that your environment variables are correct and restart your dev server

## Security Notes

- Never expose your `SUPABASE_SERVICE_ROLE_KEY` in client-side code
- Use different Google OAuth apps for development and production
- Regularly rotate your API keys 