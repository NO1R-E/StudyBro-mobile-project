import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const Planner = () => {
  const [tab, setTab] = useState("study");
  const [inputText, setInputText] = useState("");

  const [studyTasks, setStudyTasks] = useState([
    { id: "1", title: "อ่าน Calculus บทที่ 2", completed: false },
    { id: "2", title: "สรุปสูตรฟิสิกส์ Lab 1", completed: true },
  ]);

  const [activities, setActivities] = useState([
    { id: "1", title: "ประชุมชมรมดนตรี", time: "17:00" },
  ]);

  const addItem = () => {
    if (inputText.trim() === "") return;

    if (tab === "study") {
      const newTask = {
        id: Date.now().toString(),
        title: inputText,
        completed: false,
      };
      setStudyTasks([...studyTasks, newTask]);
    } else {
      const newAct = {
        id: Date.now().toString(),
        title: inputText,
        time: "ไม่ระบุเวลา",
      };
      setActivities([...activities, newAct]);
    }
    setInputText("");
  };

  const toggleStudyTask = (id) => {
    setStudyTasks(
      studyTasks.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task,
      ),
    );
  };

  const removeItem = (id, type) => {
    if (type === "study") {
      setStudyTasks(studyTasks.filter((item) => item.id !== id));
    } else {
      setActivities(activities.filter((item) => item.id !== id));
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      {/* Tab Switcher - Pink Theme */}
      <View style={styles.tabWrapper}>
        <TouchableOpacity
          style={[styles.tabBtn, tab === "study" && styles.activeTab]}
          onPress={() => setTab("study")}
        >
          <Text
            style={[styles.tabText, tab === "study" && styles.activeTabText]}
          >
            📚 Study Plan
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, tab === "activity" && styles.activeTab]}
          onPress={() => setTab("activity")}
        >
          <Text
            style={[styles.tabText, tab === "activity" && styles.activeTabText]}
          >
            💖 Activity
          </Text>
        </TouchableOpacity>
      </View>

      {/* Input Field - Pink Focus */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder={
            tab === "study"
              ? "เพิ่มหัวข้ออ่านหนังสือ..."
              : "เพิ่มกิจกรรมนอกหลักสูตร..."
          }
          placeholderTextColor="#FFB7C5"
          value={inputText}
          onChangeText={setInputText}
        />
        <TouchableOpacity style={styles.addCircle} onPress={addItem}>
          <Ionicons name="add" size={30} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* List - Pink Border */}
      <FlatList
        data={tab === "study" ? studyTasks : activities}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.listItem}>
            <View style={styles.itemContent}>
              {tab === "study" ? (
                <TouchableOpacity
                  onPress={() => toggleStudyTask(item.id)}
                  style={styles.checkArea}
                >
                  <Ionicons
                    name={item.completed ? "checkbox" : "square-outline"}
                    size={24}
                    color={item.completed ? "#FF4D6D" : "#FFB7C5"}
                  />
                  <Text
                    style={[
                      styles.itemTitle,
                      item.completed && styles.completedText,
                    ]}
                  >
                    {item.title}
                  </Text>
                </TouchableOpacity>
              ) : (
                <View>
                  <Text style={styles.itemTitle}>🌸 {item.title}</Text>
                  <Text style={styles.itemTime}>{item.time}</Text>
                </View>
              )}
            </View>
            <TouchableOpacity onPress={() => removeItem(item.id, tab)}>
              <Ionicons name="trash-outline" size={20} color="#FF7675" />
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyLabel}>ไม่มีรายการในขณะนี้</Text>
        }
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF0F3", padding: 20 }, // พื้นหลังชมพูอ่อนมาก
  tabWrapper: {
    flexDirection: "row",
    backgroundColor: "#FFDAE0", // พื้นหลัง Tab ชมพูอ่อน
    borderRadius: 12,
    marginBottom: 20,
    padding: 4,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 10,
  },
  activeTab: { backgroundColor: "#FFF", elevation: 3 },
  tabText: { fontWeight: "600", color: "#FF8C9E" },
  activeTabText: { color: "#FF4D6D" }, // ตัวอักษรชมพูเข้มเมื่อเลือก
  inputContainer: {
    flexDirection: "row",
    marginBottom: 20,
    alignItems: "center",
  },
  input: {
    flex: 1,
    backgroundColor: "#FFF",
    padding: 15,
    borderRadius: 15,
    fontSize: 16,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#FFDAE0",
  },
  addCircle: {
    backgroundColor: "#FF748C", // ปุ่มกดสีชมพูหลัก
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
    elevation: 3,
  },
  listItem: {
    backgroundColor: "#FFF",
    padding: 15,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    borderLeftWidth: 5,
    borderLeftColor: "#FF748C", // แถบข้างสีชมพู
    elevation: 2,
  },
  itemContent: { flex: 1 },
  checkArea: { flexDirection: "row", alignItems: "center" },
  itemTitle: { fontSize: 16, marginLeft: 10, color: "#4A4A4A" },
  completedText: { textDecorationLine: "line-through", color: "#FFB7C5" },
  itemTime: { fontSize: 13, color: "#FF8C9E", marginLeft: 30, marginTop: 2 },
  emptyLabel: { textAlign: "center", marginTop: 50, color: "#FFB7C5" },
});

export default Planner;
