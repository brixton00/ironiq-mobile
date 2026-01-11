import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { COLORS, RADIUS, SPACING } from '../../constants/theme';

export default function IronSelector({ 
  label, 
  options = [], // ex: ['Débutant', 'Intermédiaire', 'Avancé']
  selectedValues = [], // ex: ['Intermédiaire']
  onSelect, // Fonction de retour
  multiSelect = false,
  maxSelect = 1
}) {

  const handlePress = (option) => {
    if (multiSelect) {
      if (selectedValues.includes(option)) {
        // Désélectionner
        onSelect(selectedValues.filter(item => item !== option));
      } else {
        // Sélectionner (si max pas atteint)
        if (selectedValues.length < maxSelect) {
          onSelect([...selectedValues, option]);
        }
      }
    } else {
      // Sélection unique
      onSelect([option]);
    }
  };

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.optionsContainer}>
        {options.map((option) => {
          const isSelected = selectedValues.includes(option);
          return (
            <TouchableOpacity
              key={option}
              style={[styles.option, isSelected && styles.optionSelected]}
              onPress={() => handlePress(option)}
              activeOpacity={0.7}
            >
              <Text style={[styles.text, isSelected && styles.textSelected]}>
                {option}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
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
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.s, // Espacement entre les boutons
  },
  option: {
    backgroundColor: COLORS.metalDark,
    borderWidth: 1,
    borderColor: COLORS.metalMedium,
    borderRadius: RADIUS.s,
    paddingVertical: SPACING.s,
    paddingHorizontal: SPACING.m,
    marginBottom: SPACING.s,
  },
  optionSelected: {
    backgroundColor: COLORS.bloodRed, // Le fameux rouge sang
    borderColor: COLORS.bloodRedLight,
  },
  text: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  textSelected: {
    color: COLORS.text, // Blanc
    fontWeight: '700',
  }
});