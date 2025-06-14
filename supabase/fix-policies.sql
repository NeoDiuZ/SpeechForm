-- Fix for subscription policies
-- Run this in Supabase SQL Editor after the main schema

-- Allow users to insert their own subscriptions
CREATE POLICY "Users can insert their own subscription" ON subscriptions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Allow service role to insert subscriptions (for triggers)
CREATE POLICY "Service can insert subscriptions" ON subscriptions
    FOR INSERT WITH CHECK (true);

-- Add unique constraint on user_id first
ALTER TABLE subscriptions ADD CONSTRAINT unique_user_id UNIQUE (user_id);

-- Create subscription for existing users who don't have one
INSERT INTO public.subscriptions (user_id, plan_type, api_calls_used, api_calls_limit)
SELECT 
    id,
    'free',
    0,
    50
FROM auth.users 
WHERE id NOT IN (SELECT user_id FROM public.subscriptions WHERE user_id IS NOT NULL); 