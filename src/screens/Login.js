import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { useFonts, Inter_400Regular, Inter_700Bold } from "@expo-google-fonts/inter";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from "@expo/vector-icons";
import AntDesign from '@expo/vector-icons/AntDesign';

// --- 1. Import Firebase & Expo Auth ---
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithCredential } from 'firebase/auth';

// บังคับให้ WebBrowser ปิดอัตโนมัติเมื่อล็อกอินเสร็จ
WebBrowser.maybeCompleteAuthSession();

// --- 2. ใส่ Config ของ Firebase ของคุณตรงนี้ ---
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDTYzI4VIIegvvkosB_vIHKmZABq-EfkBk",
  authDomain: "studybro-mobile-project.firebaseapp.com",
  projectId: "studybro-mobile-project",
  storageBucket: "studybro-mobile-project.firebasestorage.app",
  messagingSenderId: "659667223336",
  appId: "1:659667223336:web:ba25c4788cc0b27d4bc61d",
  measurementId: "G-YX12N8CHDP"
};

// ตรวจสอบว่ามีแอป Firebase ถูกสร้างไว้หรือยัง (ป้องกัน error)
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const Login = ({ navigation }) => {
  const [loading, setLoading] = useState(false);

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_700Bold,
  });

  // --- 3. ตั้งค่า Google Auth Request ---
  // นำ Web Client ID ที่ก๊อปปี้มาจาก Firebase Console มาใส่ตรงนี้
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: '659667223336-56r7p3oraokvb05pn3namcopli4dtnuq.apps.googleusercontent.com',
  });

  // --- 4. ดักจับผลลัพธ์การล็อกอิน ---
  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      const credential = GoogleAuthProvider.credential(id_token);
      
      // นำ Token ที่ได้จาก Google ไปยืนยันตัวตนกับ Firebase
      signInWithCredential(auth, credential)
        .then(async (userCredential) => {
          const user = userCredential.user;
          
          // เซฟชื่อผู้ใช้ที่ได้จาก Google ลงเครื่อง
          await AsyncStorage.setItem('current_username', user.displayName || "ผู้ใช้");
          
          // พาไปหน้า Dashboard
          navigation.replace("MainApp", { userName: user.displayName });
        })
        .catch((error) => {
          console.error("Firebase Auth Error: ", error);
          setLoading(false);
        });
    } else if (response?.type === 'cancel' || response?.type === 'error') {
      setLoading(false);
    }
  }, [response]);

  const handleGoogleLogin = () => {
    setLoading(true);
    promptAsync(); // เด้งหน้าต่าง Google Login
  };

  return (
    <View style={styles.container}>
      <View style={styles.formContainer}>
        <View style={styles.logoCircle}>
          <Ionicons name="school" size={60} color="#FFF" />
        </View>
        
        <Text style={styles.title}>ยินดีต้อนรับ!</Text>
        <Text style={styles.subtitle}>จัดการตารางเรียนและกิจกรรมของคุณ</Text>

        {loading ? (
          <View style={{ marginTop: 20 }}>
            <ActivityIndicator size="large" color="#C7005C" />
            <Text style={{ marginTop: 10, color: "#9B7B8E" }}>กำลังเข้าสู่ระบบ...</Text>
          </View>
        ) : (
          <TouchableOpacity 
            style={styles.googleBtn} 
            onPress={handleGoogleLogin}
            disabled={!request}
          >
            <AntDesign name="google" size={24} color="#FFF" style={{ marginRight: 10 }} />
            <Text style={styles.googleBtnText}>เข้าสู่ระบบด้วย Google</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9E2EB", 
    justifyContent: "center",
  },
  formContainer: {
    paddingHorizontal: 30,
    alignItems: "center",
  },
  logoCircle: {
    width: 120,
    height: 120,
    backgroundColor: "#FFAAC9",
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
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
    marginBottom: 40,
    textAlign: "center",
  },
  googleBtn: {
    flexDirection: "row",
    backgroundColor: "#DB4437", // สีแดงของ Google
    width: "100%",
    height: 55,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    elevation: 3,
  },
  googleBtnText: {
    color: "#FFF",
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
});

export default Login;