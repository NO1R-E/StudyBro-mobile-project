import React, { useState, useEffect } from "react";
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
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  useFonts,
  Inter_400Regular,
  Inter_700Bold,
} from "@expo-google-fonts/inter";
import Entypo from "@expo/vector-icons/Entypo";
import AntDesign from "@expo/vector-icons/AntDesign";
import * as ImagePicker from "expo-image-picker";
import { Picker } from "@react-native-picker/picker";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const Profile = () => {
  const navigation = useNavigation();

  const pickImage = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert("you don't have permission to access this");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;

      setProfile((prev) => ({
        ...prev,
        avatar: uri,
      }));
    }
  };

  //คณะและสาขา
  const facultyData = {
    ศวท: ["IT", "Computer Science"],
    วิศวะ: ["Computer Engineer", "ไฟฟ้า"],
  };

  // สร้าง State สำหรับเก็บข้อมูลโปรไฟล์
  const [profile, setProfile] = useState({
    name: "",
    faculty: "",
    major: "",
    year: "",
    studentId: "",
    avatar: "",
  });

  const [isLoaded, setIsLoaded] = useState(false);

  // 1. ดึงข้อมูลจากเครื่องมาแสดงครั้งแรก
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const savedProfile = await AsyncStorage.getItem("myProfile");
        if (savedProfile) {
          setProfile(JSON.parse(savedProfile));
        }
      } catch (e) {
        console.error("Failed to load profile", e);
      }
    };
    loadProfile();
  }, []);

  // 2. บันทึกข้อมูลลงเครื่องทุกครั้งที่ profile เปลี่ยนแปลง
    useEffect(() => {
      const loadProfile = async () => {
        const saved = await AsyncStorage.getItem("myProfile");
        if (saved) setProfile(JSON.parse(saved));
        setIsLoaded(true);
      };
      loadProfile();
    }, []);

    useEffect(() => {
      if (!isLoaded) return;
      AsyncStorage.setItem("myProfile", JSON.stringify(profile));
    }, [profile, isLoaded]);

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
      "ข้อมูลทั้งหมดจะถูกลบและไม่สามารถกู้คืนได้ คุณแน่ใจหรือไม่?",
      [
        { text: "ยกเลิก", style: "cancel" },
        {
          text: "ลบข้อมูลทั้งหมด",
          style: "destructive",
          onPress: async () => {
            try {
              await AsyncStorage.multiRemove([
                "myProfile",
                "user_table",
                "user_table_list",
                "user_exams",
                "myTasks"
              ]);

              setProfile({
                name: "",
                faculty: "",
                major: "",
                year: "",
                studentId: "",
                avatar: "",
              });

              Alert.alert("สำเร็จ", "ล้างข้อมูลเรียบร้อยแล้ว", [
                {
                  text: "ตกลง",
                },
              ]);
            } catch (e) {
              console.error("Failed to clear data", e);
            }
          },
        },
      ],
    );
  };

  const toggleEdit = () => {
    if (isEditing) {
      Alert.alert("สำเร็จ", "บันทึกข้อมูลส่วนตัวเรียบร้อยแล้ว");

      navigation.navigate({
        name: "Home",
        params: { userName: profile.name },
        merge: true,
      });
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
            <TouchableOpacity onPress={pickImage} activeOpacity={0.8}>
              {profile.avatar ? (
                <Image
                  source={{ uri: profile.avatar }}
                  style={styles.avatarImage}
                />
              ) : (
                <Ionicons name="person-circle" size={110} color="#fed9e5" />
              )}
            </TouchableOpacity>
          </View>
          <View style={styles.headerTextContainer}>
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
                placeholder="กรอกชื่อ-นามสกุล"
                placeholderTextColor="#FFB3C6"
              />
            ) : (
              <Text style={styles.value}>{profile.name}</Text>
            )}
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>รหัสนิสิต</Text>
            {isEditing ? (
              <TextInput
                style={styles.input}
                value={profile.studentId}
                keyboardType="numeric"
                maxLength={10}
                onChangeText={(t) => {
                  const onlyNumbers = t.replace(/[^0-9]/g, "");
                  setProfile({ ...profile, studentId: onlyNumbers });
                }}
                placeholder="กรอกรหัสนิสิต"
                placeholderTextColor="#FFB3C6"
              />
            ) : (
              <Text style={styles.value}>{profile.studentId || "-"}</Text>
            )}
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>คณะ</Text>
            {isEditing ? (
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={profile.faculty}
                  dropdownIconColor="#FF6F91"
                  style={styles.picker}
                  onValueChange={(itemValue) =>
                    setProfile({
                      ...profile,
                      faculty: itemValue,
                      major: "",
                    })
                  }
                >
                  <Picker.Item label="เลือกคณะ" value="" />
                  {Object.keys(facultyData).map((faculty) => (
                    <Picker.Item
                      key={faculty}
                      label={faculty}
                      value={faculty}
                    />
                  ))}
                </Picker>
              </View>
            ) : (
              <Text style={styles.value}>{profile.faculty || "-"}</Text>
            )}
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>สาขา</Text>
            {isEditing ? (
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={profile.major}
                  enabled={!!profile.faculty}
                  dropdownIconColor="#FF6F91"
                  style={styles.picker}
                  onValueChange={(itemValue) =>
                    setProfile({ ...profile, major: itemValue })
                  }
                >
                  <Picker.Item label="เลือกสาขา" value="" />
                  {profile.faculty &&
                    facultyData[profile.faculty]?.map((major) => (
                      <Picker.Item key={major} label={major} value={major} />
                    ))}
                </Picker>
              </View>
            ) : (
              <Text style={styles.value}>{profile.major || "-"}</Text>
            )}
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>ชั้นปี</Text>
            {isEditing ? (
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={profile.year}
                onChangeText={(t) => {
                  const onlyNumbers = t.replace(/[^0-9]/g, "");
                  setProfile({ ...profile, year: onlyNumbers });
                }}
                placeholder="กรอกชั้นปี"
                placeholderTextColor="#FFB3C6"
              />
            ) : (
              <Text style={styles.value}>{profile.year}</Text>
            )}
          </View>

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
          <Text>
            <Text style={styles.smalllabel}>Version</Text> :{" "}
            <Text style={styles.color_detail_app}>1.0.0</Text>{" "}
          </Text>
          <Text>
            <Text style={styles.smalllabel}>Storage</Text> :{" "}
            <Text style={styles.color_detail_app}>Firebase</Text>
          </Text>
          <Text style={styles.color_detail_app}>
            StudySync คือแอปพลิเคชันจัดการชีวิตนักศึกษาแบบครบวงจร
            ที่ช่วยเชื่อมโยงตารางเรียน การสอบ และ แผนการ อ่านหนังสือ
            ไว้ในที่เดียวเพื่อให้ ผู้ใช้งานไม่พลาด ทุกกิจกรรมสำคัญผ่านระบบ
            Dashboard อัจฉริยะและการจัดการ Task ที่มีประสิทธิภาพ
          </Text>
        </View>

        <View style={styles.infoCardClearData}>
          <Text style={styles.cleardatalabel}>จัดการข้อมูลนิสิต</Text>
          <Text style={styles.cleardataDes}>
            ล้างข้อมูลทั้งหมดของคุณ รวมถึงตารางเรียน, การสอบ, กิจกรรม,
            งานที่ต้องศึกษา และข้อมูลโปรไฟล์
          </Text>
          <TouchableOpacity style={styles.clearBtn} onPress={handleClearData}>
            <Ionicons name="trash-bin-outline" size={25} color="#FF7675" />
            <Text style={styles.clearBtnText}>Clear All data</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoCardTips}>
          <Text style={styles.labelTip}>
            <AntDesign name="sun" size={24} color="#fff" /> Tips
          </Text>
          <View style={{ flexDirection: "row" }}>
            <Entypo name="dot-single" size={24} color="#A87BAB" />
            <Text style={styles.TipDes}>
              เพิ่มตารางเรียนของคุณในเมนู "Timetable" {"\n"}
              เพื่อให้เข้าถึงข้อมูลได้อย่างรวดเร็ว
            </Text>
          </View>
          <View style={{ flexDirection: "row" }}>
            <Entypo name="dot-single" size={24} color="#A87BAB" />
            <Text style={styles.TipDes}>
              ตั้งค่าวันสอบเพื่อรับการแจ้งเตือนบนหน้า{"\n"}Dashboard ของคุณ
            </Text>
          </View>
          <View style={{ flexDirection: "row" }}>
            <Entypo name="dot-single" size={24} color="#A87BAB" />
            <Text style={styles.TipDes}>
              ใช้ฟีเจอร์ "Quick Add"
              เพื่อสร้างงานที่ต้องอ่านหนังสือหรือทำการบ้านได้ทันที
            </Text>
          </View>
          <View style={{ flexDirection: "row" }}>
            <Entypo name="dot-single" size={24} color="#A87BAB" />
            <Text style={styles.TipDes}>
              ติดตามกิจกรรมต่างๆ ของคุณและทำเครื่องหมาย {"\n"}
              เมื่อทำเสร็จสิ้นแล้ว
            </Text>
          </View>
        </View>

        <View style={styles.divider} />
        <Text style={styles.versionText}>StudySync v1.0.0 🌸</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF0F3" },
  scrollContent: { padding: 20, alignItems: "center" },
  headerSection: {
    alignItems: "center",
    marginBottom: 30,
    flexDirection: "row",
    backgroundColor: "#FFB1D0",
    borderRadius: 15,
    padding: 20,
    paddingRight: 80,
  },
  avatarContainer: {
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTextContainer: {
    marginLeft: 20,
    justifyContent: "center",
  },
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
    padding: 25,
    marginBottom: 25,
    elevation: 4,
    shadowColor: "#FF748C",
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
  infoRow: { marginBottom: 22 },
  label: {
    fontSize: 14,
    color: "#000000",
    marginBottom: 6,
    fontWeight: "600",
  },
  value: {
    fontSize: 18,
    color: "#FF748C",
    fontWeight: "600",
  },
  input: {
    borderBottomWidth: 1.5,
    borderBottomColor: "#FFDAE0",
    fontSize: 18,
    paddingVertical: 8,
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
  clearBtnText: {
    color: "#FF7675",
    fontWeight: "bold",
    marginLeft: 10,
    fontSize: 20,
    fontFamily: "Inter_700Bold",
  },
  versionText: { marginTop: 30, color: "#FFB7C5", fontSize: 12 },
  ProfileLabel: { color: "#fff", fontSize: 20, fontFamily: "Inter_700Bold" },
  ProfileLabelDes: {
    color: "#fff",
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  ProfileLabelinput: {
    color: "#000000",
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    marginBottom: 20,
  },
  biglabel: { color: "#000000", fontSize: 20, fontFamily: "Inter_700Bold" },
  smalllabel: { color: "#000000", fontSize: 15, fontFamily: "Inter_700Bold" },
  color_detail_app: {
    color: "#A87BAB",
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  cleardatalabel: {
    color: "#E06B8B",
    fontSize: 20,
    fontFamily: "Inter_700Bold",
  },
  cleardataDes: {
    color: "#A87BAB",
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    marginLeft: 10,
  },
  labelTip: { color: "#E06B8B", fontSize: 20, fontFamily: "Inter_700Bold" },
  TipDes: { color: "#A87BAB", fontSize: 16, fontFamily: "Inter_400Regular" },
  avatarImage: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 2,
    borderColor: "#f14464",
    backgroundColor: "#FFF",
    elevation: 3,
  },
  pickerContainer: {
    borderWidth: 1.5,
    borderColor: "#FFB3C6",
    borderRadius: 16,
    backgroundColor: "#FFE4EC",
    overflow: "hidden",
    marginTop: 6,
    elevation: 2,
  },
  picker: {
    color: "#FF6F91",
    fontSize: 17,
    height: 55,
  },
});

export default Profile;

// const handleLogout = async () => {
//   await auth.signOut();
//   await AsyncStorage.clear(); // Important: Resets the timestamp so the next user doesn't skip their fetch
//   // Reset local states to default
// };
