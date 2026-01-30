// app/components/Header.tsx
import { Palette } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';

interface HeaderProps {
  title?: string;
  subtitle?: string;
}

export default function Header({
  title = 'Vidhi Gyan Shodh',
  subtitle = 'Continue learning'
}: HeaderProps) {
  return (
    <LinearGradient
      colors={[Palette.textPrimary, Palette.yellow]}
      start={{ x: 0, y: 0.5 }}
      end={{ x: 1, y: 0.5 }}
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
  title: { fontSize: 18, fontWeight: 'bold', color: Palette.white },
  subtitle: { fontSize: 12, color: Palette.white, opacity: 0.9 },
});