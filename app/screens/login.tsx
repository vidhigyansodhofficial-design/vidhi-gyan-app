import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
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
  View,
} from "react-native";

import { supabase } from "@/lib/supabase"; // ✅ IMPORT SUPABASE

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
      <StatusBar barStyle="light-content" />

      <ImageBackground
        source={require("../../assets/images/law-background.jpg")}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <View style={styles.darkOverlay} />

        <SafeAreaView style={styles.safeArea}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.keyboardAvoid}
          >
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* HEADER */}
              <View style={styles.headerArea}>
                <Image
                  source={require("../../assets/images/pngtree-law.png")}
                  style={styles.logo}
                  resizeMode="contain"
                />
                <Text style={styles.brandName}>Vidhi Gyan Sodh</Text>
                <View style={styles.goldLine} />
                <Text style={styles.brandTagline}>MASTER INDIAN LAW</Text>
              </View>

              {/* FORM */}
              <View style={styles.premiumSheet}>
                <Text style={styles.sheetTitle}>
                  {showOtpScreen ? "Verify Identity" : "Secure Login"}
                </Text>

                {!showOtpScreen ? (
                  <View style={styles.form}>
                    <View style={styles.inputContainer}>
                      <Text style={styles.inputLabel}>FULL NAME (optional)</Text>
                      <TextInput
                        style={styles.premiumInput}
                        placeholder="e.g. Shubham Kumar"
                        placeholderTextColor="#999"
                        value={fullName}
                        onChangeText={setFullName}
                        autoCapitalize="words"
                        returnKeyType="next"
                        onSubmitEditing={() =>
                          emailInputRef.current?.focus()
                        }
                      />
                    </View>

                    <View style={styles.inputContainer}>
                      <Text style={styles.inputLabel}>EMAIL ADDRESS</Text>
                      <TextInput
                        ref={emailInputRef}
                        style={styles.premiumInput}
                        placeholder="name@example.com"
                        placeholderTextColor="#999"
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                        returnKeyType="done"
                        onSubmitEditing={handleSendOtp}
                      />
                    </View>

                    <TouchableOpacity
                      style={[
                        styles.goldenButton,
                        isLoading && styles.buttonDisabled,
                      ]}
                      onPress={handleSendOtp}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <ActivityIndicator color="#FFF" />
                      ) : (
                        <Text style={styles.buttonText}>REQUEST OTP</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.form}>
                    <Text style={styles.otpMessage}>
                      Enter the 6-digit code sent to{" "}
                      <Text style={{ fontWeight: "bold" }}>{email}</Text>
                    </Text>

                    <View style={styles.inputContainer}>
                      <Text style={styles.inputLabel}>OTP CODE</Text>
                      <TextInput
                        ref={otpInputRef}
                        style={[styles.premiumInput, styles.otpInput]}
                        placeholder="000000"
                        placeholderTextColor="#CCC"
                        value={otp}
                        onChangeText={setOtp}
                        keyboardType="numeric"
                        maxLength={6}
                      />
                    </View>

                    {isLoading && (
                      <ActivityIndicator
                        color="#D4AF37"
                        style={{ marginTop: 10 }}
                      />
                    )}

                    <TouchableOpacity
                      onPress={() => {
                        setOtp("");
                        setShowOtpScreen(false);
                      }}
                      style={styles.backButton}
                    >
                      <Text style={styles.backButtonText}>
                        Use a different email
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </ImageBackground>
    </View>
  );
}

/* ================= STYLES (UNCHANGED) ================= */

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: "#000" },
  backgroundImage: { flex: 1 },
  darkOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.65)",
  },
  safeArea: { flex: 1 },
  keyboardAvoid: { flex: 1 },
  scrollContent: { flexGrow: 1, justifyContent: "space-between" },
  headerArea: {
    paddingTop: 40,
    paddingBottom: 20,
    alignItems: "center",
  },
  logo: { width: 80, height: 80, tintColor: "#D4AF37" },
  brandName: {
    fontSize: 34,
    color: "#FFF",
    fontFamily: Platform.OS === "ios" ? "Times New Roman" : "serif",
  },
  goldLine: {
    width: 40,
    height: 1.5,
    backgroundColor: "#D4AF37",
    marginVertical: 10,
  },
  brandTagline: {
    fontSize: 11,
    color: "rgba(255,255,255,0.5)",
    letterSpacing: 3,
    fontWeight: "700",
  },
  premiumSheet: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 45,
    borderTopRightRadius: 45,
    padding: 35,
    minHeight: 450,
  },
  sheetTitle: {
    fontSize: 26,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 30,
  },
  form: { gap: 22 },
  inputContainer: { gap: 8 },
  inputLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: "#A1A1A1",
    letterSpacing: 1.2,
  },
  premiumInput: {
    backgroundColor: "#F9F9F9",
    borderRadius: 15,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  otpInput: {
    textAlign: "center",
    fontSize: 28,
    letterSpacing: 10,
    fontWeight: "700",
    color: "#D4AF37",
  },
  otpMessage: { textAlign: "center", color: "#555" },
  goldenButton: {
    backgroundColor: "#D4AF37",
    borderRadius: 15,
    paddingVertical: 18,
    alignItems: "center",
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#FFF",
    letterSpacing: 1.5,
  },
  backButton: { alignSelf: "center", marginTop: 15 },
  backButtonText: { color: "#999", fontSize: 13 },
});
