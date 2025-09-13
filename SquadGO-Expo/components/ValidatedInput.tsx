import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TextInputProps,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ValidationRule, FormValidator } from '../utils/validation';

interface ValidatedInputProps extends Omit<TextInputProps, 'style'> {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  rules?: ValidationRule[];
  error?: string;
  showError?: boolean;
  containerStyle?: ViewStyle | TextStyle;
  inputStyle?: TextStyle;
  labelStyle?: TextStyle;
  errorStyle?: TextStyle;
  icon?: string;
  secureTextEntry?: boolean;
  onValidation?: (isValid: boolean, errors: string[]) => void;
}

export function ValidatedInput({
  label,
  value,
  onChangeText,
  rules = [],
  error,
  showError = true,
  containerStyle,
  inputStyle,
  labelStyle,
  errorStyle,
  icon,
  secureTextEntry,
  onValidation,
  ...textInputProps
}: ValidatedInputProps) {
  const [localError, setLocalError] = useState<string>('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [hasBeenTouched, setHasBeenTouched] = useState(false);

  const validator = new FormValidator();
  rules.forEach(rule => {
    validator.addRule('field', rule);
  });

  const validateInput = (inputValue: string) => {
    if (rules.length === 0) return;

    const result = validator.validateField('field', inputValue);
    const errorMessage = result.errors.length > 0 ? result.errors[0] : '';
    
    setLocalError(errorMessage);
    onValidation?.(result.isValid, result.errors);
  };

  useEffect(() => {
    if (hasBeenTouched) {
      validateInput(value);
    }
  }, [value, hasBeenTouched]);

  const handleChangeText = (text: string) => {
    onChangeText(text);
    if (hasBeenTouched) {
      validateInput(text);
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    setHasBeenTouched(true);
    validateInput(value);
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const displayError = error || localError;
  const hasError = showError && hasBeenTouched && displayError;

  return (
    <View style={[styles.container, containerStyle]}>
      <Text style={[styles.label, labelStyle, hasError && styles.labelError]}>
        {label}
      </Text>
      
      <View style={[
        styles.inputContainer,
        isFocused && styles.inputContainerFocused,
        hasError && styles.inputContainerError
      ]}>
        {icon && (
          <Ionicons 
            name={icon as any} 
            size={20} 
            color={hasError ? '#ef4444' : isFocused ? '#3b82f6' : '#6b7280'} 
            style={styles.icon}
          />
        )}
        
        <TextInput
          {...textInputProps}
          style={[
            styles.input,
            inputStyle,
            icon && styles.inputWithIcon,
            secureTextEntry && styles.inputWithSecureIcon
          ]}
          value={value}
          onChangeText={handleChangeText}
          onBlur={handleBlur}
          onFocus={handleFocus}
          secureTextEntry={secureTextEntry && !isPasswordVisible}
          placeholderTextColor={hasError ? '#fca5a5' : '#9ca3af'}
          accessibilityLabel={label}
          accessibilityHint={hasError ? `Campo ${label} con error: ${displayError}` : `Ingresa tu ${label.toLowerCase()}`}
          accessibilityState={{ disabled: textInputProps.editable === false }}
        />
        
        {secureTextEntry && (
          <TouchableOpacity
            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
            style={styles.secureIcon}
            accessibilityRole="button"
            accessibilityLabel={isPasswordVisible ? "Ocultar contraseña" : "Mostrar contraseña"}
            accessibilityHint={isPasswordVisible ? "Toca para ocultar la contraseña" : "Toca para mostrar la contraseña"}
          >
            <Ionicons
              name={isPasswordVisible ? 'eye-off' : 'eye'}
              size={20}
              color={hasError ? '#ef4444' : '#6b7280'}
            />
          </TouchableOpacity>
        )}
      </View>
      
      {hasError && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={16} color="#ef4444" />
          <Text style={[styles.errorText, errorStyle]}>
            {displayError}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f3f4f6',
    marginBottom: 8,
  },
  labelError: {
    color: '#ef4444',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#374151',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4b5563',
    paddingHorizontal: 12,
    minHeight: 48,
  },
  inputContainerFocused: {
    borderColor: '#3b82f6',
    backgroundColor: '#1f2937',
  },
  inputContainerError: {
    borderColor: '#ef4444',
    backgroundColor: '#1f1f1f',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#f3f4f6',
    paddingVertical: 12,
  },
  inputWithIcon: {
    marginLeft: 8,
  },
  inputWithSecureIcon: {
    marginRight: 8,
  },
  icon: {
    marginRight: 4,
  },
  secureIcon: {
    padding: 4,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
    marginLeft: 4,
    flex: 1,
  },
});

export default ValidatedInput;