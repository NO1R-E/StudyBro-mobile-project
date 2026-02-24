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
import {
  useFonts,
  Inter_400Regular,
  Inter_700Bold,
} from "@expo-google-fonts/inter";
import Entypo from "@expo/vector-icons/Entypo";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const Dashboard = ({ navigation }) => {
  const [userName, setUserName] = useState("ผู้ใช้");

  const [userTable, setUserTable] = useState([]);
  const [tableList, setTableList] = useState([]);

  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        try {
          const savedTable = await AsyncStorage.getItem("user_table");
          const savedTableList = await AsyncStorage.getItem("user_table_list");

          if (savedTable) {
            const parsedTable = JSON.parse(savedTable);
            setUserTable(parsedTable);
            // FIX: Pass the parsed data directly to the function
            calculateNextClass(parsedTable);
          }

          if (savedTableList) setTableList(JSON.parse(savedTableList));
        } catch (error) {
          console.error("Failed to load data on Dashboard", error);
        }
      };

      loadData();
    }, []),
  );
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

  // ข้อมูลจำลอง (วิชาเรียน)
  const mockClasses = [
    {
      id: "1",
      name: "Midterm Calculus I",
      date: "15/03/2003-02-20",
      timeStart: "09:00",
      timeEnd: "22:00",
      courseID: "01418497",
      sec: "700",
      examRoom: "LH4-101",
    },
    {
      id: "2",
      day: "Sunday",
      name: "Digital Logic",
      start: "16:30",
      end: "18:30",
      room: "302",
    },
  ];

  const mockExams = [
    {
      id: "1",
      name: "Midterm Calculus I",
      date: "15/03/2003-02-20",
      timeStart: "09:00",
      timeEnd: "22:00",
      courseID: "01418497",
      sec: "700",
      examRoom: "LH4-101",
    },
    {
      id: "2",
      name: "Physics Quiz",
      date: "2026-02-22",
      timeStart: "13:00",
      timeEnd: "14:00",
      courseID: "01418497",
      sec: "700",
      examRoom: "LH4-101",
    },
    {
      id: "3",
      name: "English Final",
      date: "2026-03-15",
      timeStart: "10:00",
      timeEnd: "12:00",
      courseID: "01418497",
      sec: "700",
      examRoom: "LH4-101",
    },
  ];
  const mockActivities = [
    {
      id: "1",
      name: "Midterm Calculus I",
      date: "15/03/2003-02-20",
      timeStart: "09:00",
      timeEnd: "22:00",
      courseID: "01418497",
      sec: "700",
      examRoom: "LH4-101",
    },
    {
      id: "2",
      name: "Physics Quiz",
      date: "2026-02-22",
      timeStart: "13:00",
      timeEnd: "14:00",
      courseID: "01418497",
      sec: "700",
      examRoom: "LH4-101",
    },
    {
      id: "3",
      name: "English Final",
      date: "2026-03-15",
      timeStart: "10:00",
      timeEnd: "12:00",
      courseID: "01418497",
      sec: "700",
      examRoom: "LH4-101",
    },
  ];

  useEffect(() => {
    calculateNextClass();
    calculateUpcomingExams();
    calculateUpcomingActivities();
  }, []);

  useFocusEffect(
    useCallback(() => {
      const fetchTasks = async () => {
        try {
          const savedTasks = await AsyncStorage.getItem("myTasks");
          if (savedTasks) {
            setTasks(JSON.parse(savedTasks));
            console.log(JSON.parse(savedTasks));
          }
        } catch (error) {
          console.error("ดึงข้อมูลมา Dashboard ล้มเหลว", error);
        }
      };
      fetchTasks();
    }, []),
  );

  // ดึงข้อมูล Profile ทุกครั้งที่เปิดมาหน้านี้
  useFocusEffect(
    useCallback(() => {
      const fetchProfile = async () => {
        try {
          const savedProfile = await AsyncStorage.getItem("myProfile");
          if (savedProfile) {
            const profile = JSON.parse(savedProfile);
            setUserName(profile.name || "ผู้ใช้");
          }
        } catch (error) {
          console.error("ดึงข้อมูลมา Dashboard ล้มเหลว", error);
        }
      };
      fetchProfile();
    }, []),
  );

  // ดึงข้อมูล Profile ทุกครั้งที่เปิดมาหน้านี้
  useFocusEffect(
    useCallback(() => {
      const fetchProfile = async () => {
        try {
          const savedProfile = await AsyncStorage.getItem("myProfile");
          if (savedProfile) {
            const profile = JSON.parse(savedProfile);
            setUserName(profile.name || "ผู้ใช้");
          }
        } catch (error) {
          console.error("ดึงข้อมูลมา Dashboard ล้มเหลว", error);
        }
      };
      fetchProfile();
    }, []),
  );

  const getMinutesWithOffset = (offsetHours = 0) => {
    const now = new Date();
    // We add the offset and set minutes to 0 if you want to check "Top of the hour"
    // or leave as is for a rolling window.
    return (now.getHours() + offsetHours) * 60 + now.getMinutes();
  };
  const calculateNextClass = () => {
    const now = new Date();
    const currentDay = now.toLocaleDateString("en-US", { weekday: "long" });

    // Use the helper to define your window
    const startTimeLimit = getMinutesWithOffset(0); // Current time
    const endTimeLimit = getMinutesWithOffset(24); // 2 hours from now

    console.log(
      `Searching for classes between minutes: ${startTimeLimit} and ${endTimeLimit}`,
    );
    console.log("Current Table Data:\n", JSON.stringify(data, null, 2));
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
    console.log("Next class found:", result);
  };

  // คำนวณวันสอบที่ใกล้จะถึง
  const calculateUpcomingExams = () => {
    const now = new Date();
    const sevenDaysLater = new Date();
    sevenDaysLater.setDate(now.getDate() + 7);

    const upcoming = mockExams.filter((exam) => {
      const examDate = new Date(exam.date);
      return examDate >= now && examDate <= sevenDaysLater;
    });

    setUpcomingExams(upcoming);
  };


  // คำนวณกิจกรรมที่จะถึงใน 7 วัน (ดึงจาก Planner แทน Mock)
  const calculateUpcomingActivities = () => {
    const now = new Date();
    const sevenDaysLater = new Date();
    sevenDaysLater.setDate(now.getDate() + 7);

    const upcoming = tasks.filter((activity) => {
      const activityDate = new Date(activity.endTimeMs);

      const isInNext7Days =
        activityDate >= now && activityDate <= sevenDaysLater;

      const isPending = activity.status === "pending";

      return isInNext7Days && isPending;
    });

    setUpcomingActivities(upcoming);
  };

  // เรียกใช้ฟังก์ชันคำนวณใหม่ทุกครั้งที่ข้อมูล tasks อัปเดต
  useEffect(() => {
    calculateNextClass();
    calculateUpcomingExams();
    calculateUpcomingActivities();
  }, [tasks]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 100 }}
    >
      {/* Header - Welcome Section */}
      <View style={styles.welcomeSection}>
        <Text style={styles.welcomeText}>สวัสดี, {userName} </Text>
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
              {nextClass.code} {nextClass.name}
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

      <View style={styles.card}>
        <View style={{ flexDirection: "row" }}>
          <Feather name="alert-circle" size={30} color="#FFAAC9" />
          <Text style={styles.sectionTitle}>สอบที่ใกล้จะถึง</Text>
        </View>
        {upcomingExams.length > 0 ? (
          upcomingExams.map((exam) => (
            <View key={exam.id} style={styles.examItem}>
              <View style={styles.examInfo}>
                <Text style={styles.examDate}>
                  {exam.date} {exam.timeStart} น. - {exam.timeEnd} น.
                </Text>
                <Text style={styles.examName}>
                  {exam.courseID} <Text style={styles.examDate}>หมู่</Text>{" "}
                  {exam.sec}
                </Text>
                <Text style={styles.examName}>{exam.name}</Text>
                <Text style={styles.examName}>
                  <Text style={styles.examDate}>ห้อง</Text> {exam.examRoom}
                </Text>
              </View>
            </View>
          ))
        ) : (
          <Text
            style={[styles.roomText, { textAlign: "center", margin: "10" }]}
          >
            ไม่มีสอบในสัปดาห์นี้
          </Text>
        )}
      </View>

      <View style={styles.card}>
        <View style={{ flexDirection: "row" }}>
          <Feather name="clipboard" size={30} color="#FFAAC9" />
          <Text style={styles.sectionTitle}>วางแผนกิจกรรม</Text>
        </View>

        {upcomingActivities.length > 0 ? (
          upcomingActivities.map((activity) => (
            <View key={activity.id} style={styles.examItem}>
              <Text style={styles.examDate}>
                {activity.dateString} เวลา {activity.timeString}
              </Text>
              <Text style={styles.examName}>{activity.title}</Text>
              <Text style={styles.examName}>
                <Text style={styles.examDate}>
                  <Entypo name="location-pin" size={24} color="#FFAAC9" />
                </Text>{" "}
                หมวดหมู่:{" "}
                {activity.category === "study" ? "อ่านหนังสือ" : "อื่นๆ"}
              </Text>
            </View>
          ))
        ) : (
          <Text style={[styles.roomText, { textAlign: "center", margin: 10 }]}>
            ไม่มีกิจกรรมในสัปดาห์นี้
          </Text>
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

  // Quick Add Pink Style
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
});

export default Dashboard;
