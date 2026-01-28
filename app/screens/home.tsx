import CourseCard from '@/components/CourseCard';
import FooterNav from '@/components/FooterNav';
import HomeHeader from '@/components/HomeHeader';
import { supabase } from '@/lib/supabase';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function HomeScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userName, setUserName] = useState('Guest');

  const [continueLearning, setContinueLearning] = useState<any[]>([]);
  const [completedCount, setCompletedCount] = useState(0);
  const [recommended, setRecommended] = useState<any[]>([]);
  const [mostPurchased, setMostPurchased] = useState<any[]>([]);

  const loadHomeData = useCallback(async () => {
    try {
      const storedUser = await AsyncStorage.getItem('user');
      if (!storedUser) return;
      const localUser = JSON.parse(storedUser);
      setUserName(localUser.fullName || localUser.email?.split('@')[0]);

      let userId = localUser.id;
      if (!userId) {
        const { data: dbUser } = await supabase.from('users').select('id').eq('email', localUser.email).single();
        if (dbUser) {
          userId = dbUser.id;
          AsyncStorage.setItem('user', JSON.stringify({ ...localUser, id: userId }));
        }
      }
      if (!userId) return;

      // PARALLEL FETCHING
      const [enrollRes, recRes, purchRes] = await Promise.all([
        supabase
          .from('user_course_enrollments')
          .select(`progress_percent, completed, courses (id, title, instructor, image, rating, price, total_duration, lectures)`)
          .eq('user_id', userId)
          .eq('enrolled', true),

        supabase
          .from('courses')
          .select('id, title, instructor, image, rating, price, total_duration, lectures')
          .eq('recommended', true),

        supabase
          .from('courses')
          .select('id, title, instructor, image, rating, price, total_duration, lectures')
          .eq('most_purchased', true)
      ]);

      const allEnrollments = enrollRes.data || [];
      const inProgress = allEnrollments.filter((e: any) => e.progress_percent < 100);
      const completed = allEnrollments.filter((e: any) => e.progress_percent >= 100 || e.completed === true);

      setContinueLearning(inProgress);
      setCompletedCount(completed.length);
      setRecommended(recRes.data || []);
      setMostPurchased(purchRes.data || []);

    } catch (err) {
      console.error("Home Load Error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadHomeData();
    }, [loadHomeData])
  );
  const onRefresh = useCallback(() => { setRefreshing(true); loadHomeData(); }, []);

  if (loading && !refreshing) {
    return (
      <View style={styles.loader}><ActivityIndicator size="large" color="#D4AF37" /></View>
    );
  }

  return (
    <View style={styles.screenContainer}>
      <StatusBar barStyle="dark-content" />
      <HomeHeader userName={userName} />

      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>

        {/* CONTINUE LEARNING SECTION */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Continue Learning</Text>

          {continueLearning.length > 0 ? (
            /* SHOW IN-PROGRESS COURSES */
            <FlatList
              horizontal
              data={continueLearning}
              keyExtractor={(item) => `cont-${item.courses.id}`}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.listContent}
              renderItem={({ item }) => (
                <View style={styles.cardWrapper}>
                  <CourseCard
                    course={item.courses}
                    progressPercent={item.progress_percent}
                    onPress={() => router.push(`/screens/course/${item.courses.id}`)}
                  />
                </View>
              )}
            />
          ) : completedCount > 0 ? (
            /* ALL COURSES COMPLETED MESSAGE */
            <View style={styles.completionCard}>
              <View style={styles.completionIconCircle}>
                <MaterialCommunityIcons name="party-popper" size={32} color="#D4AF37" />
              </View>
              <View style={styles.completionTextContainer}>
                <Text style={styles.completionTitle}>Great Job, {userName}!</Text>
                <Text style={styles.completionSub}>You have successfully completed {completedCount} {completedCount === 1 ? 'course' : 'courses'}.</Text>
              </View>
              <TouchableOpacity
                style={styles.viewMyCoursesBtn}
                onPress={() => router.push('/screens/my-courses')}
              >
                <Text style={styles.viewMyCoursesText}>VIEW MY COURSES</Text>
                <MaterialCommunityIcons name="arrow-right" size={16} color="#FFF" />
              </TouchableOpacity>
            </View>
          ) : (
            /* NO ENROLLMENTS AT ALL */
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>Start your legal journey today! 📚</Text>
              <TouchableOpacity style={styles.exploreButton} onPress={() => router.push('/screens/search')}>
                <Text style={styles.exploreButtonText}>Explore Courses</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* RECOMMENDED */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recommended</Text>
          <FlatList
            horizontal
            data={recommended}
            keyExtractor={(item) => `rec-${item.id}`}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <View style={styles.cardWrapper}>
                <CourseCard course={item} onPress={() => router.push(`/screens/course/${item.id}`)} />
              </View>
            )}
          />
        </View>

        {/* MOST PURCHASED */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Most Purchased</Text>
          <FlatList
            horizontal
            data={mostPurchased}
            keyExtractor={(item) => `most-${item.id}`}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <View style={styles.cardWrapper}>
                <CourseCard course={item} onPress={() => router.push(`/screens/course/${item.id}`)} />
              </View>
            )}
          />
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
      <FooterNav />
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: { flex: 1, backgroundColor: '#F9FAFB' },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  section: { marginTop: 24 },
  sectionTitle: { fontSize: 19, fontWeight: '800', marginLeft: 16, marginBottom: 14, color: '#1E293B' },
  listContent: { paddingHorizontal: 16 },
  cardWrapper: { width: 260, marginRight: 20 },

  /* Completion Card Styles */
  completionCard: {
    marginHorizontal: 16,
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#D4AF37',
    shadowColor: '#D4AF37',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  completionIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  completionTextContainer: { alignItems: 'center', marginBottom: 16 },
  completionTitle: { fontSize: 18, fontWeight: '900', color: '#1E293B' },
  completionSub: { fontSize: 14, color: '#64748B', textAlign: 'center', marginTop: 4 },
  viewMyCoursesBtn: {
    backgroundColor: '#D4AF37',
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  viewMyCoursesText: { color: '#FFF', fontWeight: '800', fontSize: 13, marginRight: 8 },

  emptyState: { marginHorizontal: 16, padding: 20, backgroundColor: '#FFF', borderRadius: 16, alignItems: 'center' },
  emptyText: { color: '#64748B', fontWeight: '600' },
  exploreButton: { marginTop: 12, backgroundColor: '#1E293B', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 },
  exploreButtonText: { color: '#FFF', fontWeight: '700' },
});