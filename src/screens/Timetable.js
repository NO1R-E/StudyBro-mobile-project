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
  Platform,
} from "react-native";
import CustomDropdown from "../components/CustomDropdown";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Picker } from "@react-native-picker/picker";
import {
  useFonts,
  Inter_400Regular,
  Inter_700Bold,
} from "@expo-google-fonts/inter";
import Feather from "@expo/vector-icons/Feather";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db, auth } from "../../firebaseConfig";
import isOverlapping from "../helper/isOverlapping";
import { useFocusEffect } from "@react-navigation/native";

const Timetable = ({ navigation }) => {
  const user = auth.currentUser;
  const [mode, setMode] = useState("class");
  const [pickerMode, setPickerMode] = useState(null);
  const [action, setAction] = useState();
  const [modalTableVisible, setModalTableVisible] = useState(false);
  const [modalSubjectVisible, setModalSubjectVisible] = useState(false);
  const [modalExamEditVisible, setModalExamEditVisible] = useState(false);

  // จัดการสถานะการแก้ไขวิชา
  const [isEditingSubject, setIsEditingSubject] = useState(false);
  const [editingSubjectOriginalCode, setEditingSubjectOriginalCode] =
    useState(null);

  // จัดการเวลาเริ่มต้นมาตรฐาน
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

  const [editingExam, setEditingExam] = useState(null);

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_700Bold,
  });

  const openPicker = (mode) => {
    setPickerMode(mode);
  };

  // ข้อมูลวิชาหลัก
  const [subject, setSubject] = useState({
    code: "",
    name: "",
    sec: "100",
  });

  // ข้อมูลคาบเรียน
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

  const [activePicker, setActivePicker] = useState(null);

  const [tableList, setTableList] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [table, setTable] = useState([]);
  const [examList, setExamList] = useState([]);

  const [newSemester, setNewSemester] = useState("ภาคต้น");
  const [newYear, setNewYear] = useState(
    (new Date().getFullYear() + 543).toString(),
  );

  const handleAddTable = () => {
    if (!newYear.trim()) {
      Alert.alert("แจ้งเตือน", "กรุณากรอกปีการศึกษา");
      return;
    }

    const tableName = `${newSemester}/${newYear}`;

    if (tableList.some((t) => t.label === tableName)) {
      Alert.alert("แจ้งเตือน", "มีปีการศึกษานี้อยู่แล้ว");
      return;
    }

    const newOption = {
      label: tableName,
      value: tableList.length + 1,
    };

    const updatedList = [...tableList, newOption];
    setTableList(updatedList);
    setSelectedTable(tableName);
    persistData(table, updatedList, examList);
    setModalTableVisible(false);
    setAction(null);
  };

  const openAddSubjectModal = (day) => {
    setIsEditingSubject(false);
    setEditingSubjectOriginalCode(null);
    setSubject({ code: "", name: "", sec: "100" });
    setSessions([
      {
        id: Date.now().toString(),
        day: day,
        type: "Lecture",
        room: "",
        startTime: getDefaultStartTime(),
        endTime: getDefaultEndTime(),
      },
    ]);
    setModalSubjectVisible(true);
  };

  const handleEditSubjectClick = (itemCode) => {
    const subjectClasses = table.filter(
      (c) => c.code === itemCode && c.table === selectedTable,
    );
    if (subjectClasses.length > 0) {
      const baseClass = subjectClasses[0];
      setSubject({
        code: baseClass.code,
        name: baseClass.name,
        sec: baseClass.sec,
      });

      const parsedSessions = subjectClasses.map((c) => {
        const [startH, startM] = c.start.split(":").map(Number);
        const [endH, endM] = c.end.split(":").map(Number);
        const startDate = new Date();
        startDate.setHours(startH, startM, 0, 0);
        const endDate = new Date();
        endDate.setHours(endH, endM, 0, 0);

        return {
          id: c.id,
          day: c.day,
          type: c.type || "Lecture",
          room: c.room || "",
          startTime: startDate,
          endTime: endDate,
        };
      });

      setSessions(parsedSessions);
      setIsEditingSubject(true);
      setEditingSubjectOriginalCode(itemCode);
      setModalSubjectVisible(true);
    }
  };

  const handleAddSubject = async () => {
    // ตรวจสอบค่าว่างของวิชาหลัก
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

    // ตรวจสอบค่าว่างของแต่ละคาบเรียน
    for (let i = 0; i < sessions.length; i++) {
      if (!sessions[i].type.trim()) {
        Alert.alert(
          "กรุณากรอกข้อมูล",
          `โปรดกรอกประเภท (Lec/Lab) และห้องเรียนในคาบที่ ${i + 1} ให้ครบถ้วน`,
        );
        return;
      }
      if (!sessions[i].room.trim()) {
        sessions[i].room = "ติดต่ออาจารย์ผู้สอน"; // กำหนดค่าเริ่มต้นหากห้องว่าง
      }
    }

    // แยกข้อมูลวิชาเดิมออกก่อน หากกำลังอยู่ในโหมดแก้ไข
    let tempTable = table;
    if (isEditingSubject) {
      tempTable = table.filter(
        (c) =>
          !(c.code === editingSubjectOriginalCode && c.table === selectedTable),
      );
    }

    // ตรวจสอบวิชาซ้ำ (รหัสวิชาตรงกันในเทอมเดียวกัน)
    const isDuplicateCode = tempTable.some(
      (c) =>
        c.code.trim().toUpperCase() === subject.code.trim().toUpperCase() &&
        c.table === selectedTable,
    );

    if (isDuplicateCode) {
      Alert.alert(
        "เพิ่มวิชาไม่สำเร็จ",
        `รหัสวิชา ${subject.code.toUpperCase()} มีอยู่ในตารางเรียนแล้ว หากต้องการเพิ่มคาบเรียนหรือแก้ไข กรุณากดปุ่ม 'แก้ไข' ของวิชานั้นแทนขอรับ`,
      );
      return;
    }

    const newEntries = sessions.map((s, index) => ({
      id: s.id.toString().includes(Date.now().toString().substring(0, 5))
        ? s.id
        : Date.now().toString() + index.toString(),
      table: selectedTable,
      code: subject.code.toUpperCase(), // บันทึกรหัสวิชาเป็นตัวพิมพ์ใหญ่เพื่อความสวยงามและป้องกันปัญหาการเปรียบเทียบ
      name: subject.name,
      sec: subject.sec,
      day: s.day,
      type: s.type,
      room: s.room,
      start: formatTime(s.startTime),
      end: formatTime(s.endTime),
    }));

    let isConflictFound = false;
    let conflictMsg = "";

    // ตรวจสอบเวลาซ้อนทับกัน
    for (const newEntry of newEntries) {
      const hasClassOverlap = tempTable.some(
        (s) =>
          s.day === newEntry.day &&
          s.table === selectedTable &&
          isOverlapping(newEntry.start, newEntry.end, s.start, s.end),
      );

      if (hasClassOverlap) {
        isConflictFound = true;
        conflictMsg = `มีวิชาอื่นซ้อนทับอยู่ในวัน ${dayLabels[newEntry.day]} เวลา ${newEntry.start}-${newEntry.end}`;
        break;
      }
    }

    const executeAdd = () => {
      const updatedTable = [...tempTable, ...newEntries];
      setTable(updatedTable);

      let updatedExams = examList;
      if (isEditingSubject && editingSubjectOriginalCode !== subject.code) {
        updatedExams = examList.map((e) =>
          e.code === editingSubjectOriginalCode && e.table === selectedTable
            ? {
                ...e,
                code: subject.code.toUpperCase(),
                name: subject.name,
                section: subject.sec,
              }
            : e,
        );
        setExamList(updatedExams);
      }

      persistData(updatedTable, tableList, updatedExams);
      setModalSubjectVisible(false);
      setIsEditingSubject(false);
      setEditingSubjectOriginalCode(null);
      setSubject({ code: "", name: "", sec: "100" });
    };

    try {
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
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteEntireSubject = () => {
    Alert.alert(
      "ยืนยันการลบวิชา",
      `คุณต้องการลบวิชา ${subject.code} ทั้งหมดออกจากตารางเรียนใช่หรือไม่?`,
      [
        { text: "ยกเลิก", style: "cancel" },
        {
          text: "ลบวิชา",
          style: "destructive",
          onPress: () => {
            const updatedTable = table.filter(
              (item) =>
                !(
                  item.code === editingSubjectOriginalCode &&
                  item.table === selectedTable
                ),
            );
            const updatedExams = examList.filter(
              (item) =>
                !(
                  item.code === editingSubjectOriginalCode &&
                  item.table === selectedTable
                ),
            );

            setTable(updatedTable);
            setExamList(updatedExams);
            persistData(updatedTable, tableList, updatedExams);

            setModalSubjectVisible(false);
            setIsEditingSubject(false);
            setEditingSubjectOriginalCode(null);
          },
        },
      ],
    );
  };

  useEffect(() => {
    setExamList((prev) => {
      const currentSemesterClasses = table.filter(
        (c) => c.table === selectedTable,
      );

      const uniqueSubjectsMap = new Map();
      currentSemesterClasses.forEach((c) => {
        if (!uniqueSubjectsMap.has(c.code)) {
          uniqueSubjectsMap.set(c.code, c);
        }
      });

      const uniqueSubjects = Array.from(uniqueSubjectsMap.values());

      return uniqueSubjects.map((c) => {
        const existing = prev.find(
          (e) => e.code === c.code && e.table === c.table,
        );
        return existing
          ? { ...existing, section: c.sec, name: c.name }
          : {
              id: c.code + c.table,
              code: c.code,
              name: c.name,
              section: c.sec || "100",
              examDate: "",
              startTime: "",
              endTime: "",
              room: "",
              table: c.table,
            };
      });
    });
  }, [table, selectedTable]);

  const dayThemes = new Map([
    [
      "Monday",
      {
        text: "#A66100",
        border: "#FFF085",
        background: "#FEFCE8",
        detail: "#D98D22",
      },
    ],
    [
      "Tuesday",
      {
        text: "#C7005C",
        border: "#FCCEE8",
        background: "#FDF2F8",
        detail: "#EA3287",
      },
    ],
    [
      "Wednesday",
      {
        text: "#078537",
        border: "#B9F8CF",
        background: "#F0FDF4",
        detail: "#2EB461",
      },
    ],
    [
      "Thursday",
      {
        text: "#c77700",
        border: "#ffbd43",
        background: "#fff1de",
        detail: "#a5742e",
      },
    ],
    [
      "Friday",
      {
        text: "#00838F",
        border: "#26C6DA",
        background: "#E0F7FA",
        detail: "#2da8b8",
      },
    ],
    [
      "Saturday",
      {
        text: "#5e058b",
        border: "#e999ff",
        background: "#fbe5ff",
        detail: "#852a99",
      },
    ],
    [
      "Sunday",
      {
        text: "#8f0000",
        border: "#ff8080",
        background: "#ffe2e2",
        detail: "#ba2c2c",
      },
    ],
  ]);

  const days = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];
  const dayLabels = {
    Monday: "จันทร์",
    Tuesday: "อังคาร",
    Wednesday: "พุธ",
    Thursday: "พฤหัสบดี",
    Friday: "ศุกร์",
    Saturday: "เสาร์",
    Sunday: "อาทิตย์",
  };

  const handleUpdateExam = () => {
    if (
      !editingExam.examDate ||
      !editingExam.startTime ||
      !editingExam.endTime
    ) {
      Alert.alert("กรุณากรอกข้อมูล", "กรุณาเลือกวันที่และเวลาสอบให้ครบถ้วน");
      return;
    }
    const [startHour, startMinute] = editingExam.startTime
      .split(":")
      .map(Number);
    const [endHour, endMinute] = editingExam.endTime.split(":").map(Number);

    const startTotal = startHour * 60 + startMinute;
    const endTotal = endHour * 60 + endMinute;

    if (startTotal >= endTotal) {
      Alert.alert("เวลาไม่ถูกต้อง", "เวลาเริ่มสอบต้องน้อยกว่าเวลาสิ้นสุด");
      return;
    }

    const updatedExams = examList.map((ex) =>
      ex.id === editingExam.id ? editingExam : ex,
    );

    setExamList(updatedExams);
    persistData(table, tableList, updatedExams);

    setModalExamEditVisible(false);
    setEditingExam(null);
  };

  useFocusEffect(
    useCallback(() => {
      const loadAndSync = async () => {
        try {
          const [localT, localL, localE, localTS] = await Promise.all([
            AsyncStorage.getItem("user_table"),
            AsyncStorage.getItem("user_table_list"),
            AsyncStorage.getItem("user_exams"),
            AsyncStorage.getItem("last_updated"),
          ]);

          let loadedTableList = [];

          // --- โหลดจาก Local ---
          if (localT) setTable(JSON.parse(localT));
          if (localL) {
            loadedTableList = JSON.parse(localL);
            loadedTableList = loadedTableList.filter(
              (item) => item.label !== "default",
            );
            setTableList(loadedTableList);
          }
          if (localE) setExamList(JSON.parse(localE));

          // --- ซิงค์กับ Cloud ---
          if (auth.currentUser) {
            const userDocRef = doc(
              db,
              "users",
              auth.currentUser.uid,
              "timetable",
              "data",
            );
            const docSnap = await getDoc(userDocRef);

            if (docSnap.exists()) {
              const cloudData = docSnap.data();
              const cloudTS = cloudData.lastUpdated;

              const isCloudNewer =
                !localTS || new Date(cloudTS) > new Date(localTS);

              if (isCloudNewer) {
                setTable(cloudData.table || []);
                let cloudTableList = cloudData.tableList || [];
                cloudTableList = cloudTableList.filter(
                  (item) => item.label !== "default",
                );
                setTableList(cloudTableList);
                setExamList(cloudData.examList || []);
                loadedTableList = cloudTableList;

                await AsyncStorage.multiSet([
                  ["user_table", JSON.stringify(cloudData.table)],
                  ["user_table_list", JSON.stringify(cloudTableList)],
                  ["user_exams", JSON.stringify(cloudData.examList)],
                  ["last_updated", cloudTS],
                ]);
              }
            }
          }

          if (loadedTableList.length > 0 && !selectedTable) {
            setSelectedTable(loadedTableList[0].label);
          }
        } catch (error) {
          console.error("DEBUG ERROR:", error);
        }
      };

      loadAndSync();

      // คืนค่าว่างเปล่า (Cleanup function)
      return () => {};
    }, [selectedTable]), // ใส่ dependency ที่จำเป็น
  );

  const persistData = async (newTable, newList, newExams) => {
    try {
      const timestamp = new Date().toISOString();

      await AsyncStorage.multiSet([
        ["user_table", JSON.stringify(newTable)],
        ["user_table_list", JSON.stringify(newList)],
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
            tableList: newList,
            examList: newExams,
            lastUpdated: timestamp,
          },
          { merge: true },
        );
      }
    } catch (error) {
      console.error("DEBUG PERSISTENCE ERROR:", error);
    }
  };

  if (!selectedTable || tableList.length === 0) {
    return (
      <View
        style={[
          styles.container,
          { justifyContent: "center", alignItems: "center", padding: 20 },
        ]}
      >
        <Ionicons
          name="calendar-outline"
          size={80}
          color="#FFAAC9"
          style={{ marginBottom: 20 }}
        />
        <Text
          style={{
            fontSize: 18,
            fontFamily: "Inter_700Bold",
            color: "#C7005C",
            textAlign: "center",
            marginBottom: 10,
          }}
        >
          คุณยังไม่ได้เพิ่มแผนปีการศึกษา
        </Text>
        <Text
          style={{
            fontSize: 14,
            fontFamily: "Inter_400Regular",
            color: "#9B7B8E",
            textAlign: "center",
            marginBottom: 30,
          }}
        >
          เริ่มต้นสร้างตารางเรียนของคุณโดยการกดปุ่มด้านล่าง
        </Text>
        <TouchableOpacity
          style={[styles.confirmBtn, { paddingHorizontal: 30 }]}
          onPress={() => {
            setAction("add");
            setModalTableVisible(true);
          }}
        >
          <Text style={styles.confirmBtnText}>+ เพิ่มปีการศึกษาเลย</Text>
        </TouchableOpacity>

        <Modal visible={modalTableVisible} animationType="fade" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Ionicons name="add-circle" size={24} color="#C7005C" />
                <Text style={styles.modalTitle}>เพิ่มปีการศึกษา</Text>
              </View>
              <View style={styles.modalBody}>
                <View style={styles.inputGroup}>
                  <Text style={styles.fieldLabel}>ภาคการศึกษา</Text>
                  <View style={styles.pickerWrapper}>
                    <Picker
                      selectedValue={newSemester}
                      onValueChange={(itemValue) => setNewSemester(itemValue)}
                      style={{ height: 50 }}
                    >
                      <Picker.Item label="ภาคต้น" value="ภาคต้น" />
                      <Picker.Item label="ภาคปลาย" value="ภาคปลาย" />
                      <Picker.Item label="ภาคฤดูร้อน" value="ภาคฤดูร้อน" />
                    </Picker>
                  </View>

                  <Text style={[styles.fieldLabel, { marginTop: 10 }]}>
                    ปีการศึกษา (พ.ศ.)
                  </Text>
                  <TextInput
                    placeholder="เช่น 2567"
                    value={newYear}
                    onChangeText={setNewYear}
                    style={styles.modalInput}
                    keyboardType="numeric"
                    placeholderTextColor="#B2BEC3"
                  />
                </View>
              </View>
              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={styles.confirmBtn}
                  onPress={handleAddTable}
                >
                  <Text style={styles.confirmBtnText}>ยืนยัน</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.closeBtn}
                  onPress={() => setModalTableVisible(false)}
                >
                  <Text style={styles.closeBtnText}>ยกเลิก</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[styles.toggleBtn, mode === "class" && styles.activeBtn]}
          onPress={() => setMode("class")}
        >
          <Text
            style={mode === "class" ? styles.activeText : styles.inactiveText}
          >
            ตารางเรียน
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleBtn, mode === "exam" && styles.activeBtn]}
          onPress={() => setMode("exam")}
        >
          <Text
            style={mode === "exam" ? styles.activeText : styles.inactiveText}
          >
            ตารางสอบ
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.addBtn}
        onPress={() => {
          setAction("add");
          setModalTableVisible(true);
        }}
      >
        <Text style={styles.addBtnText}>+ จัดการปีการศึกษา</Text>
      </TouchableOpacity>

      <View>
        <CustomDropdown
          placeholder={selectedTable}
          data={tableList}
          onSelect={(item) => setSelectedTable(item.label)}
        />
      </View>

      {/* ================= โหมดตารางเรียน ================= */}
      {mode === "class" && (
        <ScrollView
          style={styles.listArea}
          showsVerticalScrollIndicator={false}
        >
          {days.map((day) => {
            const dailyClasses = table.filter(
              (c) => c.day === day && c.table === selectedTable,
            );
            const theme = dayThemes.get(day) || {
              text: "#333",
              background: "#EEE",
            };

            return (
              <View
                key={day}
                style={[
                  styles.daySection,
                  {
                    backgroundColor: theme?.background,
                    borderColor: theme?.border,
                    borderWidth: 2,
                  },
                ]}
              >
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                  }}
                >
                  <Text
                    style={[
                      styles.dayTitle,
                      {
                        color: theme?.text,
                        borderLeftColor: theme?.text,
                        borderLeftWidth: 4,
                      },
                    ]}
                  >
                    {day}
                  </Text>
                  <TouchableOpacity onPress={() => openAddSubjectModal(day)}>
                    <Feather name="plus-circle" size={24} color={theme?.text} />
                  </TouchableOpacity>
                </View>

                {dailyClasses.length === 0 ? (
                  <Text style={[styles.emptyText, { color: theme?.detail }]}>
                    ไม่มีเรียนวันนี้
                  </Text>
                ) : (
                  dailyClasses.map((item) => (
                    <View key={item.id} style={styles.classCard}>
                      <View style={{ flexDirection: "row", gap: 15 }}>
                        <Text
                          style={[
                            styles.timeLabel,
                            { color: theme?.text, width: 90 },
                          ]}
                        >
                          {item.start} - {item.end}
                        </Text>
                        <View style={{ flex: 1 }}>
                          <View
                            style={{
                              flexDirection: "row",
                              justifyContent: "space-between",
                              alignItems: "flex-start",
                              gap: 10,
                            }}
                          >
                            <Text
                              style={[
                                styles.classlabel,
                                {
                                  color: theme?.detail,
                                  fontFamily: "Inter_700Bold",
                                  flex: 1,
                                },
                              ]}
                              numberOfLines={2}
                            >
                              {item.code} sec {item.sec}{" "}
                              {item.type ? `(${item.type})` : ""}
                            </Text>
                            <TouchableOpacity
                              onPress={() => handleEditSubjectClick(item.code)}
                              style={{
                                padding: 6,
                                flexDirection: "row",
                                alignItems: "center",
                                backgroundColor: "#F1F2F6",
                                borderRadius: 8,
                                flexShrink: 0,
                              }}
                            >
                              <Feather
                                name="edit"
                                size={14}
                                color="#00B894"
                                style={{ marginRight: 4 }}
                              />
                              <Text
                                style={{
                                  fontFamily: "Inter_700Bold",
                                  color: "#00B894",
                                  fontSize: 12,
                                }}
                              >
                                แก้ไข
                              </Text>
                            </TouchableOpacity>
                          </View>
                          <Text
                            style={[
                              styles.classlabel,
                              { color: theme?.detail, marginTop: 4 },
                            ]}
                          >
                            {item.name}
                          </Text>
                          <Text
                            style={[
                              styles.classlabel,
                              { color: theme?.detail },
                            ]}
                          >
                            ห้อง: {item.room}
                          </Text>
                        </View>
                      </View>
                    </View>
                  ))
                )}
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* ================= โหมดตารางสอบ ================= */}
      {mode === "exam" && (
        <ScrollView
          style={styles.containerExam}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.examCard}>
            <View
              style={{ flexDirection: "row", justifyContent: "space-between" }}
            >
              <Text style={styles.title}>กำหนดการสอบ</Text>
            </View>

            {examList.filter((item) => item.table === selectedTable).length ===
            0 ? (
              <Text style={styles.emptyText}>ยังไม่มีวิชาในตารางสอบ</Text>
            ) : (
              examList
                .filter((item) => item.table === selectedTable)
                .map((item) => (
                  <View key={item.id} style={styles.examCardMini}>
                    <View
                      style={{
                        flexDirection: "row",
                        gap: 20,
                        justifyContent: "space-between",
                      }}
                    >
                      <View>
                        <Text style={styles.examValue}>
                          {item.examDate || "กรุณากรอกวันสอบ"}
                        </Text>
                        <Text style={styles.examValue}>
                          {item.startTime && item.endTime
                            ? `${item.startTime} - ${item.endTime}`
                            : "กรุณากรอกเวลาสอบ"}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[
                            styles.examDatail,
                            { fontFamily: "Inter_700Bold" },
                          ]}
                        >
                          {item.code} sec {item.section}
                        </Text>
                        <Text style={styles.examDatail}>{item.name}</Text>
                        <Text style={styles.examDatail}>
                          ห้องสอบ :{" "}
                          <Text style={styles.examValue}>
                            {item.room || "รออาจารย์ผู้สอนแจ้ง"}
                          </Text>
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={{ paddingLeft: 10, justifyContent: "center" }}
                        onPress={() => {
                          setEditingExam(item);
                          setModalExamEditVisible(true);
                        }}
                      >
                        <Feather name="edit" size={24} color="#C7005C" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
            )}
          </View>
        </ScrollView>
      )}

      {/* ================= MODAL จัดการปีการศึกษา ================= */}
      <Modal visible={modalTableVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Ionicons name="settings-outline" size={24} color="#C7005C" />
              <Text style={styles.modalTitle}>จัดการปีการศึกษา</Text>
            </View>

            <View style={styles.actionTabContainer}>
              <TouchableOpacity
                onPress={() => setAction("add")}
                style={[
                  styles.actionTab,
                  action === "add" && styles.actionTabActive,
                ]}
              >
                <Ionicons
                  name="add-circle"
                  size={18}
                  color={action === "add" ? "#FFF" : "#C7005C"}
                />
                <Text
                  style={[
                    styles.actionTabText,
                    action === "add" && styles.actionTabTextActive,
                  ]}
                >
                  เพิ่มภาคเรียน
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setAction("delete")}
                style={[
                  styles.actionTab,
                  action === "delete" && styles.actionTabActive,
                ]}
              >
                <Ionicons
                  name="trash"
                  size={18}
                  color={action === "delete" ? "#FFF" : "#C7005C"}
                />
                <Text
                  style={[
                    styles.actionTabText,
                    action === "delete" && styles.actionTabTextActive,
                  ]}
                >
                  ลบภาคเรียน
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              {action === "add" ? (
                <View style={styles.inputGroup}>
                  <Text style={styles.fieldLabel}>ภาคการศึกษา</Text>
                  <View style={styles.pickerWrapper}>
                    <Picker
                      selectedValue={newSemester}
                      onValueChange={(itemValue) => setNewSemester(itemValue)}
                      style={{ height: 50 }}
                    >
                      <Picker.Item label="ภาคต้น" value="ภาคต้น" />
                      <Picker.Item label="ภาคปลาย" value="ภาคปลาย" />
                      <Picker.Item label="ภาคฤดูร้อน" value="ภาคฤดูร้อน" />
                    </Picker>
                  </View>

                  <Text style={[styles.fieldLabel, { marginTop: 10 }]}>
                    ปีการศึกษา (พ.ศ.)
                  </Text>
                  <TextInput
                    placeholder="เช่น 2567"
                    value={newYear}
                    onChangeText={setNewYear}
                    keyboardType="numeric"
                    style={styles.modalInput}
                  />
                </View>
              ) : action === "delete" ? (
                <View style={styles.inputGroup}>
                  <Text style={styles.fieldLabel}>เลือกกลุ่มที่ต้องการลบ</Text>
                  <View style={styles.pickerWrapper}>
                    <Picker
                      selectedValue={selectedTable}
                      onValueChange={(itemValue) => setSelectedTable(itemValue)}
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
                </View>
              ) : (
                <View style={styles.placeholderBox}>
                  <Ionicons name="arrow-up-outline" size={30} color="#DDD" />
                  <Text style={styles.placeholderText}>
                    กรุณาเลือกรูปแบบการจัดการ
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[
                  styles.confirmBtn,
                  {
                    opacity:
                      action === "delete" && tableList.length === 0 ? 0.5 : 1,
                  },
                ]}
                disabled={action === "delete" && tableList.length === 0}
                onPress={() => {
                  if (action === "add") {
                    handleAddTable();
                  }

                  if (action === "delete") {
                    if (!selectedTable) return;
                    const updatedTableList = tableList.filter(
                      (item) => item.label !== selectedTable,
                    );
                    const updatedTable = table.filter(
                      (item) => item.table !== selectedTable,
                    );
                    const updatedExams = examList.filter(
                      (item) => item.table !== selectedTable,
                    );

                    setTableList(updatedTableList);
                    setTable(updatedTable);
                    setExamList(updatedExams);
                    setSelectedTable(
                      updatedTableList.length > 0
                        ? updatedTableList[0].label
                        : null,
                    );
                    persistData(updatedTable, updatedTableList, updatedExams);
                  }
                  setModalTableVisible(false);
                }}
              >
                <Text style={styles.confirmBtnText}>ยืนยันการทำรายการ</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => {
                  setModalTableVisible(false);
                  setAction(null);
                }}
              >
                <Text style={styles.closeBtnText}>ยกเลิก</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ================= MODAL เพิ่ม/แก้ไข วิชาเรียนแบบระบุหลายคาบ ================= */}
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
              {isEditingSubject ? "แก้ไขข้อมูลวิชาเรียน" : "เพิ่มวิชาเรียน"}
            </Text>

            <ScrollView
              showsVerticalScrollIndicator={false}
              style={{ flexShrink: 1 }}
            >
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

                  {/* 📝 เปลี่ยนจาก TextInput เป็น Dropdown สำหรับ Lecture/Lab */}
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
                <Text style={styles.saveBtnText}>
                  {isEditingSubject ? "บันทึกการเปลี่ยนแปลง" : "บันทึกวิชา"}
                </Text>
              </TouchableOpacity>

              {/* ปุ่มลบวิชาทั้งหมด จะแสดงเฉพาะตอนแก้ไข */}
              {isEditingSubject && (
                <TouchableOpacity
                  style={[styles.saveBtn, { backgroundColor: "#FF7675" }]}
                  onPress={handleDeleteEntireSubject}
                >
                  <Text style={styles.saveBtnText}>ลบวิชานี้</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => {
                  setModalSubjectVisible(false);
                  setIsEditingSubject(false);
                  setEditingSubjectOriginalCode(null);
                }}
              >
                <Text style={styles.cancelBtnText}>ยกเลิก</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ================= MODAL แก้ไขเวลาสอบ ================= */}
      <Modal
        visible={modalExamEditVisible}
        animationType="fade"
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>อัปเดตข้อมูลสอบ</Text>

            <Text style={styles.label}>รหัสวิชา</Text>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: "#EAEAEA", color: "#666" },
              ]}
              value={`${editingExam?.code} - ${editingExam?.name}`}
              editable={false}
            />

            <Text style={styles.label}>ห้องสอบ (ปล่อยว่างได้)</Text>
            <TextInput
              placeholder="เช่น รออาจารย์แจ้ง"
              style={styles.input}
              value={editingExam?.room}
              onChangeText={(t) => setEditingExam({ ...editingExam, room: t })}
            />

            <Text style={styles.label}>วันที่สอบ</Text>
            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => openPicker("date")}
            >
              <Text style={styles.pickerText}>
                {editingExam?.examDate || "เลือกวันที่"}
              </Text>
              <Ionicons name="calendar-outline" size={20} color="gray" />
            </TouchableOpacity>

            <View style={{ flexDirection: "row" }}>
              <View style={{ flex: 1, marginRight: 5 }}>
                <Text style={styles.label}>เวลาเริ่ม</Text>
                <TouchableOpacity
                  style={styles.pickerButton}
                  onPress={() => openPicker("startTime")}
                >
                  <Text style={styles.pickerText}>
                    {editingExam?.startTime || "เลือกเวลา"}
                  </Text>
                  <Ionicons name="time-outline" size={20} color="gray" />
                </TouchableOpacity>
              </View>
              <View style={{ flex: 1, marginLeft: 5 }}>
                <Text style={styles.label}>เวลาสิ้นสุด</Text>
                <TouchableOpacity
                  style={styles.pickerButton}
                  onPress={() => openPicker("endTime")}
                >
                  <Text style={styles.pickerText}>
                    {editingExam?.endTime || "เลือกเวลา"}
                  </Text>
                  <Ionicons name="time-outline" size={20} color="gray" />
                </TouchableOpacity>
              </View>
            </View>

            {pickerMode && (
              <DateTimePicker
                value={new Date()}
                mode={pickerMode === "date" ? "date" : "time"}
                is24Hour
                display="default"
                onChange={(event, selectedDate) => {
                  setPickerMode(null);
                  if (!selectedDate) return;

                  if (pickerMode === "date") {
                    setEditingExam({
                      ...editingExam,
                      examDate: selectedDate.toLocaleDateString("th-TH"),
                    });
                  } else if (pickerMode === "startTime") {
                    setEditingExam({
                      ...editingExam,
                      startTime: selectedDate.toLocaleTimeString("th-TH", {
                        hour: "2-digit",
                        minute: "2-digit",
                      }),
                    });
                  } else if (pickerMode === "endTime") {
                    setEditingExam({
                      ...editingExam,
                      endTime: selectedDate.toLocaleTimeString("th-TH", {
                        hour: "2-digit",
                        minute: "2-digit",
                      }),
                    });
                  }
                }}
              />
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleUpdateExam}
              >
                <Text style={styles.saveBtnText}>บันทึกตารางสอบ</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setModalExamEditVisible(false)}
              >
                <Text style={styles.cancelBtnText}>ยกเลิก</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9E2EB" },
  toggleContainer: {
    flexDirection: "row",
    margin: 15,
    backgroundColor: "#ffffff",
    borderRadius: 25,
    padding: 5,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 25,
  },
  activeBtn: { backgroundColor: "#FFAAC9", elevation: 8 },
  activeText: { color: "#FFF", fontFamily: "Inter_700Bold", fontSize: 16 },
  inactiveText: { color: "#9B7B8E", fontFamily: "Inter_700Bold", fontSize: 16 },
  listArea: { paddingHorizontal: 15 },
  daySection: {
    marginBottom: 20,
    borderWidth: 1,
    padding: 10,
    borderRadius: 12,
  },
  dayTitle: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    marginBottom: 10,
    paddingLeft: 10,
  },
  classCard: {
    backgroundColor: "#FFF",
    padding: 15,
    borderRadius: 12,
    marginBottom: 8,
    elevation: 2,
  },
  timeLabel: { fontFamily: "Inter_700Bold", fontSize: 15 },
  classlabel: { fontFamily: "Inter_400Regular", fontSize: 14, marginTop: 2 },
  emptyText: { color: "#B2BEC3", fontStyle: "italic", marginLeft: 15 },
  addBtn: {
    backgroundColor: "#ffffff",
    borderWidth: 1.5,
    marginHorizontal: 15,
    marginBottom: 10,
    borderColor: "#C7005C",
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
    borderStyle: "dashed",
  },
  addBtnText: { color: "#C7005C", fontFamily: "Inter_700Bold", fontSize: 16 },
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
  title: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    color: "#C7005C",
    marginBottom: 15,
  },
  examCard: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 15,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: "#FFDAE0",
  },
  examCardMini: {
    backgroundColor: "#FDF2F8",
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
  },
  containerExam: { paddingHorizontal: 15 },
  examValue: {
    color: "#C7005C",
    fontFamily: "Inter_700Bold",
    fontSize: 14,
    marginBottom: 2,
  },
  examDatail: {
    color: "#333",
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    marginBottom: 2,
  },
  actionTabContainer: {
    flexDirection: "row",
    backgroundColor: "#F1F2F6",
    borderRadius: 15,
    padding: 5,
    marginBottom: 15,
  },
  actionTab: {
    flex: 1,
    flexDirection: "row",
    height: 45,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
  },
  actionTabActive: { backgroundColor: "#C7005C" },
  actionTabText: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: "#C7005C",
    marginLeft: 8,
  },
  actionTabTextActive: { color: "#FFF", fontFamily: "Inter_700Bold" },
  modalBody: { minHeight: 120, justifyContent: "center" },
  inputGroup: { gap: 10 },
  fieldLabel: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    color: "#9B7B8E",
    marginLeft: 5,
  },
  modalInput: {
    backgroundColor: "#FFF",
    borderWidth: 1.5,
    borderColor: "#FFDAE0",
    borderRadius: 15,
    height: 55,
    paddingHorizontal: 20,
    fontSize: 16,
    color: "#333",
  },
  pickerWrapper: {
    borderWidth: 1.5,
    borderColor: "#FFDAE0",
    borderRadius: 15,
    overflow: "hidden",
    backgroundColor: "#FFF",
  },
  placeholderBox: { alignItems: "center", gap: 10 },
  placeholderText: {
    color: "#B2BEC3",
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  modalFooter: { marginTop: 20, gap: 5 },
  confirmBtn: {
    backgroundColor: "#C7005C",
    height: 55,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
  },
  confirmBtnText: { color: "#FFF", fontSize: 17, fontFamily: "Inter_700Bold" },
  closeBtn: { height: 50, justifyContent: "center", alignItems: "center" },
  closeBtnText: { color: "#9B7B8E", fontSize: 16, fontFamily: "Inter_700Bold" },
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

export default Timetable;
