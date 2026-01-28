// app/_layout.tsx
import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import * as NavigationBar from 'expo-navigation-bar';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import 'react-native-reanimated';

// RootLayout component
export default function RootLayout() {
  useEffect(() => {
    if (Platform.OS === 'android') {
      NavigationBar.setVisibilityAsync("hidden");
      NavigationBar.setBehaviorAsync("overlay-swipe");
    }
  }, []);

  return (
    <ThemeProvider value={DefaultTheme}>
      <Stack>
        {/* Now 'index' = onboarding screen */}
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="screens/home" options={{ headerShown: false }} />
        <Stack.Screen name="screens/login" options={{ headerShown: false }} />
        <Stack.Screen name="screens/course/[id]" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style="light" />
    </ThemeProvider>
  );
}