-- Allow public read access to active forms (for form filling)
CREATE POLICY "Public can view active forms" ON forms
    FOR SELECT USING (is_active = true);

-- Allow public insert access to responses (for form submissions)
CREATE POLICY "Public can insert responses" ON responses
    FOR INSERT WITH CHECK (true);

-- Drop the existing restrictive response insert policy if it exists
DROP POLICY IF EXISTS "Anyone can insert responses" ON responses; 