import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  Alert, 
  ActivityIndicator, 
  Modal, 
  FlatList,
  KeyboardAvoidingView, 
  Platform 
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { FontAwesome } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS } from '../constants/theme';
import IronButton from '../components/ui/IronButton';

export default function ProgramDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [program, setProgram] = useState(null);
  const [activeWeek, setActiveWeek] = useState(null); 
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  
  // États de la séance en cours
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [sessionInputs, setSessionInputs] = useState({});
  const [isWeekFinished, setIsWeekFinished] = useState(false);
  const [validatedDays, setValidatedDays] = useState([]);

  // États pour le sélecteur RPE (Menu déroulant custom)
  const [rpeModalVisible, setRpeModalVisible] = useState(false);
  const [currentRpeSelection, setCurrentRpeSelection] = useState({ exerciseName: '', setIndex: -1 });

  // Liste des valeurs RPE (6 à 10 par 0.5)
  const rpeValues = Array.from({ length: 9 }, (_, i) => (6 + i * 0.5).toString());

  // CHARGEMENT DU PROGRAMME
  useEffect(() => {
    const fetchProgramDetails = async () => {
      try {
        const token = await SecureStore.getItemAsync('userToken');
        const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/programs/my-programs`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        
        if (data.result) {
          const found = data.programs.find(p => p._id === id);
          setProgram(found);
          
          if (found && found.mesocycle && found.mesocycle.weeks) {
            let currentWeek = found.mesocycle.weeks.find(w => !w.isWeekComplete && w.isGenerated);
            if (!currentWeek) {
              const generatedWeeks = found.mesocycle.weeks.filter(w => w.isGenerated);
              currentWeek = generatedWeeks[generatedWeeks.length - 1];
            }
            setActiveWeek(currentWeek);
            if (currentWeek && Array.isArray(currentWeek.completedSessions)) {
               setValidatedDays(currentWeek.completedSessions);
            }
            if (currentWeek && currentWeek.isWeekComplete) {
              setIsWeekFinished(true);
            }
          }
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchProgramDetails();
  }, [id]);

  // GESTION DES INPUTS & INVALIDATION
  const handleInputChange = (exerciseName, setIndex, field, value) => {
    setSessionInputs(prev => {
      const key = `${exerciseName}-${setIndex}`;
      const currentData = prev[key] || {};
      
      // 1. On met à jour la valeur modifiée
      const newData = { ...currentData, [field]: value };

      // 2. AUTO-VALIDATION : Vérification des 3 champs
      // On convertit en string pour éviter les bugs si value est un nombre pur
      const hasWeight = newData.weight && newData.weight.toString().trim().length > 0;
      const hasReps = newData.reps && newData.reps.toString().trim().length > 0;
      const hasRpe = newData.rpe && newData.rpe.toString().trim().length > 0;

      // Si les 3 sont remplis, on valide. Sinon, on invalide.
      if (hasWeight && hasReps && hasRpe) {
        newData.validated = true;
      } else {
        newData.validated = false;
      }

      return { ...prev, [key]: newData };
    });
  };

  const openRpeSelector = (exerciseName, setIndex) => {
    if (!isSessionActive) return;
    setCurrentRpeSelection({ exerciseName, setIndex });
    setRpeModalVisible(true);
  };

  const selectRpe = (value) => {
    handleInputChange(currentRpeSelection.exerciseName, currentRpeSelection.setIndex, 'rpe', value);
    setRpeModalVisible(false);
  };

  const toggleSetValidation = (exerciseName, setIndex) => {
    const key = `${exerciseName}-${setIndex}`;
    const current = sessionInputs[key] || {};

    // RÈGLE 1 : Vérification stricte incluant le RPE
    if (!current.weight || !current.reps || !current.rpe) {
      Alert.alert(
        "Données incomplètes", 
        "Veuillez renseigner la Charge, les Répétitions ET le RPE avant de valider."
      );
      return;
    }

    // Si tout est bon, on toggle (validation ou invalidation manuelle)
    // Note : handleInputChange gère déjà l'invalidation sur modif, ici c'est le "click" final
    setSessionInputs(prev => ({
      ...prev,
      [key]: { ...current, validated: !current.validated }
    }));
  };

  const isExerciseComplete = (exercise) => {
    for (let i = 0; i < exercise.sets; i++) {
      const setKey = `${exercise.name}-${i}`;
      if (!sessionInputs[setKey]?.validated) return false;
    }
    return true;
  };

  const handleFinishSession = async () => {
    // Vérification basique qu'au moins une série est validée ? (Optionnel)
    Alert.alert(
      "Terminer la séance",
      "Confirmer l'enregistrement de vos performances ?",
      [
        { text: "Annuler", style: "cancel" },
        { text: "Valider", onPress: async () => { await saveSessionToBackend(); } }
      ]
    );
  };

  const saveSessionToBackend = async () => {
    try {
      setLoading(true);
      const token = await SecureStore.getItemAsync('userToken');
      const currentDay = activeWeek.sessions[selectedDayIndex];

      const formattedExercises = currentDay.exercises.map(ex => {
        const setsData = [];
        for (let i = 0; i < ex.sets; i++) {
          const input = sessionInputs[`${ex.name}-${i}`] || {};
          if (input.validated) {
            setsData.push({
              setIndex: i + 1,
              weight: parseFloat(input.weight) || 0,
              reps: parseFloat(input.reps) || 0,
              intensityReached: parseFloat(input.rpe) || 0, // Mapping RPE vers Backend
              validated: true
            });
          }
        }
        return { exerciseName: ex.name, sets: setsData };
      });

      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/programs/log-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          programId: program._id,
          dayName: currentDay.sessionName,
          dayIndex: selectedDayIndex,
          weekNumber: activeWeek.weekNumber, 
          exercises: formattedExercises
        })
      });

      const data = await response.json();

      if (data.result) {
        Alert.alert("Succès", "Séance enregistrée !");
        setIsSessionActive(false);
        setValidatedDays(prev => {
            if(!prev.includes(selectedDayIndex)) return [...prev, selectedDayIndex];
            return prev;
        });

        if (data.isWeekComplete) {
          setIsWeekFinished(true);
          const allDaysIndices = activeWeek.sessions.map((_, i) => i);
          setValidatedDays(allDaysIndices);
        }
      } else {
        Alert.alert("Erreur Backend", data.error || "Erreur inconnue");
      }

    } catch (e) {
      console.error(e);
      Alert.alert("Erreur", "Impossible de sauvegarder la séance");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProgram = () => {
    Alert.alert("ÉVOLUTION", "Fonctionnalité backend à relier prochainement.");
  };

  if (loading || !program || !activeWeek) {
    return <View style={styles.centered}><ActivityIndicator color={COLORS.bloodRed} /></View>;
  }

  const currentSessions = activeWeek.sessions;
  const currentDay = currentSessions[selectedDayIndex];
  const isDayValidated = validatedDays.includes(selectedDayIndex);

  return (
    // RÈGLE 2 : KeyboardAvoidingView englobe tout l'écran
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      
      {/* 1. HEADER & TOGGLE JOURS */}
      <View style={[styles.header, isWeekFinished && {opacity: 0.3}]}>
        <Text style={styles.programTitle}>{program.programName}</Text>
        <Text style={styles.weekTitle}>SEMAINE {activeWeek.weekNumber} : {activeWeek.overview}</Text>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dayTabs}>
          {currentSessions.map((session, index) => {
            const isDone = validatedDays.includes(index);
            return (
              <TouchableOpacity 
                key={index}
                disabled={isWeekFinished} 
                style={[styles.tab, selectedDayIndex === index && styles.activeTab]}
                onPress={() => {
                  setSelectedDayIndex(index);
                  setIsSessionActive(false);
                }}
              >
                <Text style={[
                  styles.tabText, 
                  selectedDayIndex === index && styles.activeTabText,
                  isDone && styles.strikethroughTab
                ]}>
                  {session.sessionName || `Séance ${index + 1}`}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* CONTENU PRINCIPAL */}
      <ScrollView 
        contentContainerStyle={styles.content}
        pointerEvents={isWeekFinished ? 'none' : 'auto'} 
        style={isWeekFinished ? { opacity: 0.3 } : {}} 
        showsVerticalScrollIndicator={false}
      >
        
        {/* BOUTON DÉMARRAGE */}
        {!isSessionActive && !isDayValidated && !isWeekFinished && (
          <IronButton 
            title="DÉMARRER LA SÉANCE" 
            onPress={() => setIsSessionActive(true)}
            variant="metal"
          />
        )}

        {isDayValidated && !isWeekFinished && (
          <View style={styles.validatedBanner}>
            <Text style={styles.validatedText}>SÉANCE TERMINÉE ✅</Text>
          </View>
        )}

        {/* LISTE DES EXERCICES */}
        {currentDay.exercises.map((exercise, exIndex) => {
          const isDone = isExerciseComplete(exercise);
          
          return (
            <View key={exIndex} style={[styles.exerciseCard, (!isSessionActive && !isDayValidated) && {opacity: 0.5}]}>
              <View style={styles.exerciseHeader}>
                {/* RÈGLE 4 : Si une série est invalidée, l'exercice n'est plus barré */}
                <Text style={[styles.exerciseName, isDone && styles.strikethrough]}>
                  {exercise.name}
                </Text>

                <View style={{alignItems: 'flex-end'}}>
                  <Text style={styles.exerciseMeta}>{exercise.sets} x {exercise.reps}</Text>
                  <Text style={styles.rpeLabel}>Cible: RPE {exercise.intensityTarget || exercise.rpe || '-'}</Text>
                </View>
              </View>
              
              <Text style={styles.exerciseNote}>💡 {exercise.notes || exercise.note || "Aucune note"}</Text>

              {/* Lignes de Séries */}
              {Array.from({ length: exercise.sets }).map((_, setIndex) => {
                const key = `${exercise.name}-${setIndex}`;
                const setInput = sessionInputs[key] || {};
                
                return (
                  <View key={setIndex} style={[styles.setRow, isDone && {opacity: 0.5}]}>
                    <Text style={[styles.setLabel, isDone && styles.strikethrough]}>
                      Série {setIndex + 1}
                    </Text>
                    
                    {/* INPUT POIDS */}
                    <TextInput 
                      style={styles.input} 
                      placeholder="kg" 
                      placeholderTextColor="#555"
                      keyboardType="numeric"
                      editable={isSessionActive}
                      value={setInput.weight}
                      onChangeText={(val) => handleInputChange(exercise.name, setIndex, 'weight', val)}
                    />

                    {/* INPUT REPS */}
                    <TextInput 
                      style={styles.input} 
                      placeholder="reps" 
                      placeholderTextColor="#555"
                      keyboardType="numeric"
                      editable={isSessionActive}
                      value={setInput.reps}
                      onChangeText={(val) => handleInputChange(exercise.name, setIndex, 'reps', val)}
                    />

                    {/* INPUT RPE (SÉLECTEUR) */}
                    <TouchableOpacity 
                      style={[styles.input, styles.rpeInput]} 
                      onPress={() => openRpeSelector(exercise.name, setIndex)}
                      disabled={!isSessionActive}
                    >
                       <Text style={{color: setInput.rpe ? 'white' : '#555'}}>
                         {setInput.rpe ? `RPE ${setInput.rpe}` : 'RPE'}
                       </Text>
                    </TouchableOpacity>

                    {/* CHECKBOX VALIDATION */}
                    <TouchableOpacity 
                      style={[styles.checkbox, setInput.validated && styles.checkboxChecked]}
                      onPress={() => isSessionActive && toggleSetValidation(exercise.name, setIndex)}
                    >
                      {setInput.validated && <FontAwesome name="check" size={14} color="white" />}
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          );
        })}

        <View style={{height: 40}} />

        {isSessionActive && (
          <IronButton 
            title="TERMINER LA SÉANCE" 
            onPress={handleFinishSession} 
          />
        )}

      </ScrollView>

      {/* OVERLAY SEMAINE TERMINÉE */}
      {isWeekFinished && (
        <View style={styles.overlayContainer}>
          <View style={styles.overlayContent}>
            <FontAwesome name="trophy" size={50} color={COLORS.gold || '#FFD700'} style={{marginBottom: SPACING.m}} />
            <Text style={styles.congratsTitle}>SEMAINE TERMINÉE</Text>
            <Text style={styles.congratsSub}>Excellent travail ! Prêt pour la suite ?</Text>
            
            <View style={{width: '100%', marginTop: SPACING.l}}>
              <IronButton 
                title="Générer la semaine d'entrainement suivante" 
                onPress={handleUpdateProgram}
                variant="primary"
                icon="magic"
              />
            </View>
          </View>
        </View>
      )}

      {/* MODAL SÉLECTEUR RPE */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={rpeModalVisible}
        onRequestClose={() => setRpeModalVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setRpeModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>ESTIMATION RPE</Text>
            <FlatList 
              data={rpeValues}
              keyExtractor={(item) => item}
              numColumns={3}
              renderItem={({item}) => (
                <TouchableOpacity 
                  style={styles.rpeOption} 
                  onPress={() => selectRpe(item)}
                >
                  <Text style={styles.rpeOptionText}>{item}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>

    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  centered: { flex: 1, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center' },
  
  header: { padding: SPACING.m, paddingTop: 60, backgroundColor: COLORS.metalDark },
  programTitle: { fontSize: 22, color: COLORS.text, fontWeight: 'bold', marginBottom: 4 },
  weekTitle: { fontSize: 14, color: COLORS.bloodRed, fontWeight: 'bold', marginBottom: SPACING.m, fontStyle: 'italic' },
  dayTabs: { flexDirection: 'row' },
  tab: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, marginRight: 10, backgroundColor: 'rgba(255,255,255,0.1)' },
  activeTab: { backgroundColor: COLORS.bloodRed },
  tabText: { color: COLORS.textSecondary, fontWeight: '600' },
  activeTabText: { color: 'white' },
  strikethroughTab: { textDecorationLine: 'line-through', opacity: 0.6 },
  
  content: { padding: SPACING.m, paddingBottom: 50 },
  
  exerciseCard: {
    backgroundColor: COLORS.metalDark,
    borderRadius: RADIUS.m,
    padding: SPACING.m,
    marginTop: SPACING.m,
    borderWidth: 1,
    borderColor: COLORS.metalMedium,
  },
  exerciseHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
  exerciseName: { fontSize: 20, fontWeight: 'bold', color: 'white', flex: 1 },
  strikethrough: { textDecorationLine: 'line-through', color: COLORS.textSecondary },
  
  exerciseMeta: { backgroundColor: COLORS.bloodRed, color: 'white', fontSize: 20, fontWeight: 'bold' },
  rpeLabel: {
    color: '#F59E0B',
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 4,
    textAlign: 'right'
  },

  exerciseNote: { color: COLORS.textSecondary, fontSize: 12, fontStyle: 'italic', marginBottom: SPACING.m },
  
  setRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8 },
  setLabel: { color: COLORS.textSecondary, width: 50, fontSize: 12 },
  input: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    color: 'white',
    paddingVertical: 8,
    borderRadius: RADIUS.s,
    borderWidth: 1,
    borderColor: COLORS.metalMedium,
    textAlign: 'center',
    height: 40
  },
  rpeInput: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.1)', 
    borderColor: '#F59E0B'
  },
  checkbox: {
    width: 35, height: 35,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: COLORS.metalLight,
    justifyContent: 'center', alignItems: 'center'
  },
  checkboxChecked: {
    backgroundColor: COLORS.success,
    borderColor: COLORS.success,
  },
  
  validatedBanner: {
    padding: SPACING.m,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: RADIUS.m,
    borderWidth: 1,
    borderColor: COLORS.success,
    alignItems: 'center',
    marginBottom: SPACING.m
  },
  validatedText: {
    color: COLORS.success,
    fontWeight: 'bold',
    letterSpacing: 1
  },

  // STYLES MODAL RPE
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    backgroundColor: COLORS.metalDark,
    borderRadius: RADIUS.m,
    padding: SPACING.m,
    borderWidth: 1,
    borderColor: COLORS.bloodRed,
    alignItems: 'center'
  },
  modalTitle: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: SPACING.m
  },
  rpeOption: {
    backgroundColor: '#333',
    padding: 15,
    margin: 5,
    borderRadius: 8,
    width: 70,
    alignItems: 'center'
  },
  rpeOptionText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16
  },

  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  congratsTitle: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: SPACING.s
  },
  congratsSub: {
    color: COLORS.textSecondary,
    fontSize: 16,
    fontStyle: 'italic',
    textAlign: 'center'
  }
});