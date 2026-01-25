export interface Course {
    id: string;
    title: string;
    instructor: string;
    rating: number;
    reviews: number;
    price: number | null;
    image: string;
    enrolled: boolean;
    total_duration: string;
    lectures: number;
  }
  
  export interface CourseSyllabus {
    id: string;
    course_id: string;
    title: string;
    video_url: string;
    duration: string | null;
    order_index: number;
  }
  