// app/index.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  SafeAreaView,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

export default function OnboardingScreen() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);

  const slides = [
    {
      title: "Learn Law Smarter",
      description:
        "Access comprehensive law courses from basics to advanced topics, designed specifically for Indian law students.",
      icon: require('../assets/images/pngtree-law.png'),
    },
    {
      title: "From Experts",
      description:
        "Learn from experienced legal professionals and top law faculty with years of teaching experience.",
      icon: require('../assets/images/book-icon.png'),
    },
    {
      title: "Anytime, Anywhere",
      description:
        "Study at your own pace with high-quality video lectures and study materials available 24/7.",
      icon: require('../assets/images/video-icon.png'),
    },
  ];

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // Last slide → go to login
      router.push('/screens/login');
    }
  };

  const handleSkip = () => {
    router.push('/screens/login');
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#0A192F', '#501E26']} style={styles.gradient}>
        {/* Icon */}
        <View style={styles.iconContainer}>
          <Image
            source={slides[currentIndex].icon}
            style={styles.icon}
            resizeMode="contain"
          />
        </View>

        {/* Title */}
        <Text style={styles.title}>{slides[currentIndex].title}</Text>

        {/* Description */}
        <Text style={styles.description}>
          {slides[currentIndex].description}
        </Text>

        {/* Pagination Dots */}
        <View style={styles.dotsContainer}>
          {slides.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                index === currentIndex ? styles.activeDot : styles.inactiveDot,
              ]}
            />
          ))}
        </View>

        {/* Button */}
        <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
          <Text style={styles.buttonText}>
            {currentIndex === slides.length - 1 ? 'Get Started' : 'Next'}
          </Text>
        </TouchableOpacity>

        {/* Skip Link */}
        <TouchableOpacity onPress={handleSkip}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  iconContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 60,
    padding: 25,
    marginBottom: 40,
  },
  icon: {
    width: 70,
    height: 70,
    tintColor: '#FFD700',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 34,
  },
  description: {
    fontSize: 16,
    color: '#E0E0E0',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 40,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginHorizontal: 6,
  },
  activeDot: {
    backgroundColor: '#FFD700',
  },
  inactiveDot: {
    backgroundColor: '#FFFFFF',
  },
  nextButton: {
    width: '100%',
    backgroundColor: '#FFD700',
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonText: {
    color: '#000',
    fontSize: 18,
    fontWeight: '600',
  },
  skipText: {
    color: '#FFFFFF',
    fontSize: 16,
    textDecorationLine: 'underline',
  },
});