import { useHaptics } from '@/hooks/useHaptics';
import { supabase } from '@/lib/supabase';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as NavigationBar from 'expo-navigation-bar';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import * as ScreenCapture from 'expo-screen-capture';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  AppState,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { WebView } from 'react-native-webview';

const { width } = Dimensions.get('window');

type TabType = 'Overview' | 'Syllabus' | 'Discussion' | 'Reviews';

export default function CourseDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [isScreenBlocked, setIsScreenBlocked] = useState(false);
  const courseId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [course, setCourse] = useState<any>(null);
  const [syllabus, setSyllabus] = useState<any[]>([]);
  const [activeVideo, setActiveVideo] = useState<string | null>(null);
  const [activeSyllabusId, setActiveSyllabusId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [progressMap, setProgressMap] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false); // New loading state for enroll button
  const [activeTab, setActiveTab] = useState<TabType>('Overview');
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [posting, setPosting] = useState(false);
  const { triggerHaptic } = useHaptics();

  /* ---------------- SECURITY STATE ---------------- */
  const webViewRef = useRef<WebView>(null);
  const [suspiciousCount, setSuspiciousCount] = useState(0);
  const [showSecurityWarning, setShowSecurityWarning] = useState(false);
  const [securityViolation, setSecurityViolation] = useState<string>('');

  /* ---------------- IMMERSIVE MODE & SECURITY ---------------- */

  // Helper: Log Security Event
  const logSecurityEvent = async (event: string) => {
    if (!userId || !courseId) return;
    // Don't await strictly to avoid blocking UI
    supabase.from('security_logs').insert({
      user_id: userId,
      course_id: courseId,
      event: event,
      details: { timestamp: new Date().toISOString(), violation_count: suspiciousCount + 1 }
    }).then(({ error }) => {
      if (error) console.warn("Security log error:", error);
    });
  };

  // Helper: Handle Suspicious Activity
  const handleSuspiciousActivity = (reason: string) => {
    triggerHaptic('error'); // Warn user physically
    // 1. Pause Video (Best Effort)
    const pauseScript = `
      (function() {
        try {
          var videos = document.querySelectorAll('video');
          videos.forEach(function(v) { v.pause(); });
          var iframes = document.querySelectorAll('iframe');
          iframes.forEach(function(f) { 
            f.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'pauseVideo' }), '*');
          });
        } catch(e) {}
      })();
      true;
    `;
    webViewRef.current?.injectJavaScript(pauseScript);

    // 2. Update State
    setSecurityViolation(reason);
    setShowSecurityWarning(true);
    setSuspiciousCount(prev => prev + 1);

    // 3. Log
    logSecurityEvent(reason);
  };

  // 1. App Background / Focus Loss Detection
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState.match(/inactive|background/)) {
        handleSuspiciousActivity('APP_BACKGROUND_FOCUS_LOST');
        setIsScreenBlocked(true); // Temporarily block screen content visually
      } else if (nextAppState === 'active') {
        // Optional: Auto-resume or keep blocked until user dismisses warning?
        // We'll keep the warning up if it was triggered.
        // But we can unblock the "isScreenBlocked" black screen if we rely on the warning overlay.
        // Let's keep isScreenBlocked false here to let the warning overlay show on top.
        setIsScreenBlocked(false);
      }
    });

    return () => {
      subscription.remove();
    };
  }, [userId, courseId]);

  // 2. Immersive Mode (Refined for Smoothness)
  useFocusEffect(
    useCallback(() => {
      const enterFullScreen = async () => {
        try {
          if (Platform.OS === 'android') {
            // Set absolute positioning to prevent layout jumps (smoothness)
            await NavigationBar.setPositionAsync("absolute");
            await NavigationBar.setBackgroundColorAsync("#00000000"); // Transparent
            await NavigationBar.setVisibilityAsync("hidden");
            await NavigationBar.setBehaviorAsync("sticky-immersive");
          }
          // iOS & Android Status Bar
          StatusBar.setHidden(true, 'fade');
        } catch (error) {
          console.warn("Enter full screen error:", error);
        }
      };

      const exitFullScreen = async () => {
        try {
          if (Platform.OS === 'android') {
            await NavigationBar.setVisibilityAsync("visible");
            await NavigationBar.setPositionAsync("relative");
            await NavigationBar.setBackgroundColorAsync("#000000"); // Restore to black or theme color
          }
          StatusBar.setHidden(false, 'fade');
        } catch (error) {
          console.warn("Exit full screen error:", error);
        }
      };

      enterFullScreen();

      return () => {
        exitFullScreen();
      };
    }, [])
  );

  // 3. Screenshot Detection
  useFocusEffect(
    useCallback(() => {
      let subscription: ScreenCapture.Subscription | null = null;
      const secureScreen = async () => {
        try {
          await ScreenCapture.preventScreenCaptureAsync();
          subscription = ScreenCapture.addScreenshotListener(() => {
            handleSuspiciousActivity('SCREENSHOT_ATTEMPT');
          });
        } catch (err) {
          console.warn("Screen security error:", err);
        }
      };
      secureScreen();
      return () => {
        ScreenCapture.allowScreenCaptureAsync();
        subscription?.remove();
      };
    }, [userId, courseId])
  );

  /* ---------------- DYNAMIC DATA ---------------- */
  const titleConfig = useMemo(() => {
    const rawTitle = course?.title ? course.title.toUpperCase() : "COURSE PLAYER";
    let fontSize = 11;
    let letterSpacing = 2;
    if (rawTitle.length > 30) { fontSize = 9; letterSpacing = 1.2; }
    else if (rawTitle.length > 20) { fontSize = 10; letterSpacing = 1.5; }
    return { title: rawTitle, fontSize, letterSpacing };
  }, [course]);

  const progressPercent = useMemo(() => {
    if (!syllabus.length) return 0;
    const completedCount = Object.values(progressMap).filter(v => v === true).length;
    return Math.round((completedCount / syllabus.length) * 100);
  }, [progressMap, syllabus]);

  const totalDuration = useMemo(() => {
    return syllabus.reduce((acc, curr) => acc + (parseInt(curr.duration) || 0), 0) + " mins";
  }, [syllabus]);

  useEffect(() => {
    if (courseId) {
      loadAll();
      fetchComments();
    }
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

      let uId = localUser.id;
      if (!uId) {
        const { data: dbUser } = await supabase.from('users').select('id').eq('email', localUser.email).single();
        if (dbUser) {
          uId = dbUser.id;
          AsyncStorage.setItem('user', JSON.stringify({ ...localUser, id: uId }));
        }
      }
      setUserId(uId);

      // PARALLEL REQUESTS
      const [courseRes, syllabusRes, enrollRes, progressRes] = await Promise.all([
        // 1. Course Details
        supabase.from('courses').select('title, instructor, description, total_duration, lectures, topics, image').eq('id', courseId).single(),
        // 2. Syllabus
        supabase.from('course_syllabus').select('*').eq('course_id', courseId).order('order_index'),
        // 3. Enrollment (only if user known)
        uId ? supabase.from('user_course_enrollments').select('*').eq('user_id', uId).eq('course_id', courseId).maybeSingle() : Promise.resolve({ data: null }),
        // 4. Progress (only if user known)
        uId ? supabase.from('user_syllabus_progress').select('syllabus_id, completed').eq('user_id', uId).eq('course_id', courseId) : Promise.resolve({ data: [] })
      ]);

      setCourse(courseRes.data);

      const syllabusData = syllabusRes.data || [];
      setSyllabus(syllabusData);

      if (syllabusData.length) {
        // Only set if not already set (re-renders shouldn't reset active video ideally, but for initial load it's fine)
        if (!activeVideo) {
          setActiveVideo(syllabusData[0].video_url);
          setActiveSyllabusId(syllabusData[0].id);
        }
      }

      setIsEnrolled(!!enrollRes.data);

      const progressRows = progressRes.data || [];
      const map: Record<string, boolean> = {};
      progressRows.forEach((p: any) => (map[p.syllabus_id] = p.completed));
      setProgressMap(map);

    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from('course_comments')
        .select(`
          id, content, created_at,
          users (id, full_name, email)
        `)
        .eq('course_id', courseId)
        .order('created_at', { ascending: false });

      if (error) console.warn("Comments error:", error);
      else setComments(data || []);
    } catch (e) {
      console.log(e);
    }
  };

  const handlePostComment = async () => {
    if (!newComment.trim()) return;
    if (!userId) {
      Alert.alert("Please login", "You need to be logged in to comment.");
      return;
    }
    triggerHaptic('selection');
    setPosting(true);
    try {
      const { error } = await supabase.from('course_comments').insert({
        course_id: courseId,
        user_id: userId,
        content: newComment.trim(),
      });

      if (error) throw error;

      setNewComment('');
      triggerHaptic('success');
      fetchComments(); // Refresh list
    } catch (err: any) {
      triggerHaptic('error');
      console.error("Post comment error:", err);
      Alert.alert("Error", err.message || "Failed to post comment.");
    } finally {
      setPosting(false);
    }
  };

  /* ---------------- ACTION LOGIC ---------------- */
  const handleEnroll = async () => {
    triggerHaptic('medium');
    if (!userId || !courseId) return;
    setEnrolling(true);
    try {
      const { error } = await supabase.from('user_course_enrollments').insert({
        user_id: userId,
        course_id: courseId,
        enrolled: true,
      });

      if (error) throw error;

      setIsEnrolled(true);
      triggerHaptic('success');
      Alert.alert("Success", "Welcome to the course!");
    } catch (err: any) {
      triggerHaptic('error');
      Alert.alert("Enrollment Failed", err.message);
    } finally {
      setEnrolling(false);
    }
  };

  const markCompleted = async (sId: string) => {
    if (!userId) return;
    triggerHaptic('light');

    // 1. Optimistic Update Local State
    const wasAlreadyCompleted = progressMap[sId];
    if (wasAlreadyCompleted) return; // Should not happen if button is hidden, but safety check

    const newMap = { ...progressMap, [sId]: true };
    setProgressMap(newMap);

    // 2. Calculate New Progress
    const totalItems = syllabus.length;
    const completedCount = Object.values(newMap).filter(v => v === true).length;
    // accurate percentage
    const newPercent = totalItems > 0 ? Math.round((completedCount / totalItems) * 100) : 0;
    const isCompleted = newPercent === 100;

    try {
      // 3. Update Syllabus Progress
      const item = syllabus.find(s => s.id === sId);
      const { error: syllabusError } = await supabase.from('user_syllabus_progress').upsert({
        user_id: userId,
        course_id: courseId,
        syllabus_id: sId,
        completed: true,
        completed_at: new Date(),
        progress_percent: 100,
        watched_seconds: item?.total_duration_sec || 0,
      });

      if (syllabusError) throw syllabusError;

      // 4. Update Course Enrollment Progress (Realtime sync for Home Page)
      const { error: enrollmentError } = await supabase
        .from('user_course_enrollments')
        .update({
          progress_percent: newPercent,
          completed: isCompleted,
          // Update enrolled_at or last_accessed if you want to sort by recent
        })
        .eq('user_id', userId)
        .eq('course_id', courseId);

      if (enrollmentError) throw enrollmentError;

      if (isCompleted) {
        triggerHaptic('success');
        Alert.alert("Course Completed!", "Congratulations! You have finished this course.");
      }

    } catch (err: any) {
      console.error("Progress Update Failed:", err);
      triggerHaptic('warning');
      Alert.alert("Error", "Failed to save progress.");
      // Revert local state if needed, but keeping it simple for now
    }
  };

  if (loading || !course) {
    return (
      <View style={styles.loader}><ActivityIndicator size="large" color="#D4AF37" /></View>
    );
  }

  if (isScreenBlocked && !showSecurityWarning) {
    return (
      <View style={styles.blockedContainer}>
        <MaterialCommunityIcons name="shield-lock" size={60} color="#D4AF37" />
        <Text style={styles.blockedText}>SECURE ENVIRONMENT ACTIVE</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 1. TOP BAR */}
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

      {/* 2. VIDEO PLAYER AREA */}
      <View style={styles.videoSection}>
        {isEnrolled ? (
          activeVideo ? (
            <WebView
              ref={webViewRef}
              source={{ uri: activeVideo }}
              style={{ flex: 1, backgroundColor: '#000' }}
              allowsFullscreenVideo
              javaScriptEnabled={true}
              domStorageEnabled={true}
              allowsInlineMediaPlayback={true}
              mediaPlaybackRequiresUserAction={false}
              startInLoadingState={true}
              renderLoading={() => (
                <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
                  <ActivityIndicator size="large" color="#D4AF37" />
                </View>
              )}
              androidHardwareAccelerationDisabled={false}
            />
          ) : (
            <View style={styles.videoLockOverlay}><Text style={styles.lockText}>VIDEO UNAVAILABLE</Text></View>
          )
        ) : (
          <View style={styles.videoLockOverlay}>
            <MaterialCommunityIcons name="lock-outline" size={40} color="#D4AF37" />
            <Text style={styles.lockText}>ENROLL TO UNLOCK MODULE</Text>
            <TouchableOpacity
              style={styles.enrollBtn}
              onPress={handleEnroll}
              disabled={enrolling}
            >
              {enrolling ? <ActivityIndicator size="small" color="#FFF" /> : (
                <>
                  <MaterialCommunityIcons name="flash" size={16} color="#FFF" />
                  <Text style={styles.enrollBtnText}>ENROLL NOW</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
        <TouchableOpacity style={styles.videoBackButton} onPress={() => { triggerHaptic('light'); router.back(); }}>
          <MaterialCommunityIcons name="chevron-left" size={28} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* 3. HEADER INFO */}
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

      {/* 4. TABS & PROGRESS */}
      <View style={styles.tabArea}>
        <View style={styles.tabBar}>
          {(['Overview', 'Syllabus', 'Discussion', 'Reviews'] as TabType[]).map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => { triggerHaptic('selection'); setActiveTab(tab); }}
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
                style={[
                  styles.lessonItem,
                  activeSyllabusId === item.id && styles.lessonActive,
                  !isEnrolled && !item.preview && { opacity: 0.6 }
                ]}
                onPress={() => {
                  triggerHaptic('selection');
                  if (isEnrolled || item.preview) {
                    setActiveSyllabusId(item.id);
                    setActiveVideo(item.video_url);
                  } else {
                    triggerHaptic('warning');
                    Alert.alert("Locked", "Please enroll to view this module.");
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
                  {isEnrolled ? (
                    progressMap[item.id] ? (
                      <MaterialCommunityIcons name="check-circle" size={24} color="#10B981" />
                    ) : (
                      <TouchableOpacity style={styles.doneBtn} onPress={() => markCompleted(item.id)}>
                        <Text style={styles.doneBtnText}>DONE</Text>
                      </TouchableOpacity>
                    )
                  ) : item.preview ? (
                    <Text style={styles.previewTag}>PREVIEW</Text>
                  ) : (
                    <MaterialCommunityIcons name="lock-outline" size={18} color="#CBD5E1" />
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {activeTab === 'Discussion' && (
          <View style={styles.contentPadding}>
            <Text style={styles.sectionTitle}>Discussion ({comments.length})</Text>

            {/* COMMENT INPUT */}
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.commentInputBox}>
              <TextInput
                style={styles.commentInput}
                placeholder="Ask a question or share thoughts..."
                placeholderTextColor="#94A3B8"
                value={newComment}
                onChangeText={setNewComment}
                multiline
              />
              <TouchableOpacity
                style={[styles.postBtn, !newComment.trim() && { opacity: 0.5 }]}
                disabled={!newComment.trim() || posting}
                onPress={handlePostComment}
              >
                {posting ? <ActivityIndicator size="small" color="#FFF" /> : <MaterialCommunityIcons name="send" size={20} color="#FFF" />}
              </TouchableOpacity>
            </KeyboardAvoidingView>

            {/* COMMENTS LIST */}
            <View style={{ marginTop: 20 }}>
              {comments.map((c) => (
                <View key={c.id} style={styles.commentItem}>
                  <Image
                    source={{ uri: `https://ui-avatars.com/api/?name=${c.users?.full_name || 'User'}&background=F1F5F9&color=64748B` }}
                    style={styles.commentAvatar}
                  />
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={styles.commentUser}>{c.users?.full_name || 'Student'}</Text>
                      <Text style={styles.commentDate}>{new Date(c.created_at).toLocaleDateString()}</Text>
                    </View>
                    <Text style={styles.commentText}>{c.content}</Text>
                  </View>
                </View>
              ))}
              {comments.length === 0 && (
                <Text style={styles.emptyComments}>No comments yet. Be the first to start a conversation!</Text>
              )}
            </View>
          </View>
        )}

        {activeTab === 'Reviews' && (
          <View style={styles.contentPadding}>
            <Text style={styles.bodyText}>Verified feedback from the legal community. (Coming Soon)</Text>
          </View>
        )}
      </ScrollView>

      {/* SECURITY WARNING OVERLAY */}
      {showSecurityWarning && (
        <View style={styles.securityOverlay}>
          <View style={styles.securityBox}>
            <MaterialCommunityIcons name="alert-decagram" size={50} color="#EF4444" />
            <Text style={styles.securityTitle}>Security Alert</Text>
            <Text style={styles.securityText}>
              {securityViolation === 'SCREENSHOT_ATTEMPT'
                ? "Screenshots are protected content."
                : "App backgrounding is restricted during playback."}
            </Text>
            <Text style={styles.securitySubText}>
              This incident has been logged. ({suspiciousCount})
            </Text>
            <TouchableOpacity
              style={styles.resumeBtn}
              onPress={() => { triggerHaptic('medium'); setShowSecurityWarning(false); }}
            >
              <Text style={styles.resumeBtnText}>I UNDERSTAND, RESUME</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  blockedContainer: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center', zIndex: 999 },
  blockedText: { color: '#D4AF37', marginTop: 16, fontWeight: '900', letterSpacing: 1.2 },

  securityOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  securityBox: { width: '80%', backgroundColor: '#1E293B', padding: 24, borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: '#EF4444' },
  securityTitle: { fontSize: 20, fontWeight: '900', color: '#FFF', marginVertical: 12 },
  securityText: { color: '#CBD5E1', textAlign: 'center', marginBottom: 8, fontSize: 14 },
  securitySubText: { color: '#64748B', fontSize: 12, marginBottom: 20 },
  resumeBtn: { backgroundColor: '#EF4444', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 8, width: '100%', alignItems: 'center' },
  resumeBtnText: { color: '#FFF', fontWeight: '900', fontSize: 13 },

  premiumTopBar: { backgroundColor: '#D4AF37', paddingTop: Platform.OS === 'ios' ? 55 : 18, paddingBottom: 15, elevation: 4 },
  headerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  premiumTitle: { fontWeight: '900', color: '#FFF', textAlign: 'center' },

  videoSection: { height: 230, backgroundColor: '#000', position: 'relative' },
  videoLockOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0F172A', padding: 20 },
  lockText: { color: '#D4AF37', fontSize: 12, fontWeight: '800', marginTop: 10, marginBottom: 15, letterSpacing: 1.2 },

  enrollBtn: { backgroundColor: '#D4AF37', flexDirection: 'row', paddingVertical: 10, paddingHorizontal: 25, borderRadius: 25, alignItems: 'center' },
  enrollBtnText: { color: '#FFF', fontWeight: '900', fontSize: 12, marginLeft: 8, letterSpacing: 1 },

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

  actionArea: { width: 85, alignItems: 'flex-end' },
  previewTag: { fontSize: 10, fontWeight: '900', color: '#D4AF37', backgroundColor: '#FFFDF0', padding: 4, borderRadius: 4 },
  doneBtn: { backgroundColor: '#1E293B', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8 },
  doneBtnText: { color: '#FFF', fontSize: 11, fontWeight: '900', letterSpacing: 0.5 },

  commentInputBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8F9FA', borderRadius: 12, padding: 8, borderWidth: 1, borderColor: '#EFF6FF' },
  commentInput: { flex: 1, paddingHorizontal: 12, paddingVertical: 8, fontSize: 14, color: '#334155', maxHeight: 80 },
  postBtn: { backgroundColor: '#D4AF37', width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginLeft: 8 },
  commentItem: { flexDirection: 'row', marginBottom: 20, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', paddingBottom: 16 },
  commentAvatar: { width: 40, height: 40, borderRadius: 20, marginRight: 12 },
  commentUser: { fontSize: 13, fontWeight: '700', color: '#1E293B' },
  commentDate: { fontSize: 11, color: '#94A3B8' },
  commentText: { fontSize: 14, color: '#475569', marginTop: 4, lineHeight: 20 },
  emptyComments: { textAlign: 'center', color: '#94A3B8', marginTop: 20, fontStyle: 'italic' },
}); 