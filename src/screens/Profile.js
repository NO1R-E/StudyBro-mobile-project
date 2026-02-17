import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const Profile = () => {
  // สร้าง State สำหรับเก็บข้อมูลโปรไฟล์
  const [profile, setProfile] = useState({
    name: "สมหญิง รักเรียน",
    faculty: "อักษรศาสตร์",
    year: "2",
    studentId: "650123456",
  });

  const [isEditing, setIsEditing] = useState(false);

  // ฟังก์ชันสำหรับการล้างข้อมูล (Clear Data)
  const handleClearData = () => {
    Alert.alert(
      "⚠️ ยืนยันการลบข้อมูล",
      "การดำเนินการนี้จะลบตารางเรียน กิจกรรม และแผนการเรียนทั้งหมดของคุณ และไม่สามารถเรียกคืนได้ คุณแน่ใจหรือไม่?",
      [
        { text: "ยกเลิก", style: "cancel" },
        {
          text: "ลบข้อมูลทั้งหมด",
          style: "destructive",
          onPress: () => {
            console.log("All data cleared");
            Alert.alert("สำเร็จ", "ล้างข้อมูลเรียบร้อยแล้ว");
          },
        },
      ],
    );
  };

  const toggleEdit = () => {
    if (isEditing) {
      Alert.alert("สำเร็จ", "บันทึกข้อมูลส่วนตัวเรียบร้อยแล้ว");
    }
    setIsEditing(!isEditing);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile Header - Pink Style */}
        <View style={styles.headerSection}>
          <View style={styles.avatarContainer}>
            <Ionicons name="person-circle" size={110} color="#FF748C" />
            <TouchableOpacity style={styles.editIcon}>
              <Ionicons name="camera" size={20} color="#FFF" />
            </TouchableOpacity>
          </View>
          <Text style={styles.mainTitle}>{profile.name}</Text>
          <Text style={styles.subTitle}>นิสิตชั้นปีที่ {profile.year}</Text>
        </View>

        {/* Info Section - Pink Borders */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.label}>ชื่อ-นามสกุล</Text>
            {isEditing ? (
              <TextInput
                style={styles.input}
                value={profile.name}
                onChangeText={(t) => setProfile({ ...profile, name: t })}
              />
            ) : (
              <Text style={styles.value}>{profile.name}</Text>
            )}
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>คณะ</Text>
            {isEditing ? (
              <TextInput
                style={styles.input}
                value={profile.faculty}
                onChangeText={(t) => setProfile({ ...profile, faculty: t })}
              />
            ) : (
              <Text style={styles.value}>{profile.faculty}</Text>
            )}
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>ชั้นปี</Text>
            {isEditing ? (
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={profile.year}
                onChangeText={(t) => setProfile({ ...profile, year: t })}
              />
            ) : (
              <Text style={styles.value}>{profile.year}</Text>
            )}
          </View>
        </View>

        {/* Action Buttons - Pink Theme */}
        <TouchableOpacity
          style={[
            styles.actionBtn,
            { backgroundColor: isEditing ? "#00B894" : "#FF748C" },
          ]}
          onPress={toggleEdit}
        >
          <Ionicons
            name={isEditing ? "save-outline" : "create-outline"}
            size={20}
            color="#FFF"
          />
          <Text style={styles.actionBtnText}>
            {isEditing ? "บันทึกข้อมูล" : "แก้ไขโปรไฟล์"}
          </Text>
        </TouchableOpacity>

        <View style={styles.divider} />

        <TouchableOpacity style={styles.clearBtn} onPress={handleClearData}>
          <Ionicons name="trash-bin-outline" size={20} color="#FF7675" />
          <Text style={styles.clearBtnText}>
            ล้างข้อมูลแอปพลิเคชัน (Clear Data)
          </Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>StudySync v1.0.0 🌸</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF0F3" }, // พื้นหลังขาวชมพู
  scrollContent: { padding: 20, alignItems: "center" },
  headerSection: { alignItems: "center", marginBottom: 30 },
  avatarContainer: { position: "relative" },
  editIcon: {
    position: "absolute",
    bottom: 8,
    right: 8,
    backgroundColor: "#FF748C",
    padding: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#FFF",
  },
  mainTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 10,
    color: "#4A4A4A",
  },
  subTitle: { fontSize: 16, color: "#FF8C9E" },
  infoCard: {
    backgroundColor: "#FFF",
    width: "100%",
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    elevation: 4,
    shadowColor: "#FF748C",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  infoRow: { marginBottom: 15 },
  label: { fontSize: 13, color: "#FFB7C5", marginBottom: 5, fontWeight: "600" },
  value: { fontSize: 17, color: "#4A4A4A", fontWeight: "500" },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: "#FFDAE0",
    fontSize: 17,
    paddingVertical: 5,
    color: "#FF4D6D",
  },
  actionBtn: {
    flexDirection: "row",
    width: "100%",
    padding: 16,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
    elevation: 3,
  },
  actionBtnText: {
    color: "#FFF",
    fontWeight: "bold",
    marginLeft: 10,
    fontSize: 16,
  },
  divider: {
    height: 1,
    backgroundColor: "#FFDAE0",
    width: "100%",
    marginVertical: 20,
  },
  clearBtn: {
    flexDirection: "row",
    width: "100%",
    padding: 15,
    borderRadius: 15,
    borderWidth: 1.5,
    borderColor: "#FF7675",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  clearBtnText: { color: "#FF7675", fontWeight: "bold", marginLeft: 10 },
  versionText: { marginTop: 30, color: "#FFB7C5", fontSize: 12 },
});

export default Profile;
