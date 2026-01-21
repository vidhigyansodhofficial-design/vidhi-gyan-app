import { Palette } from '@/constants/theme';
import { Course, courses } from '@/lib/data';
import { useNavigation } from '@react-navigation/native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { VideoView, useVideoPlayer } from 'expo-video';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import RazorpayCheckout from 'react-native-razorpay';
import Svg, { Path } from 'react-native-svg';


// 🔹 Bootstrap Icon Component
const BootstrapIcon = ({ name, color = '#666', size = 16 }: { name: string; color?: string; size?: number }) => {
  const icons: Record<string, string> = {
    star: 'M8 1.5a.5.5 0 0 1 .5.5v12a.5.5 0 0 1-1 0V2a.5.5 0 0 1 .5-.5zM13 1.5a.5.5 0 0 1 .5.5v12a.5.5 0 0 1-1 0V2a.5.5 0 0 1 .5-.5z',
    user: 'M8 8a3 3 0 1 1 0-6 3 3 0 0 1 0 6zm0 1a4 4 0 0 1-4 4h8a4 4 0 0 1-4-4z',
    clock: 'M8 1a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h2z',
    book: 'M1 2.828c.885-.37 2.154-.769 3.388-.893 1.33-.134 2.458.063 3.112.752v9.746c-.935-.53-2.12-.603-3.213-.493-1.18.12-2.37.461-3.287.811zm7.5-.141c.654-.689 1.782-.886 3.112-.752 1.234.124 2.503.523 3.388.893v9.923c-.918-.35-2.107-.692-3.287-.81-1.094-.111-2.278-.039-3.213.492zM8 1.783C7.015.936 5.587.81 4.287.94c-1.514.153-3.042.672-3.994 1.105A.5.5 0 0 0 0 2.5v11a.5.5 0 0 0 .707.455c.882-.4 2.303-.881 3.68-1.02 1.409-.142 2.59.087 3.223.877a.5.5 0 0 0 .78 0c.633-.79 1.814-1.019 3.222-.877 1.378.139 2.8.62 3.681 1.02A.5.5 0 0 0 16 13.5v-11a.5.5 0 0 0-.293-.455c-.952-.433-2.48-.952-3.994-1.105C10.413.809 8.985.936 8 1.783',
    pin: 'M8 1.5a.5.5 0 0 1 .5.5v12a.5.5 0 0 1-1 0V2a.5.5 0 0 1 .5-.5z',
    lock: 'M8 1a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h2zm0 1a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1H8z',
  };
  const d = icons[name];
  if (!d) return null;
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill={color}>
      <Path d={d} />
    </Svg>
  );
};

