import React from "react";
import { StyleSheet, View, Image, Text } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack"; // นำเข้า Stack
import { Ionicons } from "@expo/vector-icons";
import { PaperProvider } from "react-native-paper";

// นำเข้าหน้าต่างๆ
import Login from "./src/screens/Login"; // นำเข้าหน้า Login
import Dashboard from "./src/screens/Dashboard";
import Timetable from "./src/screens/Timetable";
import Planner from "./src/screens/Planner";
import Profile from "./src/screens/Profile";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator(); // สร้าง Stack Navigator

// 1. สร้าง Component สำหรับกลุ่มหน้า Tab ด้านล่าง (โค้ดเดิมของคุณ)
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
            <View style={[styles.iconContainer, focused && styles.activeIconBackground]}>
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
        tabBarShowLabel: false,
      })}
    >
      <Tab.Screen
        name="Home"
        component={Dashboard}
        options={{
          headerTitle: () => (
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Image
                source={require("./assets/logo.png")} // ตรวจสอบพาทรูปภาพให้ตรง
                style={{
                  width: 40,
                  height: 40,
                  resizeMode: "contain",
                  marginRight: 10,
                }}
              />
              <Text style={{ color: "#000000", fontSize: 18, fontWeight: "bold" }}>
                Home
              </Text>
            </View>
          ),
          headerStyle: {
            backgroundColor: "#ffffff",
            height: 100,
          },
        }}
      />
      <Tab.Screen
        name="Timetable"
        component={Timetable}
        options={{
          headerTitle: () => (
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Image
                source={require("./assets/logo.png")} // ตรวจสอบพาทรูปภาพให้ตรง
                style={{
                  width: 40,
                  height: 40,
                  resizeMode: "contain",
                  marginRight: 10,
                }}
              />
              <Text style={{ color: "#000000", fontSize: 18, fontWeight: "bold" }}>
                Timetable
              </Text>
            </View>
          ),
          headerStyle: {
            backgroundColor: "#ffffff",
            height: 100,
          },
        }}
      />
      <Tab.Screen
        name="Planner"
        component={Planner}
        options={{
          headerTitle: () => (
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Image
                source={require("./assets/logo.png")} // ตรวจสอบพาทรูปภาพให้ตรง
                style={{
                  width: 40,
                  height: 40,
                  resizeMode: "contain",
                  marginRight: 10,
                }}
              />
              <Text style={{ color: "#000000", fontSize: 18, fontWeight: "bold" }}>
                Planner
              </Text>
            </View>
          ),
          headerStyle: {
            backgroundColor: "#ffffff",
            height: 100,
          },
        }} 
      />
      <Tab.Screen
        name="Profile"
        component={Profile}
        options={{
          headerTitle: () => (
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Image
                source={require("./assets/logo.png")} // ตรวจสอบพาทรูปภาพให้ตรง
                style={{
                  width: 40,
                  height: 40,
                  resizeMode: "contain",
                  marginRight: 10,
                }}
              />
              <Text style={{ color: "#000000", fontSize: 18, fontWeight: "bold" }}>
                Profile
              </Text>
            </View>
          ),
          headerStyle: {
            backgroundColor: "#ffffff",
            height: 100,
          },
        }}
      />
    </Tab.Navigator>
  );
};

// 2. ตัวหลักของ App: ใช้ Stack คุมว่าหน้าแรกคือ Login
const App = () => {
  return (
    <PaperProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Login">
          {/* หน้า Login (ซ่อน Header ด้านบน) */}
          <Stack.Screen 
            name="Login" 
            component={Login} 
            options={{ headerShown: false }} 
          />
          {/* หน้าหลักที่รวม Tab ไว้ (ซ่อน Header เพราะ Tab จัดการเอง) */}
          <Stack.Screen 
            name="MainApp" 
            component={MainTabs} 
            options={{ headerShown: false }} 
          />
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