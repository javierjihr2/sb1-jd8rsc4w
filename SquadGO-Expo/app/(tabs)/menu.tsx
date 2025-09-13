import React from 'react';
import { View, Text } from 'react-native';

// Esta pantalla no se muestra realmente, solo existe para el sistema de navegación
// El menú desplegable se maneja a través del componente DropdownMenu
export default function MenuScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Menú</Text>
    </View>
  );
}