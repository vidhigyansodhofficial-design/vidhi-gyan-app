
// Mock implementation to prevent crashes in Expo Go or when the module is missing
const MockNotifications = {
    setNotificationHandler: () => { },
    scheduleNotificationAsync: async () => { },
    addNotificationReceivedListener: () => ({ remove: () => { } }),
    addNotificationResponseReceivedListener: () => ({ remove: () => { } }),
    requestPermissionsAsync: async () => ({ status: 'denied' }),
    getPermissionsAsync: async () => ({ status: 'denied' }),
    getExpoPushTokenAsync: async () => ({ data: null }),
    AndroidImportance: { MAX: 5 },
    setNotificationChannelAsync: async () => { },
};

let Notifications: any = MockNotifications;

try {
    // Attempt to load the real module
    // In Expo Go SDK 53+, this might throw an error immediately on Android
    const ExpoNotifications = require('expo-notifications');
    if (ExpoNotifications) {
        Notifications = ExpoNotifications;
    }
} catch (error) {
    console.log('expo-notifications module not available or caused an error:', error);
    // Fallback to mock is already set
}

export default Notifications;
