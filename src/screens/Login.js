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
} from "firebase/auth";

const Login = () => {
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
    if (!email || !password || (!isLogin && !name)) {
      Alert.alert("ข้อผิดพลาด", "กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        // เข้าสู่ระบบ
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // เก็บชื่อผู้ใช้ลงเครื่องเพื่อให้ Dashboard ดึงไปใช้ได้ทันที
        if (user.displayName) {
          await AsyncStorage.setItem("userName", user.displayName);
        }
      } else {
        // สมัครสมาชิก
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: name });
        await AsyncStorage.setItem("userName", name);
        Alert.alert("สำเร็จ", "สร้างบัญชีผู้ใช้เรียบร้อยแล้ว");
      }
      // หมายเหตุ: ไม่ต้องสั่ง navigation.replace("MainApp") 
      // เพราะ App.js จะตรวจเจอ user และเปลี่ยนหน้าให้เองอัตโนมัติ
    } catch (error) {
      console.error(error);
      let message = "เกิดข้อผิดพลาดในการเชื่อมต่อ";
      if (error.code === "auth/email-already-in-use") message = "อีเมลนี้ถูกใช้งานแล้ว";
      if (error.code === "auth/wrong-password") message = "รหัสผ่านไม่ถูกต้อง";
      if (error.code === "auth/user-not-found") message = "ไม่พบผู้ใช้นี้ในระบบ";
      Alert.alert("ข้อผิดพลาด", message);
    } finally {
      setLoading(false);
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
          <Ionicons name="book" size={60} color="#FFF" />
        </View>

        <Text style={styles.title}>{isLogin ? "Welcome Back" : "Create Account"}</Text>
        <Text style={styles.subtitle}>
          {isLogin ? "ลงชื่อเข้าใช้งานเพื่อจัดการตารางเรียนของคุณ" : "สมัครสมาชิกเพื่อเริ่มต้นใช้งานแอป"}
        </Text>

        {!isLogin && (
          <View style={styles.inputContainer}>
            <Ionicons name="person-outline" size={20} color="#C7005C" style={{ marginRight: 10 }} />
            <TextInput
              style={styles.input}
              placeholder="ชื่อผู้ใช้"
              value={name}
              onChangeText={setName}
            />
          </View>
        )}

        <View style={styles.inputContainer}>
          <Ionicons name="mail-outline" size={20} color="#C7005C" style={{ marginRight: 10 }} />
          <TextInput
            style={styles.input}
            placeholder="อีเมล"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputContainer}>
          <Ionicons name="lock-closed-outline" size={20} color="#C7005C" style={{ marginRight: 10 }} />
          <TextInput
            style={styles.input}
            placeholder="รหัสผ่าน"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <Ionicons name={showPassword ? "eye-outline" : "eye-off-outline"} size={20} color="#9B7B8E" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.actionBtn} onPress={handleAuth} disabled={loading}>
          {loading ? <ActivityIndicator color="#FFF" /> : (
            <Text style={styles.actionBtnText}>{isLogin ? "เข้าสู่ระบบ" : "สมัครสมาชิก"}</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.switchBtn} onPress={() => setIsLogin(!isLogin)}>
          <Text style={styles.switchBtnText}>
            {isLogin ? "ยังไม่มีบัญชี? สมัครสมาชิกที่นี่" : "มีบัญชีอยู่แล้ว? เข้าสู่ระบบ"}
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
    width: 120, height: 120,
    backgroundColor: "#C7005C",
    borderRadius: 60,
    justifyContent: "center", alignItems: "center",
    marginBottom: 20,
  },
  title: { fontSize: 28, fontFamily: "Inter_700Bold", color: "#C7005C", marginBottom: 5 },
  subtitle: { fontSize: 14, fontFamily: "Inter_400Regular", color: "#9B7B8E", marginBottom: 30, textAlign: "center" },
  inputContainer: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#FFF", borderRadius: 15,
    marginBottom: 15, paddingHorizontal: 15,
    height: 55, borderWidth: 1, borderColor: "#FFDAE0",
  },
  input: { flex: 1, fontFamily: "Inter_400Regular", fontSize: 16, color: "#333" },
  actionBtn: {
    backgroundColor: "#C7005C", width: "100%", height: 55,
    borderRadius: 15, justifyContent: "center", alignItems: "center",
    marginTop: 10, elevation: 3,
  },
  actionBtnText: { color: "#FFF", fontSize: 18, fontFamily: "Inter_700Bold" },
  switchBtn: { marginTop: 20 },
  switchBtnText: { color: "#C7005C", fontFamily: "Inter_400Regular", fontSize: 14 },
});

export default Login;