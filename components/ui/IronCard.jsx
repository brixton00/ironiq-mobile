import React from 'react';
import { View, StyleSheet } from 'react-native';
import { COLORS, RADIUS, SPACING } from '../../constants/theme';

export default function IronCard({ children, style }) {
  return (
    <View style={[styles.card, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.metalDark,
    borderRadius: RADIUS.m,
    padding: SPACING.m,
    borderWidth: 1,
    borderColor: COLORS.metalMedium,
  }
});