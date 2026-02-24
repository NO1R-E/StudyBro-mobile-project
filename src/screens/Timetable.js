import React, { useState, useEffect } from "react";
import { Menu, Button } from "react-native-paper";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
  TextInput,
  ScrollView,
  Alert,
} from "react-native";
import CustomDropdown from "../components/CustomDropdown";
import {
  useFonts,
  Inter_400Regular,
  Inter_700Bold,
} from "@expo-google-fonts/inter";
import Feather from "@expo/vector-icons/Feather";
import { Picker } from "@react-native-picker/picker";
import { useNavigation } from "@react-navigation/native";

const Timetable = () => {
  const navigation = useNavigation();
  const [semesters, setSemesters] = useState([]);
  const [selectedSemester, setSelectedSemester] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);
  const [subject, setSubject] = useState({
    code: "",
    name: "",
    room: "",
    start: "",
    end: "",
    teacher: "",
    section: "",
  });
  const [mode, setMode] = useState("class"); // 'class' หรือ 'exam'
  const [action, setAction] = useState("add"); // add | delete
  const [activeModal, setActiveModal] = useState(null);
  const [semesterName, setSemesterName] = useState("");
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_700Bold,
  });
  useEffect(() => {
    if (!selectedSemester && semesters.length > 0) {
      setSelectedSemester(semesters[0].semesterValue);
    }
  }, [semesters]);
  useEffect(() => {
    if (selectedSemester) {
      navigation.navigate("Home", {
        subjects: semesterSubjects,
      });
    }
  }, [selectedSemester, semesters]);
  
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
  const handleAddSubject = () => {
    if (!selectedSemester || !selectedDay) return;

    if (!isValidTime(subject.start) || !isValidTime(subject.end)) {
      Alert.alert("เวลาไม่ถูกต้อง", "กรุณาใส่เวลาแบบ HH:MM");
      return;
    }

    setSemesters((prev) =>
      prev.map((sem) => {
        if (sem.semesterValue !== selectedSemester) return sem;

        return {
          ...sem,
          days: sem.days.map((d) => {
            if (d.dayName !== selectedDay) return d;

            return {
              ...d,
              subjects: [
                ...d.subjects,
                {
                  ...subject,
                  id: Date.now().toString(),
                },
              ],
            };
          }),
        };
      }),
    );

    setSubject({
      code: "",
      name: "",
      room: "",
      start: "",
      end: "",
      teacher: "",
      section: "",
    });

    setActiveModal(null);
  };
  const currentSemester = semesters.find(
    (sem) => String(sem.semesterValue) === String(selectedSemester),
  );
  const days = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];
  const createDefaultDays = () => [
    { dayName: "Monday", subjects: [] },
    { dayName: "Tuesday", subjects: [] },
    { dayName: "Wednesday", subjects: [] },
    { dayName: "Thursday", subjects: [] },
    { dayName: "Friday", subjects: [] },
    { dayName: "Saturday", subjects: [] },
    { dayName: "Sunday", subjects: [] },
  ];
  const allSubjects =
    currentSemester?.days?.flatMap((day) =>
      day.subjects.map((sub) => ({
        ...sub,
        dayName: day.dayName,
      })),
    ) || [];
  const semesterSubjects =
    currentSemester?.days.flatMap((day) =>
      day.subjects.map((sub) => ({
        ...sub,
        dayName: day.dayName,
      })),
    ) || [];
  console.log("Today index:", new Date().getDay());
  console.log(
    "Today name:",
    new Date().toLocaleDateString("en-US", { weekday: "long" }),
  );
  //format time
  const formatTime = (text) => {
    // เอาเฉพาะตัวเลข
    const cleaned = text.replace(/[^0-9]/g, "");

    // ตัดไม่เกิน 4 ตัว (HHMM)
    const limited = cleaned.slice(0, 4);

    if (limited.length <= 2) return limited;

    return `${limited.slice(0, 2)}:${limited.slice(2)}`;
  };
  const isValidTime = (time) => {
    const regex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    return regex.test(time);
  };

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
            Time-table
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleBtn, mode === "exam" && styles.activeBtn]}
          onPress={() => setMode("exam")}
        >
          <Text
            style={mode === "exam" ? styles.activeText : styles.inactiveText}
          >
            Exam-Schedule
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.addBtn}
        onPress={() => setActiveModal("group")}
      >
        <Text style={styles.addBtnText}>
          + {mode === "class" ? "Add/Del Group" : "Add Date"}
        </Text>
      </TouchableOpacity>

      <CustomDropdown
        placeholder="เลือก Semester"
        data={semesters.map((sem) => ({
          label: sem.semesterName,
          value: sem.semesterValue,
        }))}
        onSelect={(item) => {
          console.log(item);
          setSelectedSemester(item.value); // ถ้าต้องการเก็บค่า
        }}
      />
      {mode === "class" && (
        <ScrollView style={styles.listArea}>
          {days.map((day) => {
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
                      setSelectedDay(day);
                      setActiveModal("subject");
                    }}
                  >
                    <Feather name="edit" size={24} color="black" />
                  </TouchableOpacity>
                </View>

                {(currentSemester?.days.find((d) => d.dayName === day)?.subjects
                  .length || 0) === 0 ? (
                  <Text style={[styles.emptyText]}>ไม่มีเรียนวันนี้</Text>
                ) : (
                  currentSemester?.days
                    .find((d) => d.dayName === day)
                    ?.subjects.map((item) => (
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
                              {item.code} sec 700
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
                        </View>
                      </View>
                    ))
                )}
              </View>
            );
          })}
        </ScrollView>
      )}

      {mode === "exam" && (
        <ScrollView style={styles.containerExam}>
          <View style={styles.examCard}>
            <View
              style={{ flexDirection: "row", justifyContent: "space-between" }}
            >
              <Text style={styles.title}>
                Exam Schedule :{" "}
                {currentSemester?.semesterName || "Choose your Group"}{" "}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(true)}>
                <Feather name="edit" size={24} color="black" />
              </TouchableOpacity>
            </View>

            {allSubjects.length === 0 ? (
              <Text style={styles.emptyText}>ยังไม่มีวิชาใน Semester นี้</Text>
            ) : (
              allSubjects.map((item) => (
                <View key={item.id} style={styles.examCardMini}>
                  <View style={{ flexDirection: "row", gap: 20 }}>
                    <View>
                      <Text style={styles.examValue}>
                        {item.examDate || "กรุณากรอกวันสอบ"}
                      </Text>

                      <Text style={styles.examValue}>
                        {item.examStart && item.examEnd
                          ? `${item.examStart} - ${item.examEnd}`
                          : "กรุณากรอกเวลาสอบ"}
                      </Text>
                    </View>

                    <View>
                      <Text style={styles.examDatail}>
                        {item.code} sec {item.section}
                      </Text>

                      <Text style={styles.examDatail}>{item.name}</Text>

                      <Text style={styles.examDatail}>
                        ห้องสอบ :{" "}
                        <Text style={styles.examValue}>
                          {item.examRoom || "ยังไม่ได้กำหนด"}
                        </Text>
                      </Text>

                      <TouchableOpacity
                        onPress={() => {
                          setSelectedDay(item.dayName);
                          setSubject(item);
                          setActiveModal("examEdit");
                        }}
                      >
                        <Text style={{ color: "blue" }}>Edit</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      )}

      {/* 4. Modal ฟอร์ม */}
      <Modal
        visible={activeModal === "group"}
        animationType="slide"
        transparent
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {mode === "class" ? "จัดการตารางเรียน" : "ตารางสอบ"}
            </Text>

            {/* ===== กรณี วิชาเรียน ===== */}
            {mode === "class" && (
              <View>
                {/* Radio */}
                <View style={{ flexDirection: "row", marginBottom: 15 }}>
                  <TouchableOpacity
                    onPress={() => setAction("add")}
                    style={{ marginRight: 20 }}
                  >
                    <Text>{action === "add" ? "🔘 Add" : "⚪ Add"}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity onPress={() => setAction("delete")}>
                    <Text>{action === "delete" ? "🔘 Del" : "⚪ Del"}</Text>
                  </TouchableOpacity>
                </View>

                {/* Add */}
                {action === "add" && (
                  <TextInput
                    placeholder="ชื่อ Semester"
                    value={semesterName}
                    onChangeText={setSemesterName}
                    style={styles.input}
                  />
                )}

                {/* Delete */}
                {action === "delete" && (
                  <Picker
                    selectedValue={selectedSemester}
                    onValueChange={(itemValue) =>
                      setSelectedSemester(itemValue)
                    }
                  >
                    <Picker.Item label="-- เลือก Semester --" value={null} />
                    {semesters.map((sem) => (
                      <Picker.Item
                        key={sem.semesterValue}
                        label={sem.semesterName}
                        value={sem.semesterValue}
                      />
                    ))}
                  </Picker>
                )}

                {/* ปุ่มยืนยัน */}
                <TouchableOpacity
                  style={styles.saveBtn}
                  onPress={() => {
                    if (action === "add") {
                      if (!semesterName.trim()) return;

                      setSemesters((prev) => [
                        ...prev,
                        {
                          semesterName,
                          semesterValue: Date.now(),
                          days: createDefaultDays(),
                        },
                      ]);
                      setSemesterName("");
                    }

                    if (action === "delete") {
                      if (!selectedSemester) return;

                      setSemesters((prev) =>
                        prev.filter(
                          (sem) => sem.semesterValue !== selectedSemester,
                        ),
                      );
                      setSelectedSemester(null);
                    }

                    setActiveModal(null);
                  }}
                >
                  <Text style={styles.saveBtnText}>ยืนยัน</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* ===== กรณี ตารางสอบ ===== */}
            {mode === "exam" && (
              <View style={{ paddingVertical: 20 }}>
                <Text style={{ fontSize: 16, textAlign: "center" }}>
                  ตารางสอบ Mock
                </Text>
              </View>
            )}

            {/* ปุ่มยกเลิก */}
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => setActiveModal(null)}
            >
              <Text style={styles.cancelBtnText}>ยกเลิก</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      {/* Add วิชาในวัน */}
      <Modal
        visible={activeModal === "subject"}
        animationType="slide"
        transparent
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>เพิ่มวิชา - {selectedDay}</Text>

            <ScrollView>
              <Text>รหัสวิชา</Text>
              <TextInput
                placeholder="รหัสวิชา"
                style={styles.input}
                value={subject.code}
                onChangeText={(t) => setSubject({ ...subject, code: t })}
              />
              <Text>ชื่อวิชา</Text>
              <TextInput
                placeholder="Mobile Application ... "
                style={styles.input}
                value={subject.name}
                onChangeText={(t) => setSubject({ ...subject, name: t })}
              />
              <Text>หมู่</Text>
              <TextInput
                placeholder="หมู่ 700 , 800"
                style={styles.input}
                value={subject.section}
                onChangeText={(t) => setSubject({ ...subject, section: t })}
              />
              <Text>ผู้สอน</Text>
              <TextInput
                placeholder="ผู้สอน"
                style={styles.input}
                value={subject.teacher}
                onChangeText={(t) => setSubject({ ...subject, teacher: t })}
              />
              <Text>ห้องเรียน</Text>
              <TextInput
                placeholder="ห้องเรียน"
                style={styles.input}
                value={subject.room}
                onChangeText={(t) => setSubject({ ...subject, room: t })}
              />

              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                }}
              >
                {/* เริ่มเรียน */}
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text>เริ่มเรียน</Text>
                  <TextInput
                    placeholder="09:00"
                    style={styles.input}
                    value={subject.start}
                    onChangeText={(t) =>
                      setSubject({ ...subject, start: formatTime(t) })
                    }
                  />
                </View>

                {/* เลิกเรียน */}
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text>เลิกเรียน</Text>
                  <TextInput
                    placeholder="12:00"
                    style={styles.input}
                    value={subject.end}
                    onChangeText={(t) =>
                      setSubject({ ...subject, end: formatTime(t) })
                    }
                  />
                </View>
              </View>
            </ScrollView>

            <View style={{ flexDirection: "row", marginTop: 15 }}>
              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleAddSubject}
              >
                <Text style={styles.saveBtnText}>บันทึก</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setActiveModal(null)}
              >
                <Text style={styles.cancelBtnText}>ยกเลิก</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={activeModal === "examEdit"}
        animationType="slide"
        transparent
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>แก้ไขข้อมูลสอบ</Text>

            <TextInput
              placeholder="วันสอบ"
              style={styles.input}
              value={subject.examDate}
              onChangeText={(t) => setSubject({ ...subject, examDate: t })}
            />

            <TextInput
              placeholder="เริ่มสอบ"
              style={styles.input}
              value={subject.examStart}
              onChangeText={(t) => setSubject({ ...subject, examStart: t })}
            />

            <TextInput
              placeholder="เลิกสอบ"
              style={styles.input}
              value={subject.examEnd}
              onChangeText={(t) => setSubject({ ...subject, examEnd: t })}
            />

            <TextInput
              placeholder="ห้องสอบ"
              style={styles.input}
              value={subject.examRoom}
              onChangeText={(t) => setSubject({ ...subject, examRoom: t })}
            />

            <TouchableOpacity
              style={styles.saveBtn}
              onPress={() => {
                setSemesters((prev) =>
                  prev.map((sem) => {
                    if (sem.semesterValue !== selectedSemester) return sem;

                    return {
                      ...sem,
                      days: sem.days.map((day) => ({
                        ...day,
                        subjects: day.subjects.map((sub) =>
                          sub.id === subject.id ? subject : sub,
                        ),
                      })),
                    };
                  }),
                );

                setActiveModal(null);
              }}
            >
              <Text style={styles.saveBtnText}>บันทึก</Text>
            </TouchableOpacity>
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
    overflow: "hidden",
    padding: 5,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 25,
  },
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
});

export default Timetable;
