import { supabase } from '@/lib/supabase';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { Stack, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

import FooterNav from '@/components/FooterNav';
import HomeHeader from '@/components/HomeHeader';

/* ================= ICONS ================= */
const EditIcon = () => <MaterialCommunityIcons name="account-edit-outline" size={24} color="#64748B" />;
const LangIcon = () => <MaterialCommunityIcons name="translate" size={24} color="#64748B" />;
const ThemeIcon = () => <MaterialCommunityIcons name="theme-light-dark" size={24} color="#64748B" />;
const ShareIcon = () => <MaterialCommunityIcons name="share-variant-outline" size={24} color="#64748B" />;
const SupportIcon = () => <MaterialCommunityIcons name="lifebuoy" size={24} color="#64748B" />;


export default function AccountScreen() {
  const router = useRouter();
  const [user, setUser] = useState({
    id: '',
    name: 'User',
    email: '',
    courses: 0,
    completed: 0,
    learningTime: '0h',
    profileImage: null as string | null,
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
      // 2. Parallel Fetch
      const [userRes, enrollRes] = await Promise.all([
        supabase.from('users').select('id, full_name, email, profile_image_url').eq('id', userId).single(),
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
        profileImage: dbUser.profile_image_url,
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

      // Update local storage
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

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
        base64: true,
      });

      if (!result.canceled && result.assets[0].base64) {
        setLoading(true);
        // We'll treat the base64 string as a "temporary url" for storage in the text column
        // In production, you'd upload file to Supabase Storage and get a public URL
        const imageUri = `data:image/jpeg;base64,${result.assets[0].base64}`;

        const { error } = await supabase
          .from('users')
          .update({ profile_image_url: imageUri })
          .eq('id', user.id);

        if (error) throw error;

        setUser(prev => ({ ...prev, profileImage: imageUri }));

        // Update local storage so FooterNav picks it up
        const storedUser = await AsyncStorage.getItem('user');
        if (storedUser) {
          const parsed = JSON.parse(storedUser);
          await AsyncStorage.setItem('user', JSON.stringify({ ...parsed, profileImage: imageUri }));
        }

        Alert.alert("Success", "Profile photo updated!");
      }
    } catch (e: any) {
      Alert.alert("Error", "Failed to pick image: " + e.message);
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

  const handleShareApp = async () => {
    try {
      const result = await Share.share({
        message: 'Check out Vidhi Gyan Shodh, the best app for legal education! https://vidhigyanShodh.com',
        url: 'https://vidhigyanShodh.com', // iOS only
        title: 'Share Vidhi Gyan Shodh' // Android only
      });

      if (result.action === Share.sharedAction) {
        if (result.activityType) {
          // shared with activity type of result.activityType
        } else {
          // shared
        }
      } else if (result.action === Share.dismissedAction) {
        // dismissed
      }
    } catch (error: any) {
      Alert.alert(error.message);
    }
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

      {/* REUSABLE HEADER */}
      <View style={{ zIndex: 100 }}>
        <HomeHeader />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* PROFILE INFO */}
        <View style={styles.profileSection}>
          <TouchableOpacity onPress={handlePickImage} style={{ position: 'relative' }}>
            <Image
              source={{
                uri: user.profileImage || `https://ui-avatars.com/api/?name=${user.name}&background=1E293B&color=fff&size=128`,
              }}
              style={styles.avatar}
            />
            <View style={styles.editBadge}>
              <MaterialCommunityIcons name="camera" size={14} color="#FFF" />
            </View>
          </TouchableOpacity>
          <View style={{ marginLeft: 16 }}>
            <Text style={styles.userName}>{user.name}</Text>
            <Text style={styles.userEmail}>{user.email}</Text>
            <TouchableOpacity onPress={() => setActiveModal('profile')}>
              <Text style={styles.editLink}>Edit Profile</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* LEARNING STATS */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{user.courses}</Text>
            <Text style={styles.statLabel}>Enrolled</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{user.completed}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{user.learningTime}</Text>
            <Text style={styles.statLabel}>Hours</Text>
          </View>
        </View>

        {/* SETTINGS GROUP */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Account Settings</Text>
        </View>
        <View style={styles.menuGroup}>
          <Menu icon={<EditIcon />} title="Personal Information" onPress={() => setActiveModal('profile')} />
          <Menu icon={<LangIcon />} title="Language Preference" value={language} onPress={() => setActiveModal('language')} />
          <Menu icon={<ThemeIcon />} title="App Theme" value={theme} onPress={() => setActiveModal('theme')} last />
        </View>

        {/* SUPPORT GROUP */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Support & About</Text>
        </View>
        <View style={styles.menuGroup}>
          <Menu icon={<ShareIcon />} title="Share App" onPress={handleShareApp} />
          <Menu icon={<SupportIcon />} title="Terms & Conditions" onPress={() => setActiveModal('terms')} />
          <Menu icon={<MaterialCommunityIcons name="shield-check-outline" size={24} color="#64748B" />} title="Privacy Policy" onPress={() => setActiveModal('privacy')} last />
        </View>

        {/* LOGOUT */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutLabel}>Log Out</Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>v1.0.5 • Vidhi Gyan Shodh</Text>
      </ScrollView>

      <FooterNav />


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
                  ? "Welcome to Vidhi Gyan Shodh. By using our app, you agree to the following terms...\n\n1. Content: All legal courses are for educational purposes.\n2. Usage: You may not redistribute videos.\n\n(This is a placeholder for the full legal text.)"
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
const Menu = ({ icon, title, value, onPress, last }: any) => (
  <TouchableOpacity
    style={[styles.menuRow, last && { borderBottomWidth: 0 }]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <View style={styles.menuLeft}>
      {icon}
      <Text style={styles.menuText}>{title}</Text>
    </View>
    <View style={styles.menuRight}>
      {value && <Text style={styles.menuValueText}>{value}</Text>}
      <MaterialCommunityIcons name="chevron-right" size={20} color="#CBD5E1" />
    </View>
  </TouchableOpacity>
);

/* ================= STYLES ================= */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },

  scrollContent: { paddingBottom: 100, paddingTop: 10 },

  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 20,
    marginTop: 10,
  },
  avatar: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#E2E8F0', borderWidth: 2, borderColor: '#FFF' },
  editBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#D4AF37', width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#FFF' },
  userName: { fontSize: 20, fontWeight: '800', color: '#0F172A', marginBottom: 2 },
  userEmail: { fontSize: 13, color: '#64748B', marginBottom: 6 },
  editLink: { fontSize: 13, fontWeight: '700', color: '#D4AF37' },

  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 12,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statNumber: { fontSize: 18, fontWeight: '900', color: '#1E293B', marginBottom: 2 },
  statLabel: { fontSize: 12, color: '#64748B', fontWeight: '500' },
  statDivider: { width: 1, height: '60%', backgroundColor: '#E2E8F0', alignSelf: 'center' },

  sectionHeader: { paddingHorizontal: 24, marginTop: 28, marginBottom: 8 },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: '#334155', letterSpacing: 0.5 },

  menuGroup: {
    backgroundColor: '#FFF',
    marginHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    overflow: 'hidden',
  },
  menuRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  menuLeft: { flexDirection: 'row', alignItems: 'center' },
  menuText: { marginLeft: 14, fontSize: 15, fontWeight: '600', color: '#1E293B' },
  menuRight: { flexDirection: 'row', alignItems: 'center' },
  menuValueText: { fontSize: 13, color: '#94A3B8', marginRight: 8 },

  logoutButton: {
    marginTop: 30,
    marginHorizontal: 20,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#FEE2E2',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  logoutLabel: { fontSize: 15, fontWeight: '800', color: '#EF4444' },

  versionText: {
    textAlign: 'center',
    color: '#CBD5E1',
    fontSize: 11,
    marginTop: 24,
    marginBottom: 20,
  },

  /* MODAL STYLES (Keep existing functional styles, updated visually) */
  modalOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center', alignItems: 'center',
    zIndex: 1000,
  },
  modalCard: {
    backgroundColor: '#FFF', width: '85%', borderRadius: 20, padding: 24,
    elevation: 20,
  },
  modalTitle: { fontSize: 18, fontWeight: '800', marginBottom: 20, textAlign: 'center', color: '#1E293B' },
  inputLabel: { fontSize: 12, fontWeight: '700', color: '#64748B', marginBottom: 8 },
  textInput: {
    backgroundColor: '#F8FAFC', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 12,
    fontSize: 15, fontWeight: '600', color: '#334155', marginBottom: 24,
    borderWidth: 1, borderColor: '#E2E8F0'
  },
  modalActions: { flexDirection: 'row', justifyContent: 'space-between' },
  modalBtnCancel: { paddingVertical: 12, paddingHorizontal: 20 },
  modalBtnTextCancel: { color: '#64748B', fontWeight: '700' },
  modalBtnSave: {
    backgroundColor: '#D4AF37', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8,
    minWidth: 100, alignItems: 'center'
  },
  modalBtnTextSave: { color: '#FFF', fontWeight: '800' },

  optionRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9'
  },
  optionSelected: { backgroundColor: '#FFFDF5' },
  optionText: { fontSize: 15, fontWeight: '600', color: '#475569' },
  optionTextSelected: { color: '#D4AF37', fontWeight: '800' },
  modalCloseLink: { alignItems: 'center', marginTop: 20 },
  modalCloseText: { color: '#94A3B8', fontWeight: '700' },
  legalText: { color: '#475569', lineHeight: 22, fontSize: 14 },
});
