import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Feather from "@expo/vector-icons/Feather";
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import {
  useFonts,
  Inter_400Regular,
  Inter_700Bold,
} from "@expo-google-fonts/inter";
import Entypo from "@expo/vector-icons/Entypo";
import { useRoute, useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const Dashboard = ({ navigation }) => {
  const route = useRoute();
  const [userName, setUserName] = useState("ผู้ใช้");
  const [activityFilter, setActivityFilter] = useState("today");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [userTable, setUserTable] = useState([]);
  const [tableList, setTableList] = useState([]);
  const [examList, setExamList] = useState([]);

  const [nextClass, setNextClass] = useState(null);
  const [upcomingExams, setUpcomingExams] = useState([]);
  const [upcomingActivities, setUpcomingActivities] = useState([]);
  const [tasks, setTasks] = useState([]);

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_700Bold,
  });

  const [currentDate] = useState(new Date());

  const formatDateOnly = (date) => {
    const options = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    return date.toLocaleDateString("th-TH", options);
  };

  // useEffect(() => {
  //   calculateNextClass();
  //   calculateUpcomingExams();
  //   calculateUpcomingActivities();
  // }, []);

  const loadData = async () => {
    try {
      const savedTable = await AsyncStorage.getItem("user_table");
      const savedTableList = await AsyncStorage.getItem("user_table_list");
      const savedExamList = await AsyncStorage.getItem("user_exams");
      const savedTasks = await AsyncStorage.getItem("myTasks");
      const savedProfile = await AsyncStorage.getItem("myProfile");

      // ===== ตารางเรียน =====
      if (savedTable) {
        const parsedTable = JSON.parse(savedTable);
        setUserTable(parsedTable);
        calculateNextClass(parsedTable);
      } else {
        setUserTable([]);
        setNextClass(null);
      }

      // ===== รายชื่อกลุ่ม =====
      if (savedTableList) {
        setTableList(JSON.parse(savedTableList));
      } else {
        setTableList([]);
      }

      // ===== ตารางสอบ =====
      if (savedExamList) {
        const parsedExams = JSON.parse(savedExamList);
        setExamList(parsedExams);
        calculateUpcomingExams(parsedExams);
      } else {
        setExamList([]);
        setUpcomingExams([]);
      }

      // ===== Planner Tasks =====
      if (savedTasks) {
        const parsedTasks = JSON.parse(savedTasks);
        setTasks(parsedTasks);
      } else {
        setTasks([]);
        setUpcomingActivities([]);
      }
      

      // ===== Profile =====
      if (savedProfile) {
        const profile = JSON.parse(savedProfile);
        setUserName(profile.name || "ผู้ใช้");
      } else {
        setUserName("ผู้ใช้");
      }
    } catch (error) {
      console.error("Failed to load Dashboard data", error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, []),
  );

  const getMinutesWithOffset = (offsetHours = 0) => {
    const now = new Date();
    // We add the offset and set minutes to 0 if you want to check "Top of the hour"
    // or leave as is for a rolling window.
    return (now.getHours() + offsetHours) * 60 + now.getMinutes();
  };
  const calculateNextClass = (data = userTable) => {
    if (!data || data.length === 0) return;
    const now = new Date();
    const currentDay = now.toLocaleDateString("en-US", { weekday: "long" });

    // Use the helper to define your window
    const startTimeLimit = getMinutesWithOffset(0); // Current time
    const endTimeLimit = getMinutesWithOffset(24); // 2 hours from now

    // console.log(
    //   `Searching for classes between minutes: ${startTimeLimit} and ${endTimeLimit}`,
    // );
    // console.log("Current Table Data:\n", JSON.stringify(data, null, 2));
    const todayClasses = data
      .filter((c) => c.day === currentDay)
      .map((c) => {
        let h,
          m = 0;
        if (c.start && String(c.start).includes(":")) {
          [h, m] = c.start.split(":").map(Number);
        } else {
          h = Number(c.start);
        }
        return { ...c, startMinutes: h * 60 + m };
      })
      .filter((c) => {
        // Flexible window: starts after now, but before the "hour limit"
        return (
          c.startMinutes >= startTimeLimit && c.startMinutes <= endTimeLimit
        );
      })
      .sort((a, b) => a.startMinutes - b.startMinutes);

    const result = todayClasses[0] || null;
    setNextClass(result);
    // console.log("Next class found:", result);
  };

  // คำนวณวันสอบที่ใกล้จะถึง
  const calculateUpcomingExams = (data = examList) => {
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Set to start of today for comparison
    // console.log("Current Table Data:\n", JSON.stringify(data, null, 2));
    const upcoming = data
      .filter((exam) => {
        if (!exam.examDate) return false;
        // Parse DD/MM/YYYY or YYYY-MM-DD
        const [day, month, year] = exam.examDate.split("/");
        const examDateObj = new Date(year, month - 1, day);
        return examDateObj >= now;
      })
      .sort((a, b) => {
        const [dayA, monthA, yearA] = a.examDate.split("/");
        const [dayB, monthB, yearB] = b.examDate.split("/");
        return (
          new Date(yearA, monthA - 1, dayA) - new Date(yearB, monthB - 1, dayB)
        );
      });

    setUpcomingExams(upcoming);
    // console.log(upcoming);
  };

  const calculateUpcomingActivities = () => {
    const now = new Date();

    const filtered = tasks.filter((activity) => {
      const activityDate = new Date(activity.endTimeMs);
      const isPending = activity.status === "pending";

      if (!isPending) return false;

      // 🔹 วันนี้
      if (activityFilter === "today") {
        return activityDate.toDateString() === now.toDateString();
      }

      // 🔹 สัปดาห์นี้
      if (activityFilter === "week") {
        const firstDayOfWeek = new Date(now);
        firstDayOfWeek.setDate(now.getDate() - now.getDay());

        const lastDayOfWeek = new Date(firstDayOfWeek);
        lastDayOfWeek.setDate(firstDayOfWeek.getDate() + 6);

        return activityDate >= firstDayOfWeek &&
          activityDate <= lastDayOfWeek;
      }

      // 🔹 เดือนนี้
      if (activityFilter === "month") {
        return (
          activityDate.getMonth() === now.getMonth() &&
          activityDate.getFullYear() === now.getFullYear()
        );
      }

      return false;
    });

    setUpcomingActivities(filtered);
  };
  const getEmptyMessage = () => {
    if (activityFilter === "today") {
      return "ไม่มีกิจกรรมในวันนี้";
    }
    if (activityFilter === "week") {
      return "ไม่มีกิจกรรมในสัปดาห์นี้";
    }
    if (activityFilter === "month") {
      return "ไม่มีกิจกรรมในเดือนนี้";
    }
    return "ไม่มีกิจกรรม";
  };
  useEffect(() => {
    calculateUpcomingActivities();
  }, [tasks, activityFilter]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 100 }}
    >
      {/* Header - Welcome Section */}
      <View style={styles.welcomeSection}>
        <Text style={styles.welcomeText}>สวัสดี, {userName}</Text>
        <Text style={styles.dateText}>{formatDateOnly(currentDate)}</Text>
      </View>

      <View style={styles.quickAddSection}>
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.quickBtn}
            onPress={() => navigation.navigate("Timetable")}
          >
            <Ionicons name="calendar-outline" size={24} color="#FF748C" />
            <Text style={styles.quickBtnText}>เพิ่มวิชา</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickBtn}
            onPress={() => navigation.navigate("Planner")}
          >
            <Ionicons name="heart-outline" size={24} color="#FF748C" />
            <Text style={styles.quickBtnText}>เพิ่มงาน</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* คาบเรียนถัดไป */}
      <View style={styles.card}>
        <View
          style={{
            flexDirection: "row",
            marginBottom: 15,
            alignItems: "center",
          }}
        >
          <Feather name="book-open" size={26} color="#C7005C" />
          <Text
            style={[
              styles.sectionTitle,
              {
                color: "#C7005C",
                borderLeftColor: "#C7005C",
                borderLeftWidth: 4,
                paddingLeft: 10,
                marginLeft: 10,
              },
            ]}
          >
            คาบเรียนถัดไป
          </Text>
        </View>

        {nextClass ? (
          <View
            style={[
              styles.nextClassCard,
              {
                backgroundColor: "#FDF2F8", // Pinkish background
                borderColor: "#FCCEE8", // Pink border
                borderWidth: 2,
                borderRadius: 12,
                padding: 15,
              },
            ]}
          >
            <View style={styles.cardHeader}>
              <View style={[styles.tag, { backgroundColor: "#EA3287" }]}>
                <Text style={styles.tagText}>Soon</Text>
              </View>
              <Text style={[styles.timeRange, { color: "#C7005C" }]}>
                {nextClass.start} - {nextClass.end}
              </Text>
            </View>

            <Text
              style={[
                styles.classNameText,
                {
                  color: "#EA3287",
                  fontSize: 18,
                  fontWeight: "bold",
                  marginVertical: 5,
                },
              ]}
            >
              {nextClass.code} {nextClass.name} ({nextClass.table})
            </Text>

            <View style={styles.locationRow}>
              <Ionicons name="location" size={16} color="#EA3287" />
              <Text style={[styles.roomText, { color: "#EA3287" }]}>
                {" "}
                ห้อง: {nextClass.room}
              </Text>
            </View>
          </View>
        ) : (
          <View
            style={{
              backgroundColor: "#FDF2F8",
              borderColor: "#FCCEE8",
              borderWidth: 2,
              borderRadius: 12,
              padding: 20,
              alignItems: "center",
            }}
          >
            <Feather name="coffee" size={24} color="#C7005C" />
            <Text
              style={{
                color: "#C7005C",
                marginTop: 5,
                fontFamily: "Inter_400Regular",
              }}
            >
              ไม่มีเรียนแล้ววันนี้
            </Text>
          </View>
        )}
      </View>

      {/* สอบที่ใกล้ที่สุด */}
      <View style={styles.card}>
        <View
          style={{
            flexDirection: "row",
            marginBottom: 15,
            alignItems: "center",
          }}
        >
          <Feather name="alert-circle" size={26} color="#C7005C" />
          <Text
            style={[
              styles.sectionTitle,
              {
                color: "#C7005C",
                borderLeftColor: "#C7005C",
                borderLeftWidth: 4,
                paddingLeft: 10,
                marginLeft: 10,
              },
            ]}
          >
            สอบที่ใกล้จะถึง
          </Text>
        </View>

        {upcomingExams.length > 0 ? (
          upcomingExams.map((exam) => (
            <View
              key={exam.id}
              style={{
                backgroundColor: "#FDF2F8",
                borderColor: "#FCCEE8",
                borderWidth: 2,
                borderRadius: 12,
                padding: 15,
                marginBottom: 10, // Added gap between multiple exams
              }}
            >
              <View style={styles.cardHeader}>
                <View style={[styles.tag, { backgroundColor: "#C7005C" }]}>
                  <Text style={styles.tagText}>Exam</Text>
                </View>
                <Text style={{ color: "#C7005C", fontWeight: "600" }}>
                  {exam.examDate}
                </Text>
              </View>

              <Text
                style={{
                  color: "#EA3287",
                  fontSize: 18,
                  fontWeight: "bold",
                  marginVertical: 5,
                }}
              >
                {exam.code} {exam.name} ({exam.table})
              </Text>

              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <View style={styles.locationRow}>
                  <Ionicons name="location" size={16} color="#EA3287" />
                  <Text style={{ color: "#EA3287", fontSize: 15 }}>
                    {" "}
                    ห้อง: {exam.room || "ติดต่อผู้สอน"}
                  </Text>
                </View>

                <Text
                  style={{ color: "#EA3287", fontSize: 14, fontWeight: "600" }}
                >
                  {exam.startTime} - {exam.endTime}
                </Text>
              </View>
            </View>
          ))
        ) : (
          <View
            style={{
              backgroundColor: "#FDF2F8",
              borderColor: "#FCCEE8",
              borderWidth: 2,
              borderRadius: 12,
              padding: 20,
              alignItems: "center",
            }}
          >
            <Feather name="smile" size={24} color="#C7005C" />
            <Text
              style={{
                color: "#C7005C",
                marginTop: 5,
                fontFamily: "Inter_400Regular",
              }}
            >
              ไม่มีสอบเร็วๆ นี้
            </Text>
          </View>
        )}
      </View>

      {/* วางแผนกิจกรรม */}
      <View style={styles.card}>
        <View
          style={{
            flexDirection: "row",
            marginBottom: 15,
            alignItems: "center",
          }}
        >
          <Feather name="clipboard" size={26} color="#C7005C" />
          <Text
            style={[
              styles.sectionTitle,
              {
                color: "#C7005C",
                borderLeftColor: "#C7005C",
                borderLeftWidth: 4,
                paddingLeft: 10,
                marginLeft: 10,
              },
            ]}
          >
            วางแผนกิจกรรม
          </Text>
          <TouchableOpacity
            onPress={() => setShowFilterDropdown(!showFilterDropdown)}
            style={{
              marginLeft: "auto",
              backgroundColor: "#F3F3F3",
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 20,
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <Text style={{ marginRight: 5 }}>
              {activityFilter === "today"
                ? "วันนี้"
                : activityFilter === "week"
                  ? "สัปดาห์นี้"
                  : "เดือนนี้"}
            </Text>
            <MaterialIcons name="keyboard-arrow-down" size={20} />
          </TouchableOpacity>
        </View>
        {showFilterDropdown && (
          <View
            style={{
              position: "absolute",
              top: 45,          // ปรับตามตำแหน่ง header
              right: 0,
              backgroundColor: "white",
              borderRadius: 10,
              paddingVertical: 5,
              width: 150,
              elevation: 5,     // Android shadow
              zIndex: 1000,     // iOS
            }}
          >
            <TouchableOpacity
              style={{ padding: 12 }}
              onPress={() => {
                setActivityFilter("today");
                setShowFilterDropdown(false);
              }}
            >
              <Text>วันนี้</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{ padding: 12 }}
              onPress={() => {
                setActivityFilter("week");
                setShowFilterDropdown(false);
              }}
            >
              <Text>สัปดาห์นี้</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{ padding: 12 }}
              onPress={() => {
                setActivityFilter("month");
                setShowFilterDropdown(false);
              }}
            >
              <Text>เดือนนี้</Text>
            </TouchableOpacity>
          </View>
        )}
        {upcomingActivities.length > 0 ? (
          upcomingActivities.map((activity) => (
            <View
              key={activity.id}
              style={{
                backgroundColor: "#FDF2F8",
                borderColor: "#FCCEE8",
                borderWidth: 2,
                borderRadius: 12,
                padding: 15,
                marginBottom: 10,
              }}
            >
              <View style={styles.cardHeader}>
                <View style={[styles.tag, { backgroundColor: "#EA3287" }]}>
                  <Text style={styles.tagText}>Activity</Text>
                </View>
                <Text style={{ color: "#C7005C", fontWeight: "600" }}>
                  {activity.dateString}
                </Text>
              </View>

              <Text
                style={{
                  color: "#EA3287",
                  fontSize: 18,
                  fontWeight: "bold",
                  marginVertical: 5,
                }}
              >
                {activity.title}
              </Text>

              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <View style={styles.locationRow}>
                  <Ionicons name="location" size={16} color="#EA3287" />
                  <Text style={{ color: "#EA3287", fontSize: 15 }}>
                    {" "}
                    สถานที่: {activity.location || "ไม่ได้ระบุ"}
                  </Text>
                </View>

                <Text
                  style={{ color: "#EA3287", fontSize: 14, fontWeight: "600" }}
                >
                  {activity.timeString.split("-")[0]} น.
                </Text>
              </View>
            </View>
          ))
        ) : (
          <View
            style={{
              backgroundColor: "#FDF2F8",
              borderColor: "#FCCEE8",
              borderWidth: 2,
              borderRadius: 12,
              padding: 20,
              alignItems: "center",
            }}
          >
            <Feather name="calendar" size={24} color="#C7005C" />
            <Text
              style={{
                color: "#C7005C",
                marginTop: 5,
                fontFamily: "Inter_400Regular",
              }}
            >
              {getEmptyMessage()}
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF0F3", padding: 20 },
  welcomeSection: { marginBottom: 25 },
  welcomeText: { fontSize: 26, fontWeight: "bold", color: "#4A4A4A" },
  dateText: { fontSize: 16, color: "#FF8C9E", marginTop: 5 },
  sectionTitle: {
    marginBottom: 15,
    fontSize: 18,
    fontWeight: "bold",
    color: "#4A4A4A",
    marginHorizontal: 15,
  },

  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  tag: {
    backgroundColor: "rgba(255,255,255,0.25)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
  },
  tagText: { color: "#FFF", fontSize: 12, fontWeight: "bold" },
  timeRange: { color: "#FFF", fontWeight: "600" },
  locationRow: { flexDirection: "row", alignItems: "center" },
  roomText: { color: "#EA3287", fontSize: 15, fontFamily: "Inter_400Regular" },

  // Exam List Pink Style
  examSection: { marginBottom: 25 },
  examItem: {
    padding: 10,
    borderWidth: 1,
    borderRadius: 10,
    borderColor: "#da50503b",
  },
  examIconBox: {
    backgroundColor: "#FFF0F3",
    padding: 10,
    borderRadius: 14,
    marginRight: 15,
  },
  examInfo: { flex: 1 },
  examName: { fontSize: 16, color: "#EA3287", fontFamily: "Inter_400Regular" },
  examDate: {
    fontSize: 13,
    color: "#C7005C",
    marginTop: 2,
    fontFamily: "Inter_700Bold",
  },
  emptyText: { color: "#FFB7C5", fontStyle: "italic", textAlign: "center" },
  quickAddSection: { marginBottom: 40 },
  buttonRow: { flexDirection: "row", justifyContent: "space-between" },
  quickBtn: {
    backgroundColor: "#FFF",
    flex: 0.48,
    padding: 15,
    borderRadius: 18,
    alignItems: "center",
    elevation: 3,
    borderWidth: 1.5,
    borderColor: "#FFDAE0",
  },
  card: {
    backgroundColor: "#FFF",
    flex: 0.48,
    marginBottom: 15,
    padding: 15,
    borderRadius: 18,
    elevation: 3,
    borderWidth: 1.5,
    borderColor: "#FFDAE0",
  },
  quickBtnText: { marginTop: 8, fontWeight: "600", color: "#FF748C" },
  nextClassCard: {
    backgroundColor: "#FFAAC9",
    padding: 15,
    borderRadius: 12,
    marginTop: 10,
  }, // แก้สีพื้นหลังให้อ่านง่าย
});

export default Dashboard;
