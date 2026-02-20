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
import Feather from '@expo/vector-icons/Feather';

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

  const dayThemes = new Map([
    ["Monday", {
      text: "#A66100",
      border: "#FFF085",
      background: "#FEFCE8",
      detail: "#D98D22"
    }],
    ["Tuesday", {
      text: "#C7005C",
      border: "#FCCEE8",
      background: "#FDF2F8"
      , detail: "#EA3287"
    }],
    ["Wednesday", {
      text: "#078537",
      border: "#B9F8CF",
      background: "#F0FDF4"
      , detail: "#2EB461"
    }],
    ["Thursday", {
      text: "#c77700",
      border: "#ffbd43",
      background: "#fff1de"
      , detail: "#a5742e"
    }],
    ["Friday", {
      text: "#00838F",
      border: "#26C6DA",
      background: "#E0F7FA"
      , detail: "#2da8b8"
    }],
    ["Saturday", {
      text: "#5e058b",
      border: "#e999ff",
      background: "#fbe5ff"
      , detail: "#852a99"
    }],
    ["Sunday", {
      text: "#8f0000",
      border: "#ff8080",
      background: "#ffe2e2"
      , detail: "#ba2c2c"
    }],
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
            Time  table
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

      <TouchableOpacity
        style={styles.addBtn}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.addBtnText}>
          + {mode === "class" ? "Edit Group" : "Add Date"}
        </Text>
      </TouchableOpacity>

      {mode === "class" && (
        <CustomDropdown
          placeholder="Semester 1"
          data={[
            { label: "Semester 1", value: 1 },
            { label: "Semester 2", value: 2 },
            { label: "Summer", value: 3 },
          ]}
          onSelect={(item) => console.log(item)}
        />
      )}

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
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>

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
                  <TouchableOpacity>

                    <Feather name="edit" size={24} color="black" />
                  </TouchableOpacity>
                </View>

                {classes.filter((c) => c.day === day).length === 0 ? (
                  <Text style={[
                    styles.emptyText,
                    { color: theme?.detail },
                  ]}>ไม่มีเรียนวันนี้</Text>
                ) : (
                  classes
                    .filter((c) => c.day === day)
                    .map((item) => (
                      <View key={item.id} style={styles.classCard}>
                        <View style={{ flexDirection: 'row', gap: 20 }}>
                          <Text style={[
                            styles.timeLabel,
                            { color: theme?.text },
                          ]}>
                            {item.start} - {item.end}
                          </Text>
                          <View>
                            <Text style={[
                              styles.classlabel,
                              { color: theme?.detail },
                            ]}>{item.code} sec 700</Text>
                            <Text style={[
                              styles.classlabel,
                              { color: theme?.detail },
                            ]}>{item.name}</Text>
                            <Text style={[
                              styles.classlabel,
                              { color: theme?.detail },
                            ]}>ห้อง: {item.room}</Text>
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

      {mode === "exam" && <Text>📝 แสดงตารางสอบ</Text>}


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
  activeText: { color: "#FFF", elevation: 8, fontFamily: "Inter_700Bold", fontSize: 20 },
  inactiveText: { color: "#9B7B8E", fontFamily: "Inter_700Bold", fontSize: 20 },
  listArea: { paddingHorizontal: 15 },
  daySection: {
    marginBottom: 20, borderWidth: 1,
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
  timeLabel: { fontFamily: "Inter_700Bold", fontSize: 15 },
  classlabel: { fontFamily: "Inter_400Regular", fontSize: 14 },
  deleteBtn: { color: "#FF7675", fontWeight: "bold" },
  emptyText: { color: "#B2BEC3", fontStyle: "italic", marginLeft: 15 },
  addBtn: {
    backgroundColor: "#ffffff",
    borderWidth: 1.5,
    marginHorizontal: 15,
    marginBottom:10,
    borderColor: "#C7005C",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    borderStyle: 'dashed'
  },
  addBtnText: { color: "#FF9EC1", fontWeight: "bold", fontSize: 16, fontFamily: "Inter_700Bold", fontSize: 20 },
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
