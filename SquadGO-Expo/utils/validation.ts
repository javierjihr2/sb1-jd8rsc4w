export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: string) => boolean;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export class FormValidator {
  private rules: { [key: string]: ValidationRule[] } = {};

  addRule(field: string, rule: ValidationRule): FormValidator {
    if (!this.rules[field]) {
      this.rules[field] = [];
    }
    this.rules[field].push(rule);
    return this;
  }

  validate(data: { [key: string]: string }): ValidationResult {
    const errors: string[] = [];

    for (const field in this.rules) {
      const value = data[field] || '';
      const fieldRules = this.rules[field];

      for (const rule of fieldRules) {
        if (rule.required && !value.trim()) {
          errors.push(rule.message);
          continue;
        }

        if (value && rule.minLength && value.length < rule.minLength) {
          errors.push(rule.message);
          continue;
        }

        if (value && rule.maxLength && value.length > rule.maxLength) {
          errors.push(rule.message);
          continue;
        }

        if (value && rule.pattern && !rule.pattern.test(value)) {
          errors.push(rule.message);
          continue;
        }

        if (value && rule.custom && !rule.custom(value)) {
          errors.push(rule.message);
          continue;
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  validateField(field: string, value: string): ValidationResult {
    const errors: string[] = [];
    const fieldRules = this.rules[field] || [];

    for (const rule of fieldRules) {
      if (rule.required && !value.trim()) {
        errors.push(rule.message);
        continue;
      }

      if (value && rule.minLength && value.length < rule.minLength) {
        errors.push(rule.message);
        continue;
      }

      if (value && rule.maxLength && value.length > rule.maxLength) {
        errors.push(rule.message);
        continue;
      }

      if (value && rule.pattern && !rule.pattern.test(value)) {
        errors.push(rule.message);
        continue;
      }

      if (value && rule.custom && !rule.custom(value)) {
        errors.push(rule.message);
        continue;
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

// Validadores comunes
export const validators = {
  email: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: 'Ingresa un email válido'
  },
  
  password: {
    minLength: 8,
    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    message: 'La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial'
  },
  
  username: {
    minLength: 3,
    maxLength: 20,
    pattern: /^[a-zA-Z0-9_]+$/,
    message: 'El nombre de usuario debe tener entre 3-20 caracteres y solo contener letras, números y guiones bajos'
  },
  
  price: {
    pattern: /^\d+(\.\d{1,2})?$/,
    custom: (value: string) => {
      const num = parseFloat(value);
      return num > 0 && num <= 10000;
    },
    message: 'El precio debe ser un número válido entre $0.01 y $10,000'
  },
  
  required: {
    required: true,
    message: 'Este campo es obligatorio'
  },
  
  minLength: (length: number) => ({
    minLength: length,
    message: `Debe tener al menos ${length} caracteres`
  }),
  
  maxLength: (length: number) => ({
    maxLength: length,
    message: `No puede exceder ${length} caracteres`
  })
};

// Hook para usar validación en componentes
import { useState, useCallback } from 'react';

export function useFormValidation(validator?: FormValidator) {
  const [errors, setErrors] = useState<{ [key: string]: string[] }>({});
  const [isValid, setIsValid] = useState(true);

  const validateForm = useCallback((data: { [key: string]: string }, rules?: { [key: string]: string[] }) => {
    if (validator) {
      const result = validator.validate(data);
      setIsValid(result.isValid);
      
      const fieldErrors: { [key: string]: string[] } = {};
      result.errors.forEach(error => {
        if (!fieldErrors.general) fieldErrors.general = [];
        fieldErrors.general.push(error);
      });
      
      setErrors(fieldErrors);
      return result;
    }
    
    // Validación simplificada sin validator
    const validationErrors: string[] = [];
    
    if (rules) {
      for (const [field, fieldRules] of Object.entries(rules)) {
        const value = data[field] || '';
        
        for (const rule of fieldRules) {
          if (rule === 'required' && !value.trim()) {
            validationErrors.push(`${field} es requerido`);
          } else if (rule === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            validationErrors.push('Email inválido');
          } else if (rule.startsWith('minLength:')) {
            const minLength = parseInt(rule.split(':')[1]);
            if (value && value.length < minLength) {
              validationErrors.push(`${field} debe tener al menos ${minLength} caracteres`);
            }
          }
        }
      }
    }
    
    const result = {
      isValid: validationErrors.length === 0,
      errors: validationErrors
    };
    
    setIsValid(result.isValid);
    setErrors({ general: validationErrors });
    return result;
  }, [validator]);

  const validateField = useCallback((field: string, value: string) => {
    if (validator) {
      const result = validator.validateField(field, value);
      
      setErrors(prev => ({
        ...prev,
        [field]: result.errors
      }));
      
      return result;
    }
    
    return { isValid: true, errors: [] };
  }, [validator]);

  const clearErrors = useCallback(() => {
    setErrors({});
    setIsValid(true);
  }, []);

  const clearFieldError = useCallback((field: string) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, []);

  return {
    errors,
    isValid,
    validateForm,
    validateField,
    clearErrors,
    clearFieldError
  };
}