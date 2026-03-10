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
import CustomDropdown from "../components/CustomDropdown";

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
  const [selectedTable, setSelectedTable] = useState("");
  const [nextClass, setNextClass] = useState(null);
  const [upcomingExams, setUpcomingExams] = useState([]);
  const [upcomingActivities, setUpcomingActivities] = useState([]);

  // ================= STATE สำหรับ QUICK ADD (เพิ่มงานด่วน) =================
  const [quickTaskName, setQuickTaskName] = useState("");

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

  const dayLabels = {
    Monday: "วันจันทร์",
    Tuesday: "วันอังคาร",
    Wednesday: "วันพุธ",
    Thursday: "วันพฤหัสบดี",
    Friday: "วันศุกร์",
    Saturday: "วันเสาร์",
    Sunday: "วันอาทิตย์",
  };

  const formatDate = (dateObj) =>
    `${dateObj.getDate().toString().padStart(2, "0")}/${(dateObj.getMonth() + 1).toString().padStart(2, "0")}/${dateObj.getFullYear()}`;

  useEffect(() => {
    if (selectedSemesterForTask) {
      const subjectsInTerm = userTable.filter(
        (s) => s.table === selectedSemesterForTask,
      );
      const uniqueSubjects = Array.from(
        new Set(subjectsInTerm.map((s) => s.name)),
      ).map((name) => subjectsInTerm.find((s) => s.name === name));
      setFilteredSubjectsForTask(uniqueSubjects);
    } else {
      setFilteredSubjectsForTask([]);
    }
  }, [selectedSemesterForTask, userTable]);

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

      if (savedTable) {
        setUserTable(JSON.parse(savedTable));
      } else {
        setUserTable([]);
      }

      if (savedTableList) {
        const parsedList = JSON.parse(savedTableList);
        setTableList(parsedList);
        if (parsedList.length > 0 && !selectedTableForAdd) {
          setSelectedTableForAdd(parsedList[0].label); 
        }
        if (parsedList.length > 0 && !selectedTable) {
          setSelectedTable(parsedList[0].label); 
        }
      } else {
        setTableList([]);
      }

      if (savedExamList) {
        setExamList(JSON.parse(savedExamList));
      } else {
        setExamList([]);
      }

      if (savedTasks) {
        setTasks(JSON.parse(savedTasks));
      } else {
        setTasks([]);
        setUpcomingActivities([]);
      }

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

  useEffect(() => {
    calculateNextClass(userTable, selectedTable);
    calculateUpcomingExams(examList, selectedTable);
  }, [userTable, examList, selectedTable]);

  const calculateNextClass = (data = userTable, currentSemester = selectedTable) => {
    if (!data || data.length === 0 || !currentSemester) {
      setNextClass(null);
      return;
    }

    const filteredData = data.filter(c => c.table === currentSemester);
    if (filteredData.length === 0) {
      setNextClass(null);
      return;
    }

    const now = new Date();
    const dayMap = { Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6 };
    
    const classesWithNextDate = filteredData.map(c => {
      let h = 0, m = 0;
      if (c.start && String(c.start).includes(":")) {
        [h, m] = c.start.split(":").map(Number);
      } else {
        h = Number(c.start);
      }
      
      let eh = 0, em = 0;
      if (c.end && String(c.end).includes(":")) {
        [eh, em] = c.end.split(":").map(Number);
      } else {
        eh = Number(c.end);
      }

      let classDayIndex = dayMap[c.day];
      let daysUntil = classDayIndex - now.getDay();
      
      let classEndDate = new Date(now);
      classEndDate.setHours(eh, em, 0, 0);

      if (daysUntil < 0) {
        daysUntil += 7;
      }

      if (daysUntil === 0 && now.getTime() > classEndDate.getTime()) {
        daysUntil += 7;
      }

      let classDate = new Date(now);
      classDate.setDate(classDate.getDate() + daysUntil);
      classDate.setHours(h, m, 0, 0);

      return { ...c, nextOccurrence: classDate.getTime(), daysUntil };
    });

    classesWithNextDate.sort((a, b) => a.nextOccurrence - b.nextOccurrence);
    setNextClass(classesWithNextDate[0] || null);
  };

  const calculateUpcomingExams = (data = examList, currentSemester = selectedTable) => {
    if (!currentSemester) {
      setUpcomingExams([]);
      return;
    }
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const upcoming = data
      .filter((exam) => {
        if (exam.table !== currentSemester) return false;
        if (!exam.examDate || exam.isHidden) return false; 
        const [day, month, year] = exam.examDate.split("/");
        const examDateObj = new Date(year, month - 1, day);
        return examDateObj >= now;
      })
      .sort((a, b) => {
        const [dayA, monthA, yearA] = a.examDate.split("/");
        const [dayB, monthB, yearB] = b.examDate.split("/");
        const dateA = new Date(yearA, monthA - 1, dayA).getTime();
        const dateB = new Date(yearB, monthB - 1, dayB).getTime();

        if (dateA !== dateB) return dateA - dateB;

        const timeA = a.startTime ? a.startTime : "23:59";
        const timeB = b.startTime ? b.startTime : "23:59";

        return timeA.localeCompare(timeB);
      });

    setUpcomingExams(upcoming);
  };

  const calculateUpcomingActivities = () => {
    const now = new Date();
    const todayStr = now.toDateString();

    const filtered = tasks.filter((activity) => {
      const isPending = activity.status === "pending" || !activity.status;
      if (!isPending) return false;

      // ถ้าเป็น Quick Task ให้แสดงเสมอโดยไม่สนใจเวลา
      if (activity.isQuickTask) return true;

      let activityDate;
      if (activity.endTimeMs) {
        activityDate = new Date(activity.endTimeMs);
      } else if (activity.dateString) {
        const [day, month, year] = activity.dateString.split("/");
        activityDate = new Date(year, month - 1, day);
      } else {
        activityDate = new Date();
      }

      const [day, month, year] = activity.dateString.split("/");
      const startDate = new Date(year, month - 1, day);
      const endDate = new Date(activity.endTimeMs);

      if (activityFilter === "today") {
        return (
          startDate.toDateString() === todayStr ||
          endDate.toDateString() === todayStr
        );
      }

      if (activityFilter === "week") {
        const firstDayOfWeek = new Date(now);
        firstDayOfWeek.setDate(now.getDate() - now.getDay());
        firstDayOfWeek.setHours(0, 0, 0, 0);

        const lastDayOfWeek = new Date(firstDayOfWeek);
        lastDayOfWeek.setDate(firstDayOfWeek.getDate() + 6);
        lastDayOfWeek.setHours(23, 59, 59, 999);

        return startDate <= lastDayOfWeek && endDate >= firstDayOfWeek;
      }

      if (activityFilter === "nextWeek") {
        const firstDayOfNextWeek = new Date(now);
        firstDayOfNextWeek.setDate(now.getDate() - now.getDay() + 7);
        firstDayOfNextWeek.setHours(0, 0, 0, 0);

        const lastDayOfNextWeek = new Date(firstDayOfNextWeek);
        lastDayOfNextWeek.setDate(firstDayOfNextWeek.getDate() + 6);
        lastDayOfNextWeek.setHours(23, 59, 59, 999);

        return startDate <= lastDayOfNextWeek && endDate >= firstDayOfNextWeek;
      }

      if (activityFilter === "month") {
        const isStartInMonth =
          startDate.getMonth() === now.getMonth() &&
          startDate.getFullYear() === now.getFullYear();
        const isEndInMonth =
          endDate.getMonth() === now.getMonth() &&
          endDate.getFullYear() === now.getFullYear();

        return isStartInMonth || isEndInMonth;
      }

      return false;
    });

    const sortedActivities = filtered.sort((a, b) => {
      const getSortTime = (item) => {
        // ให้ Quick Task ขึ้นมาแสดงอยู่บนสุดเสมอ
        if (item.isQuickTask) return 0;

        if (item.endTimeMs) return item.endTimeMs;
        if (item.dateString && item.timeString) {
          try {
            const [day, month, year] = item.dateString.split("/");
            const startTimeStr = item.timeString.split(" - ")[0];
            const [hours, minutes] = startTimeStr.split(":");
            return new Date(year, month - 1, day, hours, minutes).getTime();
          } catch (e) {
            return 0;
          }
        }
        return 0;
      };

      return getSortTime(a) - getSortTime(b);
    });

    setUpcomingActivities(sortedActivities);
  };

  const getStatusDetails = (activity) => {
    if (!activity) return { label: "Pending", isLate: false };

    // กำหนดให้ Quick Task ไม่มีวันสาย และขึ้นป้ายกำกับว่าด่วน
    if (activity.isQuickTask) {
      return { label: "ด่วน", isLate: false };
    }

    const nowMs = Date.now();
    let isLate = false;

    if (activity.endTimeMs) {
      isLate = nowMs > activity.endTimeMs;
    }
    else if (activity.timeString && activity.timeString.includes(" - ")) {
      try {
        const parts = activity.timeString.split(" - ");
        const endTimeStr = parts[1]; 
        const dateNow = new Date();
        const year = dateNow.getFullYear();
        const month = String(dateNow.getMonth() + 1).padStart(2, "0");
        const day = String(dateNow.getDate()).padStart(2, "0");
        const endTimestamp = new Date(
          `${year}-${month}-${day}T${endTimeStr}`,
        ).getTime();

        if (!isNaN(endTimestamp)) {
          isLate = nowMs > endTimestamp;
        }
      } catch (e) {
        console.error("Error parsing timeString:", e);
      }
    }

    let displayStatus = activity.status || "Pending";
    if (displayStatus === "pending") displayStatus = "Pending";

    return {
      label: isLate ? "Late" : displayStatus,
      isLate: isLate,
    };
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

  // ================= LOGIC สำหรับการบันทึก (ทั้งปกติ และ ด่วน) =================
  const saveTask = async (newTask, isQuick = false) => {
    try {
      const updatedTasks = [...tasks, newTask];
      setTasks(updatedTasks);
      await AsyncStorage.setItem("myTasks", JSON.stringify(updatedTasks));

      if (auth.currentUser) {
        const userDocRef = doc(
          db,
          "users",
          auth.currentUser.uid,
          "planner",
          "data",
        );
        await setDoc(
          userDocRef,
          {
            tasks: updatedTasks,
            lastUpdated: new Date().toISOString(),
          },
          { merge: true },
        );
      }
      
      if (!isQuick) {
        setModalTaskVisible(false);
        Alert.alert("สำเร็จ", "เพิ่มกิจกรรมลงใน Planner เรียบร้อยแล้ว");
      }
      // รีเฟรชกิจกรรม
      calculateUpcomingActivities();
    } catch (error) {
      Alert.alert("ข้อผิดพลาด", "ไม่สามารถบันทึกกิจกรรมได้");
    }
  };

  // ================= LOGIC สำหรับ QUICK ADD =================
  const handleQuickAddTask = () => {
    if (quickTaskName.trim() === "") return;

    const now = new Date();
    
    const newTask = {
      id: "quick_" + Date.now().toString(),
      title: quickTaskName.trim(),
      category: "other",
      dateString: formatDate(now),
      timeString: "00:00 - 23:59", // ใส่เผื่อไว้ไม่ให้ระบบส่วนอื่นพังเวลาแยกค่าเวลา
      note: "เพิ่มด่วน",
      status: "pending",
      isOvernight: false,
      isQuickTask: true, // ตัวแปรสำคัญที่จะสั่งให้ข้ามการตรวจสอบเวลา
      startTimeMs: now.getTime(),
      endTimeMs: now.getTime() + (1000 * 60 * 60 * 24 * 365 * 10), // ป้องกันการขึ้น Late ให้ไกลออกไปอีก 10 ปี
    };

    saveTask(newTask, true); // true = เพื่อให้รู้ว่าเป็น Quick Task
    setQuickTaskName(""); // ล้างช่องพิมพ์หลังเพิ่มสำเร็จ
  };


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
      await AsyncStorage.multiSet([
        ["user_table", JSON.stringify(newTable)],
        ["user_exams", JSON.stringify(newExams)],
        ["last_updated", timestamp],
      ]);

      if (auth.currentUser) {
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
      }

      loadData();
    } catch (error) {
      Alert.alert("Error", "ไม่สามารถบันทึกข้อมูลได้: " + error.message);
    }
  };

  const handleAddSubject = async () => {
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
          return;
        }
      }
    }

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

  const handleAddTask = () => {
    if (activityName.trim() === "") {
      Alert.alert("ข้อผิดพลาด", "กรุณากรอกชื่อวิชา หรือ กิจกรรม");
      return;
    }

    const startH = startTime.getHours() * 60 + startTime.getMinutes();
    const endH = endTime.getHours() * 60 + endTime.getMinutes();
    let isOvernight = false;
    let correctedEndTime = new Date(endTime);

    if (startH >= endH && (endH !== 0 || startH === 0)) {
      Alert.alert(
        "ยืนยันเวลาข้ามคืน",
        "เวลาสิ้นสุดน้อยกว่าเวลาเริ่มต้น ระบบจะถือว่าเป็นกิจกรรมข้ามคืน (ข้ามไปวันถัดไป) ยืนยันหรือไม่?",
        [
          { text: "ยกเลิก", style: "cancel" },
          {
            text: "ยืนยัน",
            onPress: () => {
              isOvernight = true;
              correctedEndTime.setDate(correctedEndTime.getDate() + 1);
              processTask(true, correctedEndTime);
            },
          },
        ],
      );
      return;
    }

    processTask(false, correctedEndTime);
  };

  const processTask = (isOvernight, correctedEndTime) => {
    const timeStr = `${formatTime(startTime)} - ${formatTime(endTime)}`;
    const dateStr = formatDate(activityDate);
    const dayName = activityDate.toLocaleDateString("en-US", {
      weekday: "long",
    });

    const startTimestamp = new Date(activityDate);
    startTimestamp.setHours(startTime.getHours(), startTime.getMinutes(), 0, 0);

    const endTimestamp = new Date(activityDate);
    endTimestamp.setHours(
      correctedEndTime.getHours(),
      correctedEndTime.getMinutes(),
      0,
      0,
    );
    if (isOvernight) {
      endTimestamp.setDate(endTimestamp.getDate() + 1);
    }

    const newTask = {
      id: Date.now().toString(),
      title: activityName,
      category: category,
      dateString: dateStr,
      timeString: timeStr,
      note: note,
      status: "pending",
      isOvernight: isOvernight,
      startTimeMs: startTimestamp.getTime(),
      endTimeMs: endTimestamp.getTime(),
    };

    const executeSave = () => {
      saveTask(newTask);
      setActivityName("");
      setNote("");
      setSelectedSemesterForTask("");
      setSelectedSubjectForTask("");
      setCategory("study");
    };

    const newStart = formatTime(startTime);
    const newEnd = formatTime(endTime);

    const hasActivityConflict = tasks.some(
      (t) =>
        t.dateString === dateStr &&
        isOverlapping(
          newStart,
          newEnd,
          t.timeString.split(" - ")[0],
          t.timeString.split(" - ")[1],
        ),
    );
    const classConflict = userTable.find(
      (c) => c.day === dayName && isOverlapping(newStart, newEnd, c.start, c.end),
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

      {/* เลือกเทอม (Semester Selector สำหรับแดชบอร์ด) */}
      {tableList.length > 0 && (
        <View style={{ marginBottom: 15, zIndex: 10 }}>
          <CustomDropdown
            placeholder={selectedTable || "เลือกภาคการศึกษา"}
            data={tableList}
            onSelect={(item) => setSelectedTable(item.label)}
          />
        </View>
      )}

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
          <View style={[styles.nextClassCard, { backgroundColor: "#C7005C" }]}>
            <View
              style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}
            >
              <View style={{ flexDirection: "row", gap: 8 }}>
                <View style={[styles.tag, { backgroundColor: "#FF748C" }]}>
                  <Text style={styles.tagText}>{nextClass.type}</Text>
                </View>
                <View style={[styles.tag, { backgroundColor: "#FFB8C6" }]}>
                  <Text style={[styles.tagText, { color: "#C7005C" }]}>{dayLabels[nextClass.day] || nextClass.day}</Text>
                </View>
              </View>
              <Text style={styles.timeRange}>
                {nextClass.start} - {nextClass.end}
              </Text>
            </View>
            <Text
              style={{
                color: "#FFF",
                fontSize: 20,
                fontWeight: "bold",
                marginVertical: 10,
              }}
            >
              {nextClass.code} {nextClass.name}
            </Text>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <View style={styles.locationRow}>
                <Ionicons name="location" size={16} color="#FFDAE0" />
                <Text style={{ color: "#FFDAE0", fontSize: 15 }}>
                  {" "}
                  {nextClass.room}
                </Text>
              </View>
              <Text style={{ color: "#FFDAE0", fontSize: 14 }}>
                SEC {nextClass.sec}
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
              ยังไม่มีวิชาเรียนในเทอมนี้
            </Text>
          </View>
        )}
      </View>

      {/* สอบที่กำลังมาถึง */}
      <View style={styles.card}>
        <View
          style={{
            flexDirection: "row",
            marginBottom: 15,
            alignItems: "center",
          }}
        >
          <MaterialIcons name="event-note" size={28} color="#C7005C" />
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
            สอบที่กำลังจะมาถึง
          </Text>
        </View>
        {upcomingExams.length > 0 ? (
          upcomingExams.map((exam, index) => (
            <View
              key={index}
              style={[
                styles.nextClassCard,
                {
                  backgroundColor: "#FFF",
                  borderWidth: 1.5,
                  borderColor: "#FFDAE0",
                  marginBottom: 10,
                },
              ]}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                }}
              >
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
                {exam.code} {exam.name}
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
              ไม่มีสอบในเทอมนี้
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
                flex: 1,
              },
            ]}
          >
            งาน / กิจกรรม
          </Text>

          <TouchableOpacity
            style={{ flexDirection: "row", alignItems: "center" }}
            onPress={() => setShowFilterDropdown(!showFilterDropdown)}
          >
            <Text
              style={{
                fontFamily: "Inter_400Regular",
                color: "#C7005C",
                marginRight: 5,
              }}
            >
              {activityFilter === "today"
                ? "วันนี้"
                : activityFilter === "week"
                  ? "สัปดาห์นี้"
                  : activityFilter === "nextWeek"
                    ? "สัปดาห์หน้า"
                    : "เดือนนี้"}
            </Text>
            <Entypo
              name={showFilterDropdown ? "chevron-up" : "chevron-down"}
              size={20}
              color="#C7005C"
            />
          </TouchableOpacity>
        </View>

        {/* --- ส่วนสำหรับ Quick Add (เพิ่มงานด่วน) --- */}
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 15 }}>
          <TextInput
            style={{
              flex: 1,
              backgroundColor: "#F1F2F6",
              borderRadius: 12,
              paddingHorizontal: 15,
              paddingVertical: 10,
              fontFamily: "Inter_400Regular",
              color: "#333",
            }}
            placeholder="เพิ่มงานด่วน (พิมพ์แล้วกด ✅)..."
            value={quickTaskName}
            onChangeText={setQuickTaskName}
            onSubmitEditing={handleQuickAddTask} // กดปุ่ม Enter/Return ในคีย์บอร์ดก็เซฟได้เลย
          />
          <TouchableOpacity
            style={{
              backgroundColor: "#C7005C",
              padding: 10,
              borderRadius: 12,
              marginLeft: 10,
            }}
            onPress={handleQuickAddTask}
          >
            <Ionicons name="checkmark" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>

        {showFilterDropdown && (
          <View
            style={{
              position: "absolute",
              right: 15,
              top: 55,
              backgroundColor: "#FFF",
              borderRadius: 12,
              padding: 5,
              elevation: 5,
              zIndex: 10,
              width: 120,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.2,
              shadowRadius: 4,
              borderWidth: 1,
              borderColor: "#FCE4EC",
            }}
          >
            <TouchableOpacity
              style={[
                styles.filterOption,
                activityFilter === "today" && styles.filterOptionActive,
              ]}
              onPress={() => {
                setActivityFilter("today");
                setShowFilterDropdown(false);
              }}
            >
              <Text
                style={[
                  styles.filterOptionText,
                  activityFilter === "today" && styles.filterOptionTextActive,
                ]}
              >
                วันนี้
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.filterOption,
                activityFilter === "week" && styles.filterOptionActive,
              ]}
              onPress={() => {
                setActivityFilter("week");
                setShowFilterDropdown(false);
              }}
            >
              <Text
                style={[
                  styles.filterOptionText,
                  activityFilter === "week" && styles.filterOptionTextActive,
                ]}
              >
                สัปดาห์นี้
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.filterOption,
                activityFilter === "nextWeek" && styles.filterOptionActive,
              ]}
              onPress={() => {
                setActivityFilter("nextWeek");
                setShowFilterDropdown(false);
              }}
            >
              <Text
                style={[
                  styles.filterOptionText,
                  activityFilter === "nextWeek" &&
                    styles.filterOptionTextActive,
                ]}
              >
                สัปดาห์หน้า
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.filterOption,
                activityFilter === "month" && styles.filterOptionActive,
              ]}
              onPress={() => {
                setActivityFilter("month");
                setShowFilterDropdown(false);
              }}
            >
              <Text
                style={[
                  styles.filterOptionText,
                  activityFilter === "month" && styles.filterOptionTextActive,
                ]}
              >
                เดือนนี้
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {upcomingActivities.length > 0 ? (
          upcomingActivities.map((activity, index) => {
            const { label: statusLabel, isLate } = getStatusDetails(activity);

            return (
              <View
                key={index}
                style={[
                  styles.nextClassCard,
                  {
                    backgroundColor: isLate ? "#FFEBEE" : "#FFF",
                    borderWidth: 1.5,
                    borderColor: isLate ? "#FFCDD2" : "#FFDAE0",
                    marginBottom: 10,
                  },
                ]}
              >
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                  }}
                >
                  <View
                    style={[
                      styles.tag,
                      { backgroundColor: isLate ? "#D63031" : "#C7005C" },
                    ]}
                  >
                    <Text style={styles.tagText}>
                      {statusLabel}
                    </Text>
                  </View>
                  {!activity.isQuickTask && (
                    <Text
                      style={{
                        color: isLate ? "#D63031" : "#C7005C",
                        fontWeight: "600",
                      }}
                    >
                      {activity.dateString}
                    </Text>
                  )}
                </View>
                <Text
                  style={{
                    color: isLate ? "#D63031" : "#EA3287",
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
                      color={isLate ? "#D63031" : "#EA3287"}
                    />
                    <Text
                      style={{
                        color: isLate ? "#D63031" : "#EA3287",
                        fontSize: 15,
                      }}
                    >
                      {" "}
                      : {activity.category || "ไม่ได้ระบุ"}
                    </Text>
                  </View>
                  {!activity.isQuickTask && (
                    <Text
                      style={{
                        color: isLate ? "#D63031" : "#EA3287",
                        fontSize: 14,
                        fontWeight: "600",
                      }}
                    >
                      {activity.timeString} น.{" "}
                      {activity.isOvernight ? "(ข้ามคืน)" : ""}
                    </Text>
                  )}
                </View>
              </View>
            );
          })
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

      <View style={styles.divider} />
      <Text style={styles.versionText}>StudySync v1.0.0 🌸</Text>

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
              <Text style={styles.label}>เลือกภาคการศึกษา</Text>
              <View style={[styles.pickerWrapper, { marginBottom: 10 }]}>
                <Picker
                  selectedValue={selectedTableForAdd}
                  onValueChange={(val) => setSelectedTableForAdd(val)}
                  style={{ height: 50 }}
                >
                  <Picker.Item label="-- เลือกภาคการศึกษา --" value="" />
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

      {/* ================= MODAL เพิ่มงาน (Planner) ================= */}
      <Modal visible={modalTaskVisible} animationType="fade" transparent={true}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 15,
              }}
            >
              <Feather
                name="heart"
                size={22}
                color="#C7005C"
                style={{ marginRight: 8 }}
              />
              <Text style={styles.modalTitle}>เพิ่มสิ่งที่ต้องทำ (Task)</Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.label}>หมวดหมู่</Text>
              <View style={styles.categoryRow}>
                <TouchableOpacity
                  style={[
                    styles.categoryButton,
                    category === "study" && styles.categoryButtonActive,
                  ]}
                  onPress={() => setCategory("study")}
                >
                  <Text
                    style={[
                      styles.categoryText,
                      category === "study" && styles.categoryTextActive,
                    ]}
                  >
                    📖 การเรียน
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.categoryButton,
                    category === "other" && styles.categoryButtonActive,
                  ]}
                  onPress={() => {
                    setCategory("other");
                    setSelectedSubjectForTask("");
                    setSelectedSemesterForTask("");
                  }}
                >
                  <Text
                    style={[
                      styles.categoryText,
                      category === "other" && styles.categoryTextActive,
                    ]}
                  >
                    ⚽️ อื่นๆ
                  </Text>
                </TouchableOpacity>
              </View>

              {category === "study" && (
                <>
                  <Text style={styles.label}>เลือกปีการศึกษา (Semester)</Text>
                  <View
                    style={[
                      styles.pickerWrapper,
                      {
                        marginBottom: 10,
                        backgroundColor: "#F1F2F6",
                        borderWidth: 0,
                      },
                    ]}
                  >
                    <Picker
                      selectedValue={selectedSemesterForTask}
                      onValueChange={(val) => {
                        setSelectedSemesterForTask(val);
                        setNote(`ปีการศึกษา: ${val}`);
                      }}
                    >
                      <Picker.Item label="-- เลือกเทอม --" value="" />
                      {tableList.map((item, index) => (
                        <Picker.Item
                          key={index}
                          label={item.label}
                          value={item.label}
                        />
                      ))}
                    </Picker>
                  </View>

                  {selectedSemesterForTask !== "" && (
                    <>
                      <Text style={styles.label}>เลือกวิชาในเทอมนี้</Text>
                      <View
                        style={[
                          styles.pickerWrapper,
                          {
                            marginBottom: 10,
                            backgroundColor: "#F1F2F6",
                            borderWidth: 0,
                          },
                        ]}
                      >
                        <Picker
                          selectedValue={selectedSubjectForTask}
                          onValueChange={(val) => {
                            setSelectedSubjectForTask(val);
                            setActivityName(val);
                          }}
                        >
                          <Picker.Item label="-- เลือกรายวิชา --" value="" />
                          {filteredSubjectsForTask.map((item, index) => (
                            <Picker.Item
                              key={index}
                              label={item.name}
                              value={item.name}
                            />
                          ))}
                        </Picker>
                      </View>
                    </>
                  )}
                </>
              )}

              {category === "other" && (
                <>
                  <Text style={styles.label}>ชื่องาน / กิจกรรม</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="เช่น ทำงานพาร์ทไทม์, ซักผ้า..."
                    value={activityName}
                    onChangeText={setActivityName}
                  />
                </>
              )}

              <Text style={styles.label}>รายละเอียดเพิ่มเติม</Text>
              <TextInput
                style={[styles.input, { height: 80, textAlignVertical: "top" }]}
                placeholder="จดบันทึกรายละเอียด..."
                multiline
                value={note}
                onChangeText={setNote}
              />

              <Text style={styles.label}>วันที่</Text>
              <TouchableOpacity
                style={styles.pickerButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={styles.pickerText}>
                  {formatDate(activityDate)}
                </Text>
                <Ionicons name="calendar-outline" size={20} color="#9E9E9E" />
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={activityDate}
                  mode="date"
                  display="default"
                  onChange={(event, selectedDate) => {
                    setShowDatePicker(false);
                    if (selectedDate) setActivityDate(selectedDate);
                  }}
                />
              )}

              <View style={styles.rowInputs}>
                <View style={{ flex: 1, marginRight: 5 }}>
                  <Text style={styles.label}>เริ่ม</Text>
                  <TouchableOpacity
                    style={styles.pickerButton}
                    onPress={() => setShowStartTimePicker(true)}
                  >
                    <Text style={styles.pickerText}>
                      {formatTime(startTime)}
                    </Text>
                    <Ionicons name="time-outline" size={20} color="#9E9E9E" />
                  </TouchableOpacity>
                  {showStartTimePicker && (
                    <DateTimePicker
                      value={startTime}
                      mode="time"
                      is24Hour={true}
                      display="default"
                      onChange={(event, selectedDate) => {
                        setShowStartTimePicker(false);
                        if (selectedDate) setStartTime(selectedDate);
                      }}
                    />
                  )}
                </View>

                <View style={{ flex: 1, marginLeft: 5 }}>
                  <Text style={styles.label}>สิ้นสุด</Text>
                  <TouchableOpacity
                    style={styles.pickerButton}
                    onPress={() => setShowEndTimePicker(true)}
                  >
                    <Text style={styles.pickerText}>{formatTime(endTime)}</Text>
                    <Ionicons name="time-outline" size={20} color="#9E9E9E" />
                  </TouchableOpacity>
                  {showEndTimePicker && (
                    <DateTimePicker
                      value={endTime}
                      mode="time"
                      is24Hour={true}
                      display="default"
                      onChange={(event, selectedDate) => {
                        setShowEndTimePicker(false);
                        if (selectedDate) setEndTime(selectedDate);
                      }}
                    />
                  )}
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalButtonRow}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setModalTaskVisible(false)}
              >
                <Text style={styles.cancelButtonText}>ยกเลิก</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleAddTask}
              >
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
  container: { flex: 1, backgroundColor: "#F9E2EB", paddingHorizontal: 20 },
  welcomeSection: { marginTop: 30, marginBottom: 20 },
  welcomeText: { color: "#C7005C", fontSize: 26, fontFamily: "Inter_700Bold" },
  dateText: { color: "#9B7B8E", fontSize: 16, fontFamily: "Inter_400Regular" },
  sectionTitle: { fontSize: 18, fontFamily: "Inter_700Bold", color: "#333" },

  // Filter Styles
  filterOption: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F2F6",
  },
  filterOptionActive: { backgroundColor: "#FDF2F8" },
  filterOptionText: { fontFamily: "Inter_400Regular", color: "#666" },
  filterOptionTextActive: { fontFamily: "Inter_700Bold", color: "#C7005C" },

  nextClassCard: {
    padding: 20,
    borderRadius: 20,
    elevation: 4,
    shadowColor: "#FF748C",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  tagText: { color: "#FFF", fontSize: 12, fontWeight: "bold" },
  timeRange: { color: "#FFF", fontWeight: "600" },
  locationRow: { flexDirection: "row", alignItems: "center" },
  roomText: { color: "#EA3287", fontSize: 15, fontFamily: "Inter_400Regular" },

  quickAddSection: { marginBottom: 20 },
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
  quickBtnText: { marginTop: 8, fontWeight: "bold", color: "#FF748C" },
  divider: {
    height: 1.5,
    backgroundColor: "#FFDAE0",
    marginVertical: 20,
    marginHorizontal: 15,
  },
  versionText: {
    textAlign: "center",
    color: "#B2BEC3",
    fontSize: 12,
    marginBottom: 20,
    fontFamily: "Inter_400Regular",
  },

  // Styles สำหรับ Modal เพิ่มวิชาเรียน
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
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    gap: 10,
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
  pickerButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F1F2F6",
    borderRadius: 12,
    padding: 12,
    marginBottom: 15,
  },
  pickerText: { color: "#333", fontSize: 15 },
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
  categoryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  categoryButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#EEEEEE",
    alignItems: "center",
    marginHorizontal: 5,
    backgroundColor: "#F1F2F6",
  },
  categoryButtonActive: { backgroundColor: "#FCE4EC", borderColor: "#E91E63" },
  categoryText: { fontSize: 13, color: "#9E9E9E", fontFamily: "Inter_700Bold" },
  categoryTextActive: { color: "#C7005C" },
  rowInputs: { flexDirection: "row" },
  modalButtonRow: { flexDirection: "row", marginTop: 15 },
  cancelButton: {
    flex: 1,
    backgroundColor: "#F1F2F6",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginRight: 10,
  },
  cancelButtonText: { color: "#9E9E9E", fontFamily: "Inter_700Bold" },
  saveButton: {
    flex: 1,
    backgroundColor: "#C7005C",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  saveButtonText: { color: "#FFF", fontFamily: "Inter_700Bold" },
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
});

export default Dashboard;