import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useFonts, Inter_400Regular, Inter_700Bold } from "@expo-google-fonts/inter";
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import AntDesign from '@expo/vector-icons/AntDesign';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Planner = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [activityName, setActivityName] = useState('');
  const [category, setCategory] = useState('study'); 
  const [note, setNote] = useState('');

  const [activityDate, setActivityDate] = useState(new Date());
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date(new Date().setHours(new Date().getHours() + 1)));

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);

  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [filterCategory, setFilterCategory] = useState('all'); 

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_700Bold,
  });

  const [tasks, setTasks] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // 1. โหลดข้อมูลจากเครื่องตอนเปิดหน้า
  useEffect(() => {
    const loadTasks = async () => {
      try {
        const savedTasks = await AsyncStorage.getItem('@my_tasks');
        if (savedTasks) {
          setTasks(JSON.parse(savedTasks));
        }
      } catch (e) {
        console.error("Failed to load tasks", e);
      } finally {
        setIsLoaded(true);
      }
    };
    loadTasks();
  }, []);

  // 2. เซฟข้อมูลลงเครื่องอัตโนมัติเมื่อ tasks เปลี่ยน
  useEffect(() => {
    if (isLoaded) {
      AsyncStorage.setItem('@my_tasks', JSON.stringify(tasks)).catch(e => console.error(e));
    }
  }, [tasks, isLoaded]);

  const [currentTime, setCurrentTime] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);

  const toggleTaskStatus = (id) => {
    setTasks(tasks.map(task => {
      if (task.id === id) {
        let nextStatus = 'pending';
        if (task.status === 'pending') nextStatus = 'completed';
        else if (task.status === 'completed') nextStatus = 'missed';
        else if (task.status === 'missed') nextStatus = 'pending';
        return { ...task, status: nextStatus };
      }
      return task;
    }));
  };

  const activeTasks = tasks.filter(task => {
    if (task.status !== 'pending') return false;
    if (filterCategory !== 'all' && task.category !== filterCategory) return false;
    return true;
  });

  const totalCount = tasks.length;
  const completedCount = tasks.filter(item => item.status === 'completed').length;
  const missedCount = tasks.filter(item => item.status === 'missed').length;
  
  const completedPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
  const missedPercent = totalCount > 0 ? (missedCount / totalCount) * 100 : 0;

  const formatDate = (dateObj) => `${dateObj.getDate().toString().padStart(2, '0')}/${(dateObj.getMonth() + 1).toString().padStart(2, '0')}/${dateObj.getFullYear()}`;
  const formatTime = (dateObj) => `${dateObj.getHours().toString().padStart(2, '0')}:${dateObj.getMinutes().toString().padStart(2, '0')}`;

  const handleSaveActivity = () => {
    if (activityName) {
      const endDateTime = new Date(activityDate);
      endDateTime.setHours(endTime.getHours());
      endDateTime.setMinutes(endTime.getMinutes());
      endDateTime.setSeconds(0);

      const newTask = {
        id: Date.now(),
        title: activityName,
        category: category,
        note: note,
        dateString: formatDate(activityDate),
        timeString: `${formatTime(startTime)} - ${formatTime(endTime)}`,
        endTimeMs: endDateTime.getTime(),
        status: 'pending'
      };

      setTasks([...tasks, newTask]);

      setActivityName('');
      setCategory('study');
      setNote(''); 
      setActivityDate(new Date());
      setStartTime(new Date());
      setEndTime(new Date(new Date().setHours(new Date().getHours() + 1)));
      setModalVisible(false);
      setFilterCategory('all'); 
    }
  };

  const openTaskDetails = (task) => {
    setSelectedTask(task);
    setDetailsModalVisible(true);
  };

  const handleDeleteTask = (taskId) => {
    Alert.alert(
      "ยืนยันการลบ",
      "คุณแน่ใจหรือไม่ว่าต้องการลบกิจกรรมนี้?",
      [
        { text: "ยกเลิก", style: "cancel" },
        { 
          text: "ลบกิจกรรม", 
          onPress: () => {
            setTasks(tasks.filter(task => task.id !== taskId));
            setDetailsModalVisible(false);
            setSelectedTask(null);
          },
          style: "destructive" 
        }
      ]
    );
  };

  return (
    <View style={styles.container}>

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

            <Text style={styles.label}>บันทึกข้อความ (Note)</Text>
            <TextInput 
              style={styles.textArea} 
              placeholder="เพิ่มรายละเอียดกิจกรรม..." 
              value={note} 
              onChangeText={setNote} 
              multiline={true} 
              numberOfLines={3} 
            />

            {showDatePicker && <DateTimePicker value={activityDate} mode="date" display="default" onChange={(e, d) => { setShowDatePicker(false); if (d) setActivityDate(d); }} />}
            {showStartTimePicker && <DateTimePicker value={startTime} mode="time" display="default" onChange={(e, t) => { setShowStartTimePicker(false); if (t) setStartTime(t); }} />}
            {showEndTimePicker && <DateTimePicker value={endTime} mode="time" display="default" onChange={(e, t) => { setShowEndTimePicker(false); if (t) setEndTime(t); }} />}

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

      <Modal animationType="fade" transparent={true} visible={detailsModalVisible} onRequestClose={() => setDetailsModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {selectedTask && (
              <>
                <Text style={styles.modalTitle}>รายละเอียดกิจกรรม</Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>กิจกรรม:</Text>
                  <Text style={styles.detailValue}>{selectedTask.title}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>หมวดหมู่:</Text>
                  <Text style={styles.detailValue}>
                    {selectedTask.category === 'study' ? '📖 อ่านหนังสือ' : '⚽️ อื่นๆ'}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>วันที่:</Text>
                  <Text style={styles.detailValue}>{selectedTask.dateString}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>เวลา:</Text>
                  <Text style={styles.detailValue}>{selectedTask.timeString}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>สถานะ:</Text>
                  <Text style={[styles.detailValue, { 
                    color: selectedTask.status === 'completed' ? '#4CAF50' : selectedTask.status === 'missed' ? '#FF5252' : '#F57C00',
                    fontWeight: 'bold'
                  }]}>
                    {selectedTask.status === 'completed' ? '✅ เสร็จสิ้น' : selectedTask.status === 'missed' ? '❌ พลาด (หมดเวลา)' : '⏳ รอดำเนินการ'}
                  </Text>
                </View>
                <Text style={[styles.detailLabel, { marginTop: 10 }]}>บันทึกข้อความ:</Text>
                <View style={styles.noteBox}>
                  <Text style={styles.noteText}>
                    {selectedTask.note ? selectedTask.note : '- ไม่มีบันทึกข้อความเพิ่มเติม -'}
                  </Text>
                </View>
                <View style={styles.modalButtonRow}>
                  <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteTask(selectedTask.id)}>
                    <Text style={styles.deleteButtonText}>ลบกิจกรรม</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.cancelButton} onPress={() => setDetailsModalVisible(false)}>
                    <Text style={styles.cancelButtonText}>ปิดหน้าต่าง</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.banner}>
          <Text style={styles.bannerTitle}>วางแผนกิจกรรม และ เวลาอ่านหนังสือ</Text>
          <Text style={styles.bannerSubtitle}>จัดระเบียบกิจกรรมนอกหลักสูตร{'\n'}และแผนการเรียนของคุณ</Text>
        </View>

        <View style={[styles.sectionCard, { minHeight: 200 }]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>กิจกรรมนอกหลักสูตร</Text>
            <TouchableOpacity style={styles.addButton} onPress={() => { setModalVisible(true); }}>
              <Text style={styles.addButtonText}>+ เพิ่มกิจกรรม</Text>
            </TouchableOpacity>
          </View>

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
              <AntDesign name="plus-circle" size={168} color="#F2F2F2" />
              <View >
                <Text style={styles.emptySubText}>ยังไม่มีกิจกรรมในขณะนี้</Text>
                <Text style={styles.emptySubText}>เพิ่มกิจกรรมนอกหลักสูตรของคุณได้เลย</Text>
              </View>
            </View>
          ) : (
            activeTasks.map((item) => (
              <TouchableOpacity key={item.id} style={styles.listItemRow} onPress={() => openTaskDetails(item)}>
                <View style={{ width: 80 }}>
                  <Text style={styles.dateText}>{item.dateString}</Text>
                  <Text style={styles.timeText}>{item.timeString.split('-')[0]}</Text>
                </View>
                <View style={{ flex: 1, alignItems: 'center' }}>
                  <Text style={styles.taskName}>{item.title}</Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>รายการตรวจสอบแผนกิจกรรม</Text>
            <Text style={styles.progressText}>{Math.round(completedPercent)}%</Text>
          </View>

          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${completedPercent}%` }]} />
            <View style={[styles.progressBarMissed, { width: `${missedPercent}%` }]} />
          </View>

          {tasks.length === 0 ? (
            <View style={styles.emptyFilteredContainer}>
              <FontAwesome5 name="check" size={128} color="#F2F2F2" />
              <Text style={styles.emptySubText}>ยังไม่มีงานที่ต้องศึกษาหรือทำในขณะนี้</Text>
            </View>
          ) : (
            tasks.map((plan) => (
              <TouchableOpacity key={plan.id} style={styles.checklistRow} onPress={() => openTaskDetails(plan)}>
                <View style={{ width: 80 }}>
                  <Text style={styles.checklistDate}>{plan.dateString}</Text>
                  <Text style={styles.checklistTime}>{plan.timeString.split('-')[0]}</Text>
                </View>

                <View style={{ flex: 1, alignItems: 'center' }}>
                  <Text style={[styles.checklistTitle, 
                    plan.status === 'completed' && { textDecorationLine: 'line-through', color: '#999' },
                    plan.status === 'missed' && { color: '#FF5252' }
                  ]}>
                    {plan.title}
                  </Text>
                  <Text style={{ fontSize: 9, color: plan.category === 'study' ? '#1976D2' : '#F57C00', marginTop: 2 }}>
                    {plan.category === 'study' ? '📖 อ่านหนังสือ' : '⚽️ อื่นๆ'}
                  </Text>
                </View>

                <TouchableOpacity onPress={() => toggleTaskStatus(plan.id)} style={{ padding: 5, width: 35, alignItems: 'flex-end' }}>
                  {plan.status === 'completed' && <Ionicons name="checkmark-circle" size={26} color="#4CAF50" />}
                  {plan.status === 'missed' && <Ionicons name="close-circle" size={26} color="#FF5252" />}
                  {plan.status === 'pending' && <Ionicons name="ellipse-outline" size={26} color="#E0E0E0" />}
                </TouchableOpacity>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9E2EB' },
  scrollContent: { padding: 20 },
  banner: { backgroundColor: '#FFB1D0', padding: 20, borderRadius: 20, marginBottom: 20 },
  bannerTitle: { fontSize: 20, fontFamily: 'Inter_700Bold', color: '#fff', marginBottom: 5 },
  bannerSubtitle: { fontSize: 15, fontFamily: 'Inter_400Regular', color: '#fff' },
  sectionCard: { backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 20, elevation: 2 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  sectionTitle: { fontSize: 20, fontFamily: 'Inter_700Bold', color: '#000' },
  addButton: { backgroundColor: '#FF9EC1', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20 },
  addButtonText: { color: '#fff', fontSize: 16, fontFamily: 'Inter_700Bold' },
  filterContainer: { flexDirection: 'row', marginBottom: 15, gap: 10 },
  filterBtn: { paddingVertical: 6, paddingHorizontal: 15, borderRadius: 20, backgroundColor: '#F5F5F5', borderWidth: 1, borderColor: '#EEEEEE' },
  filterBtnActive: { backgroundColor: '#FCE4EC', borderColor: '#F06292' },
  filterText: { fontSize: 12, color: '#9E9E9E', fontWeight: '500' },
  filterTextActive: { color: '#D81B60', fontWeight: 'bold' },
  listItemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  dateText: { color: '#E91E63', fontWeight: 'bold', fontSize: 12 },
  timeText: { color: '#E91E63', fontSize: 12 },
  taskName: { fontSize: 14, color: '#E91E63', textAlign: 'center', paddingHorizontal: 10 },
  checklistRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  checklistDate: { color: '#E91E63', fontWeight: 'bold', fontSize: 12 },
  checklistTime: { color: '#E91E63', fontSize: 12 },
  checklistTitle: { textAlign: 'center', color: '#E91E63', fontSize: 14, paddingHorizontal: 10 },
  progressText: { fontSize: 14, color: '#BDBDBD', fontWeight: 'bold' },
  progressBarBg: { height: 6, backgroundColor: '#F0F0F0', borderRadius: 3, marginBottom: 10, flexDirection: 'row', overflow: 'hidden' },
  progressBarFill: { height: 6, backgroundColor: '#A5D6A7' },
  progressBarMissed: { height: 6, backgroundColor: '#FF5252' }, 
  emptyFilteredContainer: { alignItems: 'center', paddingVertical: 20, gap: 20 },
  emptySubText: { color: '#BEBABA', fontSize: 13, fontFamily: "Inter_400Regular" ,textAlign:'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContainer: { width: '85%', backgroundColor: '#fff', borderRadius: 20, padding: 25 },
  modalTitle: { fontSize: 20, fontFamily: 'Inter_700Bold', color: '#E91E63', marginBottom: 20, textAlign: 'center' },
  input: { backgroundColor: '#F5F5F5', borderRadius: 10, padding: 12, marginBottom: 15, fontSize: 14 },
  textArea: { backgroundColor: '#F5F5F5', borderRadius: 10, padding: 12, marginBottom: 15, fontSize: 14, minHeight: 80, textAlignVertical: 'top' },
  label: { fontSize: 12, color: 'gray', marginBottom: 5, marginLeft: 5 },
  pickerButton: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F5F5F5', borderRadius: 10, padding: 12, marginBottom: 15 },
  pickerText: { fontSize: 14, color: '#333' },
  rowInputs: { flexDirection: 'row' },
  modalButtonRow: { flexDirection: 'row', marginTop: 10 },
  cancelButton: { flex: 1, backgroundColor: '#EEEEEE', padding: 12, borderRadius: 10, marginLeft: 5, alignItems: 'center' },
  cancelButtonText: { color: '#757575', fontWeight: 'bold' },
  saveButton: { flex: 1, backgroundColor: '#E91E63', padding: 12, borderRadius: 10, marginLeft: 5, alignItems: 'center' },
  saveButtonText: { color: '#fff', fontWeight: 'bold' },
  deleteButton: { flex: 1, backgroundColor: '#FFEBEE', borderWidth: 1, borderColor: '#FFCDD2', padding: 12, borderRadius: 10, marginRight: 5, alignItems: 'center' },
  deleteButtonText: { color: '#D32F2F', fontWeight: 'bold' },
  categoryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  categoryButton: { flex: 1, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: '#EEEEEE', alignItems: 'center', marginHorizontal: 5, backgroundColor: '#FAFAFA' },
  categoryButtonActive: { backgroundColor: '#FCE4EC', borderColor: '#E91E63' },
  categoryText: { fontSize: 12, color: '#9E9E9E', fontWeight: '500' },
  categoryTextActive: { color: '#E91E63', fontWeight: 'bold' },
  detailRow: { flexDirection: 'row', marginBottom: 10 },
  detailLabel: { fontSize: 14, fontWeight: 'bold', color: '#555', width: 80 },
  detailValue: { fontSize: 14, color: '#333', flex: 1 },
  noteBox: { backgroundColor: '#F9F9F9', borderRadius: 10, padding: 12, marginTop: 5, minHeight: 60, marginBottom: 10 },
  noteText: { fontSize: 14, color: '#666', fontStyle: 'italic' },
});

export default Planner;