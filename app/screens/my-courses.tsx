import { supabase } from '@/lib/supabase';
import { Course } from '@/lib/type';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

// Components
import FooterNav from '@/components/FooterNav';
import HomeHeader from '@/components/HomeHeader';

interface EnrolledCourse extends Course {
  progress_percent: number;
}

export default function MyCoursesScreen() {
  const router = useRouter();
  const [courses, setCourses] = useState<EnrolledCourse[]>([]);
  const [loading, setLoading] = useState(true);



  /* ================= FETCH ENROLLED COURSES ================= */
  const fetchEnrolledCourses = useCallback(async () => {
    try {
      const storedUser = await AsyncStorage.getItem('user');
      if (!storedUser) {
        router.replace('/screens/auth/login');
        return;
      }

      const localUser = JSON.parse(storedUser);
      let userId = localUser.id;

      if (!userId) {
        const { data: dbUser } = await supabase.from('users').select('id').eq('email', localUser.email).single();
        if (dbUser) {
          userId = dbUser.id;
          AsyncStorage.setItem('user', JSON.stringify({ ...localUser, id: userId }));
        }
      }
      if (!userId) {
        Alert.alert('Error', 'User not found');
        return;
      }

      const { data, error } = await supabase
        .from('user_course_enrollments')
        .select(`
          progress_percent,
          courses (id, title, instructor, image, rating, price, total_duration)
        `)
        .eq('user_id', userId)
        .eq('enrolled', true)
        .order('enrolled_at', { ascending: false });

      if (error) throw error;

      const formatted: EnrolledCourse[] =
        data?.map((item: any) => ({
          ...item.courses,
          progress_percent: item.progress_percent || 0,
        })) || [];

      setCourses(formatted);
    } catch (err) {
      console.error('MyCourses error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const [ratingModalVisible, setRatingModalVisible] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [userRating, setUserRating] = useState(0);

  /* ================= SUBMIT RATING ================= */
  const handleOpenRating = (courseId: string) => {
    setSelectedCourseId(courseId);
    setUserRating(0);
    setRatingModalVisible(true);
  };

  const submitRating = async () => {
    if (!selectedCourseId || userRating === 0) return;

    try {
      const storedUser = await AsyncStorage.getItem('user');
      const user = storedUser ? JSON.parse(storedUser) : null;

      if (!user || !user.id) {
        Alert.alert('Error', 'You must be logged in to rate.');
        return;
      }

      setLoading(true);

      // 1. Insert rating (Use insert to prevent updates/modifications)
      const { error: rateError } = await supabase
        .from('course_ratings')
        .insert({
          course_id: selectedCourseId,
          user_id: user.id,
          rating: userRating
        });

      if (rateError) {
        if (rateError.code === '23505') { // Unique violation
          Alert.alert("Rated Already", "You have already rated this course. You cannot change your rating.");
          setRatingModalVisible(false);
          setLoading(false);
          return;
        }
        throw rateError;
      }

      // 2. Calculate new average
      const { data: ratingsFromDb } = await supabase
        .from('course_ratings')
        .select('rating')
        .eq('course_id', selectedCourseId);

      if (ratingsFromDb) {
        const total = ratingsFromDb.reduce((acc, curr) => acc + curr.rating, 0);
        const avg = Number((total / ratingsFromDb.length).toFixed(1));

        // 3. Update course table
        await supabase
          .from('courses')
          .update({ rating: avg, reviews: ratingsFromDb.length })
          .eq('id', selectedCourseId);

        Alert.alert("Success", "Thanks for your rating!");
        fetchEnrolledCourses(); // Refresh list
      }

      setRatingModalVisible(false);
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchEnrolledCourses();
    }, [fetchEnrolledCourses])
  );

  /* ================= UI ================= */
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <Stack.Screen options={{ headerShown: false }} />

      {/* HEADER */}
      <HomeHeader />

      {/* CONTENT */}
      <View style={styles.mainContent}>
        <View style={styles.sectionHeader}>
          <Text style={styles.title}>My Courses</Text>
          <View style={styles.badge}>
            <Text style={styles.subtitle}>
              {courses.length} IN PROGRESS
            </Text>
          </View>
        </View>

        {loading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#D4AF37" />
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {courses.length > 0 ? (
              courses.map(course => (
                <TouchableOpacity
                  key={course.id}
                  activeOpacity={0.9}
                  style={styles.cardWrapper}
                  onPress={() =>
                    router.push({
                      pathname: '/screens/course/[id]',
                      params: { id: course.id },
                    })
                  }
                >
                  {/* IMAGE */}
                  <Image
                    transition={500}
                    source={{
                      uri:
                        course.image ||
                        'https://via.placeholder.com/600x400',
                    }}
                    style={styles.courseImage}
                  />

                  <View style={styles.cardDetails}>
                    <Text style={styles.courseTitle} numberOfLines={2}>
                      {course.title}
                    </Text>

                    <Text style={styles.instructorText}>
                      {course.instructor}
                    </Text>

                    <View style={styles.priceRow}>
                      <View style={styles.ratingBox}>

                        <Ionicons name="star" size={12} color="#F59E0B" style={{ marginRight: 4 }} />
                        <Text style={styles.ratingText}>
                          {course.rating || 4.8}
                        </Text>
                      </View>

                      <Text style={styles.priceText}>
                        {course.price ? `₹${course.price}` : 'Free'}
                      </Text>
                    </View>

                    {/* PROGRESS */}
                    <View style={styles.progressContainer}>
                      <View style={styles.progressTrack}>
                        <View
                          style={[
                            styles.progressFill,
                            { width: `${course.progress_percent}%` },
                          ]}
                        />
                      </View>
                      <Text style={styles.progressPercentText}>
                        {course.progress_percent}% complete
                      </Text>
                    </View>

                    {/* ACTION ROW */}
                    <View style={styles.actionRow}>
                      <TouchableOpacity
                        style={styles.rateButton}
                        onPress={() => handleOpenRating(course.id)}
                      >
                        <Ionicons name="star-outline" size={16} color="#B8860B" />
                        <Text style={styles.rateButtonText}>Rate Course</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>
                  No active courses found.
                </Text>
              </View>
            )}
          </ScrollView>
        )}

      </View>

      {/* RATING MODAL */}
      <Modal
        visible={ratingModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setRatingModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Rate this Course</Text>

            <View style={styles.starsContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity key={star} onPress={() => setUserRating(star)}>
                  <Ionicons
                    name={star <= userRating ? "star" : "star-outline"}
                    size={32}
                    color="#D4AF37"
                    style={{ marginHorizontal: 4 }}
                  />
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity onPress={() => setRatingModalVisible(false)} style={styles.cancelButton}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={submitRating} style={styles.submitButton}>
                <Text style={styles.submitText}>Submit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <FooterNav />
    </View >
  );
}

/* ================= STYLES ================= */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  mainContent: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  badge: {
    backgroundColor: '#FFF4D6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  subtitle: {
    fontSize: 10,
    color: '#B8860B',
    fontWeight: 'bold',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 120,
  },
  cardWrapper: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  courseImage: {
    width: '100%',
    height: 180,
    backgroundColor: '#E1E1E1',
  },
  cardDetails: {
    padding: 16,
  },
  courseTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  instructorText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  ratingBox: {
    backgroundColor: '#FFF8E1', // Brighter background for star
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#B45309', // Darker gold/orange text
  },
  priceText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2D2F31',
  },
  progressContainer: {
    marginTop: 5,
  },
  progressTrack: {
    height: 6,
    backgroundColor: '#E9ECEF',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#D4AF37',
  },
  progressPercentText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  emptyState: {
    marginTop: 100,
    alignItems: 'center',
  },
  emptyText: {
    color: '#999',
    fontSize: 16,
  },
  actionRow: {
    marginTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
    paddingTop: 10,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  rateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  rateButtonText: {
    color: '#B8860B',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  /* Modal Styles */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 24,
    borderRadius: 16,
    width: '80%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  starsContainer: {
    flexDirection: 'row',
    marginBottom: 30,
  },
  modalButtons: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
  },
  cancelButton: {
    padding: 12,
    flex: 1,
    marginRight: 10,
    alignItems: 'center',
  },
  submitButton: {
    padding: 12,
    flex: 1,
    backgroundColor: '#D4AF37',
    borderRadius: 8,
    alignItems: 'center',
    marginLeft: 10,
  },
  cancelText: {
    color: '#666',
    fontWeight: '600',
  },
  submitText: {
    color: 'white',
    fontWeight: '800',
  },
});
