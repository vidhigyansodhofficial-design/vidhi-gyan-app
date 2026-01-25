import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Platform,
  Image,
  StatusBar, // Added StatusBar
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { IconSymbol } from './ui/icon-symbol';

export default function HomeHeader() {
  const [userName, setUserName] = useState<string>('User');

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      let data;
      if (Platform.OS === 'web') {
        data = localStorage.getItem('user');
      } else {
        data = await AsyncStorage.getItem('user');
      }
      if (data) {
        const user = JSON.parse(data);
        if (user?.fullName) setUserName(user.fullName);
      }
    } catch (error) {
      console.log('Error loading user:', error);
    }
  };

  return (
    <LinearGradient
      colors={['#8B7201', '#EBC002']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.headerGradient}
    >
      <SafeAreaView>
        <View style={styles.headerContainer}>
          
          {/* LEFT SECTION */}
          <View style={styles.leftSection}>
            <View style={styles.logoCircle}>
              <Image
                source={require('../assets/images/pngtree-law.png')}
                style={styles.logo}
              />
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.brandTitle} numberOfLines={1}>Vidhi Gyan Sodh</Text>
              <Text style={styles.subtitle} numberOfLines={1}>Welcome, {userName}</Text>
            </View>
          </View>

          {/* RIGHT SECTION - Added minWidth and justifyContent */}
          <View style={styles.rightSection}>
            <TouchableOpacity style={styles.iconButton}>
              <IconSymbol name="heart" size={20} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton}>
              <IconSymbol name="cart" size={20} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton}>
              <IconSymbol name="bell" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  headerGradient: {
    // Standardized padding for Android to prevent top-bar overlap
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 10 : 0,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 4, // Added slight shadow for Android
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 15,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 2, // Take more space
  },
  logoCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#F7D74B',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  logo: {
    width: 24,
    height: 24,
    tintColor: '#4A3B00',
  },
  textContainer: {
    justifyContent: 'center',
    flexShrink: 1,
  },
  brandTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.9,
    fontWeight: '500',
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    flex: 1.2, // Defined space for icons
  },
  iconButton: {
    marginLeft: 12, // Reduced margin to ensure all 3 fit
    padding: 4,     // Better touch target
  },
});