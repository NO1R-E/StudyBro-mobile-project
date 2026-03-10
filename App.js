import React, { useState, useEffect } from "react";
import { StyleSheet, View, Image, Text, ActivityIndicator } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { PaperProvider } from "react-native-paper";

// นำเข้า Firebase Auth
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebaseConfig"; // ตรวจสอบว่า path ของไฟล์ firebaseConfig ถูกต้อง

// นำเข้าหน้าต่างๆ
import Login from "./src/screens/Login";
import Dashboard from "./src/screens/Dashboard";
import Timetable from "./src/screens/Timetable";
import Planner from "./src/screens/Planner";
import Profile from "./src/screens/Profile";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// 1. ส่วนของ Tab Navigator (UI เหมือนเดิมที่คุณทำไว้)
const MainTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === "Home") {
            iconName = focused ? "home" : "home-outline";
          } else if (route.name === "Timetable") {
            iconName = focused ? "calendar" : "calendar-outline";
          } else if (route.name === "Planner") {
            iconName = focused ? "heart" : "heart-outline";
          } else if (route.name === "Profile") {
            iconName = focused ? "person" : "person-outline";
          }

          return (
            <View
              style={[
                styles.iconContainer,
                focused && styles.activeIconBackground,
              ]}
            >
              <Ionicons name={iconName} size={size} color={color} />
            </View>
          );
        },
        tabBarActiveTintColor: "#C7005C",
        tabBarInactiveTintColor: "#B0B0B0",
        tabBarStyle: {
          backgroundColor: "#ffffff",
          height: 70,
          paddingBottom: 10,
          paddingTop: 10,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          position: "absolute",
          elevation: 10,
          borderTopWidth: 0,
        },
        tabBarShowLabel: true,
      })}
    >
      <Tab.Screen
        name="Home"
        component={Dashboard}
        options={{
          headerTitle: () => (
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Image
                source={require("./assets/logo.png")}
                style={{ width: 40, height: 40, resizeMode: "contain", marginRight: 10 }}
              />
              <Text style={{ color: "#000000", fontSize: 18, fontWeight: "bold" }}>Home</Text>
            </View>
          ),
          headerStyle: { backgroundColor: "#ffffff", height: 100 },
        }}
      />
      <Tab.Screen
        name="Timetable"
        component={Timetable}
        options={{
          headerTitle: () => (
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Image
                source={require("./assets/logo.png")}
                style={{ width: 40, height: 40, resizeMode: "contain", marginRight: 10 }}
              />
              <Text style={{ color: "#000000", fontSize: 18, fontWeight: "bold" }}>Timetable</Text>
            </View>
          ),
          headerStyle: { backgroundColor: "#ffffff", height: 100 },
        }}
      />
      <Tab.Screen
        name="Planner"
        component={Planner}
        options={{
          headerTitle: () => (
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Image
                source={require("./assets/logo.png")}
                style={{ width: 40, height: 40, resizeMode: "contain", marginRight: 10 }}
              />
              <Text style={{ color: "#000000", fontSize: 18, fontWeight: "bold" }}>Planner</Text>
            </View>
          ),
          headerStyle: { backgroundColor: "#ffffff", height: 100 },
        }}
      />
      <Tab.Screen
        name="Profile"
        component={Profile}
        options={{
          headerTitle: () => (
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Image
                source={require("./assets/logo.png")}
                style={{ width: 40, height: 40, resizeMode: "contain", marginRight: 10 }}
              />
              <Text style={{ color: "#000000", fontSize: 18, fontWeight: "bold" }}>Profile</Text>
            </View>
          ),
          headerStyle: { backgroundColor: "#ffffff", height: 100 },
        }}
      />
    </Tab.Navigator>
  );
};

// 2. ตัวหลักของ App: เพิ่ม Logic เช็คสถานะ Login
const App = () => {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState(null);

  // ดักฟังสถานะ Auth จาก Firebase
  useEffect(() => {
    const subscriber = onAuthStateChanged(auth, (authenticatedUser) => {
      setUser(authenticatedUser);
      if (initializing) setInitializing(false);
    });
    return subscriber; // unsubscribe เมื่อเลิกใช้งาน
  }, [initializing]);

  // แสดงหน้าโหลดระหว่างเช็คสถานะ (ป้องกันหน้าขาว)
  if (initializing) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F9E2EB" }}>
        <ActivityIndicator size="large" color="#C7005C" />
      </View>
    );
  }

  return (
    <PaperProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {user ? (
            // ถ้าล็อคอินแล้ว ให้เข้าหน้า MainApp ทันที
            <Stack.Screen name="MainApp" component={MainTabs} />
          ) : (
            // ถ้ายังไม่ล็อคอิน ให้แสดงหน้า Login
            <Stack.Screen name="Login" component={Login} />
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </PaperProvider>
  );
};

const styles = StyleSheet.create({
  iconContainer: {
    padding: 6,
    borderRadius: 15,
    width: 45,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  activeIconBackground: {
    backgroundColor: "#FFF0F3",
  },
});

export default App;