-- Create a new table for course comments
CREATE TABLE public.course_comments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL,
  user_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT course_comments_pkey PRIMARY KEY (id),
  CONSTRAINT fk_course_comments_course FOREIGN KEY (course_id) REFERENCES public.courses(id),
  CONSTRAINT fk_course_comments_user FOREIGN KEY (user_id) REFERENCES public.users(id)
);

-- Enable Row Level Security (RLS) if you haven't already
ALTER TABLE public.course_comments ENABLE ROW LEVEL SECURITY;

-- Create a policy to allow anyone to read comments
CREATE POLICY "Enable read access for all users" ON public.course_comments
  FOR SELECT USING (true);

-- Create a policy to allow authenticated users to insert comments
CREATE POLICY "Enable insert for authenticated users" ON public.course_comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create a policy to allow users to update their own comments (optional)
CREATE POLICY "Enable update for users based on user_id" ON public.course_comments
  FOR UPDATE USING (auth.uid() = user_id);

-- Create a policy to allow users to delete their own comments (optional)
CREATE POLICY "Enable delete for users based on user_id" ON public.course_comments
  FOR DELETE USING (auth.uid() = user_id);
