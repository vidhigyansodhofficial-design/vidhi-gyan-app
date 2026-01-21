import { Palette } from "@/constants/theme";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import Svg, { Path, SvgProps } from "react-native-svg";

// --- NEW Google SVG Icon Component ---
const GoogleIcon = (props: SvgProps) => (
  <Svg viewBox="0 0 16 16" {...props}>
    <Path d="M15.545 6.558a9.4 9.4 0 0 1 .139 1.626c0 2.434-.87 4.492-2.384 5.885h.002C11.978 15.292 10.158 16 8 16A8 8 0 1 1 8 0a7.7 7.7 0 0 1 5.352 2.082l-2.284 2.284A4.35 4.35 0 0 0 8 3.166c-2.087 0-3.86 1.408-4.492 3.304a4.8 4.8 0 0 0 0 3.063h.003c.635 1.893 2.405 3.301 4.492 3.301 1.078 0 2.004-.276 2.722-.764h-.003a3.7 3.7 0 0 0 1.599-2.431H8v-3.08z" />
  </Svg>
);
// --- END Google SVG Icon Component ---

export default function AuthScreen() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showOtpScreen, setShowOtpScreen] = useState(false);

  // --- REMOVED Google OAuth hooks and useEffect ---

  const handleSubmit = () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter both email and password");
      return;
    }
    const randomOtp = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(randomOtp);
    setOtp(randomOtp); // Pre-fill for demo
    console.log("Generated OTP (for demo):", randomOtp);
    setShowOtpScreen(true);
  };

  const handleVerifyOtp = async () => {
    if (otp !== generatedOtp) {
      Alert.alert("Invalid OTP", "The OTP you entered is incorrect");
      return;
    }
    setIsLoading(true);
    try {
      const userData = { email, name: "User" };
      await AsyncStorage.setItem("user", JSON.stringify(userData));
      router.push("/screens/home");
    } catch (err) {
      Alert.alert("Error", "Failed to save session or navigate.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // ===== OTP SCREEN =====
  if (showOtpScreen) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={[Palette.textPrimary, Palette.yellow]} style={styles.gradient}>
          <View style={styles.header}>
            <Image
              source={require("../../assets/images/pngtree-law.png")}
              style={styles.logo}
            />
            <Text style={styles.appName}>Vidhi Gyan Sodh</Text>
            <Text style={styles.tagline}>Enter OTP</Text>
          </View>

          <View style={styles.formContainer}>
            <View style={styles.otpMessageContainer}>
              <Text style={styles.otpMessageText}>
                We have sent a 6-digit verification code to your email address:
              </Text>
              <Text style={styles.otpEmailText}>{email}</Text>
            </View>

            <Text style={styles.label}>6-digit OTP</Text>
            <TextInput
              style={styles.input}
              placeholder="123456"
              value={otp}
              onChangeText={setOtp}
              keyboardType="numeric"
              maxLength={6}
            />

            <TouchableOpacity
              style={styles.authButton}
              onPress={handleVerifyOtp}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.authButtonText}>Verify OTP</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.back()}>
              <Text style={styles.forgotText}>← Back to Login</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  // ===== LOGIN SCREEN =====
  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={[Palette.textPrimary, Palette.yellow]} style={styles.gradient}>
        <View style={styles.header}>
          <Image
            source={require("../../assets/images/pngtree-law.png")}
            style={styles.logo}
          />
          <Text style={styles.appName}>Vidhi Gyan Sodh</Text>
          <Text style={styles.tagline}>Master Indian Law</Text>
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.formTitle}>Welcome Back</Text>

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="your.email@example.com"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity>
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.authButton}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            <Text style={styles.authButtonText}>Sign In</Text>
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.line} />
            <Text style={styles.orText}>Or continue with</Text>
            <View style={styles.line} />
          </View>

          {/* --- MODIFIED Google Button --- */}
          <TouchableOpacity
            style={styles.googleButton}
            // Removed onPress and disabled props
          >
            {/* Replaced AntDesign with GoogleIcon */}
            <GoogleIcon width={18} height={18} fill="#000" />
            <Text style={styles.googleText}>Sign in with Google</Text>
          </TouchableOpacity>
          {/* --- END MODIFICATION --- */}

          <Text style={styles.footerText}>
            Don’t have an account?{" "}
            <Text style={styles.signupText}>Sign Up</Text>
          </Text>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  gradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
  },
  header: { alignItems: "center", marginBottom: 40 },
  logo: { width: 70, height: 70, tintColor: Palette.yellow, marginBottom: 10 },
  appName: { fontSize: 24, fontWeight: "bold", color: Palette.white, marginBottom: 5 },
  tagline: { fontSize: 16, color: Palette.white },
  formContainer: {
    width: "100%",
    backgroundColor: Palette.white,
    borderRadius: 20,
    padding: 25,
    elevation: 5,
  },
  formTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: Palette.textPrimary,
    textAlign: "center",
    marginBottom: 20,
  },
  otpMessageContainer: {
    alignItems: 'center',
    marginBottom: 25,
  },
  otpMessageText: {
    fontSize: 16,
    color: Palette.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  otpEmailText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Palette.textPrimary,
    marginTop: 5,
  },
  label: { fontSize: 14, color: Palette.textSecondary, marginBottom: 5 },
  input: {
    borderWidth: 1,
    borderColor: Palette.divider,
    borderRadius: 10,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
    backgroundColor: Palette.white,
  },
  authButton: {
    backgroundColor: Palette.yellow,
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
    marginVertical: 10,
  },
  authButtonText: { color: Palette.textPrimary, fontSize: 18, fontWeight: "600" },
  forgotText: { color: Palette.yellow, textAlign: "right", marginBottom: 10 },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 15,
  },
  line: { flex: 1, height: 1, backgroundColor: Palette.divider },
  orText: { marginHorizontal: 8, color: Palette.textSecondary },
  googleButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Palette.divider,
    paddingVertical: 12,
    borderRadius: 10,
    marginBottom: 10,
  },
  googleText: {
    fontSize: 16,
    color: Palette.textPrimary,
    marginLeft: 10,
    fontWeight: "500",
  },
  footerText: {
    textAlign: "center",
    color: Palette.textSecondary,
    fontSize: 14,
    marginTop: 10,
  },
  signupText: { fontWeight: "bold", color: Palette.yellow },
});