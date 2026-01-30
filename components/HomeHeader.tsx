import { supabase } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Device from 'expo-device';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState } from 'react';
import {
  Image,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { IconSymbol } from './ui/icon-symbol';

// Import our safe wrapper
import Notifications from '@/lib/notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});



export default function HomeHeader() {
  const [userName, setUserName] = useState<string>('User');
  const [userId, setUserId] = useState<string | null>(null);
  const [expoPushToken, setExpoPushToken] = useState<string>('');
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotificationPanel, setShowNotificationPanel] = useState(false);
  const notificationListener = useRef<any>();
  const responseListener = useRef<any>();

  useEffect(() => {
    loadUser();
    registerForPushNotificationsAsync().then(token => token && setExpoPushToken(token));

    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      setNotifications(prev => [notification, ...prev]);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log(response);
    });

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);

  // Supabase Realtime Subscription
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel('db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_course_enrollments',
          filter: `user_id=eq.${userId}`,
        },
        async (payload) => {
          console.log('Change received!', payload);

          if (payload.eventType === 'INSERT') {
            // User enrolled
            const courseId = payload.new.course_id;
            const courseTitle = await fetchCourseTitle(courseId);
            const title = "Course Enrolled!";
            const body = `You have successfully enrolled in ${courseTitle}`;

            triggerLocalNotification(title, body);
          } else if (payload.eventType === 'UPDATE') {
            // Check if completed status changed to true
            if (payload.new.completed && !payload.old.completed) {
              const courseId = payload.new.course_id;
              const courseTitle = await fetchCourseTitle(courseId);
              const title = "Course Completed!";
              const body = `Congratulations! You have completed ${courseTitle}`;

              triggerLocalNotification(title, body);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const fetchInitialNotifications = async (currentUserId: string) => {
    const { data, error } = await supabase
      .from('user_course_enrollments')
      .select('course_id, enrolled_at, completed, courses(title)')
      .eq('user_id', currentUserId)
      .order('enrolled_at', { ascending: false })
      .limit(10);

    if (error || !data) return;

    // Load cleared notifications
    let clearedIds = new Set();
    try {
      const stored = await AsyncStorage.getItem('cleared_notifications');
      if (stored) {
        clearedIds = new Set(JSON.parse(stored));
      }
    } catch (e) {
      console.log('Failed to load cleared notifications', e);
    }

    const dbNotifications: any[] = data.map((item: any) => {
      const isCompleted = item.completed;
      const title = isCompleted ? "Course Completed" : "Course Enrolled";
      const body = isCompleted
        ? `You have completed ${item.courses?.title}`
        : `In Progress: ${item.courses?.title}`;

      const identifier = item.course_id + (isCompleted ? '_comp' : '_enr');

      return {
        date: new Date(item.enrolled_at).getTime(),
        request: {
          identifier,
          content: {
            title,
            body,
            data: { type: isCompleted ? 'completed' : 'enrolled' },
            sound: 'default'
          },
          trigger: { type: 'push' }
        }
      } as unknown as any;
    }).filter(n => !clearedIds.has(n.request.identifier));

    setNotifications(prev => {
      // Merge without duplicates (simple check by identifier)
      const newIds = new Set(dbNotifications.map(n => n.request.identifier));
      const filteredPrev = prev.filter(n => !newIds.has(n.request.identifier));
      return [...dbNotifications, ...filteredPrev];
    });
  };

  const handleClearAll = async () => {
    const idsToClear = notifications.map(n => n.request.identifier);
    setNotifications([]); // Instant UI update

    try {
      const stored = await AsyncStorage.getItem('cleared_notifications');
      const existing = stored ? JSON.parse(stored) : [];
      const updated = Array.from(new Set([...existing, ...idsToClear]));

      await AsyncStorage.setItem('cleared_notifications', JSON.stringify(updated));
    } catch (e) {
      console.log('Error clearing notifications', e);
    }
  };

  const fetchCourseTitle = async (courseId: string) => {
    const { data, error } = await supabase
      .from('courses')
      .select('title')
      .eq('id', courseId)
      .single();

    if (error || !data) return "Unknown Course";
    return data.title;
  };

  const triggerLocalNotification = async (title: string, body: string, type: 'completed' | 'enrolled') => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: title,
        body: body,
        data: { type },
      },
      trigger: null, // Immediate
    });
  };

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
        if (user?.id) {
          setUserId(user.id);
          fetchInitialNotifications(user.id);
        }
      }
    } catch (error) {
      console.log('Error loading user:', error);
    }
  };

  async function registerForPushNotificationsAsync() {
    let token;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        // alert('Failed to get push token for push notification!');
        return;
      }
      // Learn more about projectId:
      // https://docs.expo.dev/push-notifications/push-notifications-setup/#configure-projectid
      // token = (await Notifications.getExpoPushTokenAsync({ projectId: 'your-project-id' })).data;
      // using default for now, projectId should be added in app.json for production
      try {
        token = (await Notifications.getExpoPushTokenAsync()).data;
        // console.log(token);
      } catch (e) {
        // console.log(e);
      }
    } else {
      // alert('Must use physical device for Push Notifications');
      console.log('Must use physical device for Push Notifications');
    }

    return token;
  }

  const toggleNotificationPanel = () => {
    setShowNotificationPanel(!showNotificationPanel);
  };

  return (
    <View style={{ zIndex: 1000 }}>
      <LinearGradient
        colors={['#8B7201', '#EBC002']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.headerGradient}
      >
        <View>
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
                <Text style={styles.brandTitle} numberOfLines={1}>Vidhi Gyan Shodh</Text>
                <Text style={styles.subtitle} numberOfLines={1}>Welcome, {userName}</Text>
              </View>
            </View>

            {/* RIGHT SECTION */}
            <View style={styles.rightSection}>
              <TouchableOpacity style={styles.iconButton}>
                <IconSymbol name="cart" size={24} color="#FFFFFF" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.iconButton}
                onPress={toggleNotificationPanel}
              >
                <IconSymbol name="bell" size={24} color="#FFFFFF" />
                {notifications.length > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                      {notifications.length > 99 ? '99+' : notifications.length}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

          </View>
        </View>

      </LinearGradient>

      {showNotificationPanel && (
        <View style={styles.dropdownContainer}>
          <View style={styles.dropdownHeader}>
            <Text style={styles.dropdownTitle}>Notifications</Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity onPress={handleClearAll}>
                <Text style={styles.clearAllText}>Clear all</Text>
              </TouchableOpacity>
            </View>
          </View>
          <ScrollView style={styles.dropdownContent}>
            {notifications.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No new notifications</Text>
              </View>
            ) : (
              notifications.map((item, index) => {
                const type = item.request.content.data?.type;
                const isCompleted = type === 'completed';

                return (
                  <View key={item.request.identifier || index} style={styles.notificationItem}>
                    <View style={[styles.notificationIcon, { backgroundColor: isCompleted ? '#E8F5E9' : '#E3F2FD' }]}>
                      <IconSymbol
                        name={isCompleted ? "checkmark.circle.fill" : "book.fill"}
                        size={16}
                        color={isCompleted ? "#2E7D32" : "#1565C0"}
                      />
                    </View>
                    <View style={styles.notificationTextContainer}>
                      <Text style={styles.notificationTitle}>{item.request.content.title}</Text>
                      <Text style={styles.notificationBody} numberOfLines={2}>
                        {item.request.content.body}
                      </Text>
                      <Text style={styles.notificationTime}>
                        {new Date(item.date).toLocaleDateString([], { month: 'short', day: 'numeric' })} • {new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </View>
                  </View>
                );
              })
            )}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  headerGradient: {
    // Restored padding for visible status bar
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 10 : 40,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 4, // Added slight shadow for Android
    zIndex: 1,
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
    marginLeft: 16, // Reduced margin to ensure all 3 fit
    padding: 4,     // Better touch target
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: 'red',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 2,
    borderWidth: 1.5,
    borderColor: '#EBC002',
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  dropdownContainer: {
    position: 'absolute',
    top: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 70 : 80,
    right: 16,
    width: 300,
    maxHeight: 400,
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 10,
    zIndex: 1001,
    overflow: 'hidden',
  },
  dropdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    backgroundColor: '#FAFAFA',
  },
  dropdownTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#333',
  },
  clearAllText: {
    color: '#EBC002', // Using brand color
    fontSize: 12,
    fontWeight: '600',
  },
  dropdownContent: {
    maxHeight: 350,
  },
  emptyState: {
    padding: 24,
    alignItems: 'center',
  },
  emptyStateText: {
    color: '#999',
    fontSize: 14,
  },
  notificationItem: {
    flexDirection: 'row',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  notificationIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFF8E1', // Light yellow
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  notificationTextContainer: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  notificationBody: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
  },
  notificationTime: {
    fontSize: 10,
    color: '#999',
    marginTop: 4,
  }
});