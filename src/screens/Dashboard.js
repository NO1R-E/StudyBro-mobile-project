import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Feather from "@expo/vector-icons/Feather";
import {
  useFonts,
  Inter_400Regular,
  Inter_700Bold,
} from "@expo-google-fonts/inter";
import Entypo from "@expo/vector-icons/Entypo";

const Dashboard = ({ navigation, route }) => {
  const subjects = route?.params?.subjects ?? null;
  const [nextClass, setNextClass] = useState(null);
  const [upcomingExams, setUpcomingExams] = useState([]);
  const [nextClasses, setNextClasses] = useState([]);
  const [upcomingActivities, setUpcomingActivities] = useState([]);
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_700Bold,
  });
  const today = new Date();

  const thaiDate = today.toLocaleDateString("th-TH", {
    weekday: "long",
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const calculateNextClasses = () => {
    if (!subjects || subjects.length === 0) {
      setNextClasses([]);
      setNextClass(null);
      return;
    }

    const now = new Date();
    const currentDay = now.getDay(); // 0-6
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const dayMap = {
      Sunday: 0,
      Monday: 1,
      Tuesday: 2,
      Wednesday: 3,
      Thursday: 4,
      Friday: 5,
      Saturday: 6,
    };

    const upcoming = subjects.map((sub) => {
      const classDay = dayMap[sub.dayName];

      const [h, m] = sub.start.split(":").map(Number);
      const classMinutes = h * 60 + m;

      let diffDays = classDay - currentDay;

      if (diffDays < 0) diffDays += 7;

      let diffMinutes = diffDays * 24 * 60 + (classMinutes - currentMinutes);

      if (diffMinutes < 0) diffMinutes += 7 * 24 * 60;

      return {
        ...sub,
        diffMinutes,
      };
    });

    upcoming.sort((a, b) => a.diffMinutes - b.diffMinutes);

    setNextClasses(upcoming);
    setNextClass(upcoming[0]);
  };
  useEffect(() => {
    console.log("===== SUBJECTS CHANGED =====");

    if (!subjects) {
      console.log("Subjects is NULL");
      return;
    }

    console.log("Subjects length:", subjects.length);
    console.table(subjects);
  }, [subjects]);

  //อัพเดตอัตโนมัติทุกนาที
  useEffect(() => {
    if (subjects) {
      calculateNextClasses();
    }
  }, [subjects]);
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 100 }}
    >
      {/* Header - Welcome Section */}
      <View style={styles.welcomeSection}>
        <Text style={styles.welcomeText}>สวัสดี, คนดำ🥷 </Text>
        <Text style={styles.dateText}>{thaiDate}</Text>
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

      <View style={styles.card}>
        <View style={{ flexDirection: "row" }}>
          <Feather name="book-open" size={30} color="#FFAAC9" />
          <Text style={styles.sectionTitle}>คาบเรียนถัดไป</Text>
        </View>
        {nextClasses && nextClasses.length > 0 ? (
          <TouchableOpacity style={styles.nextClassCard}>
            <View style={styles.cardHeader}>
              <View style={styles.tag}>
                <Text style={styles.tagText}>Soon</Text>
              </View>

              <Text style={styles.timeRange}>
                {nextClasses[0].start} - {nextClasses[0].end}
              </Text>
            </View>

            <Text style={styles.roomText}>{nextClasses[0].name}</Text>

            <View style={styles.locationRow}>
              <Ionicons name="location" size={16} color="#000000" />
              <Text style={styles.roomText}>
                ห้องเรียน: {nextClasses[0].room}
              </Text>
            </View>
          </TouchableOpacity>
        ) : (
          <View style={styles.nextClassCard}>
            <Text
              style={[styles.roomText, { textAlign: "center", margin: 10 }]}
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
                {activity.date} เวลา {activity.time}
              </Text>
              <Text style={styles.examName}>{activity.title}</Text>
              <Text style={styles.examName}>
                <Text style={styles.examDate}>
                  <Entypo name="location-pin" size={24} color="FFAAC9" />
                </Text>{" "}
                {activity.location}
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
