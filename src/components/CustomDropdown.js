import React, { useState } from "react";
import { View } from "react-native";
import { Menu, Button } from "react-native-paper";

const CustomDropdown = ({ label, items = [] }) => {
  const [visible, setVisible] = useState(false);

  const openMenu = () => setVisible(true);
  const closeMenu = () => setVisible(false);

  return (
    <View>
      <Menu
        visible={visible}
        onDismiss={closeMenu}
        anchor={<Button onPress={openMenu}>{label}</Button>}
      >
        {items.map((item, index) => (
          <Menu.Item
            key={index}
            onPress={() => {
              item.onPress?.();
              closeMenu();
            }}
            title={item.title}
          />
        ))}
      </Menu>
    </View>
  );
};

export default CustomDropdown;
