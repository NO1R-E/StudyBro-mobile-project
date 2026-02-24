import React, { useState, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Feather from '@expo/vector-icons/Feather';
import { useFonts, Inter_400Regular, Inter_700Bold } from "@expo-google-fonts/inter";
import Entypo from '@expo/vector-icons/Entypo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRoute } from '@react-navigation/native';

const Dashboard = ({ navigation }) => {
  const route = useRoute();
  const [userName, setUserName] = useState("ผู้ใช้");

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

  useEffect(() => {
    if (route.params?.userName) {
      setUserName(route.params.userName);
    }
  }, [route.params?.userName]);

  // โหลดและคำนวณข้อมูลทุกครั้งที่สลับมาหน้า Dashboard
  useFocusEffect(
    useCallback(() => {
      const fetchData = async () => {
        try {
          const savedTasks = await AsyncStorage.getItem('@my_tasks');
          const parsedTasks = savedTasks ? JSON.parse(savedTasks) : [];
          
          const savedTimetable = await AsyncStorage.getItem('@my_timetable');
          const parsedSemesters = savedTimetable ? JSON.parse(savedTimetable) : [];

          calculateUpcomingActivities(parsedTasks);
          calculateNextClass(parsedSemesters);
          calculateUpcomingExams(parsedSemesters);

        } catch (error) {
          console.error("Load Dashboard Data Failed", error);
        }
      };

      fetchData();
    }, [])
  );

  const calculateUpcomingActivities = (tasksData) => {
    const now = new Date();
    const sevenDaysLater = new Date();
    sevenDaysLater.setDate(now.getDate() + 7);

    const upcoming = tasksData.filter((task) => {
      if (task.status !== 'pending') return false;
      const taskDate = new Date(task.endTimeMs);
      return taskDate >= now && taskDate <= sevenDaysLater;
    });

    setUpcomingActivities(upcoming);
  };

  const calculateNextClass = (semestersData) => {
    const now = new Date();
    const currentDay = now.toLocaleDateString("en-US", { weekday: "long" });
    const currentTimeMinutes = now.getHours() * 60 + now.getMinutes();

    let allTodayClasses = [];

    semestersData.forEach(sem => {
      const todaySchedule = sem.days?.find(d => d.dayName === currentDay);
      if (todaySchedule) {
        todaySchedule.subjects?.forEach(sub => {
          if (sub.start) {
            const [h, m] = sub.start.split(":").map(Number);
            const startMinutes = h * 60 + m;
            if (startMinutes > currentTimeMinutes) {
              allTodayClasses.push({ ...sub, startMinutes });
            }
          }
        });
      }
    });

    allTodayClasses.sort((a, b) => a.startMinutes - b.startMinutes);
    setNextClass(allTodayClasses[0] || null);
  };

  const calculateUpcomingExams = (semestersData) => {
    const now = new Date();
    now.setHours(0,0,0,0);
    const sevenDaysLater = new Date(now);
    sevenDaysLater.setDate(now.getDate() + 7);

    let allExams = [];

    semestersData.forEach(sem => {
      sem.days?.forEach(day => {
        day.subjects?.forEach(sub => {
          if (sub.examDate) {
            let parsedDate;
            if (sub.examDate.includes('/')) {
              const parts = sub.examDate.split('/');
              if (parts.length === 3) {
                parsedDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`); 
              }
            } else {
              parsedDate = new Date(sub.examDate);
            }

            if (parsedDate && parsedDate >= now && parsedDate <= sevenDaysLater) {
              allExams.push(sub);
            }
          }
        });
      });
    });

    setUpcomingExams(allExams);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 100 }}>
      <View style={styles.welcomeSection}>
        <Text style={styles.welcomeText}>สวัสดี, คนดำ🥷</Text>
        <Text style={styles.dateText}>{formatDateOnly(currentDate)}</Text>
      </View>

      <View style={styles.quickAddSection}>
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.quickBtn} onPress={() => navigation.navigate("Timetable")}>
            <Ionicons name="calendar-outline" size={24} color="#FF748C" />
            <Text style={styles.quickBtnText}>เพิ่มวิชา</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickBtn} onPress={() => navigation.navigate("Planner")}>
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
            <Text style={[styles.roomText, { textAlign: 'center', margin: '10' }]}>ไม่มีเรียนแล้ววันนี้</Text>
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
                  {exam.examDate}  {exam.examStart} น. - {exam.examEnd} น.
                </Text>
                <Text style={styles.examName}>{exam.code} <Text style={styles.examDate}>หมู่</Text>  {exam.section}</Text>
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
                {activity.dateString} เวลา {activity.timeString.split('-')[0]}
              </Text>
              <Text style={styles.examName}>{activity.title}</Text>
              <Text style={styles.examName}>
                <Entypo name="location-pin" size={24} color="FFAAC9" /> {activity.category === 'study' ? 'อ่านหนังสือ' : 'อื่นๆ'}
              </Text>
            </View>
          ))
        ) : (
          <Text style={[styles.roomText, { textAlign: 'center', margin: 10 }]}>ไม่มีกิจกรรมในสัปดาห์นี้</Text>
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
  sectionTitle: { marginBottom: 15, fontSize: 18, fontWeight: "bold", color: "#4A4A4A", marginHorizontal: 15 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  tag: { backgroundColor: "rgba(255,255,255,0.25)", paddingHorizontal: 12, paddingVertical: 4, borderRadius: 10 },
  tagText: { color: "#FFF", fontSize: 12, fontWeight: "bold" },
  timeRange: { color: "#FFF", fontWeight: "600" },
  locationRow: { flexDirection: "row", alignItems: "center" },
  roomText: { color: "#EA3287", fontSize: 15, fontFamily: 'Inter_400Regular' },
  examSection: { marginBottom: 25 },
  examItem: { padding: 10, borderWidth: 1, borderRadius: 10, borderColor: "#da50503b", marginBottom: 10 },
  examIconBox: { backgroundColor: "#FFF0F3", padding: 10, borderRadius: 14, marginRight: 15 },
  examInfo: { flex: 1 },
  examName: { fontSize: 16, color: "#EA3287", fontFamily: 'Inter_400Regular' },
  examDate: { fontSize: 13, color: "#C7005C", marginTop: 2, fontFamily: 'Inter_700Bold' },
  emptyText: { color: "#FFB7C5", fontStyle: "italic", textAlign: "center" },
  quickAddSection: { marginBottom: 40 },
  buttonRow: { flexDirection: "row", justifyContent: "space-between" },
  quickBtn: { backgroundColor: "#FFF", flex: 0.48, padding: 15, borderRadius: 18, alignItems: "center", elevation: 3, borderWidth: 1.5, borderColor: "#FFDAE0" },
  card: { backgroundColor: "#FFF", flex: 0.48, marginBottom: 15, padding: 15, borderRadius: 18, elevation: 3, borderWidth: 1.5, borderColor: "#FFDAE0" },
  quickBtnText: { marginTop: 8, fontWeight: "600", color: "#FF748C" },
  nextClassCard: { backgroundColor: "#FFAAC9", padding: 15, borderRadius: 12, marginTop: 10 }, // แก้สีพื้นหลังให้อ่านง่าย
});

export default Dashboard;