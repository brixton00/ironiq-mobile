import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Text, Alert, Modal, TouchableOpacity } from 'react-native';import { COLORS, SPACING } from '../../constants/theme';

// UI Components
import IronButton from '../../components/ui/IronButton';
import IronInput from '../../components/ui/IronInput';
import IronSelector from '../../components/ui/IronSelector';

export default function GenerateProgramScreen() {
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [generatedProgram, setGeneratedProgram] = useState(null);
  
  // STATE
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

  // DATA LISTS
  const levels = ['Débutant', 'Intermédiaire', 'Avancé'];
  const genders = ['Homme', 'Femme'];
  const frequencies = ['2', '3', '4', '5', '6'];
  const durations = ['30-45 min', '45-60 min', '60-90 min', '90+ min'];
  const goals = ['Hypertrophie', 'Force', 'Sèche', 'Endurance'];
  const splits = ['Full Body', 'Upper/Lower', 'PPL', 'Bro Split', 'Optimisé par IA'];
  const equipments = ['Salle de sport', 'Haltères + Banc', 'Poids du corps'];
  const muscles = ['Pectoraux', 'Dos', 'Épaules', 'Quadriceps', 'Ischios', 'Fessiers', 'Biceps', 'Triceps', 'Abs'];

  // HANDLERS
  const updateForm = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    // 1. Validation de base
    if (!formData.age) {
      Alert.alert("Information manquante", "L'âge est requis pour calibrer l'intensité.");
      return;
    }

    setLoading(true);

    try {
      // Nettoyage des données (Flattening): on transforme les tableaux ['Valeur'] en string 'Valeur' pour simplifier les traitements IA
      const cleanData = {
        ...formData,
        gender: formData.gender[0],
        level: formData.level[0],
        frequency: formData.frequency[0],
        duration: formData.duration[0],
        goal: formData.goal[0],
        split: formData.split[0],
        equipment: formData.equipment[0],
        // 'focus' reste un tableau car c'est du multiselect
        // 'age' et 'injuries' restent tels quels
      };

      console.log("🚀 Envoi du payload à l'IA :", cleanData);

      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/gpt/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userData: cleanData,
          userId: null // 👈 Ici on met une valeur en dur pour tester la sauvegarde BDD
          // Plus tard : await SecureStore.getItemAsync('userId')
        }),
      });

      const data = await response.json();
 
      if (data.result) {
        console.log("✅ Programme reçu :", data.program.programName);
        setGeneratedProgram(data.program); 
        setModalVisible(true);
      } else {
        throw new Error(data.error || "Erreur inconnue du serveur");
      }

    } catch (error) {
      console.error("❌ Erreur Mobile :", error);
      Alert.alert("Échec Connexion", "Impossible de contacter le QG IronIQ. Vérifiez votre serveur.");
    } finally {
      setLoading(false);
    }
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
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>PROGRAMME GÉNÉRÉ</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={{color: COLORS.textSecondary, fontSize: 20}}>✕</Text>
              </TouchableOpacity>
            </View>

            {generatedProgram && (
              <ScrollView style={{maxHeight: 400}} showsVerticalScrollIndicator={false}>
                
                <Text style={styles.programName}>{generatedProgram.programName}</Text>
                
                <View style={styles.tagContainer}>
                  <View style={styles.tag}><Text style={styles.tagText}>{generatedProgram.goal}</Text></View>
                  <View style={styles.tag}><Text style={styles.tagText}>{generatedProgram.frequency}j / sem</Text></View>
                </View>

                <Text style={styles.sectionLabel}>PLANNING</Text>
                {generatedProgram.schedule.map((day, index) => (
                  <View key={index} style={styles.dayRow}>
                    <Text style={styles.dayName}>{day.dayName}</Text>
                    <Text style={styles.dayFocus}>{day.focus}</Text>
                  </View>
                ))}
                
                <Text style={styles.infoText}>
                  Le programme complet a été sauvegardé dans votre profil.
                </Text>

              </ScrollView>
            )}

            <View style={{marginTop: SPACING.m}}>
              <IronButton 
                title="TERMINER" 
                onPress={() => {
                  setModalVisible(false);
                  // Optionnel : Rediriger
                  // router.push('/(tabs)'); 
                }} 
              />
            </View>

          </View>
        </View>
      </Modal>
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
    paddingTop: 60, 
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
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    padding: SPACING.l,
  },
  modalContent: {
    backgroundColor: COLORS.metalDark || '#1a1a1a', 
    borderRadius: 16,
    padding: SPACING.l,
    borderWidth: 1,
    borderColor: COLORS.metalMedium || '#333',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.m,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
    paddingBottom: SPACING.s,
  },
  modalTitle: {
    color: COLORS.bloodRed || '#ff0000',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1,
  },
  programName: {
    color: COLORS.text || '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: SPACING.s,
    textAlign: 'center',
  },
  tagContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.s,
    marginBottom: SPACING.l,
  },
  tag: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  tagText: {
    color: '#ccc',
    fontSize: 12,
    fontWeight: '600',
  },
  sectionLabel: {
    color: '#888',
    fontSize: 12,
    marginBottom: SPACING.s,
    marginTop: SPACING.s,
  },
  dayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  dayName: {
    color: '#fff',
    fontWeight: '700',
  },
  dayFocus: {
    color: COLORS.bloodRed || '#ff0000',
    fontStyle: 'italic',
  },
  infoText: {
    color: '#666',
    fontSize: 12,
    textAlign: 'center',
    marginTop: SPACING.l,
    fontStyle: 'italic',
  }
});