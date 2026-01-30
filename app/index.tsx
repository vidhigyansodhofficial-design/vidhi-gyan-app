import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Image,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function OnboardingScreen() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);

  // ================= SESSION CHECK =================
  useEffect(() => {
    const checkUserSession = async () => {
      try {
        const user = await AsyncStorage.getItem("user");
        if (user) {
          // If user exists, skip onboarding and login, go straight to home
          router.replace("/screens/home");
        }
      } catch (e) {
        console.error("Failed to fetch session", e);
      }
    };
    checkUserSession();
  }, []);

  const slides = [
    {
      title: "Learn Law Smarter",
      description:
        "Access comprehensive law courses designed specifically for Indian law students with premium materials.",
      icon: require('../assets/images/pngtree-law.png'),
    },
    {
      title: "Expert Guidance",
      description:
        "Learn from experienced legal professionals and top law faculty with years of teaching experience.",
      icon: require('../assets/images/book-icon.png'),
    },
    {
      title: "Anytime, Anywhere",
      description:
        "Study at your own pace with high-quality video lectures available 24/7 on your mobile device.",
      icon: require('../assets/images/video-icon.png'),
    },
  ];

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      router.push('/screens/login');
    }
  };

  const handleSkip = () => {
    router.push('/screens/login');
  };

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="light-content" hidden={false} translucent={true} backgroundColor="transparent" />
      <LinearGradient
        colors={['#0F172A', '#1E293B', '#000000']}
        style={styles.gradient}
      >
        <SafeAreaView style={styles.safeArea}>

          {/* Top Skip Button */}
          <TouchableOpacity onPress={handleSkip} style={styles.skipWrapper}>
            <Text style={styles.skipText}>SKIP</Text>
          </TouchableOpacity>

          {/* Visual Section */}
          <View style={styles.centerSection}>
            <View style={styles.iconBackdrop}>
              <Image
                source={slides[currentIndex].icon}
                style={styles.icon}
                resizeMode="contain"
              />
            </View>

            {/* Typography */}
            <Text style={styles.brandSubtitle}>VIDHI GYAN SHODH</Text>
            <Text style={styles.title}>{slides[currentIndex].title}</Text>
            <Text style={styles.description}>
              {slides[currentIndex].description}
            </Text>
          </View>

          {/* Bottom Navigation Section */}
          <View style={styles.footer}>
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

            {/* Action Button */}
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.nextButton}
              onPress={handleNext}
            >
              <Text style={styles.buttonText}>
                {currentIndex === slides.length - 1 ? 'GET STARTED' : 'CONTINUE'}
              </Text>
            </TouchableOpacity>
          </View>

        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: 35,
  },
  skipWrapper: {
    alignSelf: 'flex-end',
    marginTop: 20,
    padding: 10,
  },
  skipText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 2,
  },
  centerSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconBackdrop: {
    width: 160,
    height: 160,
    backgroundColor: 'rgba(212, 175, 55, 0.05)',
    borderRadius: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.1)',
  },
  icon: {
    width: 90,
    height: 90,
    tintColor: '#D4AF37', // Premium Gold
  },
  brandSubtitle: {
    fontSize: 12,
    color: '#D4AF37',
    letterSpacing: 4,
    fontWeight: '700',
    marginBottom: 15,
  },
  title: {
    fontSize: 32,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: Platform.OS === 'ios' ? 'Times New Roman' : 'serif',
    lineHeight: 40,
  },
  description: {
    fontSize: 16,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 26,
    paddingHorizontal: 10,
  },
  footer: {
    paddingBottom: 40,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 35,
  },
  dot: {
    height: 4,
    borderRadius: 2,
    marginHorizontal: 4,
  },
  activeDot: {
    width: 24,
    backgroundColor: '#D4AF37',
  },
  inactiveDot: {
    width: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  nextButton: {
    backgroundColor: '#D4AF37',
    paddingVertical: 20,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
  },
  buttonText: {
    color: '#000',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
});