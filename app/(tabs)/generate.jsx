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

// --- COMPOSANT HELPER (Hors du composant principal pour perfs) ---
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

  // STATE FOCUS PRIORITAIRE (Max 3)
  const [priorityFocus, setPriorityFocus] = useState([]);
  const [customPriorityInput, setCustomPriorityInput] = useState(''); // Input dédié ligne 4

  // STATE TEMPORAIRE POUR LES INPUTS TEXTE CLASSIQUES
  const [tempInputs, setTempInputs] = useState({
    injuries: '',
    inquiries: '',
    include: '',
    exclude: ''
  });

  // DATA LISTS
  const levels = ['Débutant', 'Intermédiaire', 'Avancé'];
  const genders = ['Homme', 'Femme'];
  const frequencies = ['1','2', '3', '4', '5', '6'];
  const durations = ['30-45 min', '45-60 min', '60-90 min', '90+ min'];
  const goals = ['Hypertrophie', 'Force','Powerbuilding','Streetlifting', 'Endurance']; 
  const splits = ['Full Body', 'Upper/Lower', 'PPL', 'Bro Split', 'Libre'];
  const equipmentModes = ['Salle de sport', 'Calisthenics', 'Sélectionner'];
  const detailedEquipmentsList = ['Haltères', 'Barre Olympique', 'Banc', 'Poulie', 'Kettlebell', 'Élastiques', 'Barre de traction', 'Gilet lesté'];
  const muscles = ['Upper body', 'Lower body', 'Pectoraux', 'Dos','Chaîne postérieure/Lombaires', 'Épaules', 'Quadriceps', 'Ischios', 'Fessiers', 'Biceps', 'Triceps','Trapèzes','Avant-bras','Mollets','Abs'];
  const caloricContexts = ['Surplus', 'Maintien', 'Déficit'];
  
  // LISTE DES EXERCICES PRIORITAIRES (GRILLE)
  const PRIORITY_LIFTS = ['Squat', 'Développé Couché', 'Soulevé de Terre', 'Tractions', 'Dips', 'Développé Militaire'];

  // HANDLERS
  const updateForm = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const toggleEquipment = (item) => {
    setFormData(prev => {
        const currentList = prev.detailedEquipment;
        if (currentList.includes(item)) {
            return { ...prev, detailedEquipment: currentList.filter(i => i !== item) };
        } else {
            return { ...prev, detailedEquipment: [...currentList, item] };
        }
    });
  };

  // Gestion des exercices prioritaires (Grille & Custom)
  const togglePriorityFocus = (exercise) => {
    if (priorityFocus.includes(exercise)) {
      setPriorityFocus(prev => prev.filter(e => e !== exercise));
    } else {
      if (priorityFocus.length >= 3) {
        Alert.alert("Stratégie Limitée", "Choisissez 3 exercices prioritaires maximum (Liste ou Perso).");
        return;
      }
      setPriorityFocus(prev => [...prev, exercise]);
    }
  };

  // Ajout depuis la 4ème ligne (Input)
  const addCustomPriority = () => {
    const val = customPriorityInput.trim();
    if (!val) return;

    // Intelligence : Si l'utilisateur tape un exo de la grille, on active le bouton
    const existingInGrid = PRIORITY_LIFTS.find(lift => lift.toLowerCase() === val.toLowerCase());
    if (existingInGrid) {
      if (!priorityFocus.includes(existingInGrid)) {
         togglePriorityFocus(existingInGrid); // Va gérer la limite de 3
      }
      setCustomPriorityInput('');
      return;
    }

    // Sinon ajout comme exo perso
    if (priorityFocus.includes(val)) {
      setCustomPriorityInput('');
      return;
    }
    
    if (priorityFocus.length >= 3) {
      Alert.alert("Stratégie Limitée", "Choisissez 3 exercices prioritaires maximum (Liste ou Perso).");
      return;
    }

    setPriorityFocus(prev => [...prev, val]);
    setCustomPriorityInput('');
  };

  // Suppression d'un tag prioritaire (Grille ou Custom)
  const removePriority = (item) => {
    setPriorityFocus(prev => prev.filter(e => e !== item));
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

      // FUSION : Exercices Prioritaires (Grille + Custom) + Exercices Manuels (Section 'Include')
      const combinedInclusions = [...priorityFocus, ...formData.exercisesToInclude];

      const cleanData = {
        gender: formData.gender[0],
        level: formData.level[0],
        age: formData.age,
        frequency: formData.frequency[0],
        timeAvailable: formData.timeAvailable[0],
        goal: formData.goal[0],
        priorityProgression: priorityFocus,
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
    router.replace('/(tabs)'); 
  };

  return (
    <KeyboardAvoidingView 
      style={styles.screen} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
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
          label="Équipement disponible" 
          options={equipmentModes} 
          selectedValues={formData.equipment}
          onSelect={(val) => {
             updateForm('equipment', val);
             if (val[0] !== 'Sélectionner') updateForm('detailedEquipment', []);
          }}
        />

        {formData.equipment[0] === 'Sélectionner' && (
          <View style={styles.subSelectorContainer}>
            <IronSelector 
              label="Sélectionnez votre matériel (Cumulable)" 
              options={detailedEquipmentsList} 
              selectedValues={formData.detailedEquipment}
              onSelect={(val) => {
                  // IronSelector renvoie directement le tableau mis à jour
                  if (Array.isArray(val)) {
                      updateForm('detailedEquipment', val);
                  } else {
                      toggleEquipment(val); // Fallback de sécurité
                  }
              }} 
              multiSelect={true}
              // --- CORRECTION : On autorise la sélection de toute la liste ---
              maxSelect={detailedEquipmentsList.length} 
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
          label="Durée d'une séance" 
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
              if (Array.isArray(val)) updateForm('focus', val); 
          }}
          multiSelect={true}
          maxSelect={3}
        />

        {/* --- SECTION 4 : PROGRESSION SPÉCIFIQUE --- */}
        <SectionTitle title="4. Progression Spécifique" />
        
        <Text style={styles.label}>Cibles de Progression (Max 3)</Text>
        <Text style={styles.subtitle}>Sélectionnez ou ajoutez les mouvements sur lesquels vous désirez progresser.</Text>
        <View style={{height: SPACING.m}} />
        <View style={styles.priorityContainer}>
            {/* LIGNES 1, 2, 3 : GRILLE PREDEFINIE */}
            <View style={styles.priorityGrid}>
            {PRIORITY_LIFTS.map((lift) => {
                const isSelected = priorityFocus.includes(lift);
                return (
                <TouchableOpacity
                    key={lift}
                    style={[styles.priorityButton, isSelected && styles.priorityButtonSelected]}
                    onPress={() => togglePriorityFocus(lift)}
                >
                    <Text style={[styles.priorityButtonText, isSelected && styles.priorityButtonTextSelected]}>
                    {lift}
                    </Text>
                </TouchableOpacity>
                );
            })}
            </View>

            {/* LIGNE 4 : INPUT D'AJOUT PERSONNALISE */}
            <View style={styles.customInputRow}>
                <View style={{flex: 1}}>
                    <IronInput 
                        placeholder="Autre (ex: Front Squat...)"
                        value={customPriorityInput}
                        onChangeText={setCustomPriorityInput}
                    />
                </View>
                <TouchableOpacity 
                    style={styles.addButton} 
                    onPress={addCustomPriority}
                >
                    <Ionicons name="add" size={24} color={COLORS.text} />
                </TouchableOpacity>
            </View>

            {/* AFFICHAGE DES TAGS PERSONNALISES SEULEMENT */}
            {/* On filtre pour n'afficher ici QUE ce qui n'est pas dans la grille (car la grille gère son propre affichage 'selected') */}
            <View style={styles.tagsWrapper}>
                {priorityFocus
                    .filter(item => !PRIORITY_LIFTS.includes(item)) // Affiche uniquement les items persos
                    .map((item, index) => (
                    <View key={index} style={styles.removableTag}>
                        <Text style={styles.removableTagText}>{item}</Text>
                        <TouchableOpacity onPress={() => removePriority(item)}>
                            <Ionicons name="close-circle" size={16} color={COLORS.textSecondary} style={{marginLeft: 4}}/>
                        </TouchableOpacity>
                    </View>
                ))}
            </View>
        </View>

        <View style={{height: SPACING.m}} />

        <TagInputSection 
          label="Autres exercices à inclure (Optionnel)"
          placeholder="ex: Face Pull, JM Press..."
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
          placeholder="ex: Squat Barre, Développé Militaire..."
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

// Helpers
function SectionTitle({ title }) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.line} />
      <Text style={styles.sectionTitle}>{title.toUpperCase()}</Text>
      <View style={styles.line} />
    </View>
  );
}

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
    fontSize: 40,
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
    fontSize: 18,
    marginHorizontal: SPACING.s,
    letterSpacing: 1,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.metalMedium,
  },
  label: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 8,
    textTransform: 'uppercase', 
    letterSpacing: 1,           
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
  subSelectorContainer: {
    marginLeft: SPACING.l,
    borderLeftWidth: 2,
    borderLeftColor: COLORS.metalMedium,
    paddingLeft: SPACING.m,
    marginBottom: SPACING.m
  },
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
  // --- NOUVEAUX STYLES : GRILLE PRIORITAIRE ---
  priorityContainer: {
    marginBottom: SPACING.m,
  },
  priorityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  customInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    width: '100%',
    marginTop: 4,
    marginBottom: 4,
  },
  priorityButton: {
    width: '48%', // 2 par ligne environ
    paddingVertical: 12,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: COLORS.metalMedium,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  priorityButtonSelected: {
    backgroundColor: 'rgba(200, 0, 0, 0.15)', // Rouge léger transparent
    borderColor: COLORS.bloodRed,
  },
  priorityButtonText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  priorityButtonTextSelected: {
    color: '#fff',
    fontWeight: '800',
  },
  // MODAL
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)', 
    justifyContent: 'center',
    padding: SPACING.l,
  },
  modalContent: {
    backgroundColor: COLORS.metalDark || '#1a1a1a', 
    borderRadius: 16,
    padding: SPACING.l,
    borderWidth: 1,
    borderColor: COLORS.bloodRed, 
    maxHeight: '80%',
  },
  programName: { 
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.m
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
  // MODAL HEADER
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.m,
  },
  modalTitle: {
    color: COLORS.bloodRed,
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
});