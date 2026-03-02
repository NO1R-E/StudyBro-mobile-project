import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, TextInput, Alert, Platform } from "react-native";
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

const Timetable = ({ navigation }) => {
  const [mode, setMode] = useState("class"); // 'class' หรือ 'exam'

  const [action, setAction] = useState();
  const [modalTableVisible, setModalTableVisible] = useState(false);
  const [modalSubjectVisible, setModalSubjectVisible] = useState(false);
  const [modalExamVisible, setModalExamVisible] = useState(false);
  const [modalExamEditVisible, setModalExamEditVisible] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const formatTime = (dateObj) =>
    `${dateObj.getHours().toString().padStart(2, "0")}:${dateObj.getMinutes().toString().padStart(2, "0")}`;
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(
    new Date(new Date().setHours(new Date().getHours() + 1)),
  );
  const [editingExam, setEditingExam] = useState(null);

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_700Bold,
  });

  const [subject, setSubject] = useState({
    code: "",
    name: "",
    room: "",
    start: "",
    end: "",
    day: "Monday",
    sec: "100",
  });

  const [tableList, setTableList] = useState([{ label: "default", value: 1 }]);
  const [selectedTable, setSelectedTable] = useState("default");
  // ข้อมูลจำลอง (Mock Data)
  const [table, setTable] = useState([]);

  const [newTableName, setNewTableName] = useState();
  const handleAddTable = () => {
    if (newTableName.trim() === "") return;

    // 1. Create the new dropdown option
    const newOption = {
      label: newTableName,
      value: tableList.length + 1,
    };

    // 2. Update the tableList state so the dropdown shows the new item
    setTableList([...tableList, newOption]);

    // 3. Switch the view to the newly created table
    setSelectedTable(newTableName);

    // 4. Reset and close modal
    setNewTableName("");
    setModalTableVisible(false);
  };

  const handleAddSubject = () => {
    if (!subject.name || !subject.code) {
      Alert.alert("กรุณากรอกข้อมูล", "โปรดระบุชื่อวิชาและรหัสวิชา");
      return;
    }

    if (startTime >= endTime) {
      Alert.alert("เวลาไม่ถูกต้อง", "เวลาเริ่มต้องน้อยกว่าเวลาสิ้นสุด");
      return;
    }

    const newEntry = {
      ...subject,
      start: formatTime(startTime),
      end: formatTime(endTime),
      id: Math.random().toString(),
      table: selectedTable,
    };

    setTable([...table, newEntry]);
    setModalSubjectVisible(false);
    // reset form...
    setSubject({
      code: "",
      name: "",
      room: "",
      start: "",
      end: "",
      day: "Monday", // Default fallback
    });
  };

  const handleDeleteSubject = (id) => {
    Alert.alert("ยืนยันการลบ", "คุณต้องการลบวิชานี้ใช่หรือไม่?", [
      { text: "ยกเลิก", style: "cancel" },
      {
        text: "ลบ",
        style: "destructive",
        onPress: () => {
          // Filter out the item with the matching ID
          const updatedTable = table.filter((item) => item.id !== id);
          setTable(updatedTable);
        },
      },
    ]);
  };

  const [selectedExamList, setSelectedExamList] = useState("default");
  const [examList, setExamList] = useState(
    table.map((c) => ({
      id: c.id,
      code: c.code,
      name: c.name,
      section: "700", // ถ้ามีจริงค่อยดึงจาก c.section
      examDate: "",
      startTime: "",
      endTime: "",
      room: "",
    })),
  );

  useEffect(() => {
    setExamList((prev) => {
      return table
        .filter((c) => c.table === selectedTable) // 👈 กรองตาม Semester
        .map((c) => {
          const existing = prev.find((e) => e.id === c.id);

          return existing
            ? { ...existing, section: c.sec }
            : {
              id: c.id,
              code: c.code,
              name: c.name,
              section: c.sec || "100",
              examDate: "",
              startTime: "",
              endTime: "",
              room: "",
              table: c.table, // 👈 เก็บ semester ไว้ด้วย
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

  const handleUpdateExam = () => {
    setExamList((prev) =>
      prev.map((ex) => (ex.id === editingExam.id ? editingExam : ex)),
    );
    setModalExamEditVisible(false);
    setEditingExam(null);
  };

  const handleMainAddPress = () => {
    if (mode === "class") {
      setModalTableVisible(true); // Open Group/Semester management
    } else {
      setModalExamVisible(true); // Open Exam date management
    }
  };

  useEffect(() => {
    console.log("data has been load");
    const loadAppData = async () => {
      try {
        const savedTable = await AsyncStorage.getItem("user_table");
        const savedTableList = await AsyncStorage.getItem("user_table_list");
        const savedExams = await AsyncStorage.getItem("user_exams");

        if (savedTable) setTable(JSON.parse(savedTable));
        if (savedTableList) setTableList(JSON.parse(savedTableList));
        if (savedExams) setExamList(JSON.parse(savedExams));
      } catch (error) {
        console.error("Failed to load data", error);
      }
    };
    loadAppData();
  }, []);

  useEffect(() => {
    console.log("data has been saved");
    const saveAppData = async () => {
      try {
        await AsyncStorage.setItem("user_table", JSON.stringify(table));
        await AsyncStorage.setItem(
          "user_table_list",
          JSON.stringify(tableList),
        );
        await AsyncStorage.setItem("user_exams", JSON.stringify(examList));
      } catch (error) {
        console.error("Failed to save data", error);
      }
    };
    saveAppData();
  }, [table, tableList, examList]);

  return (
    <View style={styles.container}>
      {/* 1. Toggle ระหว่าง ตารางเรียน / ตารางสอบ */}
      <View style={styles.toggleContainer}>
        <TouchableOpacity style={[styles.toggleBtn, mode === "class" && styles.activeBtn]} onPress={() => setMode("class")}>
          <Text style={mode === "class" ? styles.activeText : styles.inactiveText}>Time-table</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.toggleBtn, mode === "exam" && styles.activeBtn]} onPress={() => setMode("exam")}>
          <Text style={mode === "exam" ? styles.activeText : styles.inactiveText}>Exam-Schedule</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.addBtn}
        onPress={() => setModalTableVisible(true)}
      >
        <Text style={styles.addBtnText}>+Edit Group</Text>
      </TouchableOpacity>

      <View>
        <CustomDropdown
          placeholder={selectedTable}
          data={tableList}
          onSelect={(item) => setSelectedTable(item.label)}
        />
      </View>

      {mode === "class" && (
        <ScrollView style={styles.listArea} showsVerticalScrollIndicator={false}>
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
                  <TouchableOpacity
                    onPress={() => {
                      setSubject({ ...subject, day: day });
                      setModalSubjectVisible(true);
                    }}
                  >
                    <Feather name="edit" size={24} color="black" />
                  </TouchableOpacity>
                </View>

                {dailyClasses.length === 0 ? (
                  <Text style={[styles.emptyText, { color: theme?.detail }]}>
                    ไม่มีเรียนวันนี้
                  </Text>
                ) : (
                  dailyClasses.map((item) => (
                    <View key={item.id} style={styles.classCard}>
                      <View style={{ flexDirection: "row", gap: 20 }}>
                        <Text
                          style={[styles.timeLabel, { color: theme?.text }]}
                        >
                          {item.start} - {item.end}
                        </Text>
                        <View>
                          <Text
                            style={[
                              styles.classlabel,
                              { color: theme?.detail },
                            ]}
                          >
                            {item.code} sec {item.sec}
                          </Text>
                          <Text
                            style={[
                              styles.classlabel,
                              { color: theme?.detail },
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
                        <TouchableOpacity onPress={() => handleDeleteSubject(day, item.id)} style={{justifyContent: 'center', padding: 5}}>
                          <Feather name="trash-2" size={20} color="#FF7675" />
                        </TouchableOpacity>
                      </View>
                      <TouchableOpacity
                        onPress={() => handleDeleteSubject(item.id)}
                        style={{ padding: 10 }}
                      >
                        <Feather name="trash-2" size={20} color="#FF7675" />
                      </TouchableOpacity>
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
            <View
              style={{ flexDirection: "row", justifyContent: "space-between" }}
            >
              <Text style={styles.title}>Exam Schedule</Text>
            </View>

            {examList
              .filter((item) => item.table === selectedTable)
              .map((item) => (
                <View key={item.id} style={styles.examCardMini}>
                  <View style={{ flexDirection: "row", gap: 20 }}>
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
                    <View>
                      <Text style={styles.examDatail}>
                        {item.code} sec {item.section}
                      </Text>

                      <Text style={styles.examDatail}>{item.name}</Text>
                      <Text style={styles.examDatail}>
                        ห้อง :{" "}
                        <Text style={styles.examValue}>
                          {item.room || "ติดต่อผู้สอน"}
                        </Text>
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={{ paddingLeft: 14 }}
                      onPress={() => {
                        setEditingExam(item);
                        setModalExamEditVisible(true);
                      }}
                    >
                      <Feather name="edit" size={24} color="black" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
          </View>
        </ScrollView>
      )}
      {/* 4. Modal ฟอร์ม (จัดการตารางเรียน/กลุ่ม) */}
      <Modal visible={modalTableVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {mode === "class" ? "จัดการกลุ่มตารางเรียน" : "จัดการตารางสอบ"}
            </Text>

            {/* ส่วนเลือก Action: Add หรือ Delete */}
            <View
              style={{
                flexDirection: "row",
                marginBottom: 15,
                justifyContent: "center",
                gap: 20,
              }}
            >
              <TouchableOpacity
                onPress={() => setAction("add")}
                style={{ flexDirection: "row", alignItems: "center" }}
              >
                <Text style={{ fontSize: 18 }}>
                  {action === "add" ? "🔘" : "⚪"}
                </Text>
                <Text style={[styles.classlabel, { marginLeft: 5 }]}>
                  เพิ่มกลุ่มใหม่
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setAction("delete")}
                style={{ flexDirection: "row", alignItems: "center" }}

              >
                <Text style={{ fontSize: 18 }}>
                  {action === "delete" ? "🔘" : "⚪"}
                </Text>
                <Text style={[styles.classlabel, { marginLeft: 5 }]}>
                  ลบกลุ่ม
                </Text>
              </TouchableOpacity>
            </View>

            {/* Content ตาม Action ที่เลือก */}
            <View style={{ minHeight: 100, justifyContent: "center" }}>
              {action === "add" ? (
                <View>
                  <TextInput
                    placeholder="ชื่อกลุ่มใหม่ (เช่น Semester 1/67)"
                    value={newTableName}
                    onChangeText={setNewTableName}
                    style={styles.input}
                  />
                </View>
              ) : action === "delete" ? (
                <View
                  style={{
                    borderWidth: 1,
                    borderColor: "#DDD",
                    borderRadius: 8,
                    overflow: "hidden",
                  }}
                >
                  <Picker
                    selectedValue={selectedTable}
                    onValueChange={(itemValue) => setSelectedTable(itemValue)}
                  >
                    <Picker.Item
                      label="-- เลือกกลุ่มที่ต้องการลบ --"
                      value={null}
                    />
                    {tableList.map((item, index) => (
                      <Picker.Item
                        key={index}
                        label={item.label}
                        value={item.label}
                      />
                    ))}
                  </Picker>
                </View>
              ) : (
                <Text style={{ textAlign: "center", color: "#636E72" }}>
                  กรุณาเลือกรูปแบบการจัดการ
                </Text>
              )}
            </View>

            {/* ปุ่มยืนยันการทำงาน */}
            <TouchableOpacity
              style={[
                styles.saveBtn,
                {
                  marginTop: 20,
                  opacity:
                    (action === "add" && !newTableName) ||
                      (action === "delete" && !selectedTable)
                      ? 0.5
                      : 1,
                },
              ]}
              onPress={() => {
                if (action === "add") {
                  if (!newTableName || newTableName.trim() === "") return;

                  const newOption = {
                    label: newTableName,
                    value: tableList.length + 1,
                  };
                  setTableList([...tableList, newOption]);
                  setSelectedTable(newTableName);
                  setNewTableName("");
                }

                if (action === "delete") {
                  if (!selectedTable || selectedTable === "default") {
                    Alert.alert("ขออภัย", "ไม่สามารถลบกลุ่มเริ่มต้นได้");
                    return;
                  }

                  setTableList((prev) =>
                    prev.filter((item) => item.label !== selectedTable),
                  );

                  setTable((prev) =>
                    prev.filter((item) => item.table !== selectedTable),
                  );

                  setExamList((prev) =>
                    prev.filter((item) => item.table !== selectedTable)
                  );

                  setSelectedTable("default");
                }

                setModalTableVisible(false);
                setAction(null); // Reset action for next time
              }}
            >
              <Text style={styles.saveBtnText}>ยืนยันการทำรายการ</Text>
            </TouchableOpacity>

            {/* ปุ่มยกเลิก */}
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => {
                setModalTableVisible(false);
                setAction(null);
              }}
            >
              <Text style={styles.cancelBtnText}>ยกเลิก</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL for add SUBJECT */}
      <Modal
        visible={modalSubjectVisible}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={{ flexDirection: "row" }}>
              <Text style={styles.modalTitle}>
                จัดการข้อมูล{mode === "class" ? "วิชาเรียน" : "ตารางสอบ"}
              </Text>
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
            <TextInput
              placeholder="ห้องเรียน"
              style={styles.input}
              value={subject.room}
              onChangeText={(t) => setSubject({ ...subject, room: t })}
            />

            {/* <View style={styles.row}>
              <TextInput
                placeholder="เริ่ม (00:00)"
                style={[styles.input, { flex: 1, marginRight: 5 }]}
                value={subject.start}
                onChangeText={(t) => setSubject({ ...subject, start: t })}
              />
              <TextInput
                placeholder="จบ (00:00)"
                style={[styles.input, { flex: 1 }]}
                value={subject.end}
                onChangeText={(t) => setSubject({ ...subject, end: t })}
              />
            </View> */}

            <View style={{ flexDirection: "row" }}>
              <View style={{ flex: 1, marginRight: 5 }}>
                <Text style={styles.label}>เวลาเริ่ม</Text>
                <TouchableOpacity
                  style={styles.pickerButton}
                  onPress={() => setShowStartTimePicker(true)}
                >
                  <Text style={styles.pickerText}>{formatTime(startTime)}</Text>
                  <Ionicons name="time-outline" size={20} color="gray" />
                </TouchableOpacity>
              </View>
              <View style={{ flex: 1, marginLeft: 5 }}>
                <Text style={styles.label}>เวลาสิ้นสุด</Text>
                <TouchableOpacity
                  style={styles.pickerButton}
                  onPress={() => setShowEndTimePicker(true)}
                >
                  <Text style={styles.pickerText}>{formatTime(endTime)}</Text>
                  <Ionicons name="time-outline" size={20} color="gray" />
                </TouchableOpacity>
              </View>
            </View>

            {showStartTimePicker && (
              <DateTimePicker
                value={startTime}
                mode="time"
                display="default"
                onChange={(e, t) => {
                  setShowStartTimePicker(false);
                  if (t) setStartTime(t);
                }}
              />
            )}
            {showEndTimePicker && (
              <DateTimePicker
                value={endTime}
                mode="time"
                display="default"
                onChange={(e, t) => {
                  setShowEndTimePicker(false);
                  if (t) setEndTime(t);
                }}
              />
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleAddSubject}
              >
                <Text style={styles.saveBtnText}>บันทึก</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setModalSubjectVisible(false)}
              >
                <Text style={styles.cancelBtnText}>ยกเลิก</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      {/* MODAL for add/del Exam */}
      <Modal
        visible={modalExamVisible}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text>Exam date</Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setModalExamVisible(false)}
              >
                <Text style={styles.cancelBtnText}>ยกเลิก</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleAddSubject}>
                <Text style={styles.saveBtnText}>บันทึก</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL for edit Exam */}
      <Modal
        visible={modalExamEditVisible}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              แก้ไขวันสอบ: {editingExam?.name}
            </Text>

            <TextInput
              placeholder="วันที่สอบ (เช่น 12 มี.ค. 67)"
              style={styles.input}
              value={editingExam?.examDate}
              onChangeText={(text) =>
                setEditingExam({ ...editingExam, examDate: text })
              }
            />

            <TextInput
              placeholder="เวลาเริ่ม (เช่น 09:00)"
              style={styles.input}
              value={editingExam?.startTime}
              onChangeText={(text) =>
                setEditingExam({ ...editingExam, startTime: text })
              }
            />

            <TextInput
              placeholder="เวลาสิ้นสุด (เช่น 12:00)"
              style={styles.input}
              value={editingExam?.endTime}
              onChangeText={(text) =>
                setEditingExam({ ...editingExam, endTime: text })
              }
            />

            <TextInput
              placeholder="ห้องสอบ"
              style={styles.input}
              value={editingExam?.room}
              onChangeText={(text) =>
                setEditingExam({ ...editingExam, room: text })
              }
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleUpdateExam}
              >
                <Text style={styles.saveBtnText}>บันทึกข้อมูลสอบ</Text>
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
  toggleContainer: { flexDirection: "row", margin: 15, backgroundColor: "#ffffff", borderRadius: 25, padding: 5 },
  toggleBtn: { flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: 25 },
  activeBtn: { backgroundColor: "#FFAAC9", elevation: 8 },
  activeText: {
    color: "#FFF",
    elevation: 8,
    fontFamily: "Inter_700Bold",
    fontSize: 18,
  },
  inactiveText: { color: "#9B7B8E", fontFamily: "Inter_700Bold", fontSize: 18 },
  listArea: { paddingHorizontal: 15 },
  daySection: {
    marginBottom: 20,
    borderWidth: 1,
    padding: 10,
    borderRadius: 12,
  },
  dayTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2D3436",
    marginBottom: 10,
    fontFamily: "Inter_700Bold",
    fontSize: 20,
    paddingLeft: 10,
  },
  classCard: {
    backgroundColor: "#FFF",
    padding: 15,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
    elevation: 2,
  },
  timeLabel: { fontFamily: "Inter_700Bold", fontSize: 16 },
  classlabel: { fontFamily: "Inter_400Regular", fontSize: 14 },
  deleteBtn: { color: "#FF7675", fontWeight: "bold" },
  emptyText: { color: "#B2BEC3", fontStyle: "italic", marginLeft: 15 },
  addBtn: {
    backgroundColor: "#ffffff",
    borderWidth: 1.5,
    marginHorizontal: 15,
    marginBottom: 10,
    borderColor: "#C7005C",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    borderStyle: "dashed",
  },
  addBtnText: {
    color: "#FF9EC1",
    fontWeight: "bold",
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    fontSize: 20,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 20,
  },
  modalContent: { backgroundColor: "#FFF", padding: 20, borderRadius: 20 },
  modalTitle: { fontSize: 20, fontWeight: "bold", marginBottom: 15 },
  input: {
    backgroundColor: "#F1F2F6",
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  row: { flexDirection: "row" },
  modalActions: { marginTop: 10 },
  saveBtn: {
    backgroundColor: "#00B894",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 10,
  },
  saveBtnText: { color: "#FFF", fontWeight: "bold" },
  cancelBtn: { padding: 10, alignItems: "center" },
  cancelBtnText: { color: "#636E72" },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#FE7CAB",
    marginBottom: 15,
  },
  examCard: {
    backgroundColor: "#FDF2F8",
    borderRadius: 20,
    padding: 15,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: "#FFB0F3",
  },
  examCardMini: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 15,
    marginBottom: 15,
  },
  inputBox: {
    borderWidth: 1.5,
    borderColor: "#FFAAC9",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  inputText: {
    color: "#999",
  },
  containerExam: {
    paddingHorizontal: 15,
  },

  examValue: {
    color: "#C7005C",
    fontFamily: "Inter_700Bold",
    fontSize: 15,
  },
  examDatail: {
    color: "#E75480",
    fontFamily: "Inter_400Regular",
    fontSize: 15,
  },
  label: { fontSize: 12, color: "gray", marginBottom: 5, marginLeft: 5 },
  pickerButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    borderRadius: 10,
    padding: 12,
    marginBottom: 15,
  },
});

export default Timetable;