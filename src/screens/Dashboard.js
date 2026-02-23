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
import Feather from '@expo/vector-icons/Feather';
import { useFonts, Inter_400Regular, Inter_700Bold } from "@expo-google-fonts/inter";
import Entypo from '@expo/vector-icons/Entypo';


const Dashboard = ({ navigation }) => {
  const [nextClass, setNextClass] = useState(null);
  const [upcomingExams, setUpcomingExams] = useState([]);
  const [upcomingActivities, setUpcomingActivities] = useState([]);
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_700Bold,
  });
  const [currentDate] = useState(new Date());
   const formatDateOnly = (date) => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('th-TH', options); 
  };

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
      day: "Sunday",
      name: "Digital Logic",
      start: "16:30",
      end: "18:30",
      room: "302",
    },
  ];

  const mockExams = [
    { id: "1", name: "Midterm Calculus I", date: "15/03/2003-02-20", timeStart: "09:00", timeEnd: "22:00", courseID: "01418497", sec: '700', examRoom: 'LH4-101' },
    { id: "2", name: "Physics Quiz", date: "2026-02-22", timeStart: "13:00", timeEnd: "14:00", courseID: "01418497", sec: '700', examRoom: 'LH4-101' },
    { id: "3", name: "English Final", date: "2026-03-15", timeStart: "10:00", timeEnd: "12:00", courseID: "01418497", sec: '700', examRoom: 'LH4-101' },
  ];
  const mockActivities = [
    {
      id: "1",
      title: "ทำ Assignment React",
      date: "2026-02-23",
      time: "20:00",
      location: "หอพัก",
      type: "Study",
    },
    {
      id: "2",
      title: "โปรเจค StartUp",
      date: "2026-02-25",
      time: "18:00",
      location: "Zoom",
      type: "Meeting",
    },
    {
      id: "3",
      title: "ออกกำลังกาย",
      date: "2026-03-01",
      time: "17:00",
      location: "ฟิตเนส",
      type: "Health",
    },
  ];

  useEffect(() => {
    calculateNextClass();
    calculateUpcomingExams();
    calculateUpcomingActivities();
  }, []);

  const calculateUpcomingActivities = () => {
    const now = new Date();
    const sevenDaysLater = new Date();
    sevenDaysLater.setDate(now.getDate() + 7);

    const upcoming = mockActivities.filter((activity) => {
      const activityDate = new Date(activity.date);
      return activityDate >= now && activityDate <= sevenDaysLater;
    });

    setUpcomingActivities(upcoming);
  };
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
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 100 }}>
      {/* Header - Welcome Section */}
      <View style={styles.welcomeSection}>
        <Text style={styles.welcomeText}>สวัสดี, คนดำ🥷</Text>
        
        {/* ดึงเวลามาตรงนี้นะ*/}
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


      <View style={styles.card}>
        <View style={{ flexDirection: 'row' }}>
          <Feather name="book-open" size={30} color="#FFAAC9" />
          <Text style={styles.sectionTitle}>คาบเรียนถัดไป</Text>
        </View>
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
            <Text style={styles.roomText}>{nextClass.name}</Text>
            <View style={styles.locationRow}>
              <Ionicons name="location" size={16} color="#FFF" />
              <Text style={styles.roomText}> ห้องเรียน: {nextClass.room}</Text>
            </View>
          </TouchableOpacity>
        ) : (
          <View style={[styles.nextClassCard]}>
            <Text style={[styles.roomText, { textAlign: 'center', margin: '10' }]}>
              ไม่มีเรียนแล้ววันนี้
            </Text>
            {/* //nigga wat */}
          </View>
        )}
      </View>

      <View style={styles.card}>
        <View style={{ flexDirection: 'row' }}>
          <Feather name="alert-circle" size={30} color="#FFAAC9" />
          <Text style={styles.sectionTitle}>สอบที่ใกล้จะถึง</Text>
        </View>
        {upcomingExams.length > 0 ? (
          upcomingExams.map((exam) => (
            <View key={exam.id} style={styles.examItem}>
              <View style={styles.examInfo}>
                <Text style={styles.examDate}>
                  {exam.date}  {exam.timeStart} น. - {exam.timeEnd} น.
                </Text>
                <Text style={styles.examName}>{exam.courseID} <Text style={styles.examDate}>หมู่</Text>  {exam.sec}</Text>
                <Text style={styles.examName}>{exam.name}</Text>
                <Text style={styles.examName}><Text style={styles.examDate}>ห้อง</Text> {exam.examRoom}</Text>
              </View>
            </View>
          ))
        ) : (
          <Text style={[styles.roomText, { textAlign: 'center', margin: '10' }]}>ไม่มีสอบในสัปดาห์นี้</Text>
        )}
      </View>

      <View style={styles.card}>
        <View style={{ flexDirection: 'row' }}>
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
                <Text style={styles.examDate}><Entypo name="location-pin" size={24} color="FFAAC9" /></Text> {activity.location}
              </Text>
            </View>
          ))
        ) : (
          <Text style={[styles.roomText, { textAlign: 'center', margin: 10 }]}>
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
    marginHorizontal: 15
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
  roomText: { color: "#EA3287", fontSize: 15, fontFamily: 'Inter_400Regular' },

  // Exam List Pink Style
  examSection: { marginBottom: 25 },
  examItem: {
    padding: 10,
    borderWidth: 1,
    borderRadius: 10,
    borderColor: "#da50503b"
  },
  examIconBox: {
    backgroundColor: "#FFF0F3",
    padding: 10,
    borderRadius: 14,
    marginRight: 15,
  },
  examInfo: { flex: 1 },
  examName: { fontSize: 16, color: "#EA3287", fontFamily: 'Inter_400Regular' },
  examDate: { fontSize: 13, color: "#C7005C", marginTop: 2, fontFamily: 'Inter_700Bold' },
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
