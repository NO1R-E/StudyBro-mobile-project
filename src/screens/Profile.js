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

import { signOut } from "firebase/auth";
import { db, auth } from "../../firebaseConfig";
import { doc, getDoc, setDoc, deleteDoc } from "firebase/firestore";

const Profile = () => {
  const navigation = useNavigation();

const pickImage = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert("แจ้งเตือน", "ต้องอนุญาตให้เข้าถึงคลังรูปภาพก่อน");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled) {
      Alert.alert("รอสักครู่", "กำลังนำส่งรูปภาพขึ้นสู่ Cloudinary...");

      const base64Img = `data:image/jpeg;base64,${result.assets[0].base64}`;
      const data = new FormData();
      data.append("file", base64Img);
      data.append("upload_preset", "Mobile");
      data.append("cloud_name", "dyvzbdlcx");

      try {
        const response = await fetch(
          "https://api.cloudinary.com/v1_1/dyvzbdlcx/image/upload",
          {
            method: "POST",
            body: data,
          },
        );

        const cloudData = await response.json();

        if (cloudData.secure_url) {
          // --- ส่วนที่แก้ไข: สร้าง Object ใหม่และสั่งบันทึกลง Firebase ทันที ---
          const updatedProfile = {
            ...profile,
            avatar: cloudData.secure_url,
          };
          
          // 1. อัปเดต State เพื่อแสดงผลบนหน้าจอ
          setProfile(updatedProfile); 
          
          // 2. สั่งบันทึกลง AsyncStorage และ Firestore ทันที
          await persistProfile(updatedProfile); 
          
          Alert.alert("สำเร็จ", "เปลี่ยนรูปโปรไฟล์เรียบร้อยแล้ว!");
          // -------------------------------------------------------
        } else {
          Alert.alert(
            "ข้อผิดพลาด",
            "ไม่สามารถนำส่งรูปภาพได้: " + cloudData.error?.message,
          );
        }
      } catch (error) {
        console.error("Cloudinary Upload Error: ", error);
        Alert.alert("ข้อผิดพลาด", "ระบบขัดข้อง ไม่สามารถเชื่อมต่อได้");
      }
    }
  };

  const facultyData = {
    ศวท: [
      // คณะศิลปศาสตร์และวิทยาศาสตร์ (Liberal Arts and Science)
      "IT (เทคโนโลยีสารสนเทศ)",
      "Computer Science (วิทยาการคอมพิวเตอร์)",
      "เคมี",
      "ฟิสิกส์",
      "จุลชีววิทยา",
      "วิทยาศาสตร์ชีวภาพ",
      "วิทยาศาสตร์ทั่วไป",
      "คณิตศาสตร์ประยุกต์",
      "ภาษาอังกฤษ",
      "การจัดการ",
      "การตลาด",
      "บัญชีบริหาร",
    ],
    วิศวะ: [
      // คณะวิศวกรรมศาสตร์ กำแพงแสน
      "Computer Engineer (วิศวกรรมคอมพิวเตอร์)",
      "วิศวกรรมเครื่องกล",
      "วิศวกรรมโยธา",
      "วิศวกรรมเกษตร",
      "วิศวกรรมการอาหาร",
      "วิศวกรรมอุตสาหการ-โลจิสติกส์",
    ],
    เกษตร: [
      // คณะเกษตร กำแพงแสน
      "เกษตรศาสตร์",
      "สัตวบาล",
      "เทคโนโลยีชีวภาพทางการเกษตร",
      "พืชไร่นา",
      "พืชสวน",
      "กีฏวิทยา",
      "โรคพืช",
      "ปฐพีวิทยา",
      "เกษตรกลวิธาน",
    ],
    ศึกษาศาสตร์: [
      // คณะศึกษาศาสตร์และพัฒนศาสตร์
      "เกษตรและสิ่งแวดล้อมศึกษา",
      "การจัดการเรียนรู้ (คณิตศาสตร์ศึกษา)",
      "การจัดการเรียนรู้ (วิทยาศาสตร์ศึกษา)",
      "การจัดการเรียนรู้ (ภาษาอังกฤษศึกษา)",
      "การจัดการเรียนรู้ (พลศึกษาและสุขศึกษา)",
    ],
    อุตสาหกรรมบริการ: [
      // คณะอุตสาหกรรมบริการ (Faculty of Hospitality Industry - แยกย้ายมาจาก ศวท.)
      "การจัดการธุรกิจการบิน",
      "การโรงแรม ภัตตาคาร และเรือสำราญ",
      "การท่องเที่ยวและนันทนาการ",
      "ภาษาอังกฤษเพื่ออุตสาหกรรมบริการ",
      "การจัดการธุรกิจบริการและอุตสาหกรรมไมซ์",
    ],
    วิทยาศาสตร์การกีฬา: [
      // คณะวิทยาศาสตร์การกีฬาและสุขภาพ
      "วิทยาศาสตร์การกีฬาและสุขภาพ",
    ],
    สัตวแพทยศาสตร์: [
      // คณะสัตวแพทยศาสตร์
      "สัตวแพทยศาสตร์ (เรียนที่กำแพงแสนปี 4-6)",
    ],
  };

  const [profile, setProfile] = useState({
    name: "",
    faculty: "",
    major: "",
    year: "",
    studentId: "",
    avatar: "",
  });

  const [userEmail, setUserEmail] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_700Bold,
  });

  const persistProfile = async (newProfile) => {
    try {
      const timestamp = new Date().toISOString();

      await AsyncStorage.multiSet([
        ["myProfile", JSON.stringify(newProfile)],
        ["last_updated_profile", timestamp],
      ]);

      // 2. Update Firestore if user is logged in
      if (auth.currentUser) {
        const userDocRef = doc(
          db,
          "users",
          auth.currentUser.uid,
          "profile",
          "data",
        );
        await setDoc(
          userDocRef,
          {
            ...newProfile,
            lastUpdated: timestamp,
          },
          { merge: true },
        );
      }
      console.log("DEBUG: successfully send Profile data!");
    } catch (error) {
      console.error("Sync Profile Error:", error);
    }
  };

  useEffect(() => {
    const loadAndSyncProfile = async () => {
      try {
        const currentUser = auth.currentUser;
        if (currentUser) setUserEmail(currentUser.email);

        // Pull local data
        const localProfile = await AsyncStorage.getItem("myProfile");
        const localTS = await AsyncStorage.getItem("last_updated_profile");

        if (localProfile) {
          setProfile(JSON.parse(localProfile));
        }

        // Sync with Cloud
        if (currentUser) {
          const userDocRef = doc(
            db,
            "users",
            currentUser.uid,
            "profile",
            "data",
          );
          const docSnap = await getDoc(userDocRef);

          if (docSnap.exists()) {
            const cloudData = docSnap.data();
            const cloudTS = cloudData.lastUpdated;

            // Logic: If Cloud is newer than Local, or Local doesn't exist
            const isCloudNewer =
              !localTS || new Date(cloudTS) > new Date(localTS);

            if (isCloudNewer) {
              const { lastUpdated, ...profileData } = cloudData;
              setProfile(profileData);
              await AsyncStorage.multiSet([
                ["myProfile", JSON.stringify(profileData)],
                ["last_updated_profile", cloudTS],
              ]);
            }
          }
        }
      } catch (error) {
        console.error("Load Profile Sync Error:", error);
      } finally {
        setIsLoaded(true);
      }
    };

    loadAndSyncProfile();
  }, []);

  if (!fontsLoaded) {
    return null;
  }
