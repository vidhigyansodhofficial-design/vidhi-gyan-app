// app/screens/search.tsx

import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';

import CourseCard from '@/components/CourseCard';
import FooterNav from '@/components/FooterNav';
import Header from '@/components/Header';
import SafeScreen from '@/components/SafeScreen';
import { Palette } from '@/constants/theme';
import { Course, courses } from '@/lib/data';

// 🔹 Search Icon
const SearchIcon = ({ color = Palette.textSecondary, size = 20 }) => (
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
            <SearchIcon color={Palette.textSecondary} size={18} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search for law topics, acts, or instructor"
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor={Palette.textSecondary}
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
              <ActivityIndicator size="large" color={Palette.yellow} />
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
    backgroundColor: Palette.white,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Palette.divider,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Palette.textPrimary,
    marginLeft: 8,
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: Palette.divider,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterButtonText: {
    fontSize: 18,
    color: Palette.textPrimary,
  },
  topicsSection: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Palette.textPrimary,
    marginBottom: 12,
  },
  topicsList: {
    gap: 8,
  },
  topicChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: Palette.divider,
    borderWidth: 1,
    borderColor: Palette.divider,
  },
  topicChipActive: {
    backgroundColor: Palette.yellow,
    borderColor: Palette.yellow,
  },
  topicChipText: {
    fontSize: 14,
    color: Palette.textPrimary,
  },
  topicChipTextActive: {
    color: Palette.textPrimary,
  },
  content: {
    paddingHorizontal: 15,
    paddingTop: 0,
    paddingBottom: 70,
  },
  resultsCount: {
    fontSize: 14,
    color: Palette.textSecondary,
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
    color: Palette.textSecondary,
  },
  noResults: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  noResultsText: {
    fontSize: 18,
    color: Palette.textSecondary,
    marginBottom: 8,
  },
  noResultsSubtext: {
    fontSize: 14,
    color: Palette.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});