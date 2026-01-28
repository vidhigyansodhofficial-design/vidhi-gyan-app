import { supabase } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';

// Components
import FooterNav from '@/components/FooterNav';
import HomeHeader from '@/components/HomeHeader';

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
import { Ionicons } from '@expo/vector-icons';

export default function AccountScreen() {
  const router = useRouter();
  const [user, setUser] = useState({
    id: '',
    name: 'User',
    email: '',
    courses: 0,
    completed: 0,
    learningTime: '0h',
  });
  const [loading, setLoading] = useState(false);

  // Modals & Sheets
  const [activeModal, setActiveModal] = useState<'profile' | 'language' | 'theme' | 'terms' | 'privacy' | null>(null);

  // Edit Profile State
  const [editName, setEditName] = useState('');

  // Settings State
  const [language, setLanguage] = useState('English');
  const [theme, setTheme] = useState('Light');

  useEffect(() => {
    loadAccountData();
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const l = await AsyncStorage.getItem('appLanguage');
    const t = await AsyncStorage.getItem('appTheme');
    if (l) setLanguage(l);
    if (t) setTheme(t);
  };

  const loadAccountData = async () => {
    try {
      const storedUser = await AsyncStorage.getItem('user');
      if (!storedUser) {
        router.replace('/screens/auth/login');
        return;
      }

      const localUser = JSON.parse(storedUser);
      let userId = localUser.id;

      // 1. Resolve User ID
      if (!userId) {
        const { data: dbUser } = await supabase.from('users').select('id').eq('email', localUser.email).single();
        if (dbUser) {
          userId = dbUser.id;
          AsyncStorage.setItem('user', JSON.stringify({ ...localUser, id: userId }));
        }
      }
      if (!userId) return;

      // 2. Parallel Fetch
      const [userRes, enrollRes] = await Promise.all([
        supabase.from('users').select('id, full_name, email').eq('id', userId).single(),
        supabase.from('user_course_enrollments').select('completed').eq('user_id', userId).eq('enrolled', true)
      ]);

      const dbUser = userRes.data;
      if (!dbUser) return;

      const enrollments = enrollRes.data || [];
      const total = enrollments.length;
      const completed = enrollments.filter((e: any) => e.completed).length;

      setUser({
        id: dbUser.id,
        name: dbUser.full_name || 'User',
        email: dbUser.email,
        courses: total,
        completed,
        learningTime: `${total * 4}h`,
      });
      setEditName(dbUser.full_name || '');
    } catch (e) {
      console.error("Account Load Error:", e);
    }
  };

  const handleUpdateProfile = async () => {
    if (!editName.trim()) {
      Alert.alert("Error", "Name cannot be empty");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({ full_name: editName })
        .eq('id', user.id);

      if (error) throw error;

      setUser(prev => ({ ...prev, name: editName }));

      // Update local storage too so other screens might pick it up if they read from it
      const storedUser = await AsyncStorage.getItem('user');
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        await AsyncStorage.setItem('user', JSON.stringify({ ...parsed, fullName: editName }));
      }

      setActiveModal(null);
      Alert.alert("Success", "Profile updated successfully");
    } catch (err: any) {
      Alert.alert("Error", err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveLanguage = async (lang: string) => {
    setLanguage(lang);
    await AsyncStorage.setItem('appLanguage', lang);
    setActiveModal(null);
    Alert.alert("Language Changed", `App language set to ${lang}. (Requires restart to fully apply)`);
  };

  const handleSaveTheme = async (thm: string) => {
    setTheme(thm);
    await AsyncStorage.setItem('appTheme', thm);
    setActiveModal(null);
    // In a real app, use a Context to toggle styles
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await AsyncStorage.clear();
          router.replace('/screens/login');
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      <Stack.Screen options={{ headerShown: false }} />

      {/* HEADER */}
      <View style={styles.headerWrapper}>
        <HomeHeader userName={user.name} />
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
            <View style={{ marginLeft: 16, flex: 1 }}>
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
          <Text style={styles.groupTitle}>Settings</Text>
          <View style={styles.card}>
            <Menu
              icon={<EditIcon />}
              title="Edit Profile"
              value={user.name}
              onPress={() => setActiveModal('profile')}
            />
            <Menu
              icon={<LangIcon />}
              title="Language"
              value={language}
              onPress={() => setActiveModal('language')}
            />
            <Menu
              icon={<ThemeIcon />}
              title="Theme"
              value={theme}
              onPress={() => setActiveModal('theme')}
            />
          </View>

          <Text style={styles.groupTitle}>Legal</Text>
          <View style={styles.card}>
            <Menu
              icon={<Ionicons name="document-text-outline" size={20} color="#555" />}
              title="Terms & Conditions"
              onPress={() => setActiveModal('terms')}
            />
            <Menu
              icon={<Ionicons name="shield-checkmark-outline" size={20} color="#555" />}
              title="Privacy Policy"
              onPress={() => setActiveModal('privacy')}
            />
          </View>

          <Text style={styles.groupTitle}>Session</Text>
          <View style={styles.card}>
            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
              <LogoutIcon />
              <Text style={styles.logoutText}>Sign Out</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.version}>Vidhi Gyan Sodh v1.0.5</Text>
        </ScrollView>
      </View>

      {/* FOOTER FIXED */}
      <View style={styles.footerWrapper}>
        <FooterNav />
      </View>

      {/* ================= MODALS ================= */}

      {/* 1. EDIT PROFILE MODAL */}
      {activeModal === 'profile' && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Edit Profile</Text>
            <Text style={styles.inputLabel}>Full Name</Text>
            <TextInput
              style={styles.textInput}
              value={editName}
              onChangeText={setEditName}
              placeholder="Enter your name"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setActiveModal(null)} style={styles.modalBtnCancel}>
                <Text style={styles.modalBtnTextCancel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleUpdateProfile} style={styles.modalBtnSave}>
                {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.modalBtnTextSave}>Save</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* 2. LANGUAGE MODAL */}
      {activeModal === 'language' && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Select Language</Text>
            {['English', 'Hindi', 'Marathi', 'Gujarati', 'Tamil'].map(lang => (
              <TouchableOpacity
                key={lang}
                style={[styles.optionRow, language === lang && styles.optionSelected]}
                onPress={() => handleSaveLanguage(lang)}
              >
                <Text style={[styles.optionText, language === lang && styles.optionTextSelected]}>{lang}</Text>
                {language === lang && <Ionicons name="checkmark" size={20} color="#D4AF37" />}
              </TouchableOpacity>
            ))}
            <TouchableOpacity onPress={() => setActiveModal(null)} style={styles.modalCloseLink}>
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* 3. THEME MODAL */}
      {activeModal === 'theme' && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Select Theme</Text>
            {['Light', 'Dark (Chat)', 'System'].map(t => (
              <TouchableOpacity
                key={t}
                style={[styles.optionRow, theme === t && styles.optionSelected]}
                onPress={() => handleSaveTheme(t)}
              >
                <Text style={[styles.optionText, theme === t && styles.optionTextSelected]}>{t}</Text>
                {theme === t && <Ionicons name="checkmark" size={20} color="#D4AF37" />}
              </TouchableOpacity>
            ))}
            <TouchableOpacity onPress={() => setActiveModal(null)} style={styles.modalCloseLink}>
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* 4. TERMS / PRIVACY MODAL */}
      {(activeModal === 'terms' || activeModal === 'privacy') && (
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { height: '70%' }]}>
            <Text style={styles.modalTitle}>{activeModal === 'terms' ? 'Terms & Conditions' : 'Privacy Policy'}</Text>
            <ScrollView style={{ marginTop: 10 }}>
              <Text style={styles.legalText}>
                {activeModal === 'terms'
                  ? "Welcome to Vidhi Gyan Sodh. By using our app, you agree to the following terms...\n\n1. Content: All legal courses are for educational purposes.\n2. Usage: You may not redistribute videos.\n\n(This is a placeholder for the full legal text.)"
                  : "We respect your privacy. This policy explains how we handle your data...\n\n1. Data Collection: We collect only what is needed for your learning progress.\n2. Security: Your data is encrypted.\n\n(This is a placeholder for the full privacy policy.)"}
              </Text>
            </ScrollView>
            <TouchableOpacity onPress={() => setActiveModal(null)} style={[styles.modalBtnSave, { marginTop: 20 }]}>
              <Text style={styles.modalBtnTextSave}>I Understand</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

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

const Menu = ({ icon, title, value, onPress }: any) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress}>
    <View style={styles.menuLeft}>
      <View style={styles.iconWrap}>{icon}</View>
      <View>
        <Text style={styles.menuTitle}>{title}</Text>
        {value && <Text style={styles.menuValue}>{value}</Text>}
      </View>
    </View>
    <Text style={styles.menuArrow}>›</Text>
  </TouchableOpacity>
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

  profileSection: { flexDirection: 'row', padding: 24, alignItems: 'center' },
  avatar: { width: 85, height: 85, borderRadius: 42.5, borderWidth: 3, borderColor: '#FFF' },
  userName: { fontSize: 22, fontWeight: '800', color: '#1E293B' },
  userEmail: { fontSize: 14, color: '#94A3B8' },
  editIconBtn: { backgroundColor: '#FFF', padding: 10, borderRadius: 20, elevation: 2 },

  statsGrid: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    marginHorizontal: 20,
    borderRadius: 25,
    paddingVertical: 22,
    elevation: 4,
    marginBottom: 20,
  },
  statBox: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: '800' },
  statLabel: { fontSize: 12, color: '#999', marginTop: 4 },

  groupTitle: {
    marginLeft: 28,
    fontSize: 13,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 1.2,
    marginBottom: 10,
    marginTop: 20,
  },

  card: {
    backgroundColor: '#FFF',
    marginHorizontal: 20,
    borderRadius: 25,
    paddingHorizontal: 18,
  },

  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  menuTitle: { fontSize: 16, fontWeight: '700', color: '#1E293B' },
  menuValue: { fontSize: 12, color: '#D4AF37', marginTop: 2, fontWeight: '600' },
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

  /* MODAL STYLES */
  modalOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center', alignItems: 'center',
    zIndex: 1000,
  },
  modalCard: {
    backgroundColor: '#FFF', width: '85%', borderRadius: 24, padding: 24,
    elevation: 10,
  },
  modalTitle: { fontSize: 20, fontWeight: '800', marginBottom: 20, textAlign: 'center' },
  inputLabel: { fontSize: 12, fontWeight: '700', color: '#64748B', marginBottom: 8 },
  textInput: {
    backgroundColor: '#F1F5F9', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12,
    fontSize: 16, fontWeight: '600', color: '#334155', marginBottom: 24
  },
  modalActions: { flexDirection: 'row', justifyContent: 'space-between' },
  modalBtnCancel: { paddingVertical: 12, paddingHorizontal: 20 },
  modalBtnTextCancel: { color: '#64748B', fontWeight: '700' },
  modalBtnSave: {
    backgroundColor: '#D4AF37', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 12,
    minWidth: 100, alignItems: 'center'
  },
  modalBtnTextSave: { color: '#FFF', fontWeight: '800' },

  optionRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9'
  },
  optionSelected: { backgroundColor: '#FDFBEF', marginHorizontal: -10, paddingHorizontal: 10, borderRadius: 8 },
  optionText: { fontSize: 16, fontWeight: '600', color: '#475569' },
  optionTextSelected: { color: '#D4AF37', fontWeight: '800' },
  modalCloseLink: { alignItems: 'center', marginTop: 20 },
  modalCloseText: { color: '#94A3B8', fontWeight: '700' },

  legalText: { color: '#444', lineHeight: 22, fontSize: 14 },
});
