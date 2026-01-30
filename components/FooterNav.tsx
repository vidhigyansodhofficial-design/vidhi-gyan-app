// app/components/FooterNav.tsx
import { Palette } from '@/constants/theme';
import { useHaptics } from '@/hooks/useHaptics';
import { supabase } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { usePathname, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

const BootstrapIcon = ({ name, color, size = 24 }: { name: string; color: string; size?: number }) => {
  const icons: Record<string, string> = {
    home: 'M8.707 1.5a1 1 0 0 0-1.414 0L.646 8.146a.5.5 0 0 0 .708.708L2 8.207V13.5A1.5 1.5 0 0 0 3.5 15h9a1.5 1.5 0 0 0 1.5-1.5V8.207l.646.647a.5.5 0 0 0 .708-.708L13 5.793V2.5a.5.5 0 0 0-.5-.5h-1a.5.5 0 0 0-.5.5v1.293zM13 7.207V13.5a.5.5 0 0 1-.5.5h-9a.5.5 0 0 1-.5-.5V7.207l5-5z',
    search: 'M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001q.044.06.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1 1 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0',
    book: 'M1 2.828c.885-.37 2.154-.769 3.388-.893 1.33-.134 2.458.063 3.112.752v9.746c-.935-.53-2.12-.603-3.213-.493-1.18.12-2.37.461-3.287.811zm7.5-.141c.654-.689 1.782-.886 3.112-.752 1.234.124 2.503.523 3.388.893v9.923c-.918-.35-2.107-.692-3.287-.81-1.094-.111-2.278-.039-3.213.492zM8 1.783C7.015.936 5.587.81 4.287.94c-1.514.153-3.042.672-3.994 1.105A.5.5 0 0 0 0 2.5v11a.5.5 0 0 0 .707.455c.882-.4 2.303-.881 3.68-1.02 1.409-.142 2.59.087 3.223.877a.5.5 0 0 0 .78 0c.633-.79 1.814-1.019 3.222-.877 1.378.139 2.8.62 3.681 1.02A.5.5 0 0 0 16 13.5v-11a.5.5 0 0 0-.293-.455c-.952-.433-2.48-.952-3.994-1.105C10.413.809 8.985.936 8 1.783',
    person: 'M11 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8m8-7a7 7 0 0 0-5.468 11.37C3.242 11.226 4.805 10 8 10s4.757 1.225 5.468 2.37A7 7 0 0 0 8 1',
  };

  const d = icons[name];
  if (!d) return null;

  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill={color}>
      <Path d={d} />
    </Svg>
  );
};

export default function FooterNav() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { triggerHaptic } = useHaptics();
  const [profileImage, setProfileImage] = useState<string | null>(null);

  const primaryColor = Palette.yellow;
  const inactiveColor = Palette.textSecondary;

  useEffect(() => {
    loadUserImage();
  }, [pathname]); // Reload when path changes (e.g. coming back from account screen)

  const loadUserImage = async () => {
    try {
      const storedUser = await AsyncStorage.getItem('user');
      if (storedUser) {
        const user = JSON.parse(storedUser);
        if (user.profileImage) {
          setProfileImage(user.profileImage);
          return;
        }
        // Optional: Fetch from DB if not in local storage but id is there
        if (user.id) {
          const { data } = await supabase.from('users').select('profile_image_url').eq('id', user.id).single();
          if (data?.profile_image_url) {
            setProfileImage(data.profile_image_url);
          }
        }
      }
    } catch (e) { }
  };

  const navItems = [
    { name: 'Home', path: '/screens/home', icon: 'home' },
    { name: 'Search', path: '/screens/search', icon: 'search' },
    { name: 'My Courses', path: '/screens/my-courses', icon: 'book' },
    { name: 'Account', path: '/screens/account', icon: 'person' },
  ];

  // Reduced bottom padding for full screen mode
  const bottomPadding = 12;

  const handlePress = (path: string) => {
    triggerHaptic('selection'); // Haptic for tab switching
    if (pathname !== path) {
      // Use replace to avoid stacking navigation history on tab switches
      router.replace(path as any);
    }
  };

  return (
    <View style={[styles.footer, { paddingBottom: bottomPadding }]}>
      {navItems.map((item, index) => {
        const isActive = pathname === item.path;
        const color = isActive ? primaryColor : inactiveColor;

        return (
          <TouchableOpacity
            key={index}
            style={styles.navItem}
            activeOpacity={0.7}
            onPress={() => handlePress(item.path)}
          >
            {item.name === 'Account' && profileImage ? (
              <Image
                source={{ uri: profileImage }}
                style={[
                  styles.profileImage,
                  { borderColor: isActive ? primaryColor : 'transparent', borderWidth: 2 }
                ]}
              />
            ) : (
              <BootstrapIcon name={item.icon} color={color} size={24} />
            )}
            <Text
              style={[
                styles.label,
                {
                  color,
                  fontWeight: isActive ? '700' : '500',
                },
              ]}
            >
              {item.name}
            </Text>
            {/* Optional: Add a small indicator dot for active tab */}
            {isActive && <View style={styles.activeIndicator} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: Palette.white,
    borderTopWidth: 1,
    borderTopColor: Palette.divider,
    paddingTop: 12,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    // Add shadow for a floating effect
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 20,
  },
  navItem: {
    alignItems: 'center',
    flex: 1,
    height: 45,
  },
  label: {
    fontSize: 11,
    marginTop: 4,
  },
  activeIndicator: {
    marginTop: 4,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Palette.yellow,
  },
  profileImage: {
    width: 24,
    height: 24,
    borderRadius: 12,
  }
});