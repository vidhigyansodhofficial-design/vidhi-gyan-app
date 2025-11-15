// app/screens/search.tsx

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import Svg, { Path } from 'react-native-svg';

import Header from '@/components/Header';
import CourseCard from '@/components/CourseCard';
import FooterNav from '@/components/FooterNav';
import SafeScreen from '@/components/SafeScreen'; // ✅ Import SafeScreen
import { courses, Course } from '@/lib/data';

// 🔹 Search Icon
const SearchIcon = ({ color = '#666', size = 20 }) => (
  <Svg width={size} height={size} viewBox="0 0 16 16" fill={color}>
    <Path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001q.044.06.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1 1 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0" />
  </Svg>
);

// 🔹 Topic Chip
const TopicChip = ({ title, isActive, onPress }: { title: string; isActive: boolean; onPress: () => void }) => (
  <TouchableOpacity
    style={[styles.topicChip, isActive && styles.topicChipActive]}
    onPress={onPress}
  >
    <Text style={[styles.topicChipText, isActive && styles.topicChipTextActive]}>
      {title}
    </Text>
  </TouchableOpacity>
);

export default function SearchScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  const popularTopics = [
    'IPC',
    'Constitutional Law',
    'Criminal Law',
    'Contract Law',
    'Family Law',
    'Environmental Law',
  ];

  useEffect(() => {
    const timer = setTimeout(() => {
      let results = courses;

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        results = results.filter(
          (course) =>
            course.title.toLowerCase().includes(query) ||
            course.instructor.toLowerCase().includes(query) ||
            course.syllabus.some((item) =>
              item.title.toLowerCase().includes(query)
            )
        );
      }

      if (selectedTopic) {
        const topicLower = selectedTopic.toLowerCase();
        results = results.filter(
          (course) =>
            course.title.toLowerCase().includes(topicLower) ||
            course.instructor.toLowerCase().includes(topicLower)
        );
      }

      setFilteredCourses(results);
      setLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, selectedTopic]);

  const handleCoursePress = (courseId: string) => {
    router.push(`/screens/course/${courseId}`);
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      {/* ✅ Use SafeScreen as root */}
      <SafeScreen>
        <Header title="Search Courses" subtitle="Find the perfect course" />

        <View style={styles.searchBarContainer}>
          <View style={styles.searchInputWrapper}>
            <SearchIcon color="#666" size={18} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search for law topics, acts, or instructor"
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#999"
            />
          </View>
          <TouchableOpacity style={styles.filterButton}>
            <Text style={styles.filterButtonText}>☰</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.topicsSection}>
          <Text style={styles.sectionTitle}>Popular Topics</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.topicsList}
          >
            {popularTopics.map((topic) => (
              <TopicChip
                key={topic}
                title={topic}
                isActive={selectedTopic === topic}
                onPress={() =>
                  setSelectedTopic(selectedTopic === topic ? null : topic)
                }
              />
            ))}
          </ScrollView>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#1D2B4E" />
              <Text style={styles.loadingText}>Searching...</Text>
            </View>
          ) : filteredCourses.length > 0 ? (
            <>
              <Text style={styles.resultsCount}>
                {filteredCourses.length} result
                {filteredCourses.length !== 1 ? 's' : ''} found
              </Text>
              <View style={styles.courseGrid}>
                {filteredCourses.map((course) => (
                  <CourseCard
                    key={course.id}
                    course={course}
                    onPress={() => handleCoursePress(course.id)}
                  />
                ))}
              </View>
            </>
          ) : (
            <View style={styles.noResults}>
              <Text style={styles.noResultsText}>No courses found.</Text>
              <Text style={styles.noResultsSubtext}>
                Try a different keyword or topic.
              </Text>
            </View>
          )}
        </ScrollView>

        <FooterNav />
      </SafeScreen>
    </>
  );
}

// ✅ Remove `container` from styles — SafeScreen handles background & padding
const styles = StyleSheet.create({
  searchBarContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
    gap: 8,
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#DDD',
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#EEE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterButtonText: {
    fontSize: 18,
    color: '#333',
  },
  topicsSection: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  topicsList: {
    gap: 8,
  },
  topicChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#EEE',
    borderWidth: 1,
    borderColor: '#DDD',
  },
  topicChipActive: {
    backgroundColor: '#1D2B4E',
    borderColor: '#1D2B4E',
  },
  topicChipText: {
    fontSize: 14,
    color: '#333',
  },
  topicChipTextActive: {
    color: '#FFF',
  },
  content: {
    paddingHorizontal: 15,
    paddingTop: 0,
    paddingBottom: 70,
  },
  resultsCount: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  courseGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
    paddingHorizontal: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  noResults: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  noResultsText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 8,
  },
  noResultsSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});