export default function CourseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const navigation = useNavigation();
  const [course, setCourse] = useState<Course | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'syllabus' | 'reviews'>('overview');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (id) {
      const found = courses.find((c) => c.id === id);
      if (found) {
        setCourse({ ...found }); // clone to avoid mutation
      } else {
        Alert.alert('Not Found', 'Course not found');
        router.back();
      }
    }
  }, [id]);

  const player = useVideoPlayer(course?.videoUrl || '', (p) => {
    p.loop = false;
    p.muted = false;
  });

  if (!course) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.error}>Loading course details...</Text>
      </SafeAreaView>
    );
  }

  // ✅ Handle Buy Now / Enroll
  const handleEnrollPress = async () => {
    if (course.enrolled) {
      router.push(`/player/${course.id}`); // navigate to video player
      return;
    }

    // Free course
    if (!course.price) {
      Alert.alert('Enrolled!', 'You now have access to this free course.');
      // In production: call API to record enrollment
      return;
    }

    // Web doesn't support Razorpay
    if (Platform.OS === 'web') {
      Alert.alert(
        'Payment Not Available',
        'Payments are only supported on the mobile app. Please install the Android/iOS app to purchase.'
      );
      return;
    }

    setIsProcessing(true);
    try {
      const options = {
        description: `Payment for ${course.title}`,
        image: course.image,
        currency: 'INR',
        key: 'rzp_live_RIHcyNXNenA4BG', // 🔑 YOUR LIVE KEY
        amount: course.price * 100, // Amount in paise
        name: 'Vidhi Gyan Sodh',
        prefill: {
          email: 'user@example.com',
          contact: '9999999999',
          name: 'Learner Name',
        },
        theme: { color: '#E74C3C' }, // Red theme for buy button
      };

      const razorpayResponse = await RazorpayCheckout.open(options);

      if (razorpayResponse) {
        // ✅ Payment successful
        Alert.alert(
          'Success!',
          `You've successfully enrolled in "${course.title}".`,
          [
            {
              text: 'OK',
              onPress: () => {
                // 🔄 In real app: update backend + local state
                // For demo, just show success
              },
            },
          ]
        );
      }
    } catch (error: any) {
      // 💥 Payment failed or cancelled
      const errMsg =
        error?.description ||
        error?.error?.description ||
        error?.message ||
        'Payment failed or was cancelled.';
      Alert.alert('Payment Failed', errMsg);
    } finally {
      setIsProcessing(false);
    }
  };

  // ✅ Button text based on state
  const getButtonText = () => {
    if (course.enrolled) return 'Continue Learning';
    if (course.price) return `Buy Now • ₹${course.price}`;
    return 'Enroll for Free';
  };
  const handleGoBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      router.push('/screens/home'); // or '/screens/search' if in search
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <>
            <Text style={styles.description}>
              Master the Indian Penal Code with this comprehensive course designed for law students and legal professionals.
              This course covers all major sections of the IPC with real case studies, practical examples, and examination strategies.
            </Text>

            <Text style={styles.sectionTitle}>What You’ll Learn</Text>
            <View style={styles.learningPoints}>
              {course.syllabus.slice(0, 4).map((point, index) => (
                <View key={index} style={styles.learningPoint}>
                  <BootstrapIcon name="pin" color="#E74C3C" size={16} />
                  <Text style={styles.pointText}>{point.title}</Text>
                </View>
              ))}
            </View>
          </>
        );
      case 'syllabus':
        return (
          <View style={styles.syllabusList}>
            {course.syllabus.map((item, index) => (
              <View key={index} style={styles.syllabusItem}>
                <Text style={styles.syllabusTitle}>{item.title}</Text>
                <Text style={styles.syllabusDuration}>{item.duration}</Text>
                {item.isLocked && <BootstrapIcon name="lock" color="#999" size={16} />}
              </View>
            ))}
          </View>
        );
      case 'reviews':
        return (
          <View>
            <Text style={styles.reviewsText}>Reviews will appear here soon.</Text>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Course Details</Text>
        </View>

        <ScrollView contentContainerStyle={styles.contentContainer}>
          {/* Video Preview */}
          <View style={styles.videoWrapper}>
            <VideoView
              style={styles.video}
              player={player}
              allowsFullscreen
              allowsPictureInPicture
              allowsPlaybackSpeedMenu
              contentFit="contain"
            />
          </View>

          <View style={{ paddingHorizontal: 20 }}>
            <Text style={styles.title}>{course.title}</Text>

            {/* Stats */}
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <BootstrapIcon name="star" color="#FFD700" size={14} />
                <Text style={[styles.rating, { color: '#FFD700' }]}>
                  {course.rating} ({course.reviews})
                </Text>
              </View>
              <View style={styles.statItem}>
                <BootstrapIcon name="user" color="#666" size={14} />
                <Text style={styles.studentCount}>15,420 students</Text>
              </View>
              <View style={styles.statItem}>
                <BootstrapIcon name="clock" color="#666" size={14} />
                <Text style={styles.duration}>{course.totalDuration}</Text>
              </View>
            </View>

            <View style={styles.lecturesRow}>
              <BootstrapIcon name="book" color={Palette.textSecondary} size={14} />
              <Text style={styles.lectures}>{course.lectures} lectures</Text>
            </View>

            <Text style={styles.instructor}>Instructor: {course.instructor}</Text>

            {/* Tabs */}
            <View style={styles.tabs}>
              {(['overview', 'syllabus', 'reviews'] as const).map((tab) => (
                <TouchableOpacity
                  key={tab}
                  style={[styles.tab, activeTab === tab && styles.activeTab]}
                  onPress={() => setActiveTab(tab)}
                >
                  <Text style={styles.tabText}>
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {renderContent()}

            {/* ✅ BUY NOW BUTTON — TRIGGERS RAZORPAY */}
            <TouchableOpacity
              style={[
                styles.continueButton,
                !course.enrolled && course.price && { backgroundColor: '#E74C3C' },
              ]}
              onPress={handleEnrollPress}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.continueText}>{getButtonText()}</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Palette.white },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: Palette.white,
    borderBottomWidth: 1,
    borderBottomColor: Palette.divider,
  },
  backButton: { marginRight: 12 },
  backArrow: { fontSize: 20, color: Palette.textPrimary },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: Palette.textPrimary },
  contentContainer: { paddingBottom: 100 },
  videoWrapper: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
    marginBottom: 16,
  },
  video: { flex: 1 },
  title: { fontSize: 22, fontWeight: 'bold', color: Palette.textPrimary, marginBottom: 8 },
  description: { fontSize: 14, color: Palette.textSecondary, lineHeight: 20, marginBottom: 16 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  rating: { fontSize: 14, marginLeft: 4 },
  studentCount: { fontSize: 14, color: Palette.textSecondary, marginLeft: 4 },
  duration: { fontSize: 14, color: Palette.textSecondary, marginLeft: 4 },
  lecturesRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 16 },
  lectures: { fontSize: 14, color: Palette.textSecondary },
  instructor: { fontSize: 16, color: Palette.textPrimary, marginBottom: 16 },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: Palette.divider,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: Palette.divider,
  },
  activeTab: { borderBottomWidth: 2, borderBottomColor: Palette.yellow },
  tabText: { fontSize: 14, fontWeight: '500', color: Palette.textPrimary },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: Palette.textPrimary, marginBottom: 12 },
  learningPoints: { marginBottom: 20 },
  learningPoint: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  pointText: { fontSize: 14, color: Palette.textSecondary, flex: 1, marginLeft: 8 },
  syllabusList: { marginBottom: 20 },
  syllabusItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Palette.divider,
  },
  syllabusTitle: { fontSize: 14, color: Palette.textPrimary, flex: 1 },
  syllabusDuration: { fontSize: 14, color: Palette.textSecondary, marginLeft: 10 },
  reviewsText: { fontSize: 16, color: Palette.textSecondary, textAlign: 'center', marginTop: 20 },
  continueButton: {
    backgroundColor: Palette.yellow,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 10,
  },
  continueText: { color: Palette.textPrimary, fontSize: 16, fontWeight: '600' },
  error: { fontSize: 18, color: '#FF0000', textAlign: 'center', marginTop: 20 },
});