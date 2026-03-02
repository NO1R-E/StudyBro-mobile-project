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

// --- 1. Import Firebase และฟังก์ชันส่งเมล/ออกจากระบบ ---
import { initializeApp } from "firebase/app";
import {
  initializeAuth,
  getReactNativePersistence,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  sendEmailVerification, // เพิ่ม: ส่งเมลยืนยัน
  signOut,               // เพิ่ม: ออกจากระบบชั่วคราว
} from "firebase/auth";

// --- 2. Firebase Config ---
const firebaseConfig = {
  apiKey: "AIzaSyDTYzI4VIIegvvkosB_vIHKmZABq-EfkBk",
  authDomain: "studybro-mobile-project.firebaseapp.com",
  projectId: "studybro-mobile-project",
  storageBucket: "studybro-mobile-project.firebasestorage.app",
  messagingSenderId: "659667223336",
  appId: "1:659667223336:web:ba25c4788cc0b27d4bc61d",
  measurementId: "G-YX12N8CHDP",
};

const app = initializeApp(firebaseConfig);
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

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
//Email Verifi
    try {
      let user;
      if (isLogin) {
        // --- โหมด: เข้าสู่ระบบ ---
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        user = userCredential.user;

        // **ตรวจสอบว่ายืนยันอีเมลหรือยัง**
        if (!user.emailVerified) {
          setLoading(false);
          Alert.alert(
            "ยืนยันอีเมลของคุณ",
            "กรุณาตรวจสอบกล่องจดหมายของคุณและกดลิงก์ยืนยันตัวตนก่อนเข้าใช้งาน",
            [
              { text: "ตกลง" },
              { 
                text: "ส่งเมลอีกครั้ง", 
                onPress: async () => {
                  await sendEmailVerification(user);
                  Alert.alert("สำเร็จ", "ส่งลิงก์ยืนยันตัวตนไปที่อีเมลอีกครั้งแล้ว");
                } 
              }
            ]
          );
          await signOut(auth); // ออกจากระบบเพื่อให้ล็อกอินใหม่หลังยืนยัน
          return;
        }
      } else {
        // --- โหมด: สมัครสมาชิก ---
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        user = userCredential.user;

        await updateProfile(user, { displayName: name });

        // **ส่งอีเมลยืนยันตัวตนทันที**
        await sendEmailVerification(user);

        setLoading(false);
        Alert.alert(
          "สร้างบัญชีสำเร็จ!",
          "เราได้ส่งลิงก์ยืนยันตัวตนไปที่อีเมลของคุณแล้ว กรุณากดยืนยันก่อนเข้าสู่ระบบครั้งแรก",
          [{ 
            text: "ตกลง", 
            onPress: () => {
              setIsLogin(true); // สลับไปหน้า Login
              setEmail("");     // ล้างค่าเพื่อให้กรอกใหม่
              setPassword("");
            } 
          }]
        );
        await signOut(auth);
        return;
      }

      // หากผ่านเงื่อนไข (ล็อกอินสำเร็จ และยืนยันอีเมลแล้ว)
      await AsyncStorage.setItem("current_username", user.displayName || name || "ผู้ใช้");
      setLoading(false);
      navigation.replace("MainApp", { userName: user.displayName || name });

    } catch (error) {
      setLoading(false);
      console.error("Auth Error:", error.code);
      if (error.code === "auth/email-already-in-use") {
        Alert.alert("ข้อผิดพลาด", "อีเมลนี้มีผู้ใช้งานแล้ว");
      } else if (error.code === "auth/invalid-email") {
        Alert.alert("ข้อผิดพลาด", "รูปแบบอีเมลไม่ถูกต้อง");
      } else if (error.code === "auth/weak-password") {
        Alert.alert("ข้อผิดพลาด", "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร");
      } else if (
        error.code === "auth/user-not-found" ||
        error.code === "auth/wrong-password" ||
        error.code === "auth/invalid-credential"
      ) {
        Alert.alert("ข้อผิดพลาด", "อีเมลหรือรหัสผ่านไม่ถูกต้อง");
      } else {
        Alert.alert("ข้อผิดพลาด", "เกิดเหตุขัดข้อง กรุณาลองใหม่อีกครั้ง");
      }
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
            ? "เข้าสู่ระบบเพื่อจัดการการเรียนของคุณ"
            : "สมัครสมาชิกเพื่อเริ่มต้นใช้งานแอป"}
        </Text>

        {!isLogin && (
          <View style={styles.inputContainer}>
            <Ionicons name="person-outline" size={20} color="#9B7B8E" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="ชื่อของคุณ (Name)"
              placeholderTextColor="#9B7B8E"
              value={name}
              onChangeText={setName}
            />
          </View>
        )}

        <View style={styles.inputContainer}>
          <Ionicons name="mail-outline" size={20} color="#9B7B8E" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="อีเมล (Email)"
            placeholderTextColor="#9B7B8E"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
        </View>

        <View style={styles.inputContainer}>
          <Ionicons name="lock-closed-outline" size={20} color="#9B7B8E" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="รหัสผ่าน (Password)"
            placeholderTextColor="#9B7B8E"
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ padding: 10 }}>
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
            {isLogin ? "ยังไม่มีบัญชีใช่หรือไม่? " : "มีบัญชีอยู่แล้วใช่ไหม? "}
          </Text>
          <TouchableOpacity onPress={() => setIsLogin(!isLogin)}>
            <Text style={styles.switchBtnText}>
              {isLogin ? "สมัครเลย" : "เข้าสู่ระบบ"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9E2EB", justifyContent: "center" },
  formContainer: { paddingHorizontal: 30, alignItems: "center" },
  logoCircle: {
    width: 120, height: 120, backgroundColor: "#FFAAC9", borderRadius: 60,
    justifyContent: "center", alignItems: "center", marginBottom: 20,
    elevation: 5, shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2, shadowRadius: 4,
  },
  title: { fontSize: 28, fontFamily: "Inter_700Bold", color: "#C7005C", marginBottom: 5 },
  subtitle: { fontSize: 14, fontFamily: "Inter_400Regular", color: "#9B7B8E", marginBottom: 30, textAlign: "center" },
  inputContainer: {
    flexDirection: "row", alignItems: "center", backgroundColor: "#FFF",
    borderRadius: 15, marginBottom: 15, paddingHorizontal: 15, height: 55,
    borderWidth: 1, borderColor: "#FFDAE0",
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontFamily: "Inter_400Regular", fontSize: 16, color: "#333" },
  actionBtn: {
    backgroundColor: "#C7005C", width: "100%", height: 55, borderRadius: 15,
    justifyContent: "center", alignItems: "center", marginTop: 10, elevation: 3,
  },
  actionBtnText: { color: "#FFF", fontSize: 18, fontFamily: "Inter_700Bold" },
  switchContainer: { flexDirection: "row", marginTop: 25 },
  switchText: { color: "#9B7B8E", fontFamily: "Inter_400Regular", fontSize: 14 },
  switchBtnText: { color: "#EA3287", fontFamily: "Inter_700Bold", fontSize: 14 },
});

export default Login;