// --- Logic การลบข้อมูล (เฉพาะตารางเรียนและแพลนเนอร์ ไม่แตะโปรไฟล์) ---
  const handleClearData = () => {
    Alert.alert(
      "⚠️ ยืนยันการลบข้อมูล",
      "ข้อมูลตารางเรียน แพลนเนอร์ และงานต่างๆ จะถูกลบ (ข้อมูลโปรไฟล์จะยังอยู่เหมือนเดิม) คุณแน่ใจหรือไม่?",
      [
        { text: "ยกเลิก", style: "cancel" },
        {
          text: "ลบข้อมูล",
          style: "destructive",
          onPress: async () => {
            try {
              // 1. ลบใน Cloud (Firestore) เฉพาะข้อมูลตารางเรียนและแพลนเนอร์
              if (auth.currentUser) {
                const userDocRef = doc(
                  db,
                  "users",
                  auth.currentUser.uid,
                  "timetable",
                  "data"
                );
                await deleteDoc(userDocRef);
                
                const userDocRef2 = doc(
                  db,
                  "users",
                  auth.currentUser.uid,
                  "planner",
                  "data"
                );
                await deleteDoc(userDocRef2);
              }

              // 2. ลบเฉพาะ Key ในเครื่องที่เกี่ยวกับตารางเรียนและแพลนเนอร์
              const keysToRemove = [
                "myTasks",
                "last_updated_planner",
                "user_table",
                "user_table_list",
                "user_exams",
                "last_updated",
              ];
              await AsyncStorage.multiRemove(keysToRemove);

              // 3. แจ้งเตือนและ "รีเซ็ตหน้าจอ" (ใช้ Navigation Reset ตามที่ต้องการ)
              Alert.alert("สำเร็จ", "ล้างข้อมูลตารางเรียนและแพลนเนอร์เรียบร้อยแล้ว", [
                {
                  text: "ตกลง",
                  onPress: () => {
                    navigation.reset({
                      index: 0,
                      routes: [{ name: "Profile" }],
                    });
                  },
                },
              ]);
            } catch (e) {
              console.error(e);
              Alert.alert("Error", "ไม่สามารถลบข้อมูลได้");
            }
          },
        },
      ],
    );
  };

  const handleLogout = () => {
    Alert.alert("ลงชื่อออก", "คุณต้องการลงชื่อออกจากระบบใช่หรือไม่?", [
      { text: "ยกเลิก", style: "cancel" },
      {
        text: "ยืนยัน",
        style: "destructive",
        onPress: async () => {
          try {
            await signOut(auth);

            const keys = [
              "myTasks",
              "last_updated_planner",
              "user_table",
              "user_table_list",
              "user_exams",
              "last_updated",
              "myProfile",
              "current_username",
              "last_updated_profile",
            ];
            await AsyncStorage.multiRemove(keys);

            // navigation.replace("Login");
          } catch (error) {
            console.error("Logout Error:", error);
            Alert.alert("ข้อผิดพลาด", "ไม่สามารถลงชื่อออกได้ กรุณาลองใหม่");
          }
        },
      },
    ]);
  };

  const toggleEdit = async () => {
    if (isEditing) {
      await persistProfile(profile);
      Alert.alert("สำเร็จ", "บันทึกข้อมูลส่วนตัวเรียบร้อยแล้ว");
      navigation.navigate({
        name: "Profile",
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

        <View style={styles.infoCard}>
          <Text style={styles.ProfileLabelinput}>โปรไฟล์ & การตั้งค่า</Text>

          <View style={styles.infoRow}>
            <Text style={styles.label}>บัญชีอีเมล (Email)</Text>
            <Text style={[styles.value, { color: "#A87BAB", fontSize: 16 }]}>
              {userEmail || "กำลังโหลด..."}
            </Text>
          </View>
<View style={styles.infoRow}>
            <Text style={styles.label}>ชื่อ-นามสกุล</Text>
            {isEditing ? (
              <TextInput
                style={styles.input}
                value={profile.name}
                maxLength={100}
                onChangeText={(t) => setProfile({ ...profile, name: t })}
                placeholder="กรอกชื่อ-นามสกุล"
                placeholderTextColor="#FFB3C6"
              />
            ) : (
              <Text style={styles.value}>{profile.name || "-"}</Text>
            )}
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>รหัสนิสิต</Text>
            {isEditing ? (
              <TextInput
                style={styles.input}
                value={profile.studentId}
                keyboardType="numeric"
                maxLength={13} 
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
                  // 1. กรองให้เหลือแต่ตัวเลข
                  const onlyNumbers = t.replace(/[^0-9]/g, "");

                  // 2. ถ้าเป็นค่าว่าง ยอมให้ set เพื่อการลบ/แก้ไข
                  if (onlyNumbers === "") {
                    setProfile({ ...profile, year: "" });
                    return;
                  }

                  // 3. แปลงเป็นตัวเลขเพื่อเช็คเงื่อนไข 1-20
                  const yearNum = parseInt(onlyNumbers, 10);
                  if (yearNum >= 1 && yearNum <= 20) {
                    setProfile({ ...profile, year: onlyNumbers });
                  } else if (yearNum > 20) {
                    // ถ้ากรอกเกิน 20 ให้ค้างไว้ที่ 20 หรือแจ้งเตือน
                    setProfile({ ...profile, year: "20" });
                  }
                }}
                placeholder="กรอกชั้นปี (1-20)"
                placeholderTextColor="#FFB3C6"
                maxLength={2} // จำกัดจำนวนหลักไม่ให้พิมพ์เกิน 2 หลัก
              />
            ) : (
              <Text style={styles.value}>{profile.year || "-"}</Text>
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

          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={25} color="#FFF" />
            <Text style={styles.logoutBtnText}>ลงชื่อออก (Logout)</Text>
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
  scrollContent: { padding: 20, alignItems: "center", paddingBottom: 100 },
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
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
  logoutBtn: {
    flexDirection: "row",
    width: "100%",
    padding: 15,
    borderRadius: 15,
    backgroundColor: "#FF7675",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 5,
    elevation: 2,
  },
  logoutBtnText: {
    color: "#FFF",
    fontWeight: "bold",
    marginLeft: 10,
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
  versionText: { marginTop: 10, color: "#FFB7C5", fontSize: 12 },
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
