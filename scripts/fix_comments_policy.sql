-- Fix RLS policies to allow inserts without Supabase Auth session
-- (Since the app manages users in 'questions' via public.users table and not auth.users)

-- Dropping previous restrictive policy
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.course_comments;

-- Create a new permissive policy for inserts
-- This allows any user with the anon key to insert comments
-- Security Note: In a production app with sensitive data, you should implement proper auth
CREATE POLICY "Enable public insert" ON public.course_comments
  FOR INSERT WITH CHECK (true);

-- Ensure read access is still open
DROP POLICY IF EXISTS "Enable read access for all users" ON public.course_comments;
CREATE POLICY "Enable read access for all users" ON public.course_comments
  FOR SELECT USING (true);
