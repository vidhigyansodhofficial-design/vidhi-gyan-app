-- Add indexes to improve query performance on foreign keys and frequently filtered columns

-- 1. user_course_enrollments
CREATE INDEX IF NOT EXISTS idx_user_course_enrollments_user_id ON public.user_course_enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_user_course_enrollments_course_id ON public.user_course_enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_user_course_enrollments_enrolled ON public.user_course_enrollments(enrolled);

-- 2. courses
CREATE INDEX IF NOT EXISTS idx_courses_recommended ON public.courses(recommended) WHERE recommended = true;
CREATE INDEX IF NOT EXISTS idx_courses_most_purchased ON public.courses(most_purchased) WHERE most_purchased = true;
CREATE INDEX IF NOT EXISTS idx_courses_category ON public.courses(category);

-- 3. course_syllabus
CREATE INDEX IF NOT EXISTS idx_course_syllabus_course_id ON public.course_syllabus(course_id);
CREATE INDEX IF NOT EXISTS idx_course_syllabus_order_index ON public.course_syllabus(order_index);

-- 4. user_syllabus_progress
CREATE INDEX IF NOT EXISTS idx_user_syllabus_progress_user_course ON public.user_syllabus_progress(user_id, course_id);
CREATE INDEX IF NOT EXISTS idx_user_syllabus_progress_syllabus_id ON public.user_syllabus_progress(syllabus_id);

-- 5. course_ratings
CREATE INDEX IF NOT EXISTS idx_course_ratings_course_id ON public.course_ratings(course_id);
CREATE INDEX IF NOT EXISTS idx_course_ratings_user_id ON public.course_ratings(user_id);

-- 6. course_comments
CREATE INDEX IF NOT EXISTS idx_course_comments_course_id ON public.course_comments(course_id);

-- ANALYZE tables to update statistics for the query planner
ANALYZE public.user_course_enrollments;
ANALYZE public.courses;
ANALYZE public.course_syllabus;
ANALYZE public.user_syllabus_progress;
ANALYZE public.course_ratings;
ANALYZE public.course_comments;
