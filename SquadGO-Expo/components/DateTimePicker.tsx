import React from 'react';
import { Platform, View, Text, TextInput, TouchableOpacity } from 'react-native';

interface DateTimePickerProps {
  value: Date;
  mode: 'date' | 'time';
  display?: string;
  onChange: (event: any, selectedDate?: Date) => void;
  minimumDate?: Date;
}

const DateTimePicker: React.FC<DateTimePickerProps> = ({
  value,
  mode,
  onChange,
  minimumDate
}) => {
  if (Platform.OS === 'web') {
    return (
      <View style={{ padding: 20, backgroundColor: 'white', margin: 20, borderRadius: 10 }}>
        <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10, color: '#333' }}>
          {mode === 'date' ? 'Seleccionar Fecha' : 'Seleccionar Hora'}
        </Text>
        <TextInput
          style={{
            borderWidth: 1,
            borderColor: '#ddd',
            borderRadius: 8,
            padding: 12,
            fontSize: 16,
            marginBottom: 10
          }}
          placeholder={mode === 'date' ? 'YYYY-MM-DD' : 'HH:MM'}
          value={
            mode === 'date'
              ? value.toISOString().split('T')[0]
              : value.toTimeString().slice(0, 5)
          }
          onChangeText={(text) => {
            if (mode === 'date') {
              const newDate = new Date(text);
              if (!isNaN(newDate.getTime())) {
                onChange({ type: 'set' }, newDate);
              }
            } else {
              const [hours, minutes] = text.split(':');
              if (hours && minutes) {
                const newTime = new Date(value);
                newTime.setHours(parseInt(hours), parseInt(minutes));
                if (!isNaN(newTime.getTime())) {
                  onChange({ type: 'set' }, newTime);
                }
              }
            }
          }}
        />
      </View>
    );
  }

  // Para plataformas nativas, usar el DateTimePicker real
  try {
    const NativeDateTimePicker = require('@react-native-community/datetimepicker').default;
    return (
      <NativeDateTimePicker
        value={value}
        mode={mode}
        display="default"
        onChange={onChange}
        minimumDate={minimumDate}
      />
    );
  } catch (error) {
    // Fallback si no se puede cargar el componente nativo
    return null;
  }
};

export default DateTimePicker;