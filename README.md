# StudyBro-mobile-project
This project is part of Mobile Application Design and Development (01418342-65) mainly use JavaScript, react native, expo as Main tech stack

วิธีใช้ Fonts Inter
//1.Import
import { useFonts, Inter_400Regular, Inter_700Bold } from "@expo-google-fonts/inter";
//2.Copyไอนี้ไปว่างใน Func
const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_700Bold,
});
3.//Exp การใช้
examValue: {
    color: "#ffffff",
    fontFamily: "Inter_700Bold",
    fontSize: 15
},
examDatail: {
    color: "#000000",
    fontFamily: "Inter_400Regular",
    fontSize: 15
},

Frontend เหลือหน้า HomeScreen PlannerScreen หน้าต่างย่อยหลังจากกดปุ่มต่างๆ

npx expo install @react-native-community/datetimepicker
ใส่วันเวลาเริ่มและเวลาที่สิ้นสุด ไม่ต้องให้ผู้ใช้กรอกวันเวลาเป็นข้อความเอง กดเลือกจากปฏิทินได้เลย