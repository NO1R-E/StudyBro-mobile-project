import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  Alert,
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

const Timetable = ({ navigation }) => {
  const user = auth.currentUser;
  const [mode, setMode] = useState("class");
  const [pickerMode, setPickerMode] = useState(null);
  const [action, setAction] = useState();
  const [modalTableVisible, setModalTableVisible] = useState(false);
  const [modalSubjectVisible, setModalSubjectVisible] = useState(false);
  const [modalExamEditVisible, setModalExamEditVisible] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const formatTime = (dateObj) =>
    `${dateObj.getHours().toString().padStart(2, "0")}:${dateObj.getMinutes().toString().padStart(2, "0")}`;
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(
    new Date(new Date().setHours(new Date().getHours() + 1))
  );
  const [editingExam, setEditingExam] = useState(null);

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_700Bold,
  });

  const openPicker = (mode) => {
    setPickerMode(mode);
  };

  // 📝 แก้ไข: เปลี่ยนจาก day ค่าเดียวเป็น days รูปแบบ Array เพื่อรองรับการเรียนหลายวัน
  const [subject, setSubject] = useState({
    code: "",
    name: "",
    room: "",
    start: "",
    end: "",
    days: [], 
    sec: "100",
  });

  // 📝 แก้ไข: เอาค่า Default ออก เปลี่ยนเป็น Array ว่าง
  const [tableList, setTableList] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [table, setTable] = useState([]);

  // 📝 แก้ไข: จัดการ State สำหรับสร้างปีการศึกษา
  const [newSemester, setNewSemester] = useState("ภาคต้น");
  const [newYear, setNewYear] = useState((new Date().getFullYear() + 543).toString());

  const handleAddTable = () => {
    if (!newYear.trim()) {
      Alert.alert("แจ้งเตือน", "กรุณากรอกปีการศึกษา");
      return;
    }

    const tableName = `${newSemester}/${newYear}`;
    
    // เช็คว่ามีกลุ่มนี้อยู่แล้วหรือไม่
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

  const handleAddSubject = async () => {
    if (!subject.name || !subject.code) {
      Alert.alert("กรุณากรอกข้อมูล", "โปรดระบุชื่อวิชาและรหัสวิชา");
      return;
    }
    if (subject.days.length === 0) {
      Alert.alert("กรุณากรอกข้อมูล", "โปรดเลือกวันที่มีเรียนอย่างน้อย 1 วัน");
      return;
    }

    const newStartStr = formatTime(startTime);
    const newEndStr = formatTime(endTime);

    const executeAdd = () => {
      // 📝 แก้ไข: วนลูปสร้าง Object วิชาตามจำนวนวันที่เลือก
      const newEntries = subject.days.map((dayItem, index) => ({
        ...subject,
        day: dayItem, // ใส่วันแยกแต่ละ Object
        start: newStartStr,
        end: newEndStr,
        id: Date.now().toString() + index, // ให้ ID ไม่ซ้ำกัน
        table: selectedTable,
      }));

      const updatedTable = [...table, ...newEntries];
      setTable(updatedTable);
      persistData(updatedTable, tableList, examList); // examList จะถูกคำนวณใหม่ใน useEffect
      setModalSubjectVisible(false);
      setSubject({
        code: "",
        name: "",
        room: "",
        start: "",
        end: "",
        days: [],
        sec: "100",
      });
    };

    try {
      // เช็คเวลาซ้ำซ้อนสำหรับทุกวันที่เลือก
      let isConflictFound = false;
      let conflictMsg = "";

      for (const currentDay of subject.days) {
        const hasClassOverlap = table.some(
          (s) =>
            s.day === currentDay &&
            s.table === selectedTable &&
            isOverlapping(newStartStr, newEndStr, s.start, s.end)
        );

        if (hasClassOverlap) {
          isConflictFound = true;
          conflictMsg = `มีวิชาอื่นซ้อนทับอยู่ในวัน${currentDay}`;
          break;
        }
      }

      if (isConflictFound) {
        Alert.alert(
          "เวลาซ้ำซ้อน",
          `${conflictMsg} คุณต้องการเพิ่มวิชานี้ลงในตารางหรือไม่?`,
          [
            { text: "ยกเลิก", style: "cancel" },
            { text: "เพิ่มต่อไป", onPress: () => executeAdd() },
          ]
        );
      } else {
        executeAdd();
      }
    } catch (error) {
      console.error(error);
    }
  };

  // ฟังก์ชันสลับวันเวลาผู้ใช้จิ้มเลือกวันในหน้า Modal สร้างวิชา
  const toggleSubjectDay = (dayToggle) => {
    if (subject.days.includes(dayToggle)) {
      setSubject({ ...subject, days: subject.days.filter((d) => d !== dayToggle) });
    } else {
      setSubject({ ...subject, days: [...subject.days, dayToggle] });
    }
  };

  const handleDeleteSubject = (id) => {
    Alert.alert("ยืนยันการลบ", "คุณต้องการลบวิชานี้ใช่หรือไม่?", [
      { text: "ยกเลิก", style: "cancel" },
      {
        text: "ลบ",
        style: "destructive",
        onPress: () => {
          const updatedTable = table.filter((item) => item.id !== id);
          setTable(updatedTable);
          persistData(updatedTable, tableList, examList);
        },
      },
    ]);
  };

  const [examList, setExamList] = useState([]);

  // 📝 แก้ไข: คำนวณตารางสอบใหม่ โดยยุบรวมรหัสวิชาเดียวกันให้เหลืออันเดียว
  useEffect(() => {
    setExamList((prev) => {
      const currentSemesterClasses = table.filter((c) => c.table === selectedTable);
      
      // Map เพื่อเก็บวิชาที่ไม่ซ้ำ
      const uniqueSubjectsMap = new Map();
      currentSemesterClasses.forEach((c) => {
        if (!uniqueSubjectsMap.has(c.code)) {
          uniqueSubjectsMap.set(c.code, c);
        }
      });

      const uniqueSubjects = Array.from(uniqueSubjectsMap.values());

      return uniqueSubjects.map((c) => {
        const existing = prev.find((e) => e.code === c.code && e.table === c.table);
        return existing
          ? { ...existing, section: c.sec } // อัปเดต Section หากมีการเปลี่ยนแปลง
          : {
              id: c.code + c.table, // ใช้รหัสวิชา + เทอมเป็น ID ตารางสอบ
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
    ["Monday", { text: "#A66100", border: "#FFF085", background: "#FEFCE8", detail: "#D98D22" }],
    ["Tuesday", { text: "#C7005C", border: "#FCCEE8", background: "#FDF2F8", detail: "#EA3287" }],
    ["Wednesday", { text: "#078537", border: "#B9F8CF", background: "#F0FDF4", detail: "#2EB461" }],
    ["Thursday", { text: "#c77700", border: "#ffbd43", background: "#fff1de", detail: "#a5742e" }],
    ["Friday", { text: "#00838F", border: "#26C6DA", background: "#E0F7FA", detail: "#2da8b8" }],
    ["Saturday", { text: "#5e058b", border: "#e999ff", background: "#fbe5ff", detail: "#852a99" }],
    ["Sunday", { text: "#8f0000", border: "#ff8080", background: "#ffe2e2", detail: "#ba2c2c" }],
  ]);

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const dayLabels = {
    "Monday": "จ.", "Tuesday": "อ.", "Wednesday": "พ.", 
    "Thursday": "พฤ.", "Friday": "ศ.", "Saturday": "ส.", "Sunday": "อา."
  };

  const handleUpdateExam = () => {
    if (!editingExam.startTime || !editingExam.endTime) {
      alert("กรุณาเลือกเวลาให้ครบ");
      return;
    }
    const [startHour, startMinute] = editingExam.startTime.split(":").map(Number);
    const [endHour, endMinute] = editingExam.endTime.split(":").map(Number);

    const startTotal = startHour * 60 + startMinute;
    const endTotal = endHour * 60 + endMinute;

    if (startTotal >= endTotal) {
      alert("เวลาเริ่มต้องน้อยกว่าเวลาสิ้นสุด");
      return;
    }

    const updatedExams = examList.map((ex) =>
      ex.id === editingExam.id ? editingExam : ex
    );

    setExamList(updatedExams);
    persistData(table, tableList, updatedExams);

    setModalExamEditVisible(false);
    setEditingExam(null);
  };

  useEffect(() => {
    const loadAndSync = async () => {
      try {
        const [localT, localL, localE, localTS] = await Promise.all([
          AsyncStorage.getItem("user_table"),
          AsyncStorage.getItem("user_table_list"),
          AsyncStorage.getItem("user_exams"),
          AsyncStorage.getItem("last_updated"),
        ]);

        let loadedTableList = [];

        if (localT) setTable(JSON.parse(localT));
        if (localL) {
          loadedTableList = JSON.parse(localL);
          // 📝 เช็คว่าไม่มี default ที่ตกค้างมา
          loadedTableList = loadedTableList.filter(item => item.label !== 'default');
          setTableList(loadedTableList);
        }
        if (localE) setExamList(JSON.parse(localE));

        if (auth.currentUser) {
          const userDocRef = doc(db, "users", auth.currentUser.uid, "timetable", "data");
          const docSnap = await getDoc(userDocRef);

          if (docSnap.exists()) {
            const cloudData = docSnap.data();
            const cloudTS = cloudData.lastUpdated;

            const isCloudNewer = !localTS || new Date(cloudTS) > new Date(localTS);

            if (isCloudNewer) {
              setTable(cloudData.table || []);
              let cloudTableList = cloudData.tableList || [];
              cloudTableList = cloudTableList.filter(item => item.label !== 'default');
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

        // ตั้งค่าเทอมที่เลือกอัตโนมัติหากมีข้อมูล
        if (loadedTableList.length > 0 && !selectedTable) {
          setSelectedTable(loadedTableList[0].label);
        }

      } catch (error) {
        console.error("DEBUG ERROR:", error);
      }
    };

    loadAndSync();
  }, []);

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
        const userDocRef = doc(db, "users", auth.currentUser.uid, "timetable", "data");
        await setDoc(userDocRef, {
          table: newTable,
          tableList: newList,
          examList: newExams,
          lastUpdated: timestamp,
        }, { merge: true });
      }
    } catch (error) {
      console.error("DEBUG PERSISTENCE ERROR:", error);
    }
  };

  // 📝 เพิ่ม: ตรวจสอบกรณีเข้ามาครั้งแรก (ไม่มีข้อมูลเทอม)
  if (!selectedTable || tableList.length === 0) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center", padding: 20 }]}>
        <Ionicons name="calendar-outline" size={80} color="#FFAAC9" style={{ marginBottom: 20 }} />
        <Text style={{ fontSize: 18, fontFamily: "Inter_700Bold", color: "#C7005C", textAlign: "center", marginBottom: 10 }}>
          คุณยังไม่ได้เพิ่มแผนปีการศึกษา
        </Text>
        <Text style={{ fontSize: 14, fontFamily: "Inter_400Regular", color: "#9B7B8E", textAlign: "center", marginBottom: 30 }}>
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

        {/* Modal สำหรับเพิ่มปีการศึกษาในหน้าว่าง */}
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

                  <Text style={[styles.fieldLabel, { marginTop: 10 }]}>ปีการศึกษา (พ.ศ.)</Text>
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
                <TouchableOpacity style={styles.confirmBtn} onPress={handleAddTable}>
                  <Text style={styles.confirmBtnText}>ยืนยัน</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.closeBtn} onPress={() => setModalTableVisible(false)}>
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
          <Text style={mode === "class" ? styles.activeText : styles.inactiveText}>
            ตารางเรียน
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleBtn, mode === "exam" && styles.activeBtn]}
          onPress={() => setMode("exam")}
        >
          <Text style={mode === "exam" ? styles.activeText : styles.inactiveText}>
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
        <ScrollView style={styles.listArea} showsVerticalScrollIndicator={false}>
          {days.map((day) => {
            const dailyClasses = table.filter((c) => c.day === day && c.table === selectedTable);
            const theme = dayThemes.get(day) || { text: "#333", background: "#EEE" };

            return (
              <View key={day} style={[styles.daySection, { backgroundColor: theme?.background, borderColor: theme?.border, borderWidth: 2 }]}>
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text style={[styles.dayTitle, { color: theme?.text, borderLeftColor: theme?.text, borderLeftWidth: 4 }]}>
                    {day}
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      // 📝 ตั้งค่าให้เปิดหน้าเพิ่มวิชาพร้อมเลือกวันนี้ไว้แล้ว
                      setSubject({ ...subject, days: [day] });
                      setModalSubjectVisible(true);
                    }}
                  >
                    <Feather name="plus-circle" size={24} color={theme?.text} />
                  </TouchableOpacity>
                </View>

                {dailyClasses.length === 0 ? (
                  <Text style={[styles.emptyText, { color: theme?.detail }]}>ไม่มีเรียนวันนี้</Text>
                ) : (
                  dailyClasses.map((item) => (
                    <View key={item.id} style={styles.classCard}>
                      <View style={{ flexDirection: "row", gap: 20 }}>
                        <Text style={[styles.timeLabel, { color: theme?.text }]}>
                          {item.start} - {item.end}
                        </Text>
                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                            <Text style={[styles.classlabel, { color: theme?.detail, fontFamily: "Inter_700Bold" }]}>
                              {item.code} sec {item.sec}
                            </Text>
                            <TouchableOpacity onPress={() => handleDeleteSubject(item.id)} style={{ padding: 5 }}>
                              <Feather name="trash-2" size={20} color="#FF7675" />
                            </TouchableOpacity>
                          </View>
                          <Text style={[styles.classlabel, { color: theme?.detail }]}>{item.name}</Text>
                          <Text style={[styles.classlabel, { color: theme?.detail }]}>ห้อง: {item.room}</Text>
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
        <ScrollView style={styles.containerExam} showsVerticalScrollIndicator={false}>
          <View style={styles.examCard}>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text style={styles.title}>กำหนดการสอบ</Text>
            </View>

            {examList.filter((item) => item.table === selectedTable).length === 0 ? (
              <Text style={styles.emptyText}>ยังไม่มีวิชาในตารางสอบ</Text>
            ) : (
              examList
                .filter((item) => item.table === selectedTable)
                .map((item) => (
                  <View key={item.id} style={styles.examCardMini}>
                    <View style={{ flexDirection: "row", gap: 20, justifyContent: "space-between" }}>
                      <View>
                        <Text style={styles.examValue}>{item.examDate || "กรุณากรอกวันสอบ"}</Text>
                        <Text style={styles.examValue}>
                          {item.startTime && item.endTime ? `${item.startTime} - ${item.endTime}` : "กรุณากรอกเวลาสอบ"}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.examDatail, { fontFamily: "Inter_700Bold" }]}>
                          {item.code} sec {item.section}
                        </Text>
                        <Text style={styles.examDatail}>{item.name}</Text>
                        <Text style={styles.examDatail}>
                          ห้อง : <Text style={styles.examValue}>{item.room || "ติดต่อผู้สอน"}</Text>
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
              <TouchableOpacity onPress={() => setAction("add")} style={[styles.actionTab, action === "add" && styles.actionTabActive]}>
                <Ionicons name="add-circle" size={18} color={action === "add" ? "#FFF" : "#C7005C"} />
                <Text style={[styles.actionTabText, action === "add" && styles.actionTabTextActive]}>เพิ่มภาคเรียน</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setAction("delete")} style={[styles.actionTab, action === "delete" && styles.actionTabActive]}>
                <Ionicons name="trash" size={18} color={action === "delete" ? "#FFF" : "#C7005C"} />
                <Text style={[styles.actionTabText, action === "delete" && styles.actionTabTextActive]}>ลบภาคเรียน</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              {action === "add" ? (
                <View style={styles.inputGroup}>
                  <Text style={styles.fieldLabel}>ภาคการศึกษา</Text>
                  <View style={styles.pickerWrapper}>
                    <Picker selectedValue={newSemester} onValueChange={(itemValue) => setNewSemester(itemValue)} style={{ height: 50 }}>
                      <Picker.Item label="ภาคต้น" value="ภาคต้น" />
                      <Picker.Item label="ภาคปลาย" value="ภาคปลาย" />
                      <Picker.Item label="ภาคฤดูร้อน" value="ภาคฤดูร้อน" />
                    </Picker>
                  </View>

                  <Text style={[styles.fieldLabel, { marginTop: 10 }]}>ปีการศึกษา (พ.ศ.)</Text>
                  <TextInput placeholder="เช่น 2567" value={newYear} onChangeText={setNewYear} keyboardType="numeric" style={styles.modalInput} />
                </View>
              ) : action === "delete" ? (
                <View style={styles.inputGroup}>
                  <Text style={styles.fieldLabel}>เลือกกลุ่มที่ต้องการลบ</Text>
                  <View style={styles.pickerWrapper}>
                    <Picker selectedValue={selectedTable} onValueChange={(itemValue) => setSelectedTable(itemValue)} style={{ height: 50 }}>
                      {tableList.map((item, index) => (
                        <Picker.Item key={index} label={item.label} value={item.label} />
                      ))}
                    </Picker>
                  </View>
                </View>
              ) : (
                <View style={styles.placeholderBox}>
                  <Ionicons name="arrow-up-outline" size={30} color="#DDD" />
                  <Text style={styles.placeholderText}>กรุณาเลือกรูปแบบการจัดการ</Text>
                </View>
              )}
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.confirmBtn, { opacity: (action === "delete" && tableList.length === 0) ? 0.5 : 1 }]}
                disabled={action === "delete" && tableList.length === 0}
                onPress={() => {
                  if (action === "add") {
                    handleAddTable();
                  }

                  if (action === "delete") {
                    if (!selectedTable) return;
                    const updatedTableList = tableList.filter((item) => item.label !== selectedTable);
                    const updatedTable = table.filter((item) => item.table !== selectedTable);
                    const updatedExams = examList.filter((item) => item.table !== selectedTable);
                    
                    setTableList(updatedTableList);
                    setTable(updatedTable);
                    setExamList(updatedExams);
                    setSelectedTable(updatedTableList.length > 0 ? updatedTableList[0].label : null);
                    persistData(updatedTable, updatedTableList, updatedExams);
                  }
                  setModalTableVisible(false);
                }}
              >
                <Text style={styles.confirmBtnText}>ยืนยันการทำรายการ</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.closeBtn} onPress={() => { setModalTableVisible(false); setAction(null); }}>
                <Text style={styles.closeBtnText}>ยกเลิก</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ================= MODAL เพิ่มวิชาเรียน (หลายวันได้) ================= */}
      <Modal visible={modalSubjectVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: 10 }]}>
            <Text style={[styles.modalTitle, { marginBottom: 10 }]}>เพิ่มวิชาเรียน</Text>
            
            <TextInput placeholder="รหัสวิชา" style={styles.input} value={subject.code} onChangeText={(t) => setSubject({ ...subject, code: t })} />
            <TextInput placeholder="ชื่อวิชา" style={styles.input} value={subject.name} onChangeText={(t) => setSubject({ ...subject, name: t })} />
            
            <View style={{ flexDirection: "row", gap: 10 }}>
              <TextInput placeholder="หมู่ (SEC)" style={[styles.input, { flex: 1 }]} value={subject.sec} onChangeText={(t) => setSubject({ ...subject, sec: t })} />
              <TextInput placeholder="ห้องเรียน" style={[styles.input, { flex: 1.5 }]} value={subject.room} onChangeText={(t) => setSubject({ ...subject, room: t })} />
            </View>

            {/* ส่วนเลือกวันเรียน (เลือกได้หลายวัน) */}
            <Text style={styles.label}>เลือกวันเรียน (สามารถเลือกได้มากกว่า 1 วัน)</Text>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 15 }}>
              {days.map((d) => {
                const isSelected = subject.days.includes(d);
                return (
                  <TouchableOpacity
                    key={d}
                    onPress={() => toggleSubjectDay(d)}
                    style={{
                      backgroundColor: isSelected ? "#C7005C" : "#F1F2F6",
                      width: 40, height: 40, borderRadius: 20,
                      justifyContent: "center", alignItems: "center",
                      borderWidth: isSelected ? 0 : 1, borderColor: "#DDD"
                    }}
                  >
                    <Text style={{ color: isSelected ? "#FFF" : "#666", fontSize: 13, fontFamily: "Inter_700Bold" }}>
                      {dayLabels[d]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={{ flexDirection: "row" }}>
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

            {showStartTimePicker && (
              <DateTimePicker
                value={startTime} mode="time" display="default"
                onChange={(e, t) => { setShowStartTimePicker(false); if (t) setStartTime(t); }}
              />
            )}
            {showEndTimePicker && (
              <DateTimePicker
                value={endTime} mode="time" display="default"
                onChange={(e, t) => { setShowEndTimePicker(false); if (t) setEndTime(t); }}
              />
            )}

            <View style={[styles.modalActions, { marginTop: 0 }]}>
              <TouchableOpacity style={styles.saveBtn} onPress={handleAddSubject}>
                <Text style={styles.saveBtnText}>บันทึกวิชา</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalSubjectVisible(false)}>
                <Text style={styles.cancelBtnText}>ยกเลิก</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ================= MODAL แก้ไขเวลาสอบ ================= */}
      <Modal visible={modalExamEditVisible} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>อัปเดตข้อมูลสอบ</Text>
            
            <Text style={styles.label}>รหัสวิชา</Text>
            <TextInput style={[styles.input, { backgroundColor: "#EAEAEA", color: "#666" }]} value={`${editingExam?.code} - ${editingExam?.name}`} editable={false} />
            
            <Text style={styles.label}>ห้องสอบ</Text>
            <TextInput placeholder="ห้องสอบ" style={styles.input} value={editingExam?.room} onChangeText={(t) => setEditingExam({ ...editingExam, room: t })} />

            <Text style={styles.label}>วันที่สอบ</Text>
            <TouchableOpacity style={styles.pickerButton} onPress={() => openPicker("date")}>
              <Text style={styles.pickerText}>{editingExam?.examDate || "เลือกวันที่"}</Text>
              <Ionicons name="calendar-outline" size={20} color="gray" />
            </TouchableOpacity>

            <View style={{ flexDirection: "row" }}>
              <View style={{ flex: 1, marginRight: 5 }}>
                <Text style={styles.label}>เวลาเริ่ม</Text>
                <TouchableOpacity style={styles.pickerButton} onPress={() => openPicker("startTime")}>
                  <Text style={styles.pickerText}>{editingExam?.startTime || "เลือกเวลา"}</Text>
                  <Ionicons name="time-outline" size={20} color="gray" />
                </TouchableOpacity>
              </View>
              <View style={{ flex: 1, marginLeft: 5 }}>
                <Text style={styles.label}>เวลาสิ้นสุด</Text>
                <TouchableOpacity style={styles.pickerButton} onPress={() => openPicker("endTime")}>
                  <Text style={styles.pickerText}>{editingExam?.endTime || "เลือกเวลา"}</Text>
                  <Ionicons name="time-outline" size={20} color="gray" />
                </TouchableOpacity>
              </View>
            </View>

            {pickerMode && (
              <DateTimePicker
                value={new Date()} mode={pickerMode === "date" ? "date" : "time"} is24Hour display="default"
                onChange={(event, selectedDate) => {
                  setPickerMode(null);
                  if (!selectedDate) return;

                  if (pickerMode === "date") {
                    setEditingExam({ ...editingExam, examDate: selectedDate.toLocaleDateString("th-TH") });
                  } else if (pickerMode === "startTime") {
                    setEditingExam({
                      ...editingExam,
                      startTime: selectedDate.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }),
                    });
                  } else if (pickerMode === "endTime") {
                    setEditingExam({
                      ...editingExam,
                      endTime: selectedDate.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }),
                    });
                  }
                }}
              />
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.saveBtn} onPress={handleUpdateExam}>
                <Text style={styles.saveBtnText}>บันทึกตารางสอบ</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalExamEditVisible(false)}>
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
  toggleContainer: { flexDirection: "row", margin: 15, backgroundColor: "#ffffff", borderRadius: 25, padding: 5 },
  toggleBtn: { flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: 25 },
  activeBtn: { backgroundColor: "#FFAAC9", elevation: 8 },
  activeText: { color: "#FFF", fontFamily: "Inter_700Bold", fontSize: 16 },
  inactiveText: { color: "#9B7B8E", fontFamily: "Inter_700Bold", fontSize: 16 },
  listArea: { paddingHorizontal: 15 },
  daySection: { marginBottom: 20, borderWidth: 1, padding: 10, borderRadius: 12 },
  dayTitle: { fontSize: 20, fontFamily: "Inter_700Bold", marginBottom: 10, paddingLeft: 10 },
  classCard: { backgroundColor: "#FFF", padding: 15, borderRadius: 12, marginBottom: 8, elevation: 2 },
  timeLabel: { fontFamily: "Inter_700Bold", fontSize: 15 },
  classlabel: { fontFamily: "Inter_400Regular", fontSize: 14, marginTop: 2 },
  emptyText: { color: "#B2BEC3", fontStyle: "italic", marginLeft: 15 },
  addBtn: { backgroundColor: "#ffffff", borderWidth: 1.5, marginHorizontal: 15, marginBottom: 10, borderColor: "#C7005C", padding: 12, borderRadius: 12, alignItems: "center", borderStyle: "dashed" },
  addBtnText: { color: "#C7005C", fontFamily: "Inter_700Bold", fontSize: 16 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", padding: 20 },
  modalContent: { backgroundColor: "#FFF", padding: 25, borderRadius: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 15, elevation: 10 },
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginBottom: 20, gap: 10 },
  modalTitle: { fontSize: 22, fontFamily: "Inter_700Bold", color: "#C7005C", textAlign: "center" },
  input: { backgroundColor: "#F1F2F6", padding: 12, borderRadius: 12, marginBottom: 10, fontFamily: "Inter_400Regular" },
  label: { fontSize: 13, color: "#666", marginBottom: 5, marginLeft: 5, fontFamily: "Inter_700Bold" },
  pickerButton: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "#F1F2F6", borderRadius: 12, padding: 12, marginBottom: 15 },
  modalActions: { marginTop: 15 },
  saveBtn: { backgroundColor: "#C7005C", padding: 15, borderRadius: 12, alignItems: "center", marginBottom: 10 },
  saveBtnText: { color: "#FFF", fontFamily: "Inter_700Bold", fontSize: 16 },
  cancelBtn: { padding: 10, alignItems: "center" },
  cancelBtnText: { color: "#9B7B8E", fontFamily: "Inter_700Bold" },
  title: { fontSize: 22, fontFamily: "Inter_700Bold", color: "#C7005C", marginBottom: 15 },
  examCard: { backgroundColor: "#FFF", borderRadius: 20, padding: 15, marginBottom: 15, borderWidth: 2, borderColor: "#FFDAE0" },
  examCardMini: { backgroundColor: "#FDF2F8", borderRadius: 15, padding: 15, marginBottom: 15 },
  containerExam: { paddingHorizontal: 15 },
  examValue: { color: "#C7005C", fontFamily: "Inter_700Bold", fontSize: 14, marginBottom: 2 },
  examDatail: { color: "#333", fontFamily: "Inter_400Regular", fontSize: 14, marginBottom: 2 },
  actionTabContainer: { flexDirection: "row", backgroundColor: "#F1F2F6", borderRadius: 15, padding: 5, marginBottom: 15 },
  actionTab: { flex: 1, flexDirection: "row", height: 45, justifyContent: "center", alignItems: "center", borderRadius: 12 },
  actionTabActive: { backgroundColor: "#C7005C" },
  actionTabText: { fontSize: 15, fontFamily: "Inter_400Regular", color: "#C7005C", marginLeft: 8 },
  actionTabTextActive: { color: "#FFF", fontFamily: "Inter_700Bold" },
  modalBody: { minHeight: 120, justifyContent: "center" },
  inputGroup: { gap: 10 },
  fieldLabel: { fontSize: 14, fontFamily: "Inter_700Bold", color: "#9B7B8E", marginLeft: 5 },
  modalInput: { backgroundColor: "#FFF", borderWidth: 1.5, borderColor: "#FFDAE0", borderRadius: 15, height: 55, paddingHorizontal: 20, fontSize: 16, color: "#333" },
  pickerWrapper: { borderWidth: 1.5, borderColor: "#FFDAE0", borderRadius: 15, overflow: "hidden", backgroundColor: "#FFF" },
  placeholderBox: { alignItems: "center", gap: 10 },
  placeholderText: { color: "#B2BEC3", fontSize: 15, fontFamily: "Inter_400Regular" },
  modalFooter: { marginTop: 20, gap: 5 },
  confirmBtn: { backgroundColor: "#C7005C", height: 55, borderRadius: 15, justifyContent: "center", alignItems: "center", elevation: 2 },
  confirmBtnText: { color: "#FFF", fontSize: 17, fontFamily: "Inter_700Bold" },
  closeBtn: { height: 50, justifyContent: "center", alignItems: "center" },
  closeBtnText: { color: "#9B7B8E", fontSize: 16, fontFamily: "Inter_700Bold" },
});

export default Timetable;