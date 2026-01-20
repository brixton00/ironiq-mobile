import * as SecureStore from 'expo-secure-store';
import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Text, Alert, Modal, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router'; 
import { COLORS, SPACING } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';

// UI Components
import IronButton from '../../components/ui/IronButton';
import IronInput from '../../components/ui/IronInput';
import IronSelector from '../../components/ui/IronSelector';

// --- CORRECTION 1 : Le composant helper est défini EN DEHORS du composant principal ---
// Cela empêche React de le détruire/recréer à chaque frappe de clavier.
const TagInputSection = ({ label, placeholder, listKey, inputKey, tempInputs, setTempInputs, addTag, removeTag, formData }) => (
  <View style={{ marginBottom: SPACING.m }}>
    <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
      <View style={{ flex: 1 }}>
        <IronInput 
          label={label}
          placeholder={placeholder}
          value={tempInputs[inputKey]}
          onChangeText={(text) => setTempInputs(prev => ({ ...prev, [inputKey]: text }))}
        />
      </View>
      <TouchableOpacity 
        style={styles.addButton} 
        onPress={() => addTag(listKey, inputKey)}
      >
        <Ionicons name="add" size={24} color={COLORS.text} />
      </TouchableOpacity>
    </View>

    {/* Liste des tags */}
    <View style={styles.tagsWrapper}>
      {formData[listKey].map((item, index) => (
        <View key={index} style={styles.removableTag}>
          <Text style={styles.removableTagText}>{item}</Text>
          <TouchableOpacity onPress={() => removeTag(listKey, index)}>
            <Ionicons name="close-circle" size={16} color={COLORS.textSecondary} style={{marginLeft: 4}}/>
          </TouchableOpacity>
        </View>
      ))}
    </View>
    <Text style={styles.counterText}>{formData[listKey].length}/5</Text>
  </View>
);

