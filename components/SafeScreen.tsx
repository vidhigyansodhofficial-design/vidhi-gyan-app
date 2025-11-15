// app/components/SafeScreen.tsx

import React from 'react';
import { SafeAreaView, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface SafeScreenProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export default function SafeScreen({ children, style }: SafeScreenProps) {
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView
      style={[
        {
          flex: 1,
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
          backgroundColor: '#F5F5F5', // match your app background
        },
        style,
      ]}
    >
      {children}
    </SafeAreaView>
  );
}