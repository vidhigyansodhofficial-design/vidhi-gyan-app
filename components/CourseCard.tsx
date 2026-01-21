import { Palette } from '@/constants/theme';
import { Course } from '@/lib/data';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface CourseCardProps {
  course: Course;
  onPress?: () => void;
}

export default function CourseCard({ course, onPress }: CourseCardProps) {
  if (!course || !course.title) {
    return (
      <View style={styles.errorCard}>
        <Text style={{ color: 'red', fontWeight: 'bold' }}>Course not found</Text>
        <Text style={{ color: Palette.yellow, marginTop: 4 }}>← Go Back</Text>
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
    width: 250,
    backgroundColor: Palette.white,
    borderRadius: 10,
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 140,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  details: {
    padding: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Palette.textPrimary,
    minHeight: 40,
  },
  instructor: {
    fontSize: 13,
    color: Palette.textSecondary,
    marginTop: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  rating: {
    color: Palette.yellow,
    fontSize: 14,
    fontWeight: '600',
  },
  reviews: {
    color: Palette.textSecondary,
    fontSize: 13,
    marginLeft: 5,
  },
  price: {
    fontSize: 15,
    fontWeight: 'bold',
    color: Palette.textPrimary,
    marginTop: 8,
  },
  priceFree: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#008000',
    marginTop: 8,
  },
  enrolledBadge: {
    backgroundColor: Palette.yellow,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  enrolledText: {
    color: Palette.textPrimary,
    fontSize: 12,
    fontWeight: 'bold',
  },
  errorCard: {
    width: 250,
    height: 150,
    borderRadius: 10,
    backgroundColor: Palette.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});