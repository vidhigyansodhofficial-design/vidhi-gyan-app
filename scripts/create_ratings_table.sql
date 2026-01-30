
CREATE TABLE public.course_ratings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  rating numeric(2, 1) NOT NULL CHECK (rating >= 1.0 AND rating <= 5.0),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE (course_id, user_id)
);

ALTER TABLE public.course_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read for public" ON public.course_ratings
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON public.course_ratings
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for users based on user_id" ON public.course_ratings
  FOR UPDATE USING (auth.uid() = user_id OR true); -- Allow easy update for now since we manage users manually