export default function GenerateProgramScreen() {
  const router = useRouter(); 
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [generatedProgram, setGeneratedProgram] = useState(null);
  
  // STATE PRINCIPAL
  const [formData, setFormData] = useState({
    level: ['Intermédiaire'],
    gender: ['Homme'],
    age: '',
    frequency: ['4'],
    timeAvailable: ['60-90 min'],
    goal: ['Hypertrophie'],
    split: ['Upper/Lower'],
    equipment: ['Salle de sport'],
    detailedEquipment: [],
    focus: [],
    injuries: [],
    inquiries: [],
    exercisesToInclude: [],
    exercisesToExclude: [],
    caloricContext: ['Maintien']
  });

  // STATE TEMPORAIRE POUR LES INPUTS TEXTE
  const [tempInputs, setTempInputs] = useState({
    injuries: '',
    inquiries: '',
    include: '',
    exclude: ''
  });

  // DATA LISTS
  const levels = ['Débutant', 'Intermédiaire', 'Avancé'];
  const genders = ['Homme', 'Femme'];
  const frequencies = ['2', '3', '4', '5', '6'];
  const durations = ['30-45 min', '45-60 min', '60-90 min', '90+ min'];
  const goals = ['Hypertrophie', 'Force', 'Endurance']; 
  const splits = ['Full Body', 'Upper/Lower', 'PPL', 'Bro Split', 'Libre'];
  const equipmentModes = ['Salle de sport', 'Calisthenics', 'Sélectionner'];
  const detailedEquipmentsList = ['Haltères', 'Barre Olympique', 'Banc', 'Poulie', 'Kettlebell', 'Élastiques', 'Barre de traction', 'Gilet lesté'];
  const muscles = ['Pectoraux', 'Dos', 'Épaules', 'Quadriceps', 'Ischios', 'Fessiers', 'Biceps', 'Triceps', 'Abs'];
  const caloricContexts = ['Surplus', 'Maintien', 'Déficit'];

  // HANDLERS
  const updateForm = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  // --- CORRECTION 3 : Logique de toggle pour la sélection multiple ---
  // Permet d'ajouter ou retirer un équipement sans écraser toute la liste
  const toggleEquipment = (item) => {
    setFormData(prev => {
        const currentList = prev.detailedEquipment;
        if (currentList.includes(item)) {
            // Si présent, on le retire
            return { ...prev, detailedEquipment: currentList.filter(i => i !== item) };
        } else {
            // Sinon, on l'ajoute
            return { ...prev, detailedEquipment: [...currentList, item] };
        }
    });
  };

  const addTag = (categoryKey, inputKey) => {
    const value = tempInputs[inputKey].trim();
    if (!value) return;
    
    if (formData[categoryKey].length >= 5) {
      Alert.alert("Limite atteinte", "Vous ne pouvez ajouter que 5 éléments maximum par catégorie.");
      return;
    }

    setFormData(prev => ({
      ...prev,
      [categoryKey]: [...prev[categoryKey], value]
    }));

    setTempInputs(prev => ({ ...prev, [inputKey]: '' }));
  };

  const removeTag = (categoryKey, index) => {
    setFormData(prev => ({
      ...prev,
      [categoryKey]: prev[categoryKey].filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async () => {
    if (!formData.age) {
      Alert.alert("Information manquante", "L'âge est requis pour calibrer l'intensité.");
      return;
    }

    if (formData.equipment[0] === 'Sélectionner' && formData.detailedEquipment.length === 0) {
      Alert.alert("Équipement requis", "Veuillez sélectionner au moins un équipement disponible.");
      return;
    }

    setLoading(true);

    try {
      const token = await SecureStore.getItemAsync('userToken');

      if (!token) {
        Alert.alert("Erreur", "Vous devez être connecté pour générer un programme.");
        router.replace('/(auth)/login');
        return;
      }

      let finalEquipment = formData.equipment[0];
      if (finalEquipment === 'Sélectionner') {
        finalEquipment = `Matériel spécifique: ${formData.detailedEquipment.join(', ')}`;
      }

      const cleanData = {
        gender: formData.gender[0],
        level: formData.level[0],
        age: formData.age,
        frequency: formData.frequency[0],
        timeAvailable: formData.timeAvailable[0],
        goal: formData.goal[0],
        split: formData.split[0],
        equipment: finalEquipment,
        kcal: formData.caloricContext[0],
        anatomicalFocus: formData.focus,
        injuries: formData.injuries,
        inquiries: formData.inquiries,
        exercisesToInclude: formData.exercisesToInclude,
        exercisesToExclude: formData.exercisesToExclude,
      };

      console.log("🚀 Envoi du payload à l'IA :", cleanData);

      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/gpt/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ userData: cleanData }),
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

  const handleFinish = () => {
    setModalVisible(false);
    // On utilise replace pour qu'un "retour arrière" ne revienne pas sur le formulaire
    router.replace('/(tabs)'); 
  };

  return (
    // --- CORRECTION 2 : KeyboardAvoidingView ---
    <KeyboardAvoidingView 
      style={styles.screen} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20} // Ajuste selon ton header
    >
      <View style={styles.header}>
        <Text style={styles.title}>INITIATE <Text style={{color: COLORS.bloodRed}}>PROTOCOL</Text></Text>
        <Text style={styles.subtitle}>Configurez votre matrice d'entraînement</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <SectionTitle title="1. Physiologie" />
        
        <IronSelector 
          label="Genre" 
          options={genders} 
          selectedValues={formData.gender}
          onSelect={(val) => updateForm('gender', val)}
        />

        <View style={{height: SPACING.s}} />
        
        <IronInput 
          label="Âge (Années)" 
          placeholder="ex: 28" 
          keyboardType="numeric"
          value={formData.age}
          onChangeText={(text) => updateForm('age', text)}
        />

        <Text style={styles.label}>Niveau d'expérience</Text>
        <View style={styles.verticalSelectorContainer}>
            {levels.map((lvl) => {
              const isSelected = formData.level.includes(lvl);
              return (
                <TouchableOpacity
                  key={lvl}
                  style={[styles.verticalOption, isSelected && styles.verticalOptionSelected]}
                  onPress={() => updateForm('level', [lvl])}
                >
                  <Text style={[styles.verticalOptionText, isSelected && styles.verticalOptionTextSelected]}>
                    {lvl}
                  </Text>
                </TouchableOpacity>
              )
            })}
        </View>

        <IronSelector 
          label="Contexte Calorique" 
          options={caloricContexts} 
          selectedValues={formData.caloricContext}
          onSelect={(val) => updateForm('caloricContext', val)}
        />

        <SectionTitle title="2. Logistique" />
        
        <IronSelector 
          label="Mode d'équipement" 
          options={equipmentModes} 
          selectedValues={formData.equipment}
          onSelect={(val) => {
             updateForm('equipment', val);
             if (val[0] !== 'Sélectionner') updateForm('detailedEquipment', []);
          }}
        />

        {formData.equipment[0] === 'Sélectionner' && (
          <View style={styles.subSelectorContainer}>
            {/* --- CORRECTION 3 APP : Utilisation du toggleEquipment --- */}
            {/* Note: Je présume ici que ton IronSelector renvoie l'item cliqué (val) si multiSelect est true */}
            {/* Si IronSelector renvoie déjà un tableau complet, utilise l'ancienne méthode. */}
            <IronSelector 
              label="Sélectionnez votre matériel (Cumulable)" 
              options={detailedEquipmentsList} 
              selectedValues={formData.detailedEquipment}
              onSelect={(val) => {
                  // Détection intelligente : si val est un tableau, le composant gère déjà le multi
                  if (Array.isArray(val)) {
                      updateForm('detailedEquipment', val);
                  } else {
                      // Sinon, on gère le toggle manuellement
                      toggleEquipment(val);
                  }
              }} 
              multiSelect={true}
            />
          </View>
        )}

        <IronSelector 
          label="Séances par semaine" 
          options={frequencies} 
          selectedValues={formData.frequency}
          onSelect={(val) => updateForm('frequency', val)}
        />
        
        <IronSelector 
          label="Durée disponible" 
          options={durations} 
          selectedValues={formData.timeAvailable}
          onSelect={(val) => updateForm('timeAvailable', val)}
        />

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
          onSelect={(val) => {
              // Même logique de sécurité pour le focus si nécessaire, 
              // sinon updateForm marche si IronSelector renvoie le tableau complet
              if (Array.isArray(val)) updateForm('focus', val); 
          }}
          multiSelect={true}
          maxSelect={3}
        />

        {/* REQ 4: Exercices Inclure / Exclure */}
        {/* On passe maintenant les props explicitement car le composant est externe */}
        <TagInputSection 
          label="Exercices à INCLURE (Optionnel)"
          placeholder="ex: Développé Couché"
          listKey="exercisesToInclude"
          inputKey="include"
          tempInputs={tempInputs}
          setTempInputs={setTempInputs}
          addTag={addTag}
          removeTag={removeTag}
          formData={formData}
        />

        <TagInputSection 
          label="Exercices à EXCLURE (Optionnel)"
          placeholder="ex: Squat Barre"
          listKey="exercisesToExclude"
          inputKey="exclude"
          tempInputs={tempInputs}
          setTempInputs={setTempInputs}
          addTag={addTag}
          removeTag={removeTag}
          formData={formData}
        />

        <TagInputSection 
          label="Blessures / Contraintes"
          placeholder="ex: Douleur épaule gauche"
          listKey="injuries"
          inputKey="injuries"
          tempInputs={tempInputs}
          setTempInputs={setTempInputs}
          addTag={addTag}
          removeTag={removeTag}
          formData={formData}
        />

        <TagInputSection 
          label="Requêtes Particulières"
          placeholder="ex: Focus fessiers important"
          listKey="inquiries"
          inputKey="inquiries"
          tempInputs={tempInputs}
          setTempInputs={setTempInputs}
          addTag={addTag}
          removeTag={removeTag}
          formData={formData}
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
                <Ionicons name="close" size={24} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            {generatedProgram && (
              <ScrollView style={{maxHeight: 500}} showsVerticalScrollIndicator={false}>
                
                {/* 1. NOM DU PROGRAMME */}
                <Text style={styles.programName}>{generatedProgram.programName}</Text>
                
                <View style={styles.divider} />

                {/* 2. OVERVIEW (Raisonnement IA) */}
                <Text style={styles.sectionLabel}>RÉSUMÉ DU MÉSOCYCLE</Text>
                <Text style={styles.reasoningText}>
                  {generatedProgram.mesocycle.overview || "Programme optimisé pour vos objectifs."}
                </Text>

                <View style={styles.divider} />

                {/* 3. DÉTAILS CLÉS (Grille) */}
                <Text style={styles.sectionLabel}>PARAMÈTRES</Text>
                
                <View style={styles.detailsGrid}>
                  <DetailItem label="Objectif" value={generatedProgram.goal} />
                  <DetailItem label="Niveau" value={generatedProgram.level} />
                  <DetailItem label="Fréquence" value={`${generatedProgram.frequency} j / sem`} />
                  <DetailItem label="Durée" value={`${generatedProgram.totalDurationWeeks} semaines`} />
                  <DetailItem label="Split" value={generatedProgram.split || "Libre"} fullWidth />
                </View>

              </ScrollView>
            )}

            <View style={{marginTop: SPACING.l}}>
              <IronButton 
                title="DÉCOUVRIR MON PROGRAMME" 
                onPress={handleFinish} 
              />
            </View>

          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
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

// Petit composant pour afficher une ligne de détail
const DetailItem = ({ label, value, fullWidth }) => (
  <View style={[styles.detailItem, fullWidth ? { width: '100%' } : { width: '48%' }]}>
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={styles.detailValue}>{value}</Text>
  </View>
);

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
  // STYLES POUR SELECTEUR VERTICAL
  label: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginBottom: 8,
    fontWeight: '600',
    marginTop: 8
  },
  verticalSelectorContainer: {
    gap: 8,
    marginBottom: SPACING.m
  },
  verticalOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.metalMedium,
    backgroundColor: 'rgba(255,255,255,0.02)',
    alignItems: 'center'
  },
  verticalOptionSelected: {
    borderColor: COLORS.bloodRed,
    backgroundColor: 'rgba(255, 0, 0, 0.1)',
  },
  verticalOptionText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '600'
  },
  verticalOptionTextSelected: {
    color: '#fff',
    fontWeight: '700'
  },
  // STYLES POUR SOUS-SELECTEUR
  subSelectorContainer: {
    marginLeft: SPACING.l,
    borderLeftWidth: 2,
    borderLeftColor: COLORS.metalMedium,
    paddingLeft: SPACING.m,
    marginBottom: SPACING.m
  },
  // STYLES POUR TAGS
  addButton: {
    backgroundColor: COLORS.metalMedium,
    height: 50, 
    width: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginLeft: 8,
    marginBottom: 14 
  },
  tagsWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: -8, 
    marginBottom: 4
  },
  removableTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.metalMedium,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 16,
  },
  removableTagText: {
    color: '#fff',
    fontSize: 12,
  },
  counterText: {
    color: COLORS.textSecondary,
    fontSize: 10,
    textAlign: 'right',
    marginTop: 2
  },
  // MODAL STYLES
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)', // Un peu plus sombre pour le focus
    justifyContent: 'center',
    padding: SPACING.l,
  },
  modalContent: {
    backgroundColor: COLORS.metalDark || '#1a1a1a', 
    borderRadius: 16,
    padding: SPACING.l,
    borderWidth: 1,
    borderColor: COLORS.bloodRed, // Bordure rouge pour marquer le succès
    maxHeight: '80%',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginVertical: SPACING.m,
  },
  reasoningText: {
    color: '#ccc',
    fontSize: 14,
    lineHeight: 20,
    fontStyle: 'italic',
    marginBottom: SPACING.s,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
  },
  detailItem: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  detailLabel: {
    color: COLORS.textSecondary,
    fontSize: 10,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  detailValue: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '700',
  },
});