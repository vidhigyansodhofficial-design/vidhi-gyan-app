import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  StatusBar,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';

import FooterNav from '@/components/FooterNav';
import HomeHeader from '@/components/HomeHeader';
// Removed SafeScreen import as it creates the white top bar gap
import { Palette } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { Course } from '@/lib/type';

const SearchIcon = ({ color = Palette.textSecondary, size = 20 }) => (
  <Svg fill={color} viewBox="0 0 16 16" height={size} width={size}>
    <Path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001q.044.06.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1 1 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0" />
  </Svg>
);

const TopicChip = ({
  title,
  isActive,
  onPress,
}: {
  title: string;
  isActive: boolean;
  onPress: () => void;
}) => (
  <TouchableOpacity
    style={[styles.topicChip, isActive && styles.topicChipActive]}
    onPress={onPress}>
    <Text style={[styles.topicChipText, isActive && styles.topicChipTextActive]}>{title}</Text>
  </TouchableOpacity>
);

export default function SearchScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  // Note: Since HomeHeader uses the user's name, ensure loadInitialData logic matches HomeScreen
  const [userName, setUserName] = useState('Shubham'); 

  const popularTopics = [
    'IPC',
    'Constitutional Law',
    'Criminal Procedure',
    'Contract Law',
  ];

  useEffect(() => {
    const fetchCoursesAndUser = async () => {
      setLoading(true);
      try {
        // Fetch User logic (similar to HomeScreen)
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const { data: userData } = await supabase
            .from('users')
            .select('full_name')
            .eq('email', session.user.email)
            .single();
          setUserName(userData?.full_name || session.user.email.split('@')[0]);
        }

        // Fetch Courses
        const { data, error } = await supabase.from('courses').select('*');
        if (error) throw error;
        if (data) {
          setAllCourses(data);
          setFilteredCourses(data);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCoursesAndUser();
  }, []);

  useEffect(() => {
    let results = allCourses;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      results = results.filter(
        (course) =>
          course.title.toLowerCase().includes(query) ||
          course.instructor.toLowerCase().includes(query)
      );
    }

    if (selectedTopic) {
      const topicLower = selectedTopic.toLowerCase();
      results = results.filter(
        (course) => course.category?.toLowerCase().includes(topicLower)
      );
    }

    setFilteredCourses(results);
  }, [searchQuery, selectedTopic, allCourses]);

  const handleCoursePress = (courseId: string) => {
    router.push(`/screens/course/${courseId}`);
  };

  const renderCourseItem = ({ item }: { item: Course }) => (
    <TouchableOpacity style={styles.courseItem} onPress={() => handleCoursePress(item.id)}>
      <Image source={{ uri: item.image }} style={styles.courseImage} />
      <View style={styles.courseContent}>
        <Text style={styles.courseTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.courseInstructor}>by {item.instructor}</Text>
        <View style={styles.courseMeta}>
          <Text style={styles.courseRating}>
            ⭐ {item.rating} ({item.reviews} reviews)
          </Text>
          <Text style={styles.coursePrice}>{item.price > 0 ? `₹${item.price}` : 'Free'}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.mainContainer}>
      <Stack.Screen options={{ headerShown: false }} />
      {/* Translucent status bar to allow gradient to show underneath */}
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      
      {/* HomeHeader now starts at the absolute top */}
      <HomeHeader userName={userName} />

      <View style={styles.body}>
        <View style={styles.searchBarContainer}>
          <View style={styles.searchInputWrapper}>
            <SearchIcon color={Palette.textSecondary} size={18} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search for law topics or acts"
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor={Palette.textSecondary}
            />
          </View>
        </View>

        <View style={styles.topicsSection}>
          <Text style={styles.sectionTitle}>Popular Topics</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.topicsList}>
            {popularTopics.map((topic) => (
              <TopicChip
                key={topic}
                title={topic}
                isActive={selectedTopic === topic}
                onPress={() => setSelectedTopic(selectedTopic === topic ? null : topic)}
              />
            ))}
          </ScrollView>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Palette.yellow} />
          </View>
        ) : (
          <FlatList
            data={filteredCourses}
            renderItem={renderCourseItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.courseList}
            ListEmptyComponent={() => (
              <View style={styles.noResults}>
                <Text style={styles.noResultsText}>No courses found.</Text>
              </View>
            )}
          />
        )}
      </View>

      <FooterNav />
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  body: {
    flex: 1,
  },
  searchBarContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 8,
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.white,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Palette.divider,
    // Add subtle shadow like Home cards
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Palette.textPrimary,
    marginLeft: 8,
  },
  topicsSection: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Palette.textPrimary,
    marginBottom: 12,
  },
  topicsList: {
    paddingRight: 16,
    gap: 8,
  },
  topicChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Palette.white,
    borderWidth: 1,
    borderColor: Palette.divider,
  },
  topicChipActive: {
    backgroundColor: Palette.yellow,
    borderColor: Palette.yellow,
  },
  topicChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: Palette.textSecondary,
  },
  topicChipTextActive: {
    color: Palette.textPrimary,
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  courseList: {
    paddingHorizontal: 16,
    paddingBottom: 100, // Space for footer
    paddingTop: 8,
  },
  courseItem: {
    flexDirection: 'row', // Horizontal list style for search results
    backgroundColor: Palette.white,
    borderRadius: 12,
    marginBottom: 16,
    padding: 10,
    elevation: 2,
  },
  courseImage: {
    width: 100,
    height: 80,
    borderRadius: 8,
  },
  courseContent: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  courseTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Palette.textPrimary,
  },
  courseInstructor: {
    fontSize: 12,
    color: Palette.textSecondary,
    marginTop: 2,
  },
  courseMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  courseRating: {
    fontSize: 11,
    color: Palette.textPrimary,
  },
  coursePrice: {
    fontSize: 13,
    fontWeight: 'bold',
    color: Palette.yellow,
  },
  noResults: {
    marginTop: 50,
    alignItems: 'center',
  },
  noResultsText: {
    color: Palette.textSecondary,
  },
});