import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  StatusBar,
  Alert,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';
import Svg, { Path, Circle, Line } from 'react-native-svg';

// Components
import HomeHeader from '@/components/HomeHeader';
import FooterNav from '@/components/FooterNav';

/* ================= ICONS ================= */
const EditIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#B8860B" strokeWidth="2">
    <Path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <Path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </Svg>
);

const LangIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2">
    <Circle cx="12" cy="12" r="10" />
    <Line x1="2" y1="12" x2="22" y2="12" />
    <Path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </Svg>
);

const ThemeIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2">
    <Path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </Svg>
);

const LogoutIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#FF4D4D" strokeWidth="2">
    <Path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <Line x1="16" y1="17" x2="21" y2="12" />
    <Line x1="16" y1="7" x2="21" y2="12" />
    <Line x1="21" y1="12" x2="9" y2="12" />
  </Svg>
);

/* ================= SCREEN ================= */
export default function AccountScreen() {
  const router = useRouter();
  const [user, setUser] = useState({
    name: 'User',
    email: '',
    courses: 0,
    completed: 0,
    learningTime: '0h',
  });

  useEffect(() => {
    loadAccountData();
  }, []);

  const loadAccountData = async () => {
    const storedUser = await AsyncStorage.getItem('user');
    if (!storedUser) {
      router.replace('/screens/auth/login');
      return;
    }

    const localUser = JSON.parse(storedUser);

    const { data: dbUser } = await supabase
      .from('users')
      .select('id, full_name, email')
      .eq('email', localUser.email)
      .single();

    if (!dbUser) return;

    const { data: enrollments } = await supabase
      .from('user_course_enrollments')
      .select('completed')
      .eq('user_id', dbUser.id)
      .eq('enrolled', true);

    const total = enrollments?.length || 0;
    const completed = enrollments?.filter(e => e.completed).length || 0;

    setUser({
      name: dbUser.full_name || 'User',
      email: dbUser.email,
      courses: total,
      completed,
      learningTime: `${total * 4}h`,
    });
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await AsyncStorage.clear();
          router.replace('/screens/auth/login');
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      {/* STATUS BAR FIX */}
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      <Stack.Screen options={{ headerShown: false }} />

      {/* HEADER */}
      <View style={styles.headerWrapper}>
        <HomeHeader />
      </View>

      {/* CONTENT */}
      <View style={styles.mainContent}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 140 }}
        >
          {/* PROFILE */}
          <View style={styles.profileSection}>
            <Image
              source={{
                uri: `https://ui-avatars.com/api/?name=${user.name}&background=D4AF37&color=fff`,
              }}
              style={styles.avatar}
            />
            <View style={{ marginLeft: 16 }}>
              <Text style={styles.userName}>{user.name}</Text>
              <Text style={styles.userEmail}>{user.email}</Text>
            </View>
          </View>

          {/* STATS */}
          <View style={styles.statsGrid}>
            <Stat label="Courses" value={user.courses} />
            <Stat label="Completed" value={user.completed} />
            <Stat label="XP" value={user.learningTime} highlight />
          </View>

          {/* SETTINGS */}
          <Text style={styles.groupTitle}>Account</Text>
          <Card>
            <Menu icon={<EditIcon />} title="Edit Profile" />
            <Menu icon={<LangIcon />} title="Language" />
            <Menu icon={<ThemeIcon />} title="Theme" />
          </Card>

          <Text style={styles.groupTitle}>Support</Text>
          <Card>
            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
              <LogoutIcon />
              <Text style={styles.logoutText}>Sign Out</Text>
            </TouchableOpacity>
          </Card>

          <Text style={styles.version}>Vidhi Gyan Sodh v1.0.4</Text>
        </ScrollView>
      </View>

      {/* FOOTER FIXED */}
      <View style={styles.footerWrapper}>
        <FooterNav />
      </View>
    </View>
  );
}

/* ================= SMALL COMPONENTS ================= */
const Stat = ({ label, value, highlight = false }: any) => (
  <View style={styles.statBox}>
    <Text style={[styles.statValue, highlight && { color: '#B8860B' }]}>
      {value}
    </Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const Card = ({ children }: any) => (
  <View style={styles.card}>{children}</View>
);

const Menu = ({ icon, title }: any) => (
  <View style={styles.menuItem}>
    <View style={styles.menuLeft}>
      <View style={styles.iconWrap}>{icon}</View>
      <Text style={styles.menuTitle}>{title}</Text>
    </View>
    <Text style={styles.menuArrow}>›</Text>
  </View>
);

/* ================= STYLES ================= */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA', paddingBottom: 70 },

  headerWrapper: { height: 180 },

  mainContent: {
    flex: 1,
    marginTop: -30,
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
    backgroundColor: '#F8F9FA',
  },

  profileSection: { flexDirection: 'row', padding: 24 },
  avatar: { width: 85, height: 85, borderRadius: 42.5, borderWidth: 3, borderColor: '#FFF' },
  userName: { fontSize: 22, fontWeight: '800' },
  userEmail: { fontSize: 14, color: '#666' },

  statsGrid: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    marginHorizontal: 20,
    borderRadius: 25,
    paddingVertical: 22,
    elevation: 4,
  },
  statBox: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: '800' },
  statLabel: { fontSize: 12, color: '#999', marginTop: 4 },

  groupTitle: {
    marginTop: 35,
    marginLeft: 28,
    fontSize: 13,
    fontWeight: '800',
    color: '#BBB',
    letterSpacing: 1.2,
  },

  card: {
    backgroundColor: '#FFF',
    marginHorizontal: 20,
    marginTop: 10,
    borderRadius: 25,
    paddingHorizontal: 18,
  },

  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  menuLeft: { flexDirection: 'row', alignItems: 'center' },
  iconWrap: {
    width: 40,
    height: 40,
    backgroundColor: '#FBFBFB',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  menuTitle: { fontSize: 16, fontWeight: '700' },
  menuArrow: { fontSize: 24, color: '#EEE' },

  logoutBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 20 },
  logoutText: { marginLeft: 14, fontSize: 17, fontWeight: '800', color: '#FF4D4D' },

  footerWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 70,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#EEE',
  },

  version: {
    textAlign: 'center',
    color: '#DDD',
    fontSize: 12,
    marginVertical: 40,
  },
});
