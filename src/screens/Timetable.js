import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, TextInput, Alert, Platform } from "react-native";
import CustomDropdown from "../components/CustomDropdown";
import { useFonts, Inter_400Regular, Inter_700Bold } from "@expo-google-fonts/inter";
import Feather from '@expo/vector-icons/Feather';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';

const Timetable = () => {
  const [semesters, setSemesters] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const [selectedSemester, setSelectedSemester] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);
  
  const [subject, setSubject] = useState({
    code: "", name: "", room: "", start: "", end: "", teacher: "", section: "",
    examDate: "", examStart: "", examEnd: "", examRoom: ""
  });
  
  const [mode, setMode] = useState("class"); 
  const [action, setAction] = useState("add"); 
  const [activeModal, setActiveModal] = useState(null);
  const [semesterName, setSemesterName] = useState("");

  const [showSubjectStart, setShowSubjectStart] = useState(false);
  const [showSubjectEnd, setShowSubjectEnd] = useState(false);
  const [showExamDate, setShowExamDate] = useState(false);
  const [showExamStart, setShowExamStart] = useState(false);
  const [showExamEnd, setShowExamEnd] = useState(false);

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_700Bold,
  });

  useEffect(() => {
    const loadTimetable = async () => {
      try {
        const savedData = await AsyncStorage.getItem('@my_timetable');
        if (savedData) {
          setSemesters(JSON.parse(savedData));
        }
      } catch (e) {
        console.error("Failed to load timetable", e);
      } finally {
        setIsLoaded(true);
      }
    };
    loadTimetable();
  }, []);

  useEffect(() => {
    if (isLoaded) {
      AsyncStorage.setItem('@my_timetable', JSON.stringify(semesters)).catch(e => console.error(e));
    }
  }, [semesters, isLoaded]);

  useEffect(() => {
    if (!selectedSemester && semesters.length > 0) {
      setSelectedSemester(semesters[0].semesterValue);
    }
  }, [semesters]);

  const dayThemes = new Map([
    ["Monday", { text: "#A66100", border: "#FFF085", background: "#FEFCE8", detail: "#D98D22" }],
    ["Tuesday", { text: "#C7005C", border: "#FCCEE8", background: "#FDF2F8", detail: "#EA3287" }],
    ["Wednesday", { text: "#078537", border: "#B9F8CF", background: "#F0FDF4", detail: "#2EB461" }],
    ["Thursday", { text: "#c77700", border: "#ffbd43", background: "#fff1de", detail: "#a5742e" }],
    ["Friday", { text: "#00838F", border: "#26C6DA", background: "#E0F7FA", detail: "#2da8b8" }],
    ["Saturday", { text: "#5e058b", border: "#e999ff", background: "#fbe5ff", detail: "#852a99" }],
    ["Sunday", { text: "#8f0000", border: "#ff8080", background: "#ffe2e2", detail: "#ba2c2c" }],
  ]);

  const formatTimeObjToString = (dateObj) => {
    if (!dateObj) return "";
    return `${dateObj.getHours().toString().padStart(2, '0')}:${dateObj.getMinutes().toString().padStart(2, '0')}`;
  };

  const formatDateObjToString = (dateObj) => {
    if (!dateObj) return "";
    return `${dateObj.getDate().toString().padStart(2, '0')}/${(dateObj.getMonth() + 1).toString().padStart(2, '0')}/${dateObj.getFullYear()}`;
  };

  const parseTimeStringToDate = (timeStr) => {
    if (!timeStr) return new Date();
    const [h, m] = timeStr.split(':');
    const d = new Date();
    d.setHours(parseInt(h, 10) || 0, parseInt(m, 10) || 0, 0, 0);
    return d;
  };

  const parseDateStringToDate = (dateStr) => {
    if (!dateStr) return new Date();
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
    }
    return new Date();
  };

  // --- ฟังก์ชันแปลงเวลา "HH:MM" เป็น นาที (เพื่อเอามาคำนวณง่ายๆ) ---
  const timeToMinutes = (timeStr) => {
    if (!timeStr) return 0;
    const [h, m] = timeStr.split(':').map(Number);
    return (h * 60) + m;
  };

  const handleAddSubject = () => {
    if (!selectedSemester || !selectedDay) return;
    if (!subject.start || !subject.end) {
      Alert.alert("กรอกข้อมูลไม่ครบ", "กรุณาเลือกเวลาเรียนให้ครบถ้วน");
      return;
    }

    const newStartMin = timeToMinutes(subject.start);
    const newEndMin = timeToMinutes(subject.end);

    // 1. เช็คว่าเวลาเริ่ม ต้องมาก่อนเวลาเลิก
    if (newStartMin >= newEndMin) {
      Alert.alert("เวลาไม่ถูกต้อง", "เวลาเริ่มเรียนต้องมาก่อนเวลาเลิกเรียน");
      return;
    }

    // 2. ตรวจสอบการทับซ้อนของเวลา (Overlap Detection)
    const currentSemObj = semesters.find(sem => sem.semesterValue === selectedSemester);
    const currentDayObj = currentSemObj?.days.find(d => d.dayName === selectedDay);
    const existingSubjects = currentDayObj?.subjects || [];

    const hasOverlap = existingSubjects.some(existingSub => {
      const existStartMin = timeToMinutes(existingSub.start);
      const existEndMin = timeToMinutes(existingSub.end);
      
      // ตรรกะการทับซ้อน: (เวลาเริ่มใหม่ < เวลาเลิกเก่า) และ (เวลาเลิกใหม่ > เวลาเริ่มเก่า)
      return newStartMin < existEndMin && newEndMin > existStartMin;
    });

    if (hasOverlap) {
      Alert.alert(
        "เวลาทับซ้อน!", 
        "เวลาเรียนที่คุณเลือก ทับซ้อนกับวิชาอื่นที่มีอยู่แล้วในวันเดียวกัน กรุณาตรวจสอบอีกครั้ง"
      );
      return; // หยุดการทำงาน ไม่บันทึกข้อมูล
    }

    // ถ้าผ่านเงื่อนไขทั้งหมด ค่อยบันทึก
    setSemesters(prev =>
      prev.map(sem => {
        if (sem.semesterValue !== selectedSemester) return sem;
        return {
          ...sem,
          days: sem.days.map(d => {
            if (d.dayName !== selectedDay) return d;
            return {
              ...d,
              subjects: [...d.subjects, { ...subject, id: Date.now().toString() }],
            };
          }),
        };
      })
    );

    setSubject({ code: "", name: "", room: "", start: "", end: "", teacher: "", section: "", examDate: "", examStart: "", examEnd: "", examRoom: "" });
    setActiveModal(null);
  };

  const handleDeleteSubject = (dayName, subjectId) => {
    Alert.alert("ยืนยันการลบ", "คุณต้องการลบวิชานี้ใช่หรือไม่?", [
      { text: "ยกเลิก", style: "cancel" },
      { text: "ลบ", style: "destructive", onPress: () => {
          setSemesters(prev => prev.map(sem => {
            if (sem.semesterValue !== selectedSemester) return sem;
            return {
              ...sem,
              days: sem.days.map(d => {
                if (d.dayName !== dayName) return d;
                return { ...d, subjects: d.subjects.filter(s => s.id !== subjectId) };
              })
            };
          }));
        }
      }
    ]);
  };

  const currentSemester = semesters.find(sem => String(sem.semesterValue) === String(selectedSemester));
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const createDefaultDays = () => days.map(dayName => ({ dayName, subjects: [] }));

  const allSubjects = currentSemester?.days?.flatMap(day =>
    day.subjects.map(sub => ({ ...sub, dayName: day.dayName }))
  ) || [];

  return (
    <View style={styles.container}>
      <View style={styles.toggleContainer}>
        <TouchableOpacity style={[styles.toggleBtn, mode === "class" && styles.activeBtn]} onPress={() => setMode("class")}>
          <Text style={mode === "class" ? styles.activeText : styles.inactiveText}>Time-table</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.toggleBtn, mode === "exam" && styles.activeBtn]} onPress={() => setMode("exam")}>
          <Text style={mode === "exam" ? styles.activeText : styles.inactiveText}>Exam-Schedule</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.addBtn} onPress={() => setActiveModal("group")}>
        <Text style={styles.addBtnText}>+ จัดการ Semester</Text>
      </TouchableOpacity>

      <CustomDropdown
        placeholder="เลือก Semester"
        data={semesters.map((sem) => ({ label: sem.semesterName, value: sem.semesterValue }))}
        onSelect={(item) => setSelectedSemester(item.value)}
      />

      {/* ================= โหมดคลาสเรียน ================= */}
      {mode === "class" && (
        <ScrollView style={styles.listArea} showsVerticalScrollIndicator={false}>
          {days.map((day) => {
            const theme = dayThemes.get(day) || { text: "#333", background: "#EEE" };
            return (
              <View key={day} style={[styles.daySection, { backgroundColor: theme?.background, borderColor: theme?.border, borderWidth: 2 }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={[styles.dayTitle, { color: theme?.text, borderLeftColor: theme?.text, borderLeftWidth: 4 }]}>{day}</Text>
                  <TouchableOpacity onPress={() => { setSelectedDay(day); setActiveModal("subject"); }}>
                    <Feather name="plus-square" size={24} color={theme?.text} />
                  </TouchableOpacity>
                </View>

                {(currentSemester?.days.find(d => d.dayName === day)?.subjects.length || 0) === 0 ? (
                  <Text style={[styles.emptyText, {color: theme?.detail}]}>ไม่มีเรียนวันนี้</Text>
                ) : (
                  currentSemester?.days.find(d => d.dayName === day)?.subjects.map((item) => (
                    <View key={item.id} style={styles.classCard}>
                      <View style={{ flexDirection: 'row', gap: 20, flex: 1 }}>
                        <Text style={[styles.timeLabel, { color: theme?.text }]}>{item.start} - {item.end}</Text>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.classlabel, { color: theme?.detail }]}>{item.code} sec {item.section}</Text>
                          <Text style={[styles.classlabel, { color: theme?.detail }]}>{item.name}</Text>
                          <Text style={[styles.classlabel, { color: theme?.detail }]}>ห้อง: {item.room}</Text>
                        </View>
                        <TouchableOpacity onPress={() => handleDeleteSubject(day, item.id)} style={{justifyContent: 'center', padding: 5}}>
                          <Feather name="trash-2" size={20} color="#FF7675" />
                        </TouchableOpacity>
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
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={styles.title}>ตารางสอบ: {currentSemester?.semesterName || "กรุณาเลือก Semester"} </Text>
            </View>
            {allSubjects.length === 0 ? (
              <Text style={styles.emptyText}>ยังไม่มีวิชาเรียนใน Semester นี้ (กรุณาเพิ่มวิชาเรียนก่อน)</Text>
            ) : (
              allSubjects.map((item) => (
                <View key={item.id} style={styles.examCardMini}>
                  <View style={{ flexDirection: 'row', gap: 20 }}>
                    <View style={{ width: 110 }}>
                      <Text style={styles.examValue}>{item.examDate || "ยังไม่ได้กำหนดวัน"}</Text>
                      <Text style={[styles.examValue, {color: "#999", fontSize: 13, marginTop: 5}]}>
                        {item.examStart && item.examEnd ? `${item.examStart} - ${item.examEnd}` : "-"}
                      </Text>
                    </View>
                    <View style={{flex: 1}}>
                      <Text style={styles.examDatail}>{item.code} sec {item.section}</Text>
                      <Text style={styles.examDatail}>{item.name}</Text>
                      <Text style={styles.examDatail}>ห้องสอบ: <Text style={styles.examValue}>{item.examRoom || "-"}</Text></Text>
                      
                      <TouchableOpacity 
                        style={styles.editExamBtn}
                        onPress={() => { setSelectedDay(item.dayName); setSubject(item); setActiveModal("examEdit"); }}
                      >
                        <Feather name="edit" size={14} color="#FFF" style={{marginRight: 5}} />
                        <Text style={{ color: "#FFF", fontSize: 13, fontWeight: "bold" }}>จัดการเวลาสอบ</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      )}

      {/* ================= Modal จัดการ Group ================= */}
      <Modal visible={activeModal === "group"} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>จัดการ Semester</Text>
            <View>
              <View style={{ flexDirection: "row", marginBottom: 15 }}>
                <TouchableOpacity onPress={() => setAction("add")} style={{ marginRight: 20 }}>
                  <Text style={{fontWeight: action === "add" ? "bold" : "normal", color: action === "add" ? "#C7005C" : "gray"}}>🔘 เพิ่ม Semester</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setAction("delete")}>
                  <Text style={{fontWeight: action === "delete" ? "bold" : "normal", color: action === "delete" ? "#C7005C" : "gray"}}>🔘 ลบ Semester</Text>
                </TouchableOpacity>
              </View>
              {action === "add" && (
                <TextInput placeholder="ชื่อ Semester (เช่น เทอม 1/2569)" value={semesterName} onChangeText={setSemesterName} style={styles.input} />
              )}
              {action === "delete" && (
                <View style={{ backgroundColor: '#F1F2F6', borderRadius: 8, marginBottom: 10 }}>
                  <Picker selectedValue={selectedSemester} onValueChange={(itemValue) => setSelectedSemester(itemValue)}>
                    <Picker.Item label="-- เลือก Semester --" value={null} />
                    {semesters.map((sem) => (
                      <Picker.Item key={sem.semesterValue} label={sem.semesterName} value={sem.semesterValue} />
                    ))}
                  </Picker>
                </View>
              )}
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setActiveModal(null)}>
                  <Text style={styles.cancelBtnText}>ยกเลิก</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveBtn} onPress={() => {
                    if (action === "add") {
                      if (!semesterName.trim()) return;
                      setSemesters(prev => [...prev, { semesterName, semesterValue: Date.now(), days: createDefaultDays() }]);
                      setSemesterName("");
                    }
                    if (action === "delete") {
                      if (!selectedSemester) return;
                      setSemesters(prev => prev.filter(sem => sem.semesterValue !== selectedSemester));
                      setSelectedSemester(null);
                    }
                    setActiveModal(null);
                  }}>
                  <Text style={styles.saveBtnText}>ยืนยัน</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* ================= Modal เพิ่มวิชาเรียน ================= */}
      <Modal visible={activeModal === "subject"} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>เพิ่มวิชา - {selectedDay}</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.label}>รหัสวิชา</Text>
              <TextInput placeholder="เช่น 01418497" style={styles.input} value={subject.code} onChangeText={(t) => setSubject({ ...subject, code: t })} />
              
              <Text style={styles.label}>ชื่อวิชา</Text>
              <TextInput placeholder="Mobile Application" style={styles.input} value={subject.name} onChangeText={(t) => setSubject({ ...subject, name: t })} />
              
              <Text style={styles.label}>หมู่เรียน (Section)</Text>
              <TextInput placeholder="เช่น 700" style={styles.input} value={subject.section} onChangeText={(t) => setSubject({ ...subject, section: t })} />
              
              <Text style={styles.label}>ผู้สอน</Text>
              <TextInput placeholder="ชื่ออาจารย์ผู้สอน" style={styles.input} value={subject.teacher} onChangeText={(t) => setSubject({ ...subject, teacher: t })} />
              
              <Text style={styles.label}>ห้องเรียน</Text>
              <TextInput placeholder="เช่น LH-201" style={styles.input} value={subject.room} onChangeText={(t) => setSubject({ ...subject, room: t })} />

              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.label}>เวลาเริ่มเรียน</Text>
                  <TouchableOpacity style={styles.pickerButton} onPress={() => setShowSubjectStart(true)}>
                    <Text style={styles.pickerText}>{subject.start || "เลือกเวลา"}</Text>
                    <Ionicons name="time-outline" size={20} color="gray" />
                  </TouchableOpacity>
                </View>
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={styles.label}>เวลาเลิกเรียน</Text>
                  <TouchableOpacity style={styles.pickerButton} onPress={() => setShowSubjectEnd(true)}>
                    <Text style={styles.pickerText}>{subject.end || "เลือกเวลา"}</Text>
                    <Ionicons name="time-outline" size={20} color="gray" />
                  </TouchableOpacity>
                </View>
              </View>

              {showSubjectStart && (
                <DateTimePicker
                  value={parseTimeStringToDate(subject.start)}
                  mode="time"
                  is24Hour={true}
                  display="default"
                  onChange={(event, selectedDate) => {
                    setShowSubjectStart(Platform.OS === 'ios');
                    if (selectedDate) setSubject({ ...subject, start: formatTimeObjToString(selectedDate) });
                  }}
                />
              )}
              {showSubjectEnd && (
                <DateTimePicker
                  value={parseTimeStringToDate(subject.end)}
                  mode="time"
                  is24Hour={true}
                  display="default"
                  onChange={(event, selectedDate) => {
                    setShowSubjectEnd(Platform.OS === 'ios');
                    if (selectedDate) setSubject({ ...subject, end: formatTimeObjToString(selectedDate) });
                  }}
                />
              )}
            </ScrollView>

            <View style={{ flexDirection: "row", marginTop: 15, gap: 10 }}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setActiveModal(null)}>
                <Text style={styles.cancelBtnText}>ยกเลิก</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleAddSubject}>
                <Text style={styles.saveBtnText}>บันทึก</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ================= Modal แก้ไขตารางสอบ ================= */}
      <Modal visible={activeModal === "examEdit"} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>ข้อมูลสอบ: {subject.name}</Text>
            
            <Text style={styles.label}>วันที่สอบ</Text>
            <TouchableOpacity style={styles.pickerButton} onPress={() => setShowExamDate(true)}>
              <Text style={styles.pickerText}>{subject.examDate || "เลือกวันที่สอบ"}</Text>
              <Ionicons name="calendar-outline" size={20} color="gray" />
            </TouchableOpacity>

            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.label}>เวลาเริ่มสอบ</Text>
                  <TouchableOpacity style={styles.pickerButton} onPress={() => setShowExamStart(true)}>
                    <Text style={styles.pickerText}>{subject.examStart || "เวลาเริ่ม"}</Text>
                    <Ionicons name="time-outline" size={20} color="gray" />
                  </TouchableOpacity>
                </View>
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={styles.label}>เวลาเลิกสอบ</Text>
                  <TouchableOpacity style={styles.pickerButton} onPress={() => setShowExamEnd(true)}>
                    <Text style={styles.pickerText}>{subject.examEnd || "เวลาเลิก"}</Text>
                    <Ionicons name="time-outline" size={20} color="gray" />
                  </TouchableOpacity>
                </View>
            </View>

            <Text style={styles.label}>ห้องสอบ</Text>
            <TextInput placeholder="เช่น LH-201" style={styles.input} value={subject.examRoom} onChangeText={(t) => setSubject({ ...subject, examRoom: t })} />

            <TouchableOpacity 
              style={{alignItems: 'flex-end', marginBottom: 10}}
              onPress={() => setSubject({ ...subject, examDate: "", examStart: "", examEnd: "", examRoom: "" })}
            >
              <Text style={{color: '#FF7675', fontWeight: 'bold', fontSize: 13}}>+ ล้างวันสอบ</Text>
            </TouchableOpacity>

            {showExamDate && (
              <DateTimePicker
                value={parseDateStringToDate(subject.examDate)}
                mode="date"
                display="default"
                onChange={(event, selectedDate) => {
                  setShowExamDate(Platform.OS === 'ios');
                  if (selectedDate) setSubject({ ...subject, examDate: formatDateObjToString(selectedDate) });
                }}
              />
            )}
            {showExamStart && (
              <DateTimePicker
                value={parseTimeStringToDate(subject.examStart)}
                mode="time"
                is24Hour={true}
                display="default"
                onChange={(event, selectedDate) => {
                  setShowExamStart(Platform.OS === 'ios');
                  if (selectedDate) setSubject({ ...subject, examStart: formatTimeObjToString(selectedDate) });
                }}
              />
            )}
            {showExamEnd && (
              <DateTimePicker
                value={parseTimeStringToDate(subject.examEnd)}
                mode="time"
                is24Hour={true}
                display="default"
                onChange={(event, selectedDate) => {
                  setShowExamEnd(Platform.OS === 'ios');
                  if (selectedDate) setSubject({ ...subject, examEnd: formatTimeObjToString(selectedDate) });
                }}
              />
            )}

            <View style={{ flexDirection: "row", marginTop: 5, gap: 10 }}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setActiveModal(null)}>
                <Text style={styles.cancelBtnText}>ยกเลิก</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={() => {
                  setSemesters(prev => prev.map(sem => {
                    if (sem.semesterValue !== selectedSemester) return sem;
                    return { ...sem, days: sem.days.map(day => ({ ...day, subjects: day.subjects.map(sub => sub.id === subject.id ? subject : sub) })) };
                  }));
                  setActiveModal(null);
                }}>
                <Text style={styles.saveBtnText}>บันทึกตารางสอบ</Text>
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
  activeText: { color: "#FFF", fontFamily: "Inter_700Bold", fontSize: 18 },
  inactiveText: { color: "#9B7B8E", fontFamily: "Inter_700Bold", fontSize: 18 },
  listArea: { paddingHorizontal: 15 },
  daySection: { marginBottom: 20, borderWidth: 1, padding: 10, borderRadius: 12 },
  dayTitle: { fontSize: 20, fontWeight: "bold", color: "#2D3436", marginBottom: 10, fontFamily: "Inter_700Bold", paddingLeft: 10 },
  classCard: { backgroundColor: "#FFF", padding: 15, borderRadius: 12, marginBottom: 8, elevation: 2 },
  timeLabel: { fontFamily: "Inter_700Bold", fontSize: 16 },
  classlabel: { fontFamily: "Inter_400Regular", fontSize: 14 },
  emptyText: { fontStyle: "italic", marginLeft: 15, color: "#B2BEC3" },
  addBtn: { backgroundColor: "#ffffff", borderWidth: 1.5, marginHorizontal: 15, marginBottom: 10, borderColor: "#C7005C", padding: 15, borderRadius: 12, alignItems: "center", borderStyle: 'dashed' },
  addBtnText: { color: "#FF9EC1", fontWeight: "bold", fontSize: 18, fontFamily: "Inter_700Bold" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", padding: 20 },
  modalContent: { backgroundColor: "#FFF", padding: 20, borderRadius: 20 },
  modalTitle: { fontSize: 20, fontWeight: "bold", marginBottom: 15, color: "#C7005C", textAlign: 'center' },
  input: { backgroundColor: "#F1F2F6", padding: 12, borderRadius: 8, marginBottom: 10 },
  
  pickerButton: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F1F2F6', borderRadius: 8, padding: 12, marginBottom: 15 },
  pickerText: { fontSize: 14, color: '#333' },
  label: { fontSize: 12, color: 'gray', marginBottom: 5, marginLeft: 5 },
  
  saveBtn: { flex: 1, backgroundColor: "#00B894", padding: 15, borderRadius: 8, alignItems: "center" },
  saveBtnText: { color: "#FFF", fontWeight: "bold", fontSize: 16 },
  cancelBtn: { flex: 1, backgroundColor: "#F1F2F6", padding: 15, borderRadius: 8, alignItems: "center" },
  cancelBtnText: { color: "#636E72", fontWeight: "bold", fontSize: 16 },
  title: { fontSize: 18, fontWeight: "bold", color: "#FE7CAB", marginBottom: 15 },
  examCard: { backgroundColor: "#FDF2F8", borderRadius: 20, padding: 15, marginBottom: 15, borderWidth: 2, borderColor: "#FFB0F3" },
  examCardMini: { backgroundColor: "#ffffff", borderRadius: 20, padding: 15, marginBottom: 15, elevation: 1 },
  containerExam: { paddingHorizontal: 15 },
  examValue: { color: "#C7005C", fontFamily: "Inter_700Bold", fontSize: 14 },
  examDatail: { color: "#E75480", fontFamily: "Inter_400Regular", fontSize: 14, marginBottom: 2 },
  
  editExamBtn: { flexDirection: 'row', backgroundColor: "#FFAAC9", paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, marginTop: 10, alignSelf: 'flex-start', alignItems: 'center' },
});

export default Timetable;