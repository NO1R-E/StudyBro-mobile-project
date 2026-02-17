import React from "react";
import { StyleSheet } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";

import Dashboard from "./src/screens/Dashboard";
import Timetable from "./src/screens/Timetable";
import Planner from "./src/screens/Planner";
import Profile from "./src/screens/Profile";

const Tab = createBottomTabNavigator();

const App = () => {
  return (
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
              iconName = focused ? "list" : "list-outline";
            } else if (route.name === "Profile") {
              iconName = focused ? "person" : "person-outline";
            }

            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: "#6C5CE7",
          tabBarInactiveTintColor: "gray",
          headerStyle: { backgroundColor: "#6C5CE7" },
          headerTintColor: "#fff",
          headerTitleStyle: { fontWeight: "bold" },
        })}
      >
        <Tab.Screen
          name="Home"
          component={Dashboard}
          options={{ title: "Dashboard" }}
        />
        <Tab.Screen
          name="Academic"
          component={Timetable}
          options={{ title: "ตารางเรียน" }}
        />
        <Tab.Screen
          name="Planner"
          component={Planner}
          options={{ title: "แผนการเรียน" }}
        />
        <Tab.Screen
          name="Profile"
          component={Profile}
          options={{ title: "ข้อมูลส่วนตัว" }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
});
export default App;
