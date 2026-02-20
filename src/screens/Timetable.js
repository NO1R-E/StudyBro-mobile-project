import React, { useState } from "react";
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
import { useFonts, Inter_400Regular, Inter_700Bold } from "@expo-google-fonts/inter";

const Timetable = () => {
  const [mode, setMode] = useState("class"); // 'class' หรือ 'exam'
  const [modalVisible, setModalVisible] = useState(false);
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_700Bold,
  });
  // สถานะสำหรับฟอร์มข้อมูล
  const [subject, setSubject] = useState({
    code: "",
    name: "",
    room: "",
    start: "",
    end: "",
    day: "Monday",
  });

  // ข้อมูลจำลอง (Mock Data)
  const [classes, setClasses] = useState([
    {
      id: "1",
      day: "Monday",
      code: "CS101",
      name: "Computer Prog",
      room: "405",
      start: "09:00",
      end: "12:00",
    },
    {
      id: "2",
      day: "Tuesday",
      code: "MA102",
      name: "Calculus I",
      room: "202",
      start: "13:00",
      end: "15:00",
    },
  ]);

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

  const handleAddSubject = () => {
    if (!subject.name || !subject.code) {
      Alert.alert("กรุณากรอกข้อมูล", "โปรดระบุชื่อวิชาและรหัสวิชา");
      return;
    }
    const newEntry = { ...subject, id: Math.random().toString() };
    setClasses([...classes, newEntry]);
    setModalVisible(false);
    setSubject({
      code: "",
      name: "",
      room: "",
      start: "",
      end: "",
      day: "Monday",
    });
  };

  const deleteSubject = (id) => {
    setClasses(classes.filter((item) => item.id !== id));
  };

  return (
    <View style={styles.container}>
      {/* 1. Toggle ระหว่าง ตารางเรียน / ตารางสอบ */}
      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[styles.toggleBtn, mode === "class" && styles.activeBtn]}
          onPress={() => setMode("class")}
        >
          <Text
            style={mode === "class" ? styles.activeText : styles.inactiveText}
          >
            Time table
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleBtn, mode === "exam" && styles.activeBtn]}
          onPress={() => setMode("exam")}
        >
          <Text
            style={mode === "exam" ? styles.activeText : styles.inactiveText}
          >
            Exam Schedule
          </Text>
        </TouchableOpacity>
      </View>
      <CustomDropdown
        renderItem={(item) => (
          <View style={{ flexDirection: "row" }}>
            <Text>{item.title}</Text>
            <Text>📚</Text>
          </View>
        )}
      />
      {/* 2. รายการตาราง (แยกตามวัน) */}
      <ScrollView style={styles.listArea}>
        {days.map((day) => (
          <View key={day} style={styles.daySection}>
            <Text style={styles.dayTitle}>{day}</Text>
            {classes.filter((c) => c.day === day).length === 0 ? (
              <Text style={styles.emptyText}>ไม่มีเรียนวันนี้</Text>
            ) : (
              classes
                .filter((c) => c.day === day)
                .map((item) => (
                  <View key={item.id} style={styles.classCard}>
                    <View style={styles.classInfo}>
                      <Text style={styles.timeLabel}>
                        {item.start} - {item.end}
                      </Text>
                      <Text style={styles.subjectLabel}>
                        {item.code}: {item.name}
                      </Text>
                      <Text style={styles.roomLabel}>ห้อง: {item.room}</Text>
                    </View>
                    <TouchableOpacity onPress={() => deleteSubject(item.id)}>
                      <Text style={styles.deleteBtn}>ลบ</Text>
                    </TouchableOpacity>
                  </View>
                ))
            )}
          </View>
        ))}
      </ScrollView>

      {/* 3. ปุ่มกดเพิ่มข้อมูล */}
      <TouchableOpacity
        style={styles.addBtn}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.addBtnText}>
          + เพิ่ม{mode === "class" ? "วิชาเรียน" : "ตารางสอบ"}
        </Text>
      </TouchableOpacity>

      {/* 4. Modal ฟอร์มสำหรับ เพิ่ม/แก้ไขข้อมูล */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              จัดการข้อมูล{mode === "class" ? "วิชาเรียน" : "ตารางสอบ"}
            </Text>

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
              placeholder="ห้องเรียน"
              style={styles.input}
              value={subject.room}
              onChangeText={(t) => setSubject({ ...subject, room: t })}
            />

            <View style={styles.row}>
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
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleAddSubject}
              >
                <Text style={styles.saveBtnText}>บันทึก</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setModalVisible(false)}
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
  container: { flex: 1, backgroundColor: "#F8F9FA" },
  toggleContainer: {
    flexDirection: "row",
    margin: 15,
    backgroundColor: "#ede4eb",
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
  activeBtn: { backgroundColor: "#FFAAC9" },
  activeText: { color: "#FFF", fontWeight: "bold" },
  inactiveText: { color: "#9B7B8E" },
  listArea: { paddingHorizontal: 15 },
  daySection: { marginBottom: 20 },
  dayTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2D3436",
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: "#6C5CE7",
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
  timeLabel: { fontSize: 12, color: "#6C5CE7", fontWeight: "600" },
  subjectLabel: { fontSize: 16, fontWeight: "bold", marginVertical: 2 },
  roomLabel: { fontSize: 13, color: "#B2BEC3" },
  deleteBtn: { color: "#FF7675", fontWeight: "bold" },
  emptyText: { color: "#B2BEC3", fontStyle: "italic", marginLeft: 15 },
  addBtn: {
    backgroundColor: "#FF7675",
    margin: 15,
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
  },
  addBtnText: { color: "#FFF", fontWeight: "bold", fontSize: 16 },
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
});

export default Timetable;
