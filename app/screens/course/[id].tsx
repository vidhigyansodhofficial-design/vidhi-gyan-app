import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  StatusBar,
  Alert,
  Platform,
  SafeAreaView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Course, CourseSyllabus } from '@/lib/type';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import AsyncStorage from '@react-native-async-storage/async-storage';

type TabType = 'Overview' | 'Syllabus' | 'Reviews';

export default function CourseDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const courseId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [course, setCourse] = useState<Course | null>(null);
  const [syllabus, setSyllabus] = useState<CourseSyllabus[]>([]);
  const [activeVideo, setActiveVideo] = useState<string | null>(null);
  const [activeChapterId, setActiveChapterId] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('Overview');

  useEffect(() => {
    if (courseId) loadData();
  }, [courseId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const storedUser = await AsyncStorage.getItem('user');
      if (!storedUser) {
        router.replace('/screens/auth/login');
        return;
      }
      const localUser = JSON.parse(storedUser);

      const { data: dbUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', localUser.email)
        .single();

      if (dbUser) setUserId(dbUser.id);

      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single();

      if (courseError) throw courseError;
      setCourse(courseData);

      const { data: syllabusData } = await supabase
        .from('course_syllabus')
        .select('*')
        .eq('course_id', courseId)
        .order('order_index', { ascending: true });

      setSyllabus(syllabusData || []);

      if (syllabusData?.length) {
        setActiveVideo(syllabusData[0].video_url);
        setActiveChapterId(syllabusData[0].id);
      }

      if (dbUser) {
        const { data: enrollment } = await supabase
          .from('user_course_enrollments')
          .select('enrolled')
          .eq('user_id', dbUser.id)
          .eq('course_id', courseId)
          .maybeSingle();
        setIsEnrolled(enrollment?.enrolled === true);
      }
    } catch (err) {
      console.error('Load error:', err);
      Alert.alert('Error', 'Could not fetch course details');
    } finally {
      setLoading(false);
    }
  };

  const handleEnrollment = async () => {
    if (!userId || !course) return;
    setEnrolling(true);
    try {
      const { error } = await supabase.from('user_course_enrollments').upsert({
        user_id: userId,
        course_id: course.id,
        enrolled: true,
        progress_percent: 0,
      }, { onConflict: 'user_id,course_id' });

      if (error) throw error;
      setIsEnrolled(true);
      Alert.alert('Congratulations!', 'Access granted to all lectures.');
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setEnrolling(false);
    }
  };

  if (loading || !course) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#D4AF37" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Set status bar to light so it's visible on dark header */}
      <StatusBar barStyle="light-content" backgroundColor="#1E293B" />

      {/* 1. CLEAN TOP HEADER */}
      <View style={styles.headerContainer}>
        <SafeAreaView>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => router.back()} style={styles.headerIconButton}>
              <MaterialCommunityIcons name="chevron-left" size={28} color="#FFF" />
            </TouchableOpacity>
            
            <Text style={styles.headerTitle} numberOfLines={1}>
              {course.title}
            </Text>
            
            <TouchableOpacity style={styles.headerIconButton}>
              <MaterialCommunityIcons name="share-variant" size={22} color="#FFF" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* 2. VIDEO SECTION */}
        <View style={styles.videoContainer}>
          {activeVideo && (isEnrolled || syllabus.find(s => s.id === activeChapterId)?.preview) ? (
            <WebView 
              source={{ uri: activeVideo }} 
              allowsFullscreenVideo 
              style={styles.webview}
              scrollEnabled={false}
            />
          ) : (
            <View style={styles.videoFallback}>
              <MaterialCommunityIcons name="play-circle" size={60} color="#D4AF37" />
              <Text style={styles.lockTextText}>Enroll to unlock premium content</Text>
            </View>
          )}
        </View>

        {/* 3. PREMIUM CTA SECTION */}
        <View style={styles.ctaWrapper}>
          <View style={styles.ctaContainer}>
            {!isEnrolled ? (
              <View>
                <View style={styles.priceRow}>
                  <Text style={styles.priceText}>{course.price ? `₹${course.price}` : 'Free'}</Text>
                  {course.price && <Text style={styles.originalPrice}>₹{Number(course.price) * 1.5}</Text>}
                </View>
                <TouchableOpacity
                  disabled={enrolling}
                  onPress={handleEnrollment}
                  style={styles.premiumEnrollBtn}
                >
                  {enrolling ? (
                    <ActivityIndicator color="#000" />
                  ) : (
                    <Text style={styles.premiumEnrollBtnText}>Enroll Now</Text>
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.enrolledInfo}>
                <View style={styles.statusLabel}>
                  <MaterialCommunityIcons name="check-decagram" size={20} color="#D4AF37" />
                  <Text style={styles.statusLabelText}>You are enrolled in this course</Text>
                </View>
                <TouchableOpacity 
                  style={styles.continueBtn}
                  onPress={() => setActiveTab('Syllabus')}
                >
                  <MaterialCommunityIcons name="play" size={22} color="#FFF" />
                  <Text style={styles.continueBtnText}>Continue Learning</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* 4. COURSE TITLE & META */}
        <View style={styles.courseDetails}>
          <Text style={styles.mainTitle}>{course.title}</Text>
          <View style={styles.ratingRow}>
            <MaterialCommunityIcons name="star" size={16} color="#D4AF37" />
            <Text style={styles.ratingValue}>{course.rating}</Text>
            <Text style={styles.reviewCount}>({course.reviews})</Text>
            <Text style={styles.metaDot}>•</Text>
            <Text style={styles.instructorName}>By {course.instructor}</Text>
          </View>
        </View>

        {/* 5. TABS */}
        <View style={styles.tabContainer}>
          {(['Overview', 'Syllabus', 'Reviews'] as TabType[]).map((tab) => (
            <TouchableOpacity 
              key={tab} 
              onPress={() => setActiveTab(tab)}
              style={[styles.tabItem, activeTab === tab && styles.activeTabItem]}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 6. TAB CONTENT */}
        <View style={styles.tabBody}>
          {activeTab === 'Overview' && (
            <View>
              <Text style={styles.sectionTitle}>About this course</Text>
              <Text style={styles.descText}>{course.description || "Comprehensive masterclass on this subject."}</Text>
              
              <Text style={styles.sectionTitle}>What you'll learn</Text>
              {course.topics && Array.isArray(course.topics) && course.topics.map((topic, i) => (
                <View key={i} style={styles.topicRow}>
                  <MaterialCommunityIcons name="check-circle" size={18} color="#D4AF37" />
                  <Text style={styles.topicText}>{topic}</Text>
                </View>
              ))}
            </View>
          )}

          {activeTab === 'Syllabus' && (
            <View>
              <Text style={styles.sectionTitle}>{syllabus.length} Lectures • {course.total_duration}</Text>
              {syllabus.map((item, index) => (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => {
                    if (isEnrolled || item.preview) {
                      setActiveVideo(item.video_url);
                      setActiveChapterId(item.id);
                    } else {
                      Alert.alert('Lecture Locked', 'Enroll now to access full syllabus.');
                    }
                  }}
                  style={[
                    styles.lessonRow,
                    activeChapterId === item.id && styles.activeLessonRow
                  ]}
                >
                  <View style={styles.lessonLead}>
                    <View style={styles.lessonIndex}>
                      <Text style={styles.lessonIndexText}>{index + 1}</Text>
                    </View>
                    <View style={styles.lessonInfo}>
                      <Text style={[styles.lessonTitle, activeChapterId === item.id && { color: '#D4AF37' }]}>
                        {item.title}
                      </Text>
                      <Text style={styles.lessonMeta}>{item.duration || '05:00'}</Text>
                    </View>
                  </View>
                  <MaterialCommunityIcons 
                    name={isEnrolled || item.preview ? "play-circle" : "lock"} 
                    size={22} 
                    color={activeChapterId === item.id ? "#D4AF37" : "#CBD5E1"} 
                  />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Updated Header Style
  headerContainer: { backgroundColor: '#1E293B', paddingBottom: 10 },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    height: 50,
  },
  headerIconButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { color: '#FFF', fontSize: 17, fontWeight: '700', flex: 1, textAlign: 'center' },

  // Video Section
  videoContainer: { height: 220, backgroundColor: '#000', borderBottomWidth: 3, borderColor: '#D4AF37' },
  webview: { flex: 1 },
  videoFallback: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  lockTextText: { color: '#94A3B8', marginTop: 10, fontSize: 13 },

  // CTA Section
  ctaWrapper: { padding: 15, backgroundColor: '#FFF' },
  ctaContainer: { 
    padding: 15, 
    borderRadius: 12, 
    backgroundColor: '#FFF', 
    borderWidth: 1, 
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3
  },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 12 },
  priceText: { fontSize: 28, fontWeight: '900', color: '#1E293B' },
  originalPrice: { fontSize: 15, color: '#94A3B8', textDecorationLine: 'line-through', marginLeft: 8 },
  premiumEnrollBtn: { backgroundColor: '#D4AF37', paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  premiumEnrollBtnText: { color: '#1E293B', fontSize: 17, fontWeight: '800' },

  // Enrolled State
  enrolledInfo: { alignItems: 'center' },
  statusLabel: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  statusLabelText: { marginLeft: 8, fontWeight: '700', color: '#1E293B', fontSize: 15 },
  continueBtn: { 
    backgroundColor: '#1E293B', 
    flexDirection: 'row', 
    width: '100%', 
    paddingVertical: 14, 
    borderRadius: 10, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  continueBtnText: { color: '#FFF', fontWeight: '800', marginLeft: 8, fontSize: 16 },

  // Course Details
  courseDetails: { paddingHorizontal: 20, paddingBottom: 15 },
  mainTitle: { fontSize: 22, fontWeight: '800', color: '#0F172A', marginBottom: 8 },
  ratingRow: { flexDirection: 'row', alignItems: 'center' },
  ratingValue: { marginLeft: 4, fontWeight: '800', color: '#D4AF37', fontSize: 15 },
  reviewCount: { marginLeft: 2, color: '#64748B', fontSize: 13 },
  metaDot: { marginHorizontal: 8, color: '#CBD5E1' },
  instructorName: { color: '#64748B', fontWeight: '600' },

  // Tab Bar
  tabContainer: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#F1F5F9' },
  tabItem: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  activeTabItem: { borderBottomWidth: 3, borderColor: '#D4AF37' },
  tabText: { fontWeight: '700', color: '#94A3B8', fontSize: 14 },
  activeTabText: { color: '#D4AF37' },

  // Tab Body
  tabBody: { padding: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#1E293B', marginBottom: 12 },
  descText: { fontSize: 15, color: '#475569', lineHeight: 24, marginBottom: 20 },
  topicRow: { flexDirection: 'row', marginBottom: 10, alignItems: 'flex-start' },
  topicText: { marginLeft: 10, color: '#334155', fontSize: 14, fontWeight: '500', flex: 1 },

  // Syllabus Rows
  lessonRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, borderBottomWidth: 1, borderColor: '#F8FAFC' },
  activeLessonRow: { backgroundColor: '#FFFDF5' },
  lessonLead: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  lessonIndex: { width: 26, height: 26, borderRadius: 13, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' },
  lessonIndexText: { fontSize: 11, fontWeight: '700', color: '#64748B' },
  lessonInfo: { marginLeft: 12, flex: 1 },
  lessonTitle: { fontSize: 14, fontWeight: '600', color: '#334155' },
  lessonMeta: { fontSize: 11, color: '#94A3B8', marginTop: 2 },
});