import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Course } from '@/lib/type';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Components
import HomeHeader from '@/components/HomeHeader';
import FooterNav from '@/components/FooterNav';

interface EnrolledCourse extends Course {
  progress_percent: number;
}

export default function MyCoursesScreen() {
  const router = useRouter();
  const [courses, setCourses] = useState<EnrolledCourse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEnrolledCourses();
  }, []);

  /* ================= FETCH ENROLLED COURSES ================= */
  const fetchEnrolledCourses = async () => {
    try {
      const storedUser = await AsyncStorage.getItem('user');
      if (!storedUser) {
        router.replace('/screens/auth/login');
        return;
      }

      const localUser = JSON.parse(storedUser);

      const { data: dbUser, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('email', localUser.email)
        .single();

      if (userError || !dbUser) {
        Alert.alert('Error', 'User not found');
        return;
      }

      const { data, error } = await supabase
        .from('user_course_enrollments')
        .select(`
          progress_percent,
          courses (*)
        `)
        .eq('user_id', dbUser.id)
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
  };

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
                        <Text style={styles.ratingText}>
                          ★ {course.rating || 4.8}
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

      <FooterNav />
    </View>
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
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#444',
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
});
