// app/components/Header.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface HeaderProps {
  title?: string;
  subtitle?: string;
}

export default function Header({ 
  title = 'Vidhi Gyan Sodh', 
  subtitle = 'Continue learning' 
}: HeaderProps) {
  return (
    <LinearGradient
      colors={['#1D2B4E', '#4E1D3A']}
      style={styles.header}
    >
      <View style={styles.container}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  header: {
    padding: 16,
    marginBottom: 10,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  container: { gap: 4 },
  title: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  subtitle: { fontSize: 12, color: '#fff', opacity: 0.9 },
});