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
import { useFonts, Inter_400Regular, Inter_700Bold } from "@expo-google-fonts/inter";
import Entypo from '@expo/vector-icons/Entypo';
import AntDesign from '@expo/vector-icons/AntDesign';


const Profile = () => {
  // สร้าง State สำหรับเก็บข้อมูลโปรไฟล์
  const [profile, setProfile] = useState({
    name: "สมหญิง รักเรียน",
    faculty: "อักษรศาสตร์",
    year: "2",
    studentId: "650123456",
  });
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_700Bold,
  });

  const [isEditing, setIsEditing] = useState(false);

  if (!fontsLoaded) {
    return null; // รอโหลดฟอนต์ก่อน
  }

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


        <View style={styles.headerSection}>
          <View style={styles.avatarContainer}>
            <Ionicons name="person-circle" size={110} color="#FFCFE1" />
            <TouchableOpacity style={styles.editIcon}>
              <Ionicons name="camera" size={20} color="#FFF" />
            </TouchableOpacity>
          </View>
          <View>
            <Text style={styles.ProfileLabel}>โปรไฟล์ & การตั้งค่า</Text>
            <Text style={styles.ProfileLabelDes}>จัดการตั้งค่าข้อมูล</Text>
          </View>
        </View>
        {/* Info Section - Pink Borders */}
        <View style={styles.infoCard}>
          <Text style={styles.ProfileLabelinput}>โปรไฟล์ & การตั้งค่า</Text>
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
        </View>
        <View style={styles.infoCardDetail}>
          <Text style={styles.biglabel}>รายละเอียด แอพพลิเคชั่น</Text>
          <Text><Text style={styles.smalllabel}>Version</Text> : <Text style={styles.color_detail_app}>1.0.0</Text> </Text>
          <Text><Text style={styles.smalllabel}>Storage</Text> : <Text style={styles.color_detail_app}>Firebase</Text></Text>
          <Text style={styles.color_detail_app}>
            StudySync คือแอปพลิเคชันจัดการชีวิตนักศึกษาแบบครบวงจร
            ที่ช่วยเชื่อมโยงตารางเรียน การสอบ และ แผนการ อ่านหนังสือ ไว้ในที่เดียวเพื่อให้
            ผู้ใช้งานไม่พลาด ทุกกิจกรรมสำคัญผ่านระบบ Dashboard อัจฉริยะและการจัดการ Task
            ที่มีประสิทธิภาพ
          </Text>
        </View>


        <View style={styles.infoCardClearData}>
          <Text style={styles.cleardatalabel}>จัดการข้อมูลนิสิต</Text>
          <Text style={styles.cleardataDes}>ล้างข้อมูลทั้งหมดของคุณ รวมถึงตารางเรียน, การสอบ, กิจกรรม, งานที่ต้องศึกษา และข้อมูลโปรไฟล์</Text>
          <TouchableOpacity style={styles.clearBtn} onPress={handleClearData}>
            <Ionicons name="trash-bin-outline" size={25} color="#FF7675" />
            <Text style={styles.clearBtnText}>
              Clear All data
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoCardTips}>
          <Text style={styles.labelTip}><AntDesign name="sun" size={24} color="#fff" />  Tips</Text>
          <View style={{ flexDirection: 'row' }}>
            <Entypo name="dot-single" size={24} color="#A87BAB" />
            <Text style={styles.TipDes}>เพิ่มตารางเรียนของคุณในเมนู "Timetable" {"\n"}เพื่อให้เข้าถึงข้อมูลได้อย่างรวดเร็ว</Text>
          </View>
          <View style={{ flexDirection: 'row' }}>
            <Entypo name="dot-single" size={24} color="#A87BAB" />
            <Text style={styles.TipDes}>ตั้งค่าวันสอบเพื่อรับการแจ้งเตือนบนหน้า{"\n"}Dashboard ของคุณ</Text>
          </View>
          <View style={{ flexDirection: 'row' }}>
            <Entypo name="dot-single" size={24} color="#A87BAB" />
            <Text style={styles.TipDes}>ใช้ฟีเจอร์ "Quick Add" เพื่อสร้างงานที่ต้องอ่านหนังสือหรือทำการบ้านได้ทันที</Text>
          </View>
          <View style={{ flexDirection: 'row' }}>
            <Entypo name="dot-single" size={24} color="#A87BAB" />
            <Text style={styles.TipDes}>ติดตามกิจกรรมต่างๆ ของคุณและทำเครื่องหมาย {"\n"}เมื่อทำเสร็จสิ้นแล้ว</Text>
          </View>
        </View>

        <View style={styles.divider} />
        <Text style={styles.versionText}>StudySync v1.0.0 🌸</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF0F3" }, // พื้นหลังขาวชมพู
  scrollContent: { padding: 20, alignItems: "center" },
  headerSection: { alignItems: "center", marginBottom: 30, flexDirection: 'row', backgroundColor: '#FFB1D0', borderRadius: 15, padding: 20, paddingRight: 80 },
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
  infoCardDetail: {
    backgroundColor: "#FFF",
    gap: 10,
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
  infoCardClearData: {
    backgroundColor: "#FFF",
    gap: 10,
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
  infoCardTips: {
    backgroundColor: "#FFDCE8",
    gap: 10,
    width: "100%",
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    elevation: 4,
    borderColor: "#000000",
    borderWidth: 1,
    shadowColor: "#FF748C",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  infoRow: { marginBottom: 15 },
  label: { fontSize: 13, color: "#000000", marginBottom: 5, fontWeight: "600" },
  value: { fontSize: 17, color: "#FF748C", fontWeight: "500" },
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
  clearBtnText: { color: "#FF7675", fontWeight: "bold", marginLeft: 10, fontSize: 20, fontFamily: "Inter_700Bold" },
  versionText: { marginTop: 30, color: "#FFB7C5", fontSize: 12 },
  ProfileLabel: { color: "#fff", fontSize: 20, fontFamily: "Inter_700Bold" },
  ProfileLabelDes: { color: "#fff", fontSize: 15, fontFamily: "Inter_400Regular" },
  ProfileLabelinput: { color: "#000000", fontSize: 20, fontFamily: "Inter_700Bold" },
  biglabel: { color: "#000000", fontSize: 20, fontFamily: "Inter_700Bold" },
  smalllabel: { color: "#000000", fontSize: 15, fontFamily: "Inter_700Bold" },
  color_detail_app: { color: "#A87BAB", fontSize: 15, fontFamily: "Inter_400Regular" },
  cleardatalabel: { color: "#E06B8B", fontSize: 20, fontFamily: "Inter_700Bold" },
  cleardataDes: { color: "#A87BAB", fontSize: 15, fontFamily: "Inter_400Regular", marginLeft: 10 },
  labelTip: { color: '#E06B8B', fontSize: 20, fontFamily: "Inter_700Bold" },
  TipDes: { color: '#A87BAB', fontSize: 16, fontFamily: "Inter_400Regular" },

});

export default Profile;
