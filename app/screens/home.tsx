import React, { useEffect, useState, useCallback } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  StatusBar,
  FlatList,
  RefreshControl,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import HomeHeader from '@/components/HomeHeader';
import CourseCard from '@/components/CourseCard';
import FooterNav from '@/components/FooterNav';
import { Course } from '@/lib/type';
import { supabase } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function HomeScreen() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userName, setUserName] = useState('Guest');

  const [continueLearning, setContinueLearning] = useState<Course[]>([]);
  const [recommended, setRecommended] = useState<Course[]>([]);
  const [mostPurchased, setMostPurchased] = useState<Course[]>([]);

  /* ================= LOAD HOME DATA ================= */
  const loadHomeData = async () => {
    try {
      /* 🔹 GET USER FROM STORAGE */
      const storedUser = await AsyncStorage.getItem('user');
      if (!storedUser) return;

      const localUser = JSON.parse(storedUser);
      setUserName(localUser.fullName || localUser.email?.split('@')[0]);

      /* 🔹 FETCH REAL USER ID */
      const { data: dbUser, error: userError } = await supabase
        .from('users')
        .select('id, full_name, email')
        .eq('email', localUser.email)
        .single();

      if (userError || !dbUser) {
        Alert.alert('Error', 'User not found');
        return;
      }

      /* 🔹 CONTINUE LEARNING (ENROLLED COURSES) */
      const { data: enrollments, error: enrollError } = await supabase
        .from('user_course_enrollments')
        .select('courses (*)')
        .eq('user_id', dbUser.id)
        .eq('enrolled', true)
        .eq('completed', false);

      if (enrollError) {
        console.error('Enrollment fetch error:', enrollError);
      }

      const enrolledCourses =
        enrollments
          ?.map((row: any) => row.courses)
          .filter(Boolean) || [];

      setContinueLearning(enrolledCourses);

      /* 🔹 RECOMMENDED COURSES */
      const { data: recommendedData } = await supabase
        .from('courses')
        .select('*')
        .eq('recommended', true)
        .order('created_at', { ascending: false });

      setRecommended(recommendedData || []);

      /* 🔹 MOST PURCHASED */
      const { data: mostPurchasedData } = await supabase
        .from('courses')
        .select('*')
        .eq('most_purchased', true)
        .order('created_at', { ascending: false });

      setMostPurchased(mostPurchasedData || []);
    } catch (err) {
      console.error('Home load error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadHomeData();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadHomeData();
  }, []);

  /* ================= RENDER HELPERS ================= */
  const renderHorizontalList = (data: Course[], key: string) => (
    <FlatList
      horizontal
      data={data}
      keyExtractor={(item) => `${key}-${item.id}`}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.listContent}
      renderItem={({ item }) => (
        <View style={styles.cardWrapper}>
          <CourseCard
            course={item}
            onPress={() => router.push(`/screens/course/${item.id}`)}
          />
        </View>
      )}
    />
  );

  /* ================= LOADER ================= */
  if (loading && !refreshing) {
    return (
      <View style={styles.loadingWrapper}>
        <ActivityIndicator size="large" color="#D4AF37" />
      </View>
    );
  }

  /* ================= UI ================= */
  return (
    <View style={styles.screenContainer}>
      <StatusBar barStyle="dark-content" />
      <HomeHeader userName={userName} />

      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* 🔹 CONTINUE LEARNING */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Continue Learning</Text>

          {continueLearning.length === 0 ? (
            <View style={styles.emptyState}>
              <Text>No courses yet 📚</Text>
              <TouchableOpacity
                style={styles.exploreButton}
                onPress={() => router.push('/screens/search')}
              >
                <Text style={styles.exploreButtonText}>Explore Courses</Text>
              </TouchableOpacity>
            </View>
          ) : (
            renderHorizontalList(continueLearning, 'continue')
          )}
        </View>

        {/* 🔹 RECOMMENDED */}
        {recommended.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recommended</Text>
            {renderHorizontalList(recommended, 'recommended')}
          </View>
        )}

        {/* 🔹 MOST PURCHASED */}
        {mostPurchased.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Most Purchased</Text>
            {renderHorizontalList(mostPurchased, 'popular')}
          </View>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      <FooterNav />
    </View>
  );
}

/* ================= STYLES ================= */
const styles = StyleSheet.create({
  screenContainer: { flex: 1, backgroundColor: '#F9FAFB' },
  loadingWrapper: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  section: { marginTop: 24 },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginLeft: 16,
    marginBottom: 12,
  },

  listContent: { paddingHorizontal: 16 },
  cardWrapper: { width: 240, marginRight: 24 },

  emptyState: {
    marginHorizontal: 16,
    backgroundColor: '#FFF',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
  },

  exploreButton: {
    marginTop: 12,
    backgroundColor: '#D4AF37',
    padding: 12,
    borderRadius: 10,
  },
  exploreButtonText: { color: '#FFF', fontWeight: '700' },
});
