import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function CourseCard({ course, progressPercent, onPress }: any) {
  const isEnrolled = typeof progressPercent === 'number';
  const isFree = !course.price || course.price <= 0;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.9}>
      <Image source={{ uri: course.image }} style={styles.image} />
      
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Text style={styles.category}>{course.category}</Text>
          <Text style={[styles.priceText, isFree ? styles.freeText : styles.paidText]}>
            {isFree ? 'Free' : `₹${course.price}`}
          </Text>
        </View>

        <Text style={styles.title} numberOfLines={2}>{course.title}</Text>
        <Text style={styles.instructor}>By {course.instructor}</Text>

        <View style={styles.metaRow}>
          <View style={styles.ratingBox}>
            <MaterialCommunityIcons name="star" size={14} color="#D4AF37" />
            <Text style={styles.ratingText}>{course.rating} ({course.reviews})</Text>
          </View>
          <Text style={styles.durationText}>{course.total_duration}</Text>
        </View>

        {/* 🔹 ACTION BUTTONS - Only show if NOT enrolled */}
        {!isEnrolled && (
          isFree ? (
            /* START LEARNING BUTTON (Free) */
            <TouchableOpacity style={[styles.actionButton, styles.freeBtnBg]} onPress={onPress}>
              <MaterialCommunityIcons name="play-circle-outline" size={18} color="#FFF" />
              <Text style={styles.actionButtonText}>START LEARNING</Text>
            </TouchableOpacity>
          ) : (
            /* PAY NOW BUTTON (Paid) */
            <TouchableOpacity style={[styles.actionButton, styles.payBtnBg]} onPress={onPress}>
              <MaterialCommunityIcons name="credit-card-outline" size={18} color="#FFF" />
              <Text style={styles.actionButtonText}>PAY NOW</Text>
            </TouchableOpacity>
          )
        )}

        {/* 🔹 PROGRESS BAR - Only shows if enrolled (Continue Learning) */}
        {isEnrolled && (
          <View style={styles.progressSection}>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
            </View>
            <Text style={styles.progressPercentText}>{progressPercent}% completed</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  image: { width: '100%', height: 130 },
  content: { padding: 12 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  category: { fontSize: 10, color: '#D4AF37', fontWeight: '800', textTransform: 'uppercase' },
  
  priceText: { fontSize: 14, fontWeight: '900' },
  paidText: { color: '#EF4444' }, // Red
  freeText: { color: '#10B981' }, // Green
  
  title: { fontSize: 15, fontWeight: '700', color: '#1E293B', height: 40 },
  instructor: { fontSize: 12, color: '#64748B', marginTop: 2 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  ratingBox: { flexDirection: 'row', alignItems: 'center' },
  ratingText: { fontSize: 12, fontWeight: '600', color: '#1E293B', marginLeft: 4 },
  durationText: { fontSize: 11, color: '#94A3B8', fontWeight: '500' },

  actionButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 12,
  },
  freeBtnBg: { backgroundColor: '#10B981' }, // Green for Free
  payBtnBg: { backgroundColor: '#1E293B' },  // Dark for Pay Now
  actionButtonText: { color: '#FFF', fontSize: 12, fontWeight: '800', marginLeft: 8 },
  
  progressSection: { marginTop: 12, borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 8 },
  progressBarBg: { height: 5, backgroundColor: '#E2E8F0', borderRadius: 10, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#D4AF37' },
  progressPercentText: { fontSize: 10, fontWeight: '700', color: '#D4AF37', marginTop: 4 },
});