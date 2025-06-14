-- Enable Row Level Security
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- Create forms table
CREATE TABLE IF NOT EXISTS forms (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    fields JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- Create responses table  
CREATE TABLE IF NOT EXISTS responses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    form_id UUID REFERENCES forms(id) ON DELETE CASCADE,
    response_data JSONB NOT NULL,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT
);

-- Create subscriptions table for billing
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    plan_type TEXT NOT NULL DEFAULT 'free', -- free, pro, enterprise
    forms_limit INTEGER DEFAULT 3,
    responses_limit INTEGER DEFAULT 100,
    api_calls_used INTEGER DEFAULT 0,
    api_calls_limit INTEGER DEFAULT 50,
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    status TEXT DEFAULT 'active',
    current_period_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    current_period_end TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '1 month'),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create usage tracking table
CREATE TABLE IF NOT EXISTS api_usage (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    cost_cents INTEGER DEFAULT 0,
    metadata JSONB
);

-- Enable Row Level Security
ALTER TABLE forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_usage ENABLE ROW LEVEL SECURITY;

-- Forms policies
CREATE POLICY "Users can view their own forms" ON forms
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own forms" ON forms
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own forms" ON forms
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own forms" ON forms
    FOR DELETE USING (auth.uid() = user_id);

-- Responses policies (form owners can view responses to their forms)
CREATE POLICY "Form owners can view responses" ON responses
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM forms 
            WHERE forms.id = responses.form_id 
            AND forms.user_id = auth.uid()
        )
    );

CREATE POLICY "Anyone can insert responses" ON responses
    FOR INSERT WITH CHECK (true);

-- Subscriptions policies
CREATE POLICY "Users can view their own subscription" ON subscriptions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscription" ON subscriptions
    FOR UPDATE USING (auth.uid() = user_id);

-- API usage policies
CREATE POLICY "Users can view their own API usage" ON api_usage
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service can insert API usage" ON api_usage
    FOR INSERT WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX idx_forms_user_id ON forms(user_id);
CREATE INDEX idx_forms_created_at ON forms(created_at DESC);
CREATE INDEX idx_responses_form_id ON responses(form_id);
CREATE INDEX idx_responses_submitted_at ON responses(submitted_at DESC);
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_api_usage_user_id ON api_usage(user_id);
CREATE INDEX idx_api_usage_timestamp ON api_usage(timestamp DESC);

-- Create a function to automatically create subscription for new users
CREATE OR REPLACE FUNCTION create_user_subscription()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO subscriptions (user_id)
    VALUES (NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create subscription when user signs up
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION create_user_subscription();

-- Function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_forms_updated_at
    BEFORE UPDATE ON forms
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_subscriptions_updated_at
    BEFORE UPDATE ON subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at(); 