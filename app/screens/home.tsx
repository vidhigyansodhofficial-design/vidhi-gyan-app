import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import CourseCard from '@/components/CourseCard';
import FooterNav from '@/components/FooterNav';
import { Palette } from '@/constants/theme';
import { Course, courses } from '@/lib/data';

const HeaderIcon = ({ name, color, size = 20 }: { name: 'heart' | 'cart' | 'bell'; color: string; size?: number }) => {
  const iconPaths: Record<'heart' | 'cart' | 'bell', string> = {
    heart: "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z",
    cart: "M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.9 2 1.99 2 2-.9 2-2-.9-2-2-2z",
    bell: "M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z",
  };

  return (
    <Svg height={size} width={size} viewBox="0 0 24 24" fill={color}>
      <Path d={iconPaths[name]} />
    </Svg>
  );
};

export default function HomeScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [continueLearning, setContinueLearning] = useState<Course[]>([]);
  const [recommended, setRecommended] = useState<Course[]>([]);
  const [mostPurchased, setMostPurchased] = useState<Course[]>([]);

  const [localCourses, setLocalCourses] = useState<Course[]>(() => [...courses]);

  useEffect(() => {
    setTimeout(() => {
      const enrolled = localCourses.filter((c) => c.enrolled);
      const notEnrolled = localCourses.filter((c) => !c.enrolled);
      const topPurchased = [...localCourses]
        .sort((a, b) => b.reviews - a.reviews)
        .slice(0, 3);

      setContinueLearning(enrolled);
      setRecommended(notEnrolled.slice(0, 3));
      setMostPurchased(topPurchased);
      setLoading(false);
    }, 800);
  }, [localCourses]);

  // ✅ SIMPLE NAVIGATION: Always go to detail screen
  const handleCoursePress = (courseId: string) => {
    router.push(`/screens/course/${courseId}`);
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={Palette.yellow} />
        <Text style={{ marginTop: 10, color: Palette.textPrimary }}>Loading courses...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <LinearGradient
        colors={[Palette.textPrimary, Palette.yellow]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.logoContainer}>
            <Image source={require('../../assets/images/pngtree-law.png')} style={styles.logo} />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.appName}>Vidhi Gyan Sodh</Text>
            <Text style={styles.tagline}>Continue learning</Text>
          </View>
          <View style={styles.headerIcons}>
            <TouchableOpacity>
              <HeaderIcon name="heart" color={Palette.white} size={22} />
            </TouchableOpacity>
            <TouchableOpacity>
              <HeaderIcon name="cart" color={Palette.white} size={22} />
            </TouchableOpacity>
            <TouchableOpacity>
              <HeaderIcon name="bell" color={Palette.white} size={22} />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      {/* Main Scroll */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Continue Learning</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollContainer}>
          {continueLearning.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              onPress={() => handleCoursePress(course.id)}
            />
          ))}
        </ScrollView>

        <Text style={styles.sectionTitle}>Recommended for You</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollContainer}>
          {recommended.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              onPress={() => handleCoursePress(course.id)}
            />
          ))}
        </ScrollView>

        <Text style={styles.sectionTitle}>Most Purchased Courses</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollContainer}>
          {mostPurchased.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              onPress={() => handleCoursePress(course.id)}
            />
          ))}
        </ScrollView>
      </ScrollView>

      <FooterNav />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Palette.white },
  header: {
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 10,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logoContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Palette.yellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: { width: 28, height: 28, tintColor: Palette.textPrimary },
  headerText: { flex: 1, marginLeft: 12 },
  appName: { fontSize: 18, fontWeight: 'bold', color: Palette.white },
  tagline: { fontSize: 12, color: Palette.white, opacity: 0.9 },
  headerIcons: { flexDirection: 'row', gap: 20 },
  content: { paddingHorizontal: 15, paddingTop: 0, paddingBottom: 70 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Palette.textPrimary,
    marginBottom: 10,
    marginTop: 20,
    paddingLeft: 5,
  },
  scrollContainer: { marginBottom: 20 },
});