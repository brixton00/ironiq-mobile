import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { COLORS, RADIUS, SPACING } from '../../constants/theme';

export default function IronButton({ title, onPress, isLoading = false, variant = 'primary' }) {
  const isPrimary = variant === 'primary';
  
  return (
    <TouchableOpacity 
      style={[
        styles.button, 
        isPrimary ? styles.primary : styles.metal
      ]} 
      onPress={onPress}
      disabled={isLoading}
      activeOpacity={0.8}
    >
      {isLoading ? (
        <ActivityIndicator color={COLORS.text} />
      ) : (
        <Text style={[styles.text, !isPrimary && styles.textMetal]}>
          {title.toUpperCase()}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: SPACING.m,
    borderRadius: RADIUS.m,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
    elevation: 5, // Ombre Android
    shadowColor: "#000", // Ombre iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 3.84,
  },
  primary: {
    backgroundColor: COLORS.bloodRed,
    borderColor: '#5c0000', 
  },
  metal: {
    backgroundColor: 'transparent',
    borderColor: COLORS.metalLight,
    borderWidth: 2,
  },
  text: {
    color: COLORS.text,
    fontWeight: '700',
    letterSpacing: 1.5,
    fontSize: 16,
  },
  textMetal: {
    color: COLORS.textSecondary,
  }
});