import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { FontAwesome } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS } from '../constants/theme';
import IronButton from '../components/ui/IronButton';

export default function ProgramDetailsScreen() {
  const { id, type } = useLocalSearchParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [program, setProgram] = useState(null);
  // AJOUT : État pour stocker la semaine active (Objet complet)
  const [activeWeek, setActiveWeek] = useState(null); 
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  
  // États de la séance en cours
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [sessionInputs, setSessionInputs] = useState({});
  const [isWeekFinished, setIsWeekFinished] = useState(false);
  
  // Pour stocker les index des jours validés (Synchronisé avec le Backend)
  const [validatedDays, setValidatedDays] = useState([]);

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
          
          // --- CORRECTION MAJEURE : SÉLECTION DE LA SEMAINE ACTIVE ---
          if (found && found.mesocycle && found.mesocycle.weeks) {
            // 1. On cherche la première semaine qui n'est pas "complète" ET qui est "générée"
            // Si toutes sont complètes, on prend la dernière.
            let currentWeek = found.mesocycle.weeks.find(w => !w.isWeekComplete && w.isGenerated);
            
            if (!currentWeek) {
              // Fallback : Si tout est fini ou rien trouvé, on prend la dernière semaine générée
              const generatedWeeks = found.mesocycle.weeks.filter(w => w.isGenerated);
              currentWeek = generatedWeeks[generatedWeeks.length - 1];
            }

            setActiveWeek(currentWeek); // On stocke la semaine active

            // 2. On charge les jours validés DEPUIS la semaine active (et non la racine du programme)
            // Note: Le modèle Programs.js utilise completedSessions (Array de Numbers) dans microcycleSchema
            if (currentWeek && Array.isArray(currentWeek.completedSessions)) {
               setValidatedDays(currentWeek.completedSessions);
            }
            
            // 3. Vérification de l'état global de la semaine
            if (currentWeek && currentWeek.isWeekComplete) {
              setIsWeekFinished(true);
            }
          }
          // -----------------------------------------------------------
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchProgramDetails();
  }, [id]);

  // --- MODIFICATION ICI : Auto-validation intelligente ---
  const handleInputChange = (exerciseName, setIndex, field, value) => {
    setSessionInputs(prev => {
      const key = `${exerciseName}-${setIndex}`;
      const currentData = prev[key] || {};
      
      // 1. On construit le nouvel objet avec la valeur modifiée
      const newData = { ...currentData, [field]: value };

      // 2. Si on modifie weight ou reps, on vérifie si tout est rempli pour cocher auto
      if (field === 'weight' || field === 'reps') {
        // On vérifie que les deux champs ont une valeur (truthy)
        if (newData.weight && newData.reps) {
           newData.validated = true;
        }
      }

      return {
        ...prev,
        [key]: newData
      };
    });
  };
  // -------------------------------------------------------

  const toggleSetValidation = (exerciseName, setIndex) => {
    const key = `${exerciseName}-${setIndex}`;
    const current = sessionInputs[key] || {};

    if (!current.weight || !current.reps) {
      Alert.alert("Données manquantes", "Veuillez renseigner la charge (kg) et les répétitions avant de valider la série.");
      return;
    }

    handleInputChange(exerciseName, setIndex, 'validated', !current.validated);
  };

  const isExerciseComplete = (exercise) => {
    for (let i = 0; i < exercise.sets; i++) {
      const setKey = `${exercise.name}-${i}`;
      if (!sessionInputs[setKey]?.validated) return false;
    }
    return true;
  };

  // ENREGISTREMENT DE LA SÉANCE
  const handleFinishSession = async () => {
    Alert.alert(
      "Terminer la séance",
      "Confirmer l'enregistrement de vos performances ?",
      [
        { text: "Annuler", style: "cancel" },
        { 
          text: "Valider", 
          onPress: async () => {
            await saveSessionToBackend(); 
          } 
        }
      ]
    );
  };

  const saveSessionToBackend = async () => {
    try {
      setLoading(true);
      const token = await SecureStore.getItemAsync('userToken');
      
      // --- CORRECTION : Utilisation de activeWeek au lieu de program.schedule ---
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
          dayName: currentDay.sessionName, // Attention : sessionName dans le Model vs dayName attendu
          dayIndex: selectedDayIndex,
          // --- AJOUT CRITIQUE : weekNumber est REQUIS par le modèle WorkoutLog ---
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
          // Si fini, on valide visuellement tous les jours
          // --- CORRECTION : Utilisation de activeWeek.sessions.map ---
          const allDaysIndices = activeWeek.sessions.map((_, i) => i);
          setValidatedDays(allDaysIndices);
        }
      } else {
        // Ajout gestion erreur backend explicite
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
    // Ici on appellera la route /generate-next-week
    Alert.alert("ÉVOLUTION", "Analyse de vos performances en cours... (Fonctionnalité backend à relier)");
  };

  // --- CORRECTION : Vérification de activeWeek avant le rendu ---
  if (loading || !program || !activeWeek) {
    return <View style={styles.centered}><ActivityIndicator color={COLORS.bloodRed} /></View>;
  }

  // --- CORRECTION : Utilisation de activeWeek.sessions ---
  const currentSessions = activeWeek.sessions;
  const currentDay = currentSessions[selectedDayIndex];
  const isDayValidated = validatedDays.includes(selectedDayIndex);

  return (
    <View style={styles.container}>
      
      {/* 1. HEADER & TOGGLE JOURS */}
      <View style={[styles.header, isWeekFinished && {opacity: 0.3}]}>
        <Text style={styles.programTitle}>{program.programName}</Text>
        {/* Ajout d'un sous-titre pour indiquer la semaine */}
        <Text style={styles.weekTitle}>SEMAINE {activeWeek.weekNumber} : {activeWeek.overview}</Text>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dayTabs}>
          {/* --- CORRECTION : Map sur currentSessions --- */}
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
                  {/* Utilisation de sessionName car dayName n'existe pas dans le modèle Session */}
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
      >
        
        {/* 2. BOUTON DÉMARRAGE */}
        {!isSessionActive && !isDayValidated && !isWeekFinished && (
          <IronButton 
            title="DÉMARRER LA SÉANCE" 
            onPress={() => setIsSessionActive(true)}
            variant="metal"
          />
        )}

        {/* Bannière Séance Terminée */}
        {isDayValidated && !isWeekFinished && (
          <View style={styles.validatedBanner}>
            <Text style={styles.validatedText}>SÉANCE TERMINÉE ✅</Text>
          </View>
        )}

        {/* 3. LISTE DES EXERCICES */}
        {currentDay.exercises.map((exercise, exIndex) => {
          const isDone = isExerciseComplete(exercise);
          
          return (
            <View key={exIndex} style={[styles.exerciseCard, (!isSessionActive && !isDayValidated) && {opacity: 0.5}]}>
              <View style={styles.exerciseHeader}>
                <Text style={[styles.exerciseName, isDone && styles.strikethrough]}>
                  {exercise.name}
                </Text>

                <View style={{alignItems: 'flex-end'}}>
                  <Text style={styles.exerciseMeta}>{exercise.sets} x {exercise.reps}</Text>
                  {/* Utilisation de intensityTarget si RPE pas dispo */}
                  <Text style={styles.rpeLabel}>RPE {exercise.intensityTarget || exercise.rpe || '-'}</Text>
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
                    
                    <TextInput 
                      style={styles.input} 
                      placeholder="kg" 
                      placeholderTextColor="#555"
                      keyboardType="numeric"
                      editable={isSessionActive}
                      value={setInput.weight}
                      onChangeText={(val) => handleInputChange(exercise.name, setIndex, 'weight', val)}
                    />

                    <TextInput 
                      style={styles.input} 
                      placeholder="reps" 
                      placeholderTextColor="#555"
                      keyboardType="numeric"
                      editable={isSessionActive}
                      value={setInput.reps}
                      onChangeText={(val) => handleInputChange(exercise.name, setIndex, 'reps', val)}
                    />

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

        <View style={{height: 20}} />

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

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  centered: { flex: 1, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center' },
  
  header: { padding: SPACING.m, paddingTop: 60, backgroundColor: COLORS.metalDark },
  programTitle: { fontSize: 22, color: COLORS.text, fontWeight: 'bold', marginBottom: 4 }, // Ajusté margin
  weekTitle: { fontSize: 14, color: COLORS.bloodRed, fontWeight: 'bold', marginBottom: SPACING.m, fontStyle: 'italic' }, // Nouveau style pour la semaine
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
  
  setRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 10 },
  setLabel: { color: COLORS.textSecondary, width: 60 },
  input: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    color: 'white',
    padding: 8,
    borderRadius: RADIUS.s,
    borderWidth: 1,
    borderColor: COLORS.metalMedium,
    textAlign: 'center'
  },
  checkbox: {
    width: 30, height: 30,
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

  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  overlayContent: {
    width: '90%',
    backgroundColor: COLORS.metalDark,
    padding: SPACING.xl,
    borderRadius: RADIUS.l,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.bloodRed,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
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