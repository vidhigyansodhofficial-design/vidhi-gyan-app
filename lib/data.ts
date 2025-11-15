// app/lib/data.ts

export interface SyllabusItem {
  title: string;
  duration: string; // e.g., "12:45"
  isLocked?: boolean; // for demo: show lock icon if not enrolled
}

export interface Course {
  id: string;
  title: string;
  instructor: string;
  rating: number;
  reviews: number;
  price?: number; // undefined or 0 = free
  image: string;
  enrolled?: boolean;
  videoUrl: string;
  totalDuration: string;
  lectures: number;
  syllabus: SyllabusItem[];
}

export const courses: Course[] = [
  {
    id: '1',
    title: 'Indian Penal Code (IPC) - Complete Guide',
    instructor: 'Dr. Rajesh Kumar',
    rating: 4.8,
    reviews: 1243,
    image: 'https://images.unsplash.com/photo-1619771833572-325fa5664609?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsYXclMjBib29rcyUyMGxpYnJhcnl8ZW58MXx8fHwxNzYwMDE2NTc5fDA&ixlib=rb-4.1.0&q=80&w=1080',
    enrolled: true,
    videoUrl: 'https://dsabsbpvocmpomhwznbc.supabase.co/storage/v1/object/public/Videos/uvani%20video.mp4',
    totalDuration: '24 hours',
    lectures: 156,
    syllabus: [
      { title: 'Introduction to IPC', duration: '12:45' },
      { title: 'General Explanations (Section 1-5)', duration: '18:30' },
      { title: 'Punishments (Section 6-75)', duration: '22:15' },
      { title: 'Offences Against Body', duration: '35:20' },
      { title: 'Offences Against Property', duration: '28:10' },
      { title: 'Case Studies & Judgments', duration: '40:05' },
    ],
  },
  {
    id: '2',
    title: 'Constitutional Law',
    instructor: 'Prof. Anita Sharma',
    rating: 4.9,
    reviews: 2156,
    image: 'https://images.unsplash.com/photo-1688417486356-a302759b826a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb25zdGl0dXRpb24lMjBsZWdhbHxlbnwxfHx8fDE3NjAwOTkwMTN8MA&ixlib=rb-4.1.0&q=80&w=1080',
    enrolled: false,
    videoUrl: 'https://dsabsbpvocmpomhwznbc.supabase.co/storage/v1/object/public/Videos/uvani%20video.mp4',
    totalDuration: '20 hours',
    lectures: 120,
    syllabus: [
      { title: 'Introduction to Constitution', duration: '15:20' },
      { title: 'Fundamental Rights', duration: '25:40' },
      { title: 'Directive Principles', duration: '18:30' },
      { title: 'Parliament & State Legislature', duration: '22:10' },
      { title: 'Judiciary & Amendments', duration: '30:15' },
    ],
  },
  {
    id: '3',
    title: 'Contract Law - Fundamentals to Advanced',
    instructor: 'Adv. Priya Mehta',
    rating: 4.7,
    reviews: 987,
    image: 'https://images.unsplash.com/flagged/photo-1581929207722-a3ac7efe8930?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdHVkeSUyMGVkdWNhdGlvbnxlbnwxfHx8fDE3NjAwNjY5NDF8MA&ixlib=rb-4.1.0&q=80&w=1080',
    price: 2999,
    enrolled: false,
    videoUrl: 'https://dsabsbpvocmpomhwznbc.supabase.co/storage/v1/object/public/Videos/uvani%20video.mp4',
    totalDuration: '18 hours',
    lectures: 98,
    syllabus: [
      { title: 'Basics of Contract Law', duration: '14:20' },
      { title: 'Offer & Acceptance', duration: '19:45' },
      { title: 'Consideration & Capacity', duration: '16:30' },
      { title: 'Breach & Remedies', duration: '21:10' },
      { title: 'Special Contracts', duration: '25:05' },
    ],
  },
  {
    id: '4',
    title: 'Criminal Procedure Code',
    instructor: 'Dr. Suresh Patel',
    rating: 4.6,
    reviews: 756,
    image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxidXNpbmVzcyUyMHByb2Zlc3Npb25hbHxlbnwxfHx8fDE3NjAwMzY5ODF8MA&ixlib=rb-4.1.0&q=80&w=1080',
    price: 1999,
    enrolled: false,
    videoUrl: 'https://dsabsbpvocmpomhwznbc.supabase.co/storage/v1/object/public/Videos/uvani%20video.mp4',
    totalDuration: '16 hours',
    lectures: 85,
    syllabus: [
      { title: 'Introduction to CrPC', duration: '13:10' },
      { title: 'Arrest & Bail Procedures', duration: '20:45' },
      { title: 'Trial Process', duration: '24:30' },
      { title: 'Appeals & Revisions', duration: '18:20' },
    ],
  },
  {
    id: '5',
    title: 'Family Law & Divorce Proceedings',
    instructor: 'Adv. Neha Gupta',
    rating: 4.9,
    reviews: 890,
    image: 'https://images.unsplash.com/photo-1700616466971-a4e05aa89e7d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjB0ZWFjaGVyfGVufDF8fHx8MTc2MDA5OTAxNHww&ixlib=rb-4.1.0&q=80&w=1080',
    price: 2499,
    enrolled: false,
    videoUrl: 'https://dsabsbpvocmpomhwznbc.supabase.co/storage/v1/object/public/Videos/uvani%20video.mp4',
    totalDuration: '14 hours',
    lectures: 72,
    syllabus: [
      { title: 'Marriage Laws in India', duration: '16:20' },
      { title: 'Divorce & Maintenance', duration: '22:40' },
      { title: 'Child Custody', duration: '19:15' },
      { title: 'Domestic Violence Act', duration: '17:30' },
    ],
  },
  {
    id: '6',
    title: 'Environmental Law & Policy',
    instructor: 'Prof. Arjun Mehta',
    rating: 4.5,
    reviews: 678,
    image: 'https://images.unsplash.com/flagged/photo-1581929207722-a3ac7efe8930?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdHVkeSUyMGVkdWNhdGlvbnxlbnwxfHx8fDE3NjAwNjY5NDF8MA&ixlib=rb-4.1.0&q=80&w=1080',
    price: 2299,
    enrolled: false,
    videoUrl: 'https://dsabsbpvocmpomhwznbc.supabase.co/storage/v1/object/public/Videos/uvani%20video.mp4',
    totalDuration: '12 hours',
    lectures: 65,
    syllabus: [
      { title: 'Introduction to Environmental Law', duration: '12:30' },
      { title: 'Air & Water Pollution Acts', duration: '18:45' },
      { title: 'Forest & Wildlife Protection', duration: '15:20' },
      { title: 'Climate Change Policies', duration: '14:10' },
    ],
  },
];

export const continueLearning = courses.filter((c) => c.enrolled);
export const recommendedForYou = courses.filter((c) => !c.enrolled).slice(0, 3);
export const mostPurchased = courses.sort((a, b) => b.reviews - a.reviews).slice(0, 3);