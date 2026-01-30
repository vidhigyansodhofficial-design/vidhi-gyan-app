import { supabase } from "@/lib/supabase"; // ✅ IMPORT SUPABASE
import { MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";

export default function AuthScreen() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showOtpScreen, setShowOtpScreen] = useState(false);

  const emailInputRef = useRef<TextInput>(null);
  const otpInputRef = useRef<TextInput>(null);

  /* ================= AUTO FOCUS OTP ================= */
  useEffect(() => {
    if (showOtpScreen) {
      setTimeout(() => otpInputRef.current?.focus(), 400);
    }
  }, [showOtpScreen]);

  /* ================= AUTO VERIFY OTP ================= */
  useEffect(() => {
    if (otp.length === 6 && !isLoading && showOtpScreen) {
      handleVerifyOtp();
    }
  }, [otp]);

  /* ================= SEND OTP ================= */
  const handleSendOtp = async () => {
    if (!email) {
      Alert.alert("Error", "Please enter email");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(
        "https://otp-nu-nine.vercel.app/api/send-otp",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            fullName: fullName || undefined, // ✅ optional
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) throw new Error();

      Alert.alert("OTP Sent", data.message || "Check your email for OTP");
      setShowOtpScreen(true);
    } catch {
      Alert.alert("Error", "Failed to send OTP. Try again.");
    } finally {
      setIsLoading(false);
    }
  };

  /* ================= VERIFY OTP ================= */
  const handleVerifyOtp = async () => {
    if (otp.length !== 6) return;

    setIsLoading(true);

    try {
      const response = await fetch(
        "https://otp-nu-nine.vercel.app/api/verify-otp",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, otp: otp.trim() }),
        }
      );

      if (!response.ok) throw new Error("Invalid OTP");

      // ✅ FETCH USER (NO UPSERT ON CLIENT)
      const { data: user, error } = await supabase
        .from("users")
        .select("id, email, full_name")
        .eq("email", email.toLowerCase())
        .single();

      if (error || !user) throw error;

      await AsyncStorage.setItem(
        "user",
        JSON.stringify({
          id: user.id,
          email: user.email,
          fullName: user.full_name,
        })
      );

      router.replace("/screens/home");
    } catch (err) {
      console.log(err);
      Alert.alert("Error", "Invalid OTP or Server Error");
      setOtp("");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />

      <ImageBackground
        source={require("../../assets/images/law-background.jpg")}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <LinearGradient
          colors={["rgba(255,255,255,0.4)", "rgba(255,255,255,0.7)", "rgba(255,255,255,0.95)"]}
          style={styles.gradientOverlay}
        >
          <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : "height"}
              style={styles.keyboardAvoid}
            >
              <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                <View style={styles.staticContent}>
                  {/* HEADER SECTION */}
                  <View style={styles.headerArea}>
                    <View style={styles.logoCircle}>
                      <Image
                        source={require("../../assets/images/pngtree-law.png")}
                        style={styles.logo}
                        resizeMode="contain"
                      />
                    </View>
                    <Text style={styles.brandName}>VIDHI GYAN SHODH</Text>
                    <Text style={styles.brandTagline}>EXCELLENCE IN LEGAL EDUCATION</Text>
                  </View>

                  {/* FORM SECTION */}
                  <View style={styles.formContainer}>
                    <Text style={styles.welcomeText}>
                      {showOtpScreen ? "Verify Access" : "Welcome Back"}
                    </Text>
                    <Text style={styles.subText}>
                      {showOtpScreen
                        ? `We sent a code to ${email}`
                        : "Sign in to continue your learning journey"}
                    </Text>

                    {!showOtpScreen ? (
                      <View style={styles.form}>
                        {/* Full Name Input */}
                        <View style={styles.inputWrapper}>
                          <MaterialCommunityIcons name="account-outline" size={20} color="#D4AF37" style={styles.inputIcon} />
                          <TextInput
                            style={styles.premiumInput}
                            placeholder="Full Name"
                            placeholderTextColor="#64748B"
                            value={fullName}
                            onChangeText={setFullName}
                            autoCapitalize="words"
                            returnKeyType="next"
                            onSubmitEditing={() => emailInputRef.current?.focus()}
                          />
                        </View>

                        {/* Email Input */}
                        <View style={styles.inputWrapper}>
                          <MaterialCommunityIcons name="email-outline" size={20} color="#D4AF37" style={styles.inputIcon} />
                          <TextInput
                            ref={emailInputRef}
                            style={styles.premiumInput}
                            placeholder="Email Address"
                            placeholderTextColor="#64748B"
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                            returnKeyType="done"
                            onSubmitEditing={handleSendOtp}
                          />
                        </View>

                        <TouchableOpacity
                          activeOpacity={0.8}
                          onPress={handleSendOtp}
                          disabled={isLoading}
                          style={{ marginTop: 10 }}
                        >
                          <LinearGradient
                            colors={isLoading ? ["#4b5563", "#374151"] : ["#D4AF37", "#AA8C2C"]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.gradientButton}
                          >
                            {isLoading ? (
                              <ActivityIndicator color="#FFF" />
                            ) : (
                              <Text style={styles.buttonText}>Get Login Code</Text>
                            )}
                          </LinearGradient>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <View style={styles.form}>
                        <View style={styles.otpContainer}>
                          {/* OTP Input */}
                          <TextInput
                            ref={otpInputRef}
                            style={styles.otpInput}
                            placeholder="• • • • • •"
                            placeholderTextColor="#555"
                            value={otp}
                            onChangeText={setOtp}
                            keyboardType="numeric"
                            maxLength={6}
                          />
                        </View>

                        {isLoading && <ActivityIndicator color="#D4AF37" style={{ marginBottom: 10 }} />}

                        <TouchableOpacity onPress={() => { setOtp(""); setShowOtpScreen(false); }}>
                          <Text style={styles.changeEmailText}>Change Email Address</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>

                  {/* FOOTER TEXT */}
                  <View style={styles.footerArea}>
                    <Text style={styles.footerText}>By continuing, you agree to our Terms & Privacy Policy</Text>
                  </View>
                </View>
              </ScrollView>
            </KeyboardAvoidingView>
          </SafeAreaView>
        </LinearGradient>
      </ImageBackground>
    </View>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: "#FFF" }, // Light Bg
  backgroundImage: { flex: 1 },
  gradientOverlay: { flex: 1 },
  safeArea: { flex: 1 },
  keyboardAvoid: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "flex-start",
    paddingBottom: 20
  },
  staticContent: {
    paddingHorizontal: 24,
    paddingTop: 100, // Fixed top padding
  },

  headerArea: {
    alignItems: "center",
    marginBottom: 30, // Reduced slightly to keep form visible
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#FFF", // White circle
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 2,
    borderColor: "#D4AF37", // Gold border
    shadowColor: "#D4AF37",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
  },
  logo: { width: 60, height: 60, tintColor: "#D4AF37" },
  brandName: {
    fontSize: 26,
    fontWeight: "900",
    color: "#1E293B", // Dark Text
    letterSpacing: 2,
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
    textAlign: 'center',
  },
  brandTagline: {
    fontSize: 10,
    color: "#B45309", // Darker gold/orange for readability on white
    letterSpacing: 4,
    fontWeight: "700",
    marginTop: 8,
    textTransform: 'uppercase',
  },

  formContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 30,
    paddingVertical: 32,
    paddingHorizontal: 24,
    // Neumorphism / Soft Shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: "800",
    color: "#1E293B", // Dark Text
    textAlign: "center",
    marginBottom: 6,
  },
  subText: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    marginBottom: 28,
  },

  form: { gap: 16 },

  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC", // Light Gray Input
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    height: 60,
    paddingHorizontal: 16,
  },
  inputIcon: { marginRight: 14, opacity: 0.8 },
  premiumInput: {
    flex: 1,
    color: "#1E293B", // Dark Input Text
    fontSize: 16,
    height: '100%',
    fontWeight: '500',
  },

  /* OTP Specific */
  otpContainer: {
    alignItems: 'center',
    marginVertical: 10,
  },
  otpInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#D4AF37",
    color: "#D4AF37",
    fontSize: 32,
    fontWeight: "800",
    letterSpacing: 12,
    textAlign: "center",
    width: '100%',
    paddingVertical: 14,
  },

  /* Button */
  gradientButton: {
    height: 60,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#D4AF37",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
    marginTop: 10,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "900",
    color: "#FFF", // White text on Gold Button
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  buttonDisabled: { opacity: 0.7 },

  changeEmailText: {
    color: "#94A3B8",
    textAlign: "center",
    fontSize: 14,
    marginTop: 20,
    textDecorationLine: 'underline',
  },

  footerArea: {
    marginTop: 30,
    alignItems: 'center',
  },
  footerText: {
    color: "#94A3B8",
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
  }
});
