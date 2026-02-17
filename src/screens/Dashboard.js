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

const Dashboard = ({ navigation }) => {
  const [nextClass, setNextClass] = useState(null);
  const [upcomingExams, setUpcomingExams] = useState([]);

  // ข้อมูลจำลอง
  const mockClasses = [
    {
      id: "1",
      day: "Tuesday",
      name: "Computer Programming",
      start: "13:00",
      end: "16:00",
      room: "405",
    },
    {
      id: "2",
      day: "Tuesday",
      name: "Digital Logic",
      start: "16:30",
      end: "18:30",
      room: "302",
    },
  ];

  const mockExams = [
    { id: "1", name: "Midterm Calculus I", date: "2026-02-20", time: "09:00" },
    { id: "2", name: "Physics Quiz", date: "2026-02-22", time: "13:00" },
    { id: "3", name: "English Final", date: "2026-03-15", time: "10:00" },
  ];

  useEffect(() => {
    calculateNextClass();
    calculateUpcomingExams();
  }, []);

  const calculateNextClass = () => {
    const now = new Date();
    const currentDay = now.toLocaleDateString("en-US", { weekday: "long" });
    const currentTime = now.getHours() * 60 + now.getMinutes();

    const todayClasses = mockClasses
      .filter((c) => c.day === currentDay)
      .map((c) => {
        const [h, m] = c.start.split(":").map(Number);
        return { ...c, startMinutes: h * 60 + m };
      })
      .filter((c) => c.startMinutes > currentTime)
      .sort((a, b) => a.startMinutes - b.startMinutes);

    setNextClass(todayClasses[0] || null);
  };

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

  return (
    <ScrollView style={styles.container}>
      {/* Header - Welcome Section */}
      <View style={styles.welcomeSection}>
        <Text style={styles.welcomeText}>สวัสดี, สมหญิง 🌸</Text>
        <Text style={styles.dateText}>วันอังคารที่ 17 ก.พ. 2026</Text>
      </View>

      {/* 1. Next Class Card - Pink Theme */}
      <Text style={styles.sectionTitle}>วิชาถัดไปที่ต้องเข้าเรียน</Text>
      {nextClass ? (
        <TouchableOpacity style={styles.nextClassCard}>
          <View style={styles.cardHeader}>
            <View style={styles.tag}>
              <Text style={styles.tagText}>Soon</Text>
            </View>
            <Text style={styles.timeRange}>
              {nextClass.start} - {nextClass.end}
            </Text>
          </View>
          <Text style={styles.className}>{nextClass.name}</Text>
          <View style={styles.locationRow}>
            <Ionicons name="location" size={16} color="#FFF" />
            <Text style={styles.roomText}> ห้องเรียน: {nextClass.room}</Text>
          </View>
        </TouchableOpacity>
      ) : (
        <View style={[styles.nextClassCard, { backgroundColor: "#FFB7C5" }]}>
          <Text style={styles.className}>ไม่มีเรียนแล้ววันนี้ ✨</Text>
          <Text style={styles.roomText}>พักผ่อนให้เต็มที่นะจ๊ะ!</Text>
        </View>
      )}

      {/* 2. Upcoming Exams - Soft Pink List */}
      <View style={styles.examSection}>
        <Text style={styles.sectionTitle}>สอบที่ใกล้จะถึง (7 วัน)</Text>
        {upcomingExams.length > 0 ? (
          upcomingExams.map((exam) => (
            <View key={exam.id} style={styles.examItem}>
              <View style={styles.examIconBox}>
                <Ionicons name="medal-outline" size={24} color="#FF748C" />
              </View>
              <View style={styles.examInfo}>
                <Text style={styles.examName}>{exam.name}</Text>
                <Text style={styles.examDate}>
                  {exam.date} • {exam.time} น.
                </Text>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>ไม่มีสอบในสัปดาห์นี้ เย้!</Text>
        )}
      </View>

      {/* 3. Quick Add Buttons - Border Pink Style */}
      <View style={styles.quickAddSection}>
        <Text style={styles.sectionTitle}>เมนูด่วน</Text>
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.quickBtn}
            onPress={() => navigation.navigate("Academic")}
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
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF0F3", padding: 20 },
  welcomeSection: { marginBottom: 25 },
  welcomeText: { fontSize: 26, fontWeight: "bold", color: "#4A4A4A" },
  dateText: { fontSize: 16, color: "#FF8C9E", marginTop: 5 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#4A4A4A",
    marginBottom: 12,
    marginTop: 10,
  },

  // Next Class Card Pink
  nextClassCard: {
    backgroundColor: "#FF748C",
    borderRadius: 25,
    padding: 20,
    marginBottom: 25,
    elevation: 4,
    shadowColor: "#FF748C",
    shadowOpacity: 0.3,
    shadowRadius: 10,
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
  className: {
    color: "#FFF",
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 10,
  },
  locationRow: { flexDirection: "row", alignItems: "center" },
  roomText: { color: "#FFF", fontSize: 14, opacity: 0.95 },

  // Exam List Pink Style
  examSection: { marginBottom: 25 },
  examItem: {
    backgroundColor: "#FFF",
    flexDirection: "row",
    padding: 15,
    borderRadius: 18,
    alignItems: "center",
    marginBottom: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#FFDAE0",
  },
  examIconBox: {
    backgroundColor: "#FFF0F3",
    padding: 10,
    borderRadius: 14,
    marginRight: 15,
  },
  examInfo: { flex: 1 },
  examName: { fontSize: 16, fontWeight: "bold", color: "#4A4A4A" },
  examDate: { fontSize: 13, color: "#FF8C9E", marginTop: 2 },
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
  quickBtnText: { marginTop: 8, fontWeight: "600", color: "#FF748C" },
});

export default Dashboard;
