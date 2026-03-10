import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Feather from "@expo/vector-icons/Feather";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import {
  useFonts,
  Inter_400Regular,
  Inter_700Bold,
} from "@expo-google-fonts/inter";
import Entypo from "@expo/vector-icons/Entypo";
import { useRoute, useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Foundation from "@expo/vector-icons/Foundation";
import { Picker } from "@react-native-picker/picker";
import DateTimePicker from "@react-native-community/datetimepicker";

// นำเข้า Firebase และ helper (กรุณาเช็ค path ให้ตรงกับโปรเจกต์ของคุณ)
import { doc, setDoc } from "firebase/firestore";
import { db, auth } from "../../firebaseConfig";
import isOverlapping from "../helper/isOverlapping";

const Dashboard = ({ navigation }) => {
  const route = useRoute();
  const [userName, setUserName] = useState("ผู้ใช้");
  const [activityFilter, setActivityFilter] = useState("today");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  // ข้อมูลต่างๆ จาก AsyncStorage
  const [userTable, setUserTable] = useState([]);
  const [tableList, setTableList] = useState([]);
  const [examList, setExamList] = useState([]);
  const [tasks, setTasks] = useState([]);

  // สิ่งที่จะแสดงใน Dashboard
  const [nextClass, setNextClass] = useState(null);
  const [upcomingExams, setUpcomingExams] = useState([]);
  const [upcomingActivities, setUpcomingActivities] = useState([]);

  // ================= STATE สำหรับ MODAL เพิ่มวิชา =================
  const [modalSubjectVisible, setModalSubjectVisible] = useState(false);
  const [selectedTableForAdd, setSelectedTableForAdd] = useState("");
  const [activePicker, setActivePicker] = useState(null);

  const getDefaultStartTime = () => {
    const d = new Date();
    d.setHours(9, 0, 0, 0);
    return d;
  };
  const getDefaultEndTime = () => {
    const d = new Date();
    d.setHours(12, 0, 0, 0);
    return d;
  };

  const formatTime = (dateObj) =>
    `${dateObj.getHours().toString().padStart(2, "0")}:${dateObj.getMinutes().toString().padStart(2, "0")}`;

  const [subject, setSubject] = useState({
    code: "",
    name: "",
    sec: "",
  });

  const [sessions, setSessions] = useState([
    {
      id: Date.now().toString(),
      day: "Monday",
      type: "Lecture",
      room: "",
      startTime: getDefaultStartTime(),
      endTime: getDefaultEndTime(),
    },
  ]);
  // ==========================================================

  // ================= STATE สำหรับ MODAL เพิ่มงาน =================
  const [modalTaskVisible, setModalTaskVisible] = useState(false);
  const [activityName, setActivityName] = useState("");
  const [category, setCategory] = useState("study");
  const [note, setNote] = useState("");
  const [activityDate, setActivityDate] = useState(new Date());
  const [startTime, setStartTime] = useState(getDefaultStartTime());
  const [endTime, setEndTime] = useState(getDefaultEndTime());
  
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);

  const [selectedSemesterForTask, setSelectedSemesterForTask] = useState("");
  const [selectedSubjectForTask, setSelectedSubjectForTask] = useState("");
  const [filteredSubjectsForTask, setFilteredSubjectsForTask] = useState([]);

  const formatDate = (dateObj) =>
    `${dateObj.getDate().toString().padStart(2, "0")}/${(dateObj.getMonth() + 1).toString().padStart(2, "0")}/${dateObj.getFullYear()}`;

  useEffect(() => {
    if (selectedSemesterForTask) {
      const subjectsInTerm = userTable.filter((s) => s.table === selectedSemesterForTask);
      const uniqueSubjects = Array.from(new Set(subjectsInTerm.map((s) => s.name)))
        .map((name) => subjectsInTerm.find((s) => s.name === name));
      setFilteredSubjectsForTask(uniqueSubjects);
    } else {
      setFilteredSubjectsForTask([]);
    }
  }, [selectedSemesterForTask, userTable]);
  // ==========================================================

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

      // ===== รายชื่อกลุ่ม (Semester) =====
      if (savedTableList) {
        const parsedList = JSON.parse(savedTableList);
        setTableList(parsedList);
        if (parsedList.length > 0 && !selectedTableForAdd) {
          setSelectedTableForAdd(parsedList[0].label); // Set default picker value
        }
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
    return (now.getHours() + offsetHours) * 60 + now.getMinutes();
  };

  const calculateNextClass = (data = userTable) => {
    if (!data || data.length === 0) return;
    const now = new Date();
    const currentDay = now.toLocaleDateString("en-US", { weekday: "long" });

    const startTimeLimit = getMinutesWithOffset(0);
    const endTimeLimit = getMinutesWithOffset(24);

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
      .filter(
        (c) =>
          c.startMinutes >= startTimeLimit && c.startMinutes <= endTimeLimit,
      )
      .sort((a, b) => a.startMinutes - b.startMinutes);

    const result = todayClasses[0] || null;
    setNextClass(result);
  };

  const calculateUpcomingExams = (data = examList) => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const upcoming = data
      .filter((exam) => {
        if (!exam.examDate) return false;
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
  };

  const calculateUpcomingActivities = () => {
    const now = new Date();

    const filtered = tasks.filter((activity) => {
      const activityDate = new Date(activity.endTimeMs);
      const isPending = activity.status === "pending";

      if (!isPending) return false;

      if (activityFilter === "today") {
        return activityDate.toDateString() === now.toDateString();
      }

      if (activityFilter === "week") {
        const firstDayOfWeek = new Date(now);
        firstDayOfWeek.setDate(now.getDate() - now.getDay());

        const lastDayOfWeek = new Date(firstDayOfWeek);
        lastDayOfWeek.setDate(firstDayOfWeek.getDate() + 6);

        return activityDate >= firstDayOfWeek && activityDate <= lastDayOfWeek;
      }

      if (activityFilter === "nextWeek") {
        const start = new Date(now);
        start.setDate(now.getDate() + 7); // เริ่มอีก 7 วันข้างหน้า

        const end = new Date(now);
        end.setDate(now.getDate() + 14); // สิ้นสุดอีก 14 วัน

        return activityDate >= start && activityDate <= end;
      }

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
    if (activityFilter === "today") return "ไม่มีกิจกรรมในวันนี้";
    if (activityFilter === "week") return "ไม่มีกิจกรรมในสัปดาห์นี้";
    if (activityFilter === "nextWeek") return "ไม่มีกิจกรรมในสัปดาห์หน้า";
    if (activityFilter === "month") return "ไม่มีกิจกรรมในเดือนนี้";
    return "ไม่มีกิจกรรม";
  };

  useEffect(() => {
    calculateUpcomingActivities();
  }, [tasks, activityFilter]);

  // ================= LOGIC สำหรับปุ่มเพิ่มวิชา =================
  const openAddSubjectModal = () => {
    if (tableList.length === 0) {
      Alert.alert(
        "แจ้งเตือน",
        "คุณยังไม่ได้สร้างปีการศึกษา กรุณาไปเพิ่มในเมนู 'ตารางเรียน' ก่อนครับ",
        [
          {
            text: "ตกลง",
            onPress: () => navigation.navigate("Timetable"),
          },
        ],
      );
      return;
    }
    setSubject({ code: "", name: "", sec: "" });
    setSessions([
      {
        id: Date.now().toString(),
        day: "Monday",
        type: "Lecture",
        room: "",
        startTime: getDefaultStartTime(),
        endTime: getDefaultEndTime(),
      },
    ]);
    setModalSubjectVisible(true);
  };

  const persistSubjectData = async (newTable, newExams) => {
    try {
      const timestamp = new Date().toISOString();
      console.log("Saving to AsyncStorage...", newTable.length, "items"); // เพิ่มบรรทัดนี้

      await AsyncStorage.multiSet([
        ["user_table", JSON.stringify(newTable)],
        ["user_exams", JSON.stringify(newExams)],
        ["last_updated", timestamp],
      ]);

      if (auth.currentUser) {
        console.log("Saving to Firestore for user:", auth.currentUser.uid); // เพิ่มบรรทัดนี้
        const userDocRef = doc(
          db,
          "users",
          auth.currentUser.uid,
          "timetable",
          "data",
        );
        await setDoc(
          userDocRef,
          {
            table: newTable,
            examList: newExams,
            lastUpdated: timestamp,
          },
          { merge: true },
        );
        console.log("Firestore Save Success!");
      }

      loadData();
    } catch (error) {
      console.error("Dashboard SAVE ERROR:", error);
      Alert.alert("Error", "ไม่สามารถบันทึกข้อมูลได้: " + error.message);
    }
  };

  const handleAddSubject = async () => {
    // 1. ตรวจสอบค่าว่างของวิชาหลัก
    if (!selectedTableForAdd) {
      Alert.alert("ข้อผิดพลาด", "กรุณาเลือกภาคการศึกษา");
      return;
    }
    if (!subject.code.trim() || !subject.name.trim() || !subject.sec.trim()) {
      Alert.alert(
        "กรุณากรอกข้อมูล",
        "โปรดกรอกรหัสวิชา ชื่อวิชา และหมู่เรียน (SEC) ให้ครบถ้วน",
      );
      return;
    }
    if (sessions.length === 0) {
      Alert.alert("กรุณากรอกข้อมูล", "โปรดเพิ่มคาบเรียนอย่างน้อย 1 คาบ");
      return;
    }

    // 2. ตรวจสอบค่าว่างของแต่ละคาบเรียน
    for (let i = 0; i < sessions.length; i++) {
      if (!sessions[i].type.trim()) {
        Alert.alert(
          "กรุณากรอกข้อมูล",
          `โปรดกรอกประเภท (Lec/Lab) และห้องเรียนในคาบที่ ${i + 1} ให้ครบถ้วน`,
        );
        return;
      }
      if (!sessions[i].room.trim()) {
        sessions[i].room = "ติดต่ออาจารย์ผู้สอน";
      }
    }

    // 3. ตรวจสอบวิชาซ้ำในเทอมเดียวกัน
    const isDuplicateCode = userTable.some(
      (c) =>
        c.code.trim().toUpperCase() === subject.code.trim().toUpperCase() &&
        c.table === selectedTableForAdd,
    );

    if (isDuplicateCode) {
      Alert.alert(
        "เพิ่มวิชาไม่สำเร็จ",
        `รหัสวิชา ${subject.code.toUpperCase()} มีอยู่ในตารางเรียนภาคนี้แล้ว หากต้องการแก้ไขกรุณาไปที่เมนูตารางเรียน`,
      );
      return;
    }

    // เตรียมข้อมูลใหม่
    const newEntries = sessions.map((s, index) => ({
      id: s.id.toString().includes(Date.now().toString().substring(0, 5))
        ? s.id
        : Date.now().toString() + index.toString(),
      table: selectedTableForAdd,
      code: subject.code.toUpperCase(),
      name: subject.name,
      sec: subject.sec,
      day: s.day,
      type: s.type,
      room: s.room,
      start: formatTime(s.startTime),
      end: formatTime(s.endTime),
    }));

    const dayLabels = {
      Monday: "จันทร์",
      Tuesday: "อังคาร",
      Wednesday: "พุธ",
      Thursday: "พฤหัสบดี",
      Friday: "ศุกร์",
      Saturday: "เสาร์",
      Sunday: "อาทิตย์",
    };

    // 4. ตรวจสอบเวลาเรียนซ้อนทับกันเองในวิชาเดียวกัน (Validation ที่เพิ่มเข้ามา)
    for (let i = 0; i < newEntries.length; i++) {
      for (let j = i + 1; j < newEntries.length; j++) {
        if (
          newEntries[i].day === newEntries[j].day &&
          isOverlapping(
            newEntries[i].start,
            newEntries[i].end,
            newEntries[j].start,
            newEntries[j].end,
          )
        ) {
          Alert.alert(
            "เวลาเรียนซ้อนทับกันเอง",
            `คาบที่ ${i + 1} (${newEntries[i].type}) และคาบที่ ${j + 1} (${newEntries[j].type}) มีเวลาเรียนทับซ้อนกันในวัน${dayLabels[newEntries[i].day]} กรุณาแก้ไขเวลาให้ถูกต้อง`,
          );
          return; // บล็อกไม่ให้บันทึกเหมือนใน Timetable.js
        }
      }
    }

    // 5. ตรวจสอบเวลาซ้อนทับกับวิชาอื่นในตาราง
    let isConflictFound = false;
    let conflictMsg = "";

    for (const newEntry of newEntries) {
      const hasClassOverlap = userTable.some(
        (s) =>
          s.day === newEntry.day &&
          s.table === selectedTableForAdd &&
          isOverlapping(newEntry.start, newEntry.end, s.start, s.end),
      );

      if (hasClassOverlap) {
        isConflictFound = true;
        conflictMsg = `มีวิชาอื่นซ้อนทับอยู่ในวัน${dayLabels[newEntry.day]} เวลา ${newEntry.start}-${newEntry.end}`;
        break;
      }
    }

    const executeAdd = () => {
      const updatedTable = [...userTable, ...newEntries];

      // อัปเดตตารางสอบ (Exam List)
      let updatedExams = [...examList];
      const existingExam = updatedExams.find(
        (e) =>
          e.code === subject.code.toUpperCase() &&
          e.table === selectedTableForAdd,
      );

      if (!existingExam) {
        updatedExams.push({
          id: subject.code.toUpperCase() + selectedTableForAdd,
          code: subject.code.toUpperCase(),
          name: subject.name,
          section: subject.sec,
          examDate: "",
          startTime: "",
          endTime: "",
          room: "",
          table: selectedTableForAdd,
        });
      }

      persistSubjectData(updatedTable, updatedExams);
      setModalSubjectVisible(false);
      Alert.alert("สำเร็จ", "เพิ่มวิชาลงตารางเรียนเรียบร้อยแล้ว");
    };

    // 6. จัดการกรณีเวลาซ้ำซ้อนกับวิชาอื่น (ถามความสมัครใจ)
    if (isConflictFound) {
      Alert.alert(
        "เวลาซ้ำซ้อน",
        `${conflictMsg} คุณต้องการบันทึกวิชานี้ลงในตารางหรือไม่?`,
        [
          { text: "ยกเลิก", style: "cancel" },
          { text: "บันทึกต่อไป", onPress: () => executeAdd() },
        ],
      );
    } else {
      executeAdd();
    }
  };

  // ================= LOGIC สำหรับปุ่มเพิ่มงาน =================
  const persistTasks = async (newTasks) => {
    try {
      const timestamp = new Date().toISOString();
      await AsyncStorage.multiSet([
        ["myTasks", JSON.stringify(newTasks)],
        ["last_updated_planner", timestamp],
      ]);
      if (auth.currentUser) {
        const userDocRef = doc(db, "users", auth.currentUser.uid, "planner", "data");
        await setDoc(userDocRef, { tasks: newTasks, lastUpdated: timestamp }, { merge: true });
      }
      loadData(); // ดึงข้อมูลมาแสดงใหม่บน Dashboard ทันที
    } catch (error) {
      console.error("Sync Error:", error);
    }
  };

  const handleSaveTask = async () => {
    if (!activityName.trim()) {
      Alert.alert("แจ้งเตือน", "กรุณากรอกชื่อกิจกรรม");
      return;
    }

    const newStart = formatTime(startTime);
    const newEnd = formatTime(endTime);
    const dateStr = formatDate(activityDate);
    const dayName = activityDate.toLocaleDateString("en-US", { weekday: "long" });

    const executeSave = async () => {
      try {
        const finalActivityDate = new Date(activityDate);
        finalActivityDate.setHours(endTime.getHours(), endTime.getMinutes(), 0, 0);

        const taskData = {
          id: Date.now().toString(),
          title: activityName.trim(),
          timeString: `${newStart} - ${newEnd}`,
          dateString: dateStr,
          category,
          note,
          status: "pending",
          endTimeMs: finalActivityDate.getTime(),
        };

        const updatedTasks = [...tasks, taskData];
        setTasks(updatedTasks);
        await persistTasks(updatedTasks);

        setActivityName("");
        setNote("");
        setModalTaskVisible(false);
        Alert.alert("สำเร็จ", "เพิ่มกิจกรรมเรียบร้อยแล้ว");
      } catch (error) {
        Alert.alert("Error", "ไม่สามารถบันทึกได้");
      }
    };

    const hasActivityConflict = tasks.some(
      (t) =>
        t.dateString === dateStr &&
        isOverlapping(newStart, newEnd, t.timeString.split(" - ")[0], t.timeString.split(" - ")[1])
    );

    const classConflict = userTable.find(
      (c) => c.day === dayName && isOverlapping(newStart, newEnd, c.start, c.end)
    );

    if (hasActivityConflict || classConflict) {
      const message = classConflict
        ? `เวลานี้ตรงกับวิชา ${classConflict.name} คุณต้องการบันทึกซ้อนลงไปหรือไม่?`
        : "เวลานี้มีกิจกรรมอื่นอยู่แล้ว คุณต้องการบันทึกซ้อนลงไปหรือไม่?";

      Alert.alert("เวลาซ้ำซ้อน", message, [
        { text: "ยกเลิก", style: "cancel" },
        { text: "ยืนยันการบันทึก", onPress: () => executeSave() },
      ]);
    } else {
      executeSave();
    }
  };
  // =========================================================

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
            onPress={openAddSubjectModal}
          >
            <Ionicons name="calendar-outline" size={24} color="#FF748C" />
            <Text style={styles.quickBtnText}>เพิ่มวิชา</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickBtn}
            onPress={() => setModalTaskVisible(true)}
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
                backgroundColor: "#FDF2F8",
                borderColor: "#FCCEE8",
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
                marginBottom: 10,
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
            style={styles.filterBtn}
          >
            <Text style={{ marginRight: 5 }}>
              {activityFilter === "today"
                ? "วันนี้"
                : activityFilter === "week"
                  ? "สัปดาห์นี้"
                  : activityFilter === "nextWeek"
                    ? "สัปดาห์ถัดไป"
                    : "เดือนนี้"}
            </Text>
            <MaterialIcons name="keyboard-arrow-down" size={20} />
          </TouchableOpacity>
        </View>

        {showFilterDropdown && (
          <View style={styles.dropdownBox}>
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
                setActivityFilter("nextWeek");
                setShowFilterDropdown(false);
              }}
            >
              <Text>สัปดาห์ถัดไป</Text>
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
                  <Foundation
                    name="clipboard-notes"
                    size={16}
                    color="#EA3287"
                  />
                  <Text style={{ color: "#EA3287", fontSize: 15 }}>
                    {" "}
                    Note: {activity.note || "ไม่ได้ระบุ"}
                  </Text>
                </View>

                <Text
                  style={{ color: "#EA3287", fontSize: 14, fontWeight: "600" }}
                >
                  {activity.timeString} น.{activity.isOvernight ? "(ข้ามคืน)" : ""}
                  
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

      {/* ================= MODAL เพิ่มวิชาเรียน ================= */}
      <Modal
        visible={modalSubjectVisible}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { maxHeight: "90%", paddingBottom: 15 },
            ]}
          >
            <Text style={[styles.modalTitle, { marginBottom: 15 }]}>
              เพิ่มวิชาเรียน
            </Text>

            <ScrollView
              showsVerticalScrollIndicator={false}
              style={{ flexShrink: 1 }}
            >
              {/* เลือก Semester */}
              <Text style={styles.label}>ภาคการศึกษา</Text>
              <View style={[styles.pickerWrapper, { marginBottom: 10 }]}>
                <Picker
                  selectedValue={selectedTableForAdd}
                  onValueChange={(val) => setSelectedTableForAdd(val)}
                  style={{ height: 50 }}
                >
                  {tableList.map((item, index) => (
                    <Picker.Item
                      key={index}
                      label={item.label}
                      value={item.label}
                    />
                  ))}
                </Picker>
              </View>

              <TextInput
                placeholder="รหัสวิชา"
                style={styles.input}
                value={subject.code}
                onChangeText={(t) => setSubject({ ...subject, code: t })}
              />
              <TextInput
                placeholder="ชื่อวิชา"
                style={styles.input}
                value={subject.name}
                onChangeText={(t) => setSubject({ ...subject, name: t })}
              />
              <TextInput
                placeholder="หมู่ (SEC)"
                style={styles.input}
                value={subject.sec}
                onChangeText={(t) => setSubject({ ...subject, sec: t })}
              />

              <Text
                style={[
                  styles.label,
                  {
                    fontSize: 16,
                    marginTop: 10,
                    marginBottom: 10,
                    color: "#C7005C",
                  },
                ]}
              >
                คาบเรียน (กดเพิ่มได้หลายคาบ)
              </Text>

              {sessions.map((session, index) => (
                <View key={session.id} style={styles.sessionCard}>
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      marginBottom: 10,
                      alignItems: "center",
                    }}
                  >
                    <Text
                      style={{ fontFamily: "Inter_700Bold", color: "#C7005C" }}
                    >
                      คาบที่ {index + 1}
                    </Text>
                    {sessions.length > 1 && (
                      <TouchableOpacity
                        onPress={() =>
                          setSessions(
                            sessions.filter((s) => s.id !== session.id),
                          )
                        }
                        style={{ padding: 5 }}
                      >
                        <Feather name="trash-2" size={18} color="#FF7675" />
                      </TouchableOpacity>
                    )}
                  </View>

                  <View style={styles.pickerWrapper}>
                    <Picker
                      selectedValue={session.day}
                      onValueChange={(val) => {
                        const newS = [...sessions];
                        newS[index].day = val;
                        setSessions(newS);
                      }}
                      style={{ height: 50 }}
                    >
                      <Picker.Item label="วันจันทร์" value="Monday" />
                      <Picker.Item label="วันอังคาร" value="Tuesday" />
                      <Picker.Item label="วันพุธ" value="Wednesday" />
                      <Picker.Item label="วันพฤหัสบดี" value="Thursday" />
                      <Picker.Item label="วันศุกร์" value="Friday" />
                      <Picker.Item label="วันเสาร์" value="Saturday" />
                      <Picker.Item label="วันอาทิตย์" value="Sunday" />
                    </Picker>
                  </View>

                  <View
                    style={{ flexDirection: "row", gap: 10, marginTop: 10 }}
                  >
                    <View
                      style={[
                        styles.pickerWrapper,
                        {
                          flex: 1,
                          backgroundColor: "#F1F2F6",
                          borderWidth: 0,
                          height: 50,
                          justifyContent: "center",
                        },
                      ]}
                    >
                      <Picker
                        selectedValue={session.type}
                        onValueChange={(val) => {
                          const newS = [...sessions];
                          newS[index].type = val;
                          setSessions(newS);
                        }}
                        style={{ height: 50, color: "#333" }}
                      >
                        <Picker.Item label="Lecture" value="Lecture" />
                        <Picker.Item label="Lab" value="Lab" />
                      </Picker>
                    </View>
                    <TextInput
                      placeholder="ห้องเรียน"
                      style={[
                        styles.input,
                        { flex: 1, marginBottom: 0, height: 50 },
                      ]}
                      value={session.room}
                      onChangeText={(t) => {
                        const newS = [...sessions];
                        newS[index].room = t;
                        setSessions(newS);
                      }}
                    />
                  </View>

                  <View style={{ flexDirection: "row", marginTop: 10 }}>
                    <View style={{ flex: 1, marginRight: 5 }}>
                      <Text style={styles.label}>เวลาเริ่ม</Text>
                      <TouchableOpacity
                        style={styles.pickerButton}
                        onPress={() =>
                          setActivePicker({ index, field: "start" })
                        }
                      >
                        <Text style={styles.pickerText}>
                          {formatTime(session.startTime)}
                        </Text>
                        <Ionicons name="time-outline" size={20} color="gray" />
                      </TouchableOpacity>
                    </View>
                    <View style={{ flex: 1, marginLeft: 5 }}>
                      <Text style={styles.label}>เวลาสิ้นสุด</Text>
                      <TouchableOpacity
                        style={styles.pickerButton}
                        onPress={() => setActivePicker({ index, field: "end" })}
                      >
                        <Text style={styles.pickerText}>
                          {formatTime(session.endTime)}
                        </Text>
                        <Ionicons name="time-outline" size={20} color="gray" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))}

              <TouchableOpacity
                style={styles.addSessionBtn}
                onPress={() =>
                  setSessions([
                    ...sessions,
                    {
                      id: Date.now().toString(),
                      day: "Monday",
                      type: "Lab",
                      room: "",
                      startTime: getDefaultStartTime(),
                      endTime: getDefaultEndTime(),
                    },
                  ])
                }
              >
                <Text style={styles.addSessionBtnText}>
                  + เพิ่มคาบเรียนใหม่ (Lec / Lab)
                </Text>
              </TouchableOpacity>
            </ScrollView>

            {activePicker && (
              <DateTimePicker
                value={
                  sessions[activePicker.index][`${activePicker.field}Time`]
                }
                mode="time"
                display="default"
                onChange={(e, date) => {
                  const currentPicker = activePicker;
                  setActivePicker(null);
                  if (date) {
                    const newS = [...sessions];
                    newS[currentPicker.index][`${currentPicker.field}Time`] =
                      date;
                    setSessions(newS);
                  }
                }}
              />
            )}

            <View style={[styles.modalActions, { marginTop: 15 }]}>
              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleAddSubject}
              >
                <Text style={styles.saveBtnText}>บันทึกวิชา</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => {
                  setModalSubjectVisible(false);
                }}
              >
                <Text style={styles.cancelBtnText}>ยกเลิก</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ================= MODAL เพิ่มงาน ================= */}
      <Modal animationType="fade" transparent={true} visible={modalTaskVisible} onRequestClose={() => setModalTaskVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>เพิ่มกิจกรรมใหม่</Text>
            
            <Text style={styles.label}>ชื่อกิจกรรม</Text>
            <TextInput style={styles.input} placeholder="ชื่อกิจกรรม (เช่น ส่งใบงาน)" value={activityName} onChangeText={setActivityName} />

            <Text style={styles.label}>หมวดหมู่กิจกรรม</Text>
            <View style={styles.categoryRow}>
              <TouchableOpacity style={[styles.categoryButton, category === "study" && styles.categoryButtonActive]} onPress={() => setCategory("study")}>
                <Text style={[styles.categoryText, category === "study" && styles.categoryTextActive]}>📖 วิชาเรียน</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.categoryButton, category === "other" && styles.categoryButtonActive]} onPress={() => { setCategory("other"); setSelectedSubjectForTask(""); setSelectedSemesterForTask(""); }}>
                <Text style={[styles.categoryText, category === "other" && styles.categoryTextActive]}>⚽️ อื่นๆ</Text>
              </TouchableOpacity>
            </View>

            {category === "study" && (
              <>
                <Text style={styles.label}>เลือกปีการศึกษา (Semester)</Text>
                <View style={[styles.pickerWrapper, { marginBottom: 10, backgroundColor: "#F1F2F6", borderWidth: 0 }]}>
                  <Picker selectedValue={selectedSemesterForTask} onValueChange={(val) => { setSelectedSemesterForTask(val); setNote(`ปีการศึกษา: ${val}`); }}>
                    <Picker.Item label="-- เลือกเทอม --" value="" />
                    {tableList.map((item, index) => (
                      <Picker.Item key={index} label={item.label} value={item.label} />
                    ))}
                  </Picker>
                </View>

                {selectedSemesterForTask !== "" && (
                  <>
                    <Text style={styles.label}>เลือกวิชาในเทอมนี้</Text>
                    <View style={[styles.pickerWrapper, { marginBottom: 10, backgroundColor: "#F1F2F6", borderWidth: 0 }]}>
                      <Picker selectedValue={selectedSubjectForTask} onValueChange={(val) => { setSelectedSubjectForTask(val); setActivityName(val); }}>
                        <Picker.Item label="-- เลือกรายวิชา --" value="" />
                        {filteredSubjectsForTask.map((item, index) => (
                          <Picker.Item key={index} label={item.name} value={item.name} />
                        ))}
                      </Picker>
                    </View>
                  </>
                )}
              </>
            )}

            <Text style={styles.label}>รายละเอียดเพิ่มเติม</Text>
            <TextInput style={[styles.input, { height: 80, textAlignVertical: "top" }]} placeholder="จดบันทึกรายละเอียด..." multiline value={note} onChangeText={setNote} />

            <Text style={styles.label}>วันที่</Text>
            <TouchableOpacity style={styles.pickerButton} onPress={() => setShowDatePicker(true)}>
              <Text style={styles.pickerText}>{formatDate(activityDate)}</Text>
              <Ionicons name="calendar-outline" size={20} color="gray" />
            </TouchableOpacity>

            <View style={styles.rowInputs}>
              <View style={{ flex: 1, marginRight: 5 }}>
                <Text style={styles.label}>เวลาเริ่ม</Text>
                <TouchableOpacity style={styles.pickerButton} onPress={() => setShowStartTimePicker(true)}>
                  <Text style={styles.pickerText}>{formatTime(startTime)}</Text>
                  <Ionicons name="time-outline" size={20} color="gray" />
                </TouchableOpacity>
              </View>
              <View style={{ flex: 1, marginLeft: 5 }}>
                <Text style={styles.label}>เวลาสิ้นสุด</Text>
                <TouchableOpacity style={styles.pickerButton} onPress={() => setShowEndTimePicker(true)}>
                  <Text style={styles.pickerText}>{formatTime(endTime)}</Text>
                  <Ionicons name="time-outline" size={20} color="gray" />
                </TouchableOpacity>
              </View>
            </View>

            {showDatePicker && <DateTimePicker value={activityDate} mode="date" display="default" onChange={(e, d) => { setShowDatePicker(false); if (d) setActivityDate(d); }} />}
            {showStartTimePicker && <DateTimePicker value={startTime} mode="time" display="default" onChange={(e, t) => { setShowStartTimePicker(false); if (t) setStartTime(t); }} />}
            {showEndTimePicker && <DateTimePicker value={endTime} mode="time" display="default" onChange={(e, t) => { setShowEndTimePicker(false); if (t) setEndTime(t); }} />}

            <View style={styles.modalButtonRow}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setModalTaskVisible(false)}>
                <Text style={styles.cancelButtonText}>ยกเลิก</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleSaveTask}>
                <Text style={styles.saveButtonText}>บันทึกงาน</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

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
  },

  filterBtn: {
    marginLeft: "auto",
    backgroundColor: "#F3F3F3",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
  },
  dropdownBox: {
    position: "absolute",
    top: 45,
    right: 0,
    backgroundColor: "white",
    borderRadius: 10,
    paddingVertical: 5,
    width: 150,
    elevation: 5,
    zIndex: 1000,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#FFF",
    padding: 25,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    color: "#C7005C",
    textAlign: "center",
  },
  input: {
    backgroundColor: "#F1F2F6",
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
    fontFamily: "Inter_400Regular",
  },
  label: {
    fontSize: 13,
    color: "#666",
    marginBottom: 5,
    marginLeft: 5,
    fontFamily: "Inter_700Bold",
  },
  pickerWrapper: {
    borderWidth: 1.5,
    borderColor: "#FFDAE0",
    borderRadius: 15,
    overflow: "hidden",
    backgroundColor: "#FFF",
  },
  sessionCard: {
    backgroundColor: "#FDF2F8",
    padding: 15,
    borderRadius: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#FFDAE0",
  },
  pickerButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F1F2F6",
    borderRadius: 12,
    padding: 12,
    marginBottom: 15,
  },
  pickerText: { color: "#333" },
  addSessionBtn: {
    backgroundColor: "#FFF",
    borderWidth: 1.5,
    borderColor: "#C7005C",
    borderStyle: "dashed",
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 10,
  },
  addSessionBtnText: {
    color: "#C7005C",
    fontFamily: "Inter_700Bold",
    fontSize: 14,
  },
  modalActions: { marginTop: 15 },
  saveBtn: {
    backgroundColor: "#C7005C",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 10,
  },
  saveBtnText: { color: "#FFF", fontFamily: "Inter_700Bold", fontSize: 16 },
  cancelBtn: { padding: 10, alignItems: "center" },
  cancelBtnText: { color: "#9B7B8E", fontFamily: "Inter_700Bold" },
  
  // Styles สำหรับ Modal เพิ่มงาน
  categoryRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 15 },
  categoryButton: { flex: 1, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: "#EEEEEE", alignItems: "center", marginHorizontal: 5, backgroundColor: "#F1F2F6" },
  categoryButtonActive: { backgroundColor: "#FCE4EC", borderColor: "#E91E63" },
  categoryText: { fontSize: 13, color: "#9E9E9E", fontFamily: "Inter_700Bold" },
  categoryTextActive: { color: "#C7005C" },
  rowInputs: { flexDirection: "row" },
  modalButtonRow: { flexDirection: "row", marginTop: 15 },
  cancelButton: { flex: 1, backgroundColor: "#F1F2F6", padding: 15, borderRadius: 12, marginRight: 5, alignItems: "center" },
  saveButton: { flex: 1, backgroundColor: "#C7005C", padding: 15, borderRadius: 12, marginLeft: 5, alignItems: "center" },
});

export default Dashboard;