import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import {
  useFonts,
  Inter_400Regular,
  Inter_700Bold,
} from "@expo-google-fonts/inter";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";

import { auth } from "../../firebaseConfig";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
  signOut,
} from "firebase/auth";

const Login = ({ navigation }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_700Bold,
  });

  const handleTestLogin = async () => {
    setLoading(true);
    try {
      const testName = "Guest User";
      await AsyncStorage.setItem("current_username", testName);
      setLoading(false);
      navigation.replace("MainApp", { userName: testName });
    } catch (e) {
      setLoading(false);
    }
  };

  const handleAuth = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("แจ้งเตือน", "กรุณากรอกอีเมลและรหัสผ่านให้ครบถ้วน");
      return;
    }

    if (!isLogin && !name.trim()) {
      Alert.alert("แจ้งเตือน", "กรุณากรอกชื่อของคุณ");
      return;
    }

    setLoading(true);
    try {
      let user;
      if (isLogin) {
        const userCredential = await signInWithEmailAndPassword(
          auth,
          email,
          password,
        );
        user = userCredential.user;

        if (!user.emailVerified) {
          setLoading(false);
          Alert.alert("ยืนยันอีเมล", "กรุณายืนยันตัวตนในอีเมลก่อนเข้าใช้งาน", [
            { text: "ตกลง" },
            {
              text: "ส่งอีกครั้ง",
              onPress: () =>
                sendEmailVerification(user).then(() =>
                  Alert.alert("สำเร็จ", "ส่งแล้ว"),
                ),
            },
          ]);
          await signOut(auth);
          return;
        }
      } else {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password,
        );
        user = userCredential.user;
        await updateProfile(user, { displayName: name });
        await sendEmailVerification(user);

        setLoading(false);
        Alert.alert("สำเร็จ", "เราส่งลิงก์ยืนยันไปที่อีเมลแล้ว", [
          {
            text: "OK",
            onPress: () => {
              setIsLogin(true);
              setEmail("");
              setPassword("");
            },
          },
        ]);
        await signOut(auth);
        return;
      }

      await AsyncStorage.setItem(
        "current_username",
        user.displayName || name || "ผู้ใช้",
      );
      setLoading(false);
      navigation.replace("MainApp", { userName: user.displayName || name });
    } catch (error) {
      setLoading(false);
      let errorMsg = "เกิดข้อผิดพลาด";
      if (error.code === "auth/email-already-in-use")
        errorMsg = "อีเมลนี้มีผู้ใช้งานแล้ว";
      else if (error.code === "auth/invalid-credential")
        errorMsg = "อีเมลหรือรหัสผ่านไม่ถูกต้อง";
      Alert.alert("ข้อผิดพลาด", errorMsg);
    }
  };

  if (!fontsLoaded) return null;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <View style={styles.formContainer}>
        <View style={styles.logoCircle}>
          <Ionicons name="school" size={60} color="#FFF" />
        </View>
        <Text style={styles.title}>
          {isLogin ? "ยินดีต้อนรับ!" : "สร้างบัญชีใหม่"}
        </Text>
        <Text style={styles.subtitle}>
          {isLogin
            ? "เข้าสู่ระบบเพื่อจัดการการเรียน"
            : "สมัครสมาชิกเพื่อใช้งานแอป"}
        </Text>

        {!isLogin && (
          <View style={styles.inputContainer}>
            <Ionicons
              name="person-outline"
              size={20}
              color="#9B7B8E"
              style={{ marginRight: 10 }}
            />
            <TextInput
              style={styles.input}
              placeholder="ชื่อของคุณ"
              value={name}
              onChangeText={setName}
            />
          </View>
        )}

        <View style={styles.inputContainer}>
          <Ionicons
            name="mail-outline"
            size={20}
            color="#9B7B8E"
            style={{ marginRight: 10 }}
          />
          <TextInput
            style={styles.input}
            placeholder="อีเมล"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
        </View>

        <View style={styles.inputContainer}>
          <Ionicons
            name="lock-closed-outline"
            size={20}
            color="#9B7B8E"
            style={{ marginRight: 10 }}
          />
          <TextInput
            style={styles.input}
            placeholder="รหัสผ่าน"
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <Ionicons
              name={showPassword ? "eye-outline" : "eye-off-outline"}
              size={20}
              color="#9B7B8E"
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.actionBtn}
          onPress={handleAuth}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.actionBtnText}>
              {isLogin ? "เข้าสู่ระบบ" : "สมัครสมาชิก"}
            </Text>
          )}
        </TouchableOpacity>

        <View style={styles.switchContainer}>
          <Text style={styles.switchText}>
            {isLogin ? "ยังไม่มีบัญชี? " : "มีบัญชีแล้ว? "}
          </Text>
          <TouchableOpacity onPress={() => setIsLogin(!isLogin)}>
            <Text style={styles.switchBtnText}>
              {isLogin ? "สมัครเลย" : "เข้าสู่ระบบ"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* --- Easy to delete Guest Mode --- */}
        <TouchableOpacity onPress={handleTestLogin} style={{ marginTop: 20 }}>
          <Text
            style={[styles.switchText, { textDecorationLine: "underline" }]}
          >
            Guest Mode (Test Only)
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9E2EB", justifyContent: "center" },
  formContainer: { paddingHorizontal: 30, alignItems: "center" },
  logoCircle: {
    width: 120,
    height: 120,
    backgroundColor: "#FFAAC9",
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    color: "#C7005C",
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: "#9B7B8E",
    marginBottom: 30,
    textAlign: "center",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 15,
    marginBottom: 15,
    paddingHorizontal: 15,
    height: 55,
    borderWidth: 1,
    borderColor: "#FFDAE0",
  },
  input: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 16,
    color: "#333",
  },
  actionBtn: {
    backgroundColor: "#C7005C",
    width: "100%",
    height: 55,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },
  actionBtnText: { color: "#FFF", fontSize: 18, fontFamily: "Inter_700Bold" },
  switchContainer: { flexDirection: "row", marginTop: 25 },
  switchText: {
    color: "#9B7B8E",
    fontFamily: "Inter_400Regular",
    fontSize: 14,
  },
  switchBtnText: {
    color: "#EA3287",
    fontFamily: "Inter_700Bold",
    fontSize: 14,
  },
});

export default Login;
