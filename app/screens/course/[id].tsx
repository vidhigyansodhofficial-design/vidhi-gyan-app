import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  StatusBar,
  Alert,
  Dimensions,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as NavigationBar from 'expo-navigation-bar';

const { width } = Dimensions.get('window');

type TabType = 'Overview' | 'Syllabus' | 'Reviews';

export default function CourseDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const courseId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [course, setCourse] = useState<any>(null);
  const [syllabus, setSyllabus] = useState<any[]>([]);
  const [activeVideo, setActiveVideo] = useState<string | null>(null);
  const [activeSyllabusId, setActiveSyllabusId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [progressMap, setProgressMap] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('Overview');

  /* ---------------- IMMERSIVE MODE LOGIC ---------------- */
  useFocusEffect(
    useCallback(() => {
      const hideSystemBars = async () => {
        try {
          if (Platform.OS === 'android') {
            await NavigationBar.setVisibilityAsync("hidden");
            await NavigationBar.setBehaviorAsync("sticky-immersive");
          }
          StatusBar.setHidden(true, 'fade');
        } catch (error) {
          console.warn("System bar error:", error);
        }
      };
      hideSystemBars();
      return () => {
        const showSystemBars = async () => {
          try {
            if (Platform.OS === 'android') {
              await NavigationBar.setVisibilityAsync("visible");
            }
            StatusBar.setHidden(false, 'fade');
          } catch (error) {
            console.warn("System bar restore error:", error);
          }
        };
        showSystemBars();
      };
    }, [])
  );

  /* ---------------- DYNAMIC FONT SCALING LOGIC ---------------- */
  const titleConfig = useMemo(() => {
    const rawTitle = course?.title ? course.title.toUpperCase() : "COURSE PLAYER";
    let fontSize = 11; 
    let letterSpacing = 2;
    if (rawTitle.length > 30) {
      fontSize = 9;
      letterSpacing = 1.2;
    } else if (rawTitle.length > 20) {
      fontSize = 10;
      letterSpacing = 1.5;
    }
    return { title: rawTitle, fontSize, letterSpacing };
  }, [course]);

  // Calculate local progress percentage for immediate UI feedback
  const progressPercent = useMemo(() => {
    if (!syllabus.length) return 0;
    const completedCount = Object.values(progressMap).filter(v => v === true).length;
    return Math.round((completedCount / syllabus.length) * 100);
  }, [progressMap, syllabus]);

  const totalDuration = useMemo(() => {
    return syllabus.reduce((acc, curr) => acc + (parseInt(curr.duration) || 0), 0) + " mins";
  }, [syllabus]);

  useEffect(() => {
    if (courseId) loadAll();
  }, [courseId]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const stored = await AsyncStorage.getItem('user');
      if (!stored) {
        router.replace('/screens/auth/login');
        return;
      }
      const localUser = JSON.parse(stored);
      const { data: dbUser } = await supabase.from('users').select('id').eq('email', localUser.email).single();
      if (!dbUser) return;
      setUserId(dbUser.id);

      const { data: courseData } = await supabase.from('courses').select('*').eq('id', courseId).single();
      setCourse(courseData);

      const { data: syllabusData } = await supabase.from('course_syllabus').select('*').eq('course_id', courseId).order('order_index');
      setSyllabus(syllabusData || []);

      if (syllabusData?.length) {
        setActiveVideo(syllabusData[0].video_url);
        setActiveSyllabusId(syllabusData[0].id);
      }

      const { data: enrollment } = await supabase.from('user_course_enrollments').select('*').eq('user_id', dbUser.id).eq('course_id', courseId).maybeSingle();
      setIsEnrolled(!!enrollment);

      const { data: progressRows } = await supabase.from('user_syllabus_progress').select('syllabus_id, completed').eq('user_id', dbUser.id).eq('course_id', courseId);
      const map: Record<string, boolean> = {};
      progressRows?.forEach(p => (map[p.syllabus_id] = p.completed));
      setProgressMap(map);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- MODIFIED MARK COMPLETED ---------------- */
  // This function now updates the lesson progress AND the overall enrollment percentage
  const markCompleted = async (sId: string) => {
    if (!userId || !courseId) return;

    // 1. Update local state for immediate UI feedback
    const updatedMap = { ...progressMap, [sId]: true };
    setProgressMap(updatedMap);

    // 2. Calculate new overall percentage
    const completedCount = Object.values(updatedMap).filter(v => v === true).length;
    const newPercent = Math.round((completedCount / syllabus.length) * 100);

    try {
      // 3. Update lesson progress
      await supabase.from('user_syllabus_progress').upsert({
        user_id: userId,
        course_id: courseId,
        syllabus_id: sId,
        completed: true,
        completed_at: new Date().toISOString(),
        progress_percent: 100 // Mark specific lesson as 100%
      }, { onConflict: 'user_id, syllabus_id' });

      // 4. Update overall course enrollment progress (This shows on Home Card)
      await supabase
        .from('user_course_enrollments')
        .update({ 
            progress_percent: newPercent,
            completed: newPercent >= 100 
        })
        .eq('user_id', userId)
        .eq('course_id', courseId);

    } catch (error) {
      console.error("Error updating progress:", error);
    }
  };

  if (loading || !course) {
    return (
      <View style={styles.loader}><ActivityIndicator size="large" color="#D4AF37" /></View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.premiumTopBar}>
        <View style={styles.headerContent}>
          <Text 
            style={[styles.premiumTitle, { fontSize: titleConfig.fontSize, letterSpacing: titleConfig.letterSpacing }]} 
            numberOfLines={1}
            adjustsFontSizeToFit={true}
          >
            {titleConfig.title}
          </Text>
        </View>
      </View>

      <StatusBar hidden />
      
      <View style={styles.videoSection}>
        {activeVideo && (isEnrolled || syllabus.find(s => s.id === activeSyllabusId)?.preview) ? (
          <WebView 
            source={{ uri: activeVideo }} 
            style={{ flex: 1 }} 
            allowsFullscreenVideo 
            javaScriptEnabled={true}
          />
        ) : (
          <View style={styles.videoLockOverlay}>
            <MaterialCommunityIcons name="lock-outline" size={40} color="#D4AF37" />
            <Text style={styles.lockText}>ENROLL TO ACCESS MODULE</Text>
          </View>
        )}
        <TouchableOpacity style={styles.videoBackButton} onPress={() => router.back()}>
          <MaterialCommunityIcons name="chevron-left" size={28} color="#FFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.headerInfo}>
        <Text style={styles.courseTitle}>{course.title}</Text>
        <View style={styles.metaRow}>
          <Text style={styles.metaText}>{course.instructor}</Text>
          <Text style={styles.metaDivider}>•</Text>
          <Text style={styles.metaText}>{course.lectures} Lectures</Text>
          <Text style={styles.metaDivider}>•</Text>
          <Text style={styles.metaText}>{totalDuration}</Text>
        </View>
      </View>

      <View style={styles.tabArea}>
        <View style={styles.tabBar}>
          {(['Overview', 'Syllabus', 'Reviews'] as TabType[]).map((tab) => (
            <TouchableOpacity 
              key={tab} 
              onPress={() => setActiveTab(tab)}
              style={[styles.tabButton, activeTab === tab && styles.activeTabButton]}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </View>
        
        {isEnrolled && (
          <View style={styles.progressContainer}>
             <View style={styles.progressTextRow}>
                <Text style={styles.progressLabel}>MODULE PROGRESS</Text>
                <Text style={styles.progressPercentText}>{progressPercent}%</Text>
             </View>
             <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
             </View>
          </View>
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {activeTab === 'Overview' && (
          <View style={styles.contentPadding}>
            <Text style={styles.sectionTitle}>Course Overview</Text>
            <Text style={styles.bodyText}>{course.description}</Text>
          </View>
        )}

        {activeTab === 'Syllabus' && (
          <View style={styles.contentPadding}>
            {syllabus.map((item, index) => (
              <TouchableOpacity 
                key={item.id} 
                style={[styles.lessonItem, activeSyllabusId === item.id && styles.lessonActive]}
                onPress={() => {
                  if (isEnrolled || item.preview) {
                    setActiveSyllabusId(item.id);
                    setActiveVideo(item.video_url);
                  }
                }}
              >
                <View style={styles.lessonMain}>
                   <View style={styles.numberBox}>
                     <Text style={styles.numberText}>{index + 1}</Text>
                   </View>
                   <View style={styles.lessonTextContent}>
                     <Text style={styles.lessonTitle} numberOfLines={1}>{item.title}</Text>
                     <Text style={styles.lessonSub}>{item.duration || '0'} mins</Text>
                   </View>
                </View>

                <View style={styles.actionArea}>
                  {isEnrolled && !progressMap[item.id] ? (
                    <TouchableOpacity style={styles.doneBtn} onPress={() => markCompleted(item.id)}>
                      <Text style={styles.doneBtnText}>DONE</Text>
                    </TouchableOpacity>
                  ) : progressMap[item.id] ? (
                    <MaterialCommunityIcons name="check-circle" size={24} color="#10B981" />
                  ) : (
                    <MaterialCommunityIcons name="lock-outline" size={18} color="#CBD5E1" />
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {activeTab === 'Reviews' && (
          <View style={styles.contentPadding}>
            <Text style={styles.bodyText}>Verified feedback from the legal community.</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  premiumTopBar: { backgroundColor: '#D4AF37', paddingTop: Platform.OS === 'ios' ? 55 : 18, paddingBottom: 15, elevation: 4 },
  headerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  premiumTitle: { fontWeight: '900', color: '#FFF', textAlign: 'center' },
  videoSection: { height: 230, backgroundColor: '#000', position: 'relative' },
  videoLockOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0F172A' },
  lockText: { color: '#D4AF37', fontSize: 12, fontWeight: '800', marginTop: 10, letterSpacing: 1.2 },
  videoBackButton: { position: 'absolute', top: 15, left: 15, width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  headerInfo: { padding: 22 },
  courseTitle: { fontSize: 23, fontWeight: '900', color: '#1E293B', marginBottom: 10, lineHeight: 30 },
  metaRow: { flexDirection: 'row', alignItems: 'center' },
  metaText: { color: '#64748B', fontSize: 13, fontWeight: '600' },
  metaDivider: { marginHorizontal: 8, color: '#CBD5E1' },
  tabArea: { borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  tabBar: { flexDirection: 'row', paddingHorizontal: 20 },
  tabButton: { paddingVertical: 18, marginRight: 25, borderBottomWidth: 3, borderBottomColor: 'transparent' },
  activeTabButton: { borderBottomColor: '#D4AF37' },
  tabText: { fontSize: 14, fontWeight: '700', color: '#94A3B8' },
  activeTabText: { color: '#1E293B' },
  progressContainer: { paddingHorizontal: 22, paddingBottom: 18, paddingTop: 8 },
  progressTextRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  progressLabel: { fontSize: 11, fontWeight: '900', color: '#64748B', letterSpacing: 1 },
  progressPercentText: { fontSize: 13, fontWeight: '900', color: '#D4AF37' },
  progressBarBg: { height: 7, backgroundColor: '#F1F5F9', borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#D4AF37' },
  contentPadding: { padding: 22 },
  sectionTitle: { fontSize: 19, fontWeight: '800', color: '#1E293B', marginBottom: 14 },
  bodyText: { fontSize: 15, color: '#475569', lineHeight: 26 },
  lessonItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 14, marginBottom: 12, borderBottomWidth: 1.5, borderColor: '#F1F5F9', backgroundColor: '#FFF' },
  lessonActive: { backgroundColor: '#FFFDF5', borderColor: '#D4AF37' },
  lessonMain: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  numberBox: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  numberText: { fontSize: 13, fontWeight: '900', color: '#64748B' },
  lessonTextContent: { flex: 1, marginRight: 12 },
  lessonTitle: { fontSize: 15, fontWeight: '700', color: '#1E293B' },
  lessonSub: { fontSize: 12, color: '#94A3B8', marginTop: 3, fontWeight: '500' },
  actionArea: { width: 75, alignItems: 'flex-end' },
  doneBtn: { backgroundColor: '#1E293B', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8 },
  doneBtnText: { color: '#FFF', fontSize: 11, fontWeight: '900', letterSpacing: 0.5 },
});