import React, { useState } from 'react';
import { TextInput, View, Text, StyleSheet } from 'react-native';
import { COLORS, RADIUS, SPACING } from '../../constants/theme';

export default function IronInput({ 
  label, 
  placeholder, 
  secureTextEntry = false, 
  value, 
  onChangeText,
  keyboardType = 'default',
  autoCapitalize = 'none'
}) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={[
          styles.input,
          isFocused && styles.inputFocused 
        ]}
        placeholder={placeholder}
        placeholderTextColor={COLORS.metalLight}
        secureTextEntry={secureTextEntry}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        cursorColor={COLORS.bloodRed} 
        selectionColor={COLORS.bloodRed}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.m,
  },
  label: {
    color: COLORS.textSecondary,
    marginBottom: SPACING.s,
    fontSize: 12,
    textTransform: 'uppercase',
    fontWeight: '600',
    letterSpacing: 1,
  },
  input: {
    backgroundColor: COLORS.metalDark,
    borderRadius: RADIUS.m,
    padding: SPACING.m,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.metalMedium,
    fontSize: 16,
  },
  inputFocused: {
    borderColor: COLORS.bloodRed, 
    backgroundColor: '#1a0505', 
  }
});