import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TextInputProps,
  ViewStyle,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  secureTextEntry?: boolean;
  containerStyle?: ViewStyle;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

/**
 * Input Component
 *
 * A text input component with label, error states, and helper text.
 * Follows the MediMindPlus design system specifications.
 *
 * @example
 * ```tsx
 * <Input
 *   label="Blood Pressure"
 *   placeholder="120/80"
 *   value={value}
 *   onChangeText={setValue}
 *   error={errorMessage}
 *   helperText="Enter systolic/diastolic"
 *   required={true}
 * />
 * ```
 */
const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  required = false,
  secureTextEntry = false,
  containerStyle,
  leftIcon,
  rightIcon,
  ...textInputProps
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const hasError = !!error;
  const showPasswordToggle = secureTextEntry;

  return (
    <View style={[styles.container, containerStyle]}>
      {/* Label */}
      {label && (
        <Text style={styles.label}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
      )}

      {/* Input Field */}
      <View
        style={[
          styles.inputContainer,
          isFocused && styles.inputContainerFocused,
          hasError && styles.inputContainerError,
        ]}
      >
        {/* Left Icon */}
        {leftIcon && <View style={styles.leftIconContainer}>{leftIcon}</View>}

        {/* Text Input */}
        <TextInput
          {...textInputProps}
          style={[styles.input, leftIcon && styles.inputWithLeftIcon]}
          secureTextEntry={secureTextEntry && !isPasswordVisible}
          onFocus={(e) => {
            setIsFocused(true);
            textInputProps.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            textInputProps.onBlur?.(e);
          }}
          placeholderTextColor="#a0aec0"
          accessible={true}
          accessibilityLabel={label}
          accessibilityHint={helperText || error}
          accessibilityRequired={required}
        />

        {/* Password Toggle or Right Icon */}
        {showPasswordToggle ? (
          <TouchableOpacity
            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
            style={styles.rightIconContainer}
            accessibilityLabel={
              isPasswordVisible ? 'Hide password' : 'Show password'
            }
            accessibilityRole="button"
          >
            <Ionicons
              name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color="#718096"
            />
          </TouchableOpacity>
        ) : (
          rightIcon && <View style={styles.rightIconContainer}>{rightIcon}</View>
        )}
      </View>

      {/* Helper Text or Error */}
      {(helperText || error) && (
        <View accessibilityLiveRegion={hasError ? "polite" : "none"}>
          <Text style={[styles.helperText, hasError && styles.errorText]}>
            {error || helperText}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },

  label: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
    color: '#4a5568',
    marginBottom: 6,
  },

  required: {
    color: '#f56565',
  },

  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    height: 48,
    paddingHorizontal: 12,
  },

  inputContainerFocused: {
    borderColor: '#667eea',
    borderWidth: 2,
  },

  inputContainerError: {
    borderColor: '#f56565',
  },

  input: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
    color: '#1a202c',
    paddingVertical: 0, // Remove default padding
  },

  inputWithLeftIcon: {
    marginLeft: 8,
  },

  leftIconContainer: {
    marginRight: 8,
  },

  rightIconContainer: {
    marginLeft: 8,
  },

  helperText: {
    fontSize: 12,
    lineHeight: 16,
    color: '#718096',
    marginTop: 4,
  },

  errorText: {
    color: '#f56565',
  },
});

export default Input;
