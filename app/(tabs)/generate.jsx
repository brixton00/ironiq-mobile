import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Text, Alert } from 'react-native';
import { COLORS, SPACING } from '../../constants/theme';

// UI Components
import IronButton from '../../components/ui/IronButton';
import IronInput from '../../components/ui/IronInput';
import IronSelector from '../../components/ui/IronSelector';

export default function GenerateProgramScreen() {
  const [loading, setLoading] = useState(false);
  
  // --- STATE ---
  const [formData, setFormData] = useState({
    level: ['Intermédiaire'],
    gender: ['Homme'],
    age: '',
    frequency: ['4'],
    duration: ['60-90 min'],
    goal: ['Hypertrophie'],
    split: ['Upper/Lower'],
    equipment: ['Salle Complète'],
    focus: [],
    injuries: ''
  });

  // --- DATA LISTS ---
  const levels = ['Débutant', 'Intermédiaire', 'Avancé'];
  const genders = ['Homme', 'Femme'];
  const frequencies = ['2', '3', '4', '5', '6'];
  const durations = ['30-45 min', '45-60 min', '60-90 min', '90+ min'];
  const goals = ['Hypertrophie', 'Force', 'Sèche', 'Endurance'];
  const splits = ['Full Body', 'Upper/Lower', 'PPL', 'Bro Split', 'Optimisé par IA'];
  const equipments = ['Salle de sport', 'Haltères + Banc', 'Poids du corps'];
  const muscles = ['Pectoraux', 'Dos', 'Épaules', 'Quadriceps', 'Ischios', 'Fessiers', 'Biceps', 'Triceps', 'Abs'];

  // --- HANDLERS ---
  const updateForm = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    // Validation basique
    if (!formData.age) {
      Alert.alert("Erreur", "L'âge est requis pour calculer la récupération.");
      return;
    }

    setLoading(true);
    console.log("Envoi à l'IA : ", formData);
    
    // TODO: Appel API vers ton backend ici
    // const response = await fetch(...);
    
    setTimeout(() => setLoading(false), 2000);
  };

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>INITIATE <Text style={{color: COLORS.bloodRed}}>PROTOCOL</Text></Text>
        <Text style={styles.subtitle}>Configurez votre matrice d'entraînement</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* 1. Physiologie */}
        <SectionTitle title="1. Physiologie" />
        <View style={styles.row}>
          <View style={{flex: 1}}>
            <IronSelector 
              label="Genre" 
              options={genders} 
              selectedValues={formData.gender}
              onSelect={(val) => updateForm('gender', val)}
            />
          </View>
          <View style={{width: SPACING.m}} />
          <View style={{flex: 1}}>
            <IronSelector 
              label="Niveau" 
              options={levels} 
              selectedValues={formData.level}
              onSelect={(val) => updateForm('level', val)}
            />
          </View>
        </View>

        <IronInput 
          label="Âge (Années)" 
          placeholder="ex: 28" 
          keyboardType="numeric"
          value={formData.age}
          onChangeText={(text) => updateForm('age', text)}
        />

        {/* 2. Logistique */}
        <SectionTitle title="2. Logistique" />
        <IronSelector 
          label="Séances par semaine" 
          options={frequencies} 
          selectedValues={formData.frequency}
          onSelect={(val) => updateForm('frequency', val)}
        />
        
        <IronSelector 
          label="Durée disponible" 
          options={durations} 
          selectedValues={formData.duration}
          onSelect={(val) => updateForm('duration', val)}
        />

        <IronSelector 
          label="Équipement" 
          options={equipments} 
          selectedValues={formData.equipment}
          onSelect={(val) => updateForm('equipment', val)}
        />

        {/* 3. Stratégie */}
        <SectionTitle title="3. Stratégie" />
        <IronSelector 
          label="Objectif Principal" 
          options={goals} 
          selectedValues={formData.goal}
          onSelect={(val) => updateForm('goal', val)}
        />

        <IronSelector 
          label="Répartition (Split)" 
          options={splits} 
          selectedValues={formData.split}
          onSelect={(val) => updateForm('split', val)}
        />

        <IronSelector 
          label="Focus (Points faibles - Max 3)" 
          options={muscles} 
          selectedValues={formData.focus}
          onSelect={(val) => updateForm('focus', val)}
          multiSelect={true}
          maxSelect={3}
        />

        <IronInput 
          label="Blessures / Contraintes" 
          placeholder="ex: Douleur épaule gauche au développé couché..." 
          value={formData.injuries}
          onChangeText={(text) => updateForm('injuries', text)}
        />

        <View style={{height: SPACING.l}} />

        <IronButton 
          title="GÉNÉRER LE PROGRAMME" 
          onPress={handleSubmit} 
          isLoading={loading}
        />
        
        <View style={{height: SPACING.xl}} />

      </ScrollView>
    </View>
  );
}

// Petit composant helper local pour les titres de section
function SectionTitle({ title }) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.line} />
      <Text style={styles.sectionTitle}>{title.toUpperCase()}</Text>
      <View style={styles.line} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: 60, // Espace status bar
  },
  header: {
    paddingHorizontal: SPACING.l,
    marginBottom: SPACING.l,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.text,
    letterSpacing: 1,
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 4,
  },
  scrollContent: {
    paddingHorizontal: SPACING.l,
    paddingBottom: SPACING.xl,
  },
  row: {
    flexDirection: 'row',
  },
  // Section Styles
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.m,
  },
  sectionTitle: {
    color: COLORS.bloodRed,
    fontWeight: '700',
    fontSize: 14,
    marginHorizontal: SPACING.s,
    letterSpacing: 1,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.metalMedium,
  }
});