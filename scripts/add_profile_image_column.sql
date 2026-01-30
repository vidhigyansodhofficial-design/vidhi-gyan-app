-- Add profile_image_url column to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS profile_image_url text;

-- (Optional) Policy to allow users to update their own profile image
-- Note: Assuming you already have an 'update' policy for users like:
-- CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);
