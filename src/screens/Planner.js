import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

const StudySyncScreen = () => {
  // --- State สำหรับฟอร์ม Modal ---
  const [modalVisible, setModalVisible] = useState(false);
  const [activityName, setActivityName] = useState('');
  const [category, setCategory] = useState('study'); // 'study' | 'other'
  
  const [activityDate, setActivityDate] = useState(new Date());
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date(new Date().setHours(new Date().getHours() + 1)));

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);

  // --- State สำหรับ Filter หมวดหมู่กล่องบน ---
  const [filterCategory, setFilterCategory] = useState('all'); // 'all' | 'study' | 'other'

  // --- State รวมข้อมูลทั้งหมด ---
  const [tasks, setTasks] = useState([]);

  // อัปเดตเวลาปัจจุบัน (เพื่อให้แอปเช็คว่าหมดเวลาหรือยัง)
  const [currentTime, setCurrentTime] = useState(Date.now());
  useEffect(() => {
    // ให้เช็คเวลาทุกๆ 1 นาที เผื่อผู้ใช้เปิดแอปทิ้งไว้
    const timer = setInterval(() => setCurrentTime(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);

  // ฟังก์ชันสลับสถานะของรายการตรวจสอบ
  const toggleTaskStatus = (id) => {
    setTasks(tasks.map(task => {
      if (task.id === id) {
        let nextStatus = 'pending';
        if (task.status === 'pending') nextStatus = 'completed';      
        else if (task.status === 'completed') nextStatus = 'missed'; 
        return { ...task, status: nextStatus };
      }
      return task;
    }));
  };

  // ================= 1. ลอจิกการกรองข้อมูลกล่องบน (กิจกรรมที่กำลังดำเนินการ) =================
  const activeTasks = tasks.filter(task => {
    // เงื่อนไข 1: ต้องเป็นสถานะ 'รอดำเนินการ' เท่านั้น (ถ้ากดเสร็จแล้ว หรือพลาดแล้ว จะไม่โชว์)
    if (task.status !== 'pending') return false;
    
    // เงื่อนไข 2: ยังไม่หมดเวลา (เวลาปัจจุบัน ต้องน้อยกว่า เวลาสิ้นสุดของกิจกรรม)
    if (currentTime > task.endTimeMs) return false;

    // เงื่อนไข 3: กรองตามหมวดหมู่ที่ผู้ใช้กดเลือกจากปุ่ม Filter
    if (filterCategory !== 'all' && task.category !== filterCategory) return false;

    return true;
  });

  // ================= 2. ลอจิกกล่องล่าง (รายการตรวจสอบแผนกิจกรรมทั้งหมด) =================
  const checklistTasks = tasks; 
  const completedCount = checklistTasks.filter(item => item.status === 'completed').length;
  const totalCount = checklistTasks.length;
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  // ฟังก์ชันจัดรูปแบบข้อความ
  const formatDate = (dateObj) => `${dateObj.getDate().toString().padStart(2, '0')}/${(dateObj.getMonth() + 1).toString().padStart(2, '0')}/${dateObj.getFullYear()}`;
  const formatTime = (dateObj) => `${dateObj.getHours().toString().padStart(2, '0')}:${dateObj.getMinutes().toString().padStart(2, '0')}`;

  // บันทึกกิจกรรมใหม่
  const handleSaveActivity = () => {
    if (activityName) {
      // เอา "วันที่" กับ "เวลาสิ้นสุด" มารวมกัน เพื่อสร้าง Timestamp ที่แม่นยำสำหรับการเปรียบเทียบ
      const endDateTime = new Date(activityDate);
      endDateTime.setHours(endTime.getHours());
      endDateTime.setMinutes(endTime.getMinutes());
      endDateTime.setSeconds(0);

      const newTask = {
        id: Date.now(),
        title: activityName,
        category: category, 
        dateString: formatDate(activityDate),
        timeString: `${formatTime(startTime)} - ${formatTime(endTime)}`,
        endTimeMs: endDateTime.getTime(), // เก็บค่า Timestamp ไว้เช็คว่าหมดเวลาหรือยัง
        status: 'pending' 
      };
      
      setTasks([...tasks, newTask]);
      
      // Reset Form 
      setActivityName('');
      setCategory('study'); 
      setActivityDate(new Date());
      setStartTime(new Date());
      setEndTime(new Date(new Date().setHours(new Date().getHours() + 1)));
      setModalVisible(false);
      setFilterCategory('all'); // กลับมาหน้า "ทั้งหมด" เพื่อให้เห็นของใหม่ที่พึ่งแอด
    }
  };

  return (
    <View style={styles.container}>
      
      {/* ================= MODAL POP-UP ================= */}
      <Modal animationType="fade" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>เพิ่มกิจกรรมใหม่</Text>
            
            <TextInput style={styles.input} placeholder="ชื่อกิจกรรม (เช่น ส่งใบงาน)" value={activityName} onChangeText={setActivityName} />
            
            <Text style={styles.label}>หมวดหมู่กิจกรรม</Text>
            <View style={styles.categoryRow}>
              <TouchableOpacity style={[styles.categoryButton, category === 'study' && styles.categoryButtonActive]} onPress={() => setCategory('study')}>
                <Text style={[styles.categoryText, category === 'study' && styles.categoryTextActive]}>📖 อ่านหนังสือ</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.categoryButton, category === 'other' && styles.categoryButtonActive]} onPress={() => setCategory('other')}>
                <Text style={[styles.categoryText, category === 'other' && styles.categoryTextActive]}>⚽️ อื่นๆ</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>วันที่</Text>
            <TouchableOpacity style={styles.pickerButton} onPress={() => setShowDatePicker(true)}>
              <Text style={styles.pickerText}>{formatDate(activityDate)}</Text>
              <Ionicons name="calendar-outline" size={20} color="gray" />
            </TouchableOpacity>

            <View style={styles.rowInputs}>
              <View style={{ flex: 1, marginRight: 5 }}>
                <Text style={styles.label}>เวลาเริ่ม</Text>
                <TouchableOpacity style={styles.pickerButton} onPress={() => setShowStartTimePicker(true)}>
                  <Text style={styles.pickerText}>{formatTime(startTime)}</Text>
                  <Ionicons name="time-outline" size={20} color="gray" />
                </TouchableOpacity>
              </View>
              <View style={{ flex: 1, marginLeft: 5 }}>
                <Text style={styles.label}>เวลาสิ้นสุด</Text>
                <TouchableOpacity style={styles.pickerButton} onPress={() => setShowEndTimePicker(true)}>
                  <Text style={styles.pickerText}>{formatTime(endTime)}</Text>
                  <Ionicons name="time-outline" size={20} color="gray" />
                </TouchableOpacity>
              </View>
            </View>

            {showDatePicker && <DateTimePicker value={activityDate} mode="date" display="default" onChange={(e, d) => { setShowDatePicker(false); if(d) setActivityDate(d); }} />}
            {showStartTimePicker && <DateTimePicker value={startTime} mode="time" display="default" onChange={(e, t) => { setShowStartTimePicker(false); if(t) setStartTime(t); }} />}
            {showEndTimePicker && <DateTimePicker value={endTime} mode="time" display="default" onChange={(e, t) => { setShowEndTimePicker(false); if(t) setEndTime(t); }} />}

            <View style={styles.modalButtonRow}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelButtonText}>ยกเลิก</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleSaveActivity}>
                <Text style={styles.saveButtonText}>บันทึก</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ================= UI หลัก ================= */}
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        <View style={styles.banner}>
          <Text style={styles.bannerTitle}>วางแผนกิจกรรม และ เวลาอ่านหนังสือ</Text>
          <Text style={styles.bannerSubtitle}>จัดระเบียบกิจกรรมนอกหลักสูตร{'\n'}และแผนการเรียนของคุณ</Text>
        </View>

        {/* ================= กล่องบน: กิจกรรมที่กำลังดำเนินการ ================= */}
        <View style={[styles.sectionCard, { minHeight: 200 }]}> 
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>กิจกรรมนอกหลักสูตร</Text>
            <TouchableOpacity style={styles.addButton} onPress={() => { setModalVisible(true); }}>
              <Text style={styles.addButtonText}>+ เพิ่มกิจกรรม</Text>
            </TouchableOpacity>
          </View>

          {/* ปุม Filter (ซ่อนไว้ถ้ายังไม่มีกิจกรรมในระบบเลย) */}
          {tasks.length > 0 && (
            <View style={styles.filterContainer}>
              <TouchableOpacity style={[styles.filterBtn, filterCategory === 'all' && styles.filterBtnActive]} onPress={() => setFilterCategory('all')}>
                <Text style={[styles.filterText, filterCategory === 'all' && styles.filterTextActive]}>ทั้งหมด</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.filterBtn, filterCategory === 'study' && styles.filterBtnActive]} onPress={() => setFilterCategory('study')}>
                <Text style={[styles.filterText, filterCategory === 'study' && styles.filterTextActive]}>📖 เรียน</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.filterBtn, filterCategory === 'other' && styles.filterBtnActive]} onPress={() => setFilterCategory('other')}>
                <Text style={[styles.filterText, filterCategory === 'other' && styles.filterTextActive]}>⚽️ อื่นๆ</Text>
              </TouchableOpacity>
            </View>
          )}

          {activeTasks.length === 0 ? (
             <View style={styles.emptyFilteredContainer}>
               <Text style={styles.emptySubText}>ไม่มีกิจกรรมที่กำลังดำเนินการ</Text>
             </View>
          ) : (
            activeTasks.map((item) => (
              <View key={item.id} style={styles.listItemRow}>
                <View style={{ width: 80 }}>
                  <Text style={styles.dateText}>{item.dateString}</Text>
                  <Text style={styles.timeText}>{item.timeString}</Text>
                </View>
                <View style={{ flex: 1, alignItems: 'center' }}>
                  <Text style={styles.taskName}>{item.title}</Text>
                </View>
              </View>
            ))
          )}
        </View>

        {/* ================= กล่องล่าง: รายการตรวจสอบแผนกิจกรรม ================= */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>รายการตรวจสอบแผนกิจกรรม</Text>
            <Text style={styles.progressText}>{completedCount}/{totalCount}</Text>
          </View>
          
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
          </View>

          {checklistTasks.length === 0 ? (
             <View style={styles.emptyFilteredContainer}>
               <Text style={styles.emptySubText}>ยังไม่มีรายการที่ต้องทำ</Text>
             </View>
          ) : (
            checklistTasks.map((plan) => (
              <View key={plan.id} style={styles.checklistRow}>
                <View style={{ width: 80 }}>
                  <Text style={styles.checklistDate}>{plan.dateString}</Text>
                  <Text style={styles.checklistTime}>{plan.timeString}</Text>
                </View>

                <View style={{ flex: 1, alignItems: 'center' }}>
                  <Text style={styles.checklistTitle}>{plan.title}</Text>
                  <Text style={{ fontSize: 9, color: plan.category === 'study' ? '#1976D2' : '#F57C00', marginTop: 2 }}>
                    {plan.category === 'study' ? '📖 อ่านหนังสือ' : '⚽️ อื่นๆ'}
                  </Text>
                </View>

                <TouchableOpacity onPress={() => toggleTaskStatus(plan.id)} style={{ padding: 5, width: 35, alignItems: 'flex-end' }}>
                  {plan.status === 'completed' && <Ionicons name="checkmark" size={26} color="#4CAF50" />}
                  {plan.status === 'missed' && <Ionicons name="close" size={26} color="#FF5252" />}
                  {plan.status === 'pending' && <Ionicons name="ellipse-outline" size={24} color="#E0E0E0" />}
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
      </ScrollView>

    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  scrollContent: { padding: 20 },
  
  banner: { backgroundColor: '#F8BBD0', padding: 20, borderRadius: 20, marginBottom: 20 },
  bannerTitle: { fontSize: 16, fontWeight: 'bold', color: '#fff', marginBottom: 5 },
  bannerSubtitle: { fontSize: 12, color: '#fff', opacity: 0.9 },
  
  sectionCard: { backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 20, elevation: 2 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#000' },
  addButton: { backgroundColor: '#F06292', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20 },
  addButtonText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  
  // Styles สำหรับ Filter หมวดหมู่
  filterContainer: { flexDirection: 'row', marginBottom: 15, gap: 10 },
  filterBtn: { paddingVertical: 6, paddingHorizontal: 15, borderRadius: 20, backgroundColor: '#F5F5F5', borderWidth: 1, borderColor: '#EEEEEE' },
  filterBtnActive: { backgroundColor: '#FCE4EC', borderColor: '#F06292' },
  filterText: { fontSize: 12, color: '#9E9E9E', fontWeight: '500' },
  filterTextActive: { color: '#D81B60', fontWeight: 'bold' },

  // กล่องบน
  listItemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  dateText: { color: '#E91E63', fontWeight: 'bold', fontSize: 12 },
  timeText: { color: '#E91E63', fontSize: 12 },
  taskName: { fontSize: 14, color: '#E91E63', textAlign: 'center', paddingHorizontal: 10 },
  
  // กล่องล่าง
  checklistRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  checklistDate: { color: '#E91E63', fontWeight: 'bold', fontSize: 12 },
  checklistTime: { color: '#E91E63', fontSize: 12 },
  checklistTitle: { textAlign: 'center', color: '#E91E63', fontSize: 14, paddingHorizontal: 10 },

  progressText: { fontSize: 12, color: '#BDBDBD' },
  progressBarBg: { height: 6, backgroundColor: '#F0F0F0', borderRadius: 3, marginBottom: 10 },
  progressBarFill: { height: 6, backgroundColor: '#A5D6A7', borderRadius: 3 },
  emptyFilteredContainer: { alignItems: 'center', paddingVertical: 20 },
  emptySubText: { color: '#BDBDBD', fontSize: 12 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContainer: { width: '85%', backgroundColor: '#fff', borderRadius: 20, padding: 25 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#E91E63', marginBottom: 20, textAlign: 'center' },
  input: { backgroundColor: '#F5F5F5', borderRadius: 10, padding: 12, marginBottom: 15, fontSize: 14 },
  label: { fontSize: 12, color: 'gray', marginBottom: 5, marginLeft: 5 },
  pickerButton: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F5F5F5', borderRadius: 10, padding: 12, marginBottom: 15 },
  pickerText: { fontSize: 14, color: '#333' },
  rowInputs: { flexDirection: 'row' },
  modalButtonRow: { flexDirection: 'row', marginTop: 10 },
  cancelButton: { flex: 1, backgroundColor: '#EEEEEE', padding: 12, borderRadius: 10, marginRight: 5, alignItems: 'center' },
  cancelButtonText: { color: '#757575', fontWeight: 'bold' },
  saveButton: { flex: 1, backgroundColor: '#E91E63', padding: 12, borderRadius: 10, marginLeft: 5, alignItems: 'center' },
  saveButtonText: { color: '#fff', fontWeight: 'bold' },
  categoryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  categoryButton: { flex: 1, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: '#EEEEEE', alignItems: 'center', marginHorizontal: 5, backgroundColor: '#FAFAFA' },
  categoryButtonActive: { backgroundColor: '#FCE4EC', borderColor: '#E91E63' },
  categoryText: { fontSize: 12, color: '#9E9E9E', fontWeight: '500' },
  categoryTextActive: { color: '#E91E63', fontWeight: 'bold' },
});

export default StudySyncScreen;