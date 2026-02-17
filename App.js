import React from "react";
import { StyleSheet, View, Image, Text } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";

import Dashboard from "./src/screens/Dashboard";
import Timetable from "./src/screens/Timetable";
import Planner from "./src/screens/Planner";
import Profile from "./src/screens/Profile";
import { PaperProvider } from "react-native-paper";

const Tab = createBottomTabNavigator();

const App = () => {
  return (
    <PaperProvider>
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            tabBarIcon: ({ focused, color, size }) => {
              let iconName;

              if (route.name === "Home") {
                iconName = focused ? "home" : "home-outline";
              } else if (route.name === "Academic") {
                iconName = focused ? "calendar" : "calendar-outline";
              } else if (route.name === "Planner") {
                iconName = focused ? "heart" : "heart-outline"; // เปลี่ยนเป็นหัวใจให้เข้ากับสีชมพู
              } else if (route.name === "Profile") {
                iconName = focused ? "person" : "person-outline";
              }

              // เพิ่ม View ครอบ Icon เพื่อทำพื้นหลังตอน Active
              return (
                <View
                  style={[
                    styles.iconContainer,
                    focused && styles.activeIconBackground,
                  ]}
                >
                  <Ionicons
                    name={iconName}
                    size={focused ? 24 : 22}
                    color={color}
                  />
                </View>
              );
            },
            // ตั้งค่าสีชมพูหลัก
            tabBarActiveTintColor: "#FF4D6D",
            tabBarInactiveTintColor: "#000000",
            tabBarStyle: {
              backgroundColor: "#FFF",
              borderTopWidth: 0,
              height: 70,
              paddingBottom: 10,
              elevation: 10, // เงาสำหรับ Android
              shadowColor: "#FF748C", // เงาสำหรับ iOS
              shadowOpacity: 0.1,
              shadowRadius: 10,
            },
            // Header สีชมพู
            headerStyle: {
              backgroundColor: "#ffffff",
              elevation: 0,
              shadowOpacity: 0,
            },
            headerTintColor: "#FFBAD5",
            headerTitleStyle: { fontWeight: "bold", fontSize: 18 },
            tabBarShowLabel: true,
            tabBarLabelStyle: { fontSize: 12, fontWeight: "600" },
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
                    style={{
                      width: 40, // ปรับความกว้างให้พอดีกับ icon
                      height: 40,
                      resizeMode: "contain",
                      marginRight: 10, // เว้นระยะห่างจากตัวหนังสือ
                    }}
                  />
                  <Text
                    style={{
                      color: "#FFF",
                      fontSize: 18,
                      fontWeight: "bold",
                    }}
                  >
                    Dash board
                  </Text>
                </View>
              ),
              headerStyle: {
                backgroundColor: "#FF748C", // สีชมพูคุมโทนเดิม
                height: 100, // เพิ่มความสูงเล็กน้อยเพื่อให้ Logo ไม่ดูอึดอัด
              },
            }}
          />
          <Tab.Screen
            name="Academic"
            component={Timetable}
            options={{
              headerTitle: () => (
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Image
                    source={require("./assets/logo.png")}
                    style={{
                      width: 40, // ปรับความกว้างให้พอดีกับ icon
                      height: 40,
                      resizeMode: "contain",
                      marginRight: 10, // เว้นระยะห่างจากตัวหนังสือ
                    }}
                  />
                  <Text
                    style={{
                      color: "#FFF",
                      fontSize: 18,
                      fontWeight: "bold",
                    }}
                  >
                    Timetable
                  </Text>
                </View>
              ),
              headerStyle: {
                backgroundColor: "#FF748C", // สีชมพูคุมโทนเดิม
                height: 100, // เพิ่มความสูงเล็กน้อยเพื่อให้ Logo ไม่ดูอึดอัด
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
                    source={require("./assets/logo.png")}
                    style={{
                      width: 40, // ปรับความกว้างให้พอดีกับ icon
                      height: 40,
                      resizeMode: "contain",
                      marginRight: 10, // เว้นระยะห่างจากตัวหนังสือ
                    }}
                  />
                  <Text
                    style={{
                      color: "#FFF",
                      fontSize: 18,
                      fontWeight: "bold",
                    }}
                  >
                    Planner
                  </Text>
                </View>
              ),
              headerStyle: {
                backgroundColor: "#FF748C", // สีชมพูคุมโทนเดิม
                height: 100, // เพิ่มความสูงเล็กน้อยเพื่อให้ Logo ไม่ดูอึดอัด
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
                    source={require("./assets/logo.png")}
                    style={{
                      width: 40, // ปรับความกว้างให้พอดีกับ icon
                      height: 40,
                      resizeMode: "contain",
                      marginRight: 10, // เว้นระยะห่างจากตัวหนังสือ
                    }}
                  />
                  <Text
                    style={{
                      color: "#FFF",
                      fontSize: 18,
                      fontWeight: "bold",
                    }}
                  >
                    Profile
                  </Text>
                </View>
              ),
              headerStyle: {
                backgroundColor: "#FF748C", // สีชมพูคุมโทนเดิม
                height: 100, // เพิ่มความสูงเล็กน้อยเพื่อให้ Logo ไม่ดูอึดอัด
              },
            }}
          />
        </Tab.Navigator>
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
    backgroundColor: "#FFF0F3", // พื้นหลังสีชมพูอ่อนมากตอนกดเลือก
  },
});

export default App;
