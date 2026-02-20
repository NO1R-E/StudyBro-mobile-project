import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
} from "react-native";
import AntDesign from "@expo/vector-icons/AntDesign";
import { useFonts, Inter_400Regular, Inter_700Bold } from "@expo-google-fonts/inter";

const CustomDropdown = ({
  data = [],
  placeholder = "Select",
  onSelect,
}) => {
  const [visible, setVisible] = useState(false);
  const [selected, setSelected] = useState(null);
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_700Bold,
  });
  const handleSelect = (item) => {
    setSelected(item);
    setVisible(false);
    onSelect?.(item);
  };

  return (
    <View style={styles.container}>
      {/* ปุ่มหลัก */}
      <TouchableOpacity
        style={styles.dropdownButton}
        onPress={() => setVisible(!visible)}
      >
        <Text style={styles.dropdownText}>
          {selected ? selected.label : placeholder}
        </Text>
        <AntDesign
          name={visible ? "up" : "down"}
          size={16}
          color="#000000"
        />
      </TouchableOpacity>

      {/* รายการ */}
      {visible && (
        <View style={styles.dropdownMenu}>
          <FlatList
            data={data}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.item}
                onPress={() => handleSelect(item)}
              >
                <Text style={styles.itemText}>{item.label}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}
    </View>
  );
};

export default CustomDropdown;

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 15,
    marginBottom: 10,
    position: "relative",   // เพิ่ม
    zIndex: 100,
  },

  dropdownMenu: {
    position: "absolute",   // สำคัญมาก
    top: 60,                // ระยะจากปุ่ม (ปรับตาม padding ปุ่ม)
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderRadius: 15,
    elevation: 5,
    paddingVertical: 5,
    zIndex: 999,
  },
  dropdownButton: {
    backgroundColor: "#FFAAC9",
    padding: 10,
    borderRadius: 25,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dropdownText: {
    color: "#fff",
    fontFamily: 'Inter_700Bold',
    fontSize: 20
  },
  item: {
    padding: 15,
  },
  itemText: {
    fontSize: 16,
  },
});