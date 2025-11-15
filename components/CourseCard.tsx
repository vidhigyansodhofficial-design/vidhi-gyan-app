import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Course } from '@/lib/data'; // Assuming Course type has 'isEnrolled?: boolean'

interface CourseCardProps {
  course: Course;
  onPress?: () => void;
}

export default function CourseCard({ course, onPress }: CourseCardProps) {
  if (!course || !course.title) {
    return (
      <View style={styles.errorCard}>
        <Text style={{ color: 'red', fontWeight: 'bold' }}>Course not found</Text>
        <Text style={{ color: '#007bff', marginTop: 4 }}>← Go Back</Text>
      </View>
    );
  }

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <Image source={{ uri: course.image }} style={styles.image} />
      <View style={styles.details}>
        <Text style={styles.title} numberOfLines={2}>
          {course.title}
        </Text>
        <Text style={styles.instructor}>{course.instructor}</Text>

        {/* --- NEW WRAPPER VIEW --- */}
        <View style={styles.bottomRow}>
          {/* Left Side: Rating */}
          <View style={styles.ratingContainer}>
            <Text style={styles.rating}>⭐ {course.rating.toFixed(1)}</Text>
            <Text style={styles.reviews}>({course.reviews})</Text>
          </View>

          {/* Right Side: Price or Enrolled Badge (MODIFIED LOGIC) */}
          {course.enrolled ? (
            <View style={styles.enrolledBadge}>
              <Text style={styles.enrolledText}>Enrolled</Text>
            </View>
          ) : course.price ? (
            <Text style={styles.price}>₹{course.price}</Text>
          ) : (
            <Text style={styles.priceFree}>Free</Text>
          )}
        </View>
        {/* --- END OF NEW WRAPPER --- */}

      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 250, // A bit wider to match the professional look
    backgroundColor: '#fff',
    borderRadius: 10,
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 }, // Softer shadow
    shadowOpacity: 0.1, // Softer shadow
    shadowRadius: 4,
    elevation: 3, // Softer elevation
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 140, // Slightly taller image
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  details: {
    padding: 12, // A bit more padding
  },
  title: {
    fontSize: 16, // Larger title
    fontWeight: 'bold',
    color: '#333',
    minHeight: 40, // Ensures space for 2 lines
  },
  instructor: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8, // Added margin-top
  },
  rating: {
    color: '#E6A400', // A more golden star color
    fontSize: 14,
    fontWeight: '600',
  },
  reviews: {
    color: '#999',
    fontSize: 13,
    marginLeft: 5,
  },
  price: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1D2B4E',
    marginTop: 8, // Added margin-top to separate from rating
  },
  priceFree: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#008000', // Standard green for 'Free'
    marginTop: 8, // Added margin-top to separate from rating
  },
  errorCard: {
    width: 250, // Match the new card width
    height: 150,
    borderRadius: 10,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
});