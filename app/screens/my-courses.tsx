// app/screens/my-courses.tsx

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import Header from '@/components/Header';
import FooterNav from '@/components/FooterNav';
import SafeScreen from '@/components/SafeScreen'; // ✅
import { courses, Course } from '@/lib/data';

// 🔹 Tab
const Tab = ({ title, isActive, onPress }: { title: string; isActive: boolean; onPress: () => void }) => (
  <TouchableOpacity style={[styles.tab, isActive && styles.activeTab]} onPress={onPress}>
    <Text style={[styles.tabText, isActive && styles.activeTabText]}>{title}</Text>
  </TouchableOpacity>
);

// 🔹 Course Card
const CourseCard = ({ course, progress, lastWatched, onContinue }: any) => (
  <View style={styles.courseCard}>
    <View style={styles.courseImageContainer}>
      <Image source={{ uri: course.image }} style={styles.courseImage} />
    </View>
    <View style={styles.courseDetails}>
      <Text style={styles.courseTitle}>{course.title}</Text>
      <Text style={styles.courseInstructor}>{course.instructor}</Text>
      <View style={styles.courseMeta}>
        <Text style={styles.metaText}>🕒 Last watched {lastWatched}</Text>
      </View>
      <View style={styles.progressContainer}>
        <Text style={styles.progressText}>{progress}% complete</Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
      </View>
      <TouchableOpacity style={styles.continueButton} onPress={onContinue}>
        <Text style={styles.continueText}>Continue</Text>
      </TouchableOpacity>
    </View>
  </View>
);

export default function MyCoursesScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'inProgress' | 'completed' | 'wishlist'>('inProgress');
  const [enrolledCourses, setEnrolledCourses] = useState<Course[]>([]);

  const courseProgress = {
    '1': { progress: 65, lastWatched: '2 hours ago' },
    '2': { progress: 42, lastWatched: '1 day ago' },
    '3': { progress: 15, lastWatched: '3 days ago' },
    '4': { progress: 100, lastWatched: '5 days ago' },
    '5': { progress: 80, lastWatched: 'Yesterday' },
    '6': { progress: 0, lastWatched: 'Never' },
  };

  useEffect(() => {
    const enrolled = courses.filter((c) => c.enrolled);
    setEnrolledCourses(enrolled);
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case 'inProgress':
        return enrolledCourses
          .filter((course) => courseProgress[course.id]?.progress < 100)
          .map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              progress={courseProgress[course.id]?.progress || 0}
              lastWatched={courseProgress[course.id]?.lastWatched || 'Never'}
              onContinue={() => router.push(`/screens/course/${course.id}`)}
            />
          ));
      case 'completed':
        return enrolledCourses
          .filter((course) => courseProgress[course.id]?.progress === 100)
          .map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              progress={100}
              lastWatched={courseProgress[course.id]?.lastWatched || 'Never'}
              onContinue={() => router.push(`/screens/course/${course.id}`)}
            />
          ));
      case 'wishlist':
        return (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Your wishlist is empty.</Text>
            <Text style={styles.emptySubtext}>Add courses to your wishlist by clicking the heart icon.</Text>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeScreen> {/* ✅ Wrap everything */}
        <Header title="My Courses" subtitle="Track your progress" />

        <View style={styles.tabsContainer}>
          <Tab title="In Progress" isActive={activeTab === 'inProgress'} onPress={() => setActiveTab('inProgress')} />
          <Tab title="Completed" isActive={activeTab === 'completed'} onPress={() => setActiveTab('completed')} />
          <Tab title="Wishlist" isActive={activeTab === 'wishlist'} onPress={() => setActiveTab('wishlist')} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {renderContent()}
        </ScrollView>

        <FooterNav />
      </SafeScreen>
    </>
  );
}

const styles = StyleSheet.create({
  tabsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#DDD',
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#DDD',
  },
  activeTab: {
    backgroundColor: '#1D2B4E',
    borderColor: '#1D2B4E',
  },
  tabText: { fontSize: 14, color: '#333' },
  activeTabText: { color: '#FFF' },
  content: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 70,
  },
  courseCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  courseImageContainer: { width: 100, height: 80 },
  courseImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  courseDetails: { flex: 1, padding: 12, justifyContent: 'space-between' },
  courseTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 4 },
  courseInstructor: { fontSize: 14, color: '#666', marginBottom: 8 },
  courseMeta: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  metaText: { fontSize: 12, color: '#999' },
  progressContainer: { marginBottom: 8 },
  progressText: { fontSize: 12, color: '#666', marginBottom: 4 },
  progressBar: { height: 6, backgroundColor: '#EEE', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#1D2B4E' },
  continueButton: {
    alignSelf: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#1D2B4E',
  },
  continueText: { fontSize: 12, color: '#FFF' },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: { fontSize: 18, color: '#666', marginBottom: 8 },
  emptySubtext: { fontSize: 14, color: '#999', textAlign: 'center', paddingHorizontal: 20 },
});