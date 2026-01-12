import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { FontAwesome } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS } from '../constants/theme';
import IronButton from '../components/ui/IronButton';

export default function ProgramDetailsScreen() {
  const { id, type } = useLocalSearchParams(); // Récupère l'ID du programme
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [program, setProgram] = useState(null);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  
  // États de la séance en cours
  const [isSessionActive, setIsSessionActive] = useState(false); // Grisé ou non
  const [sessionInputs, setSessionInputs] = useState({}); // Stocke les poids/reps/check
  const [isWeekFinished, setIsWeekFinished] = useState(false); // Pour le bouton spécial

  // CHARGEMENT DU PROGRAMME
  useEffect(() => {
    const fetchProgramDetails = async () => {
      try {
        const token = await SecureStore.getItemAsync('userToken');
        // Astuce : On réutilise l'endpoint "my-programs" et on filtre localement pour l'instant
        // Idéalement, il faudrait une route GET /programs/:id
        const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/programs/my-programs`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        
        if (data.result) {
          const found = data.programs.find(p => p._id === id);
          setProgram(found);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchProgramDetails();
  }, [id]);

  // GESTION DES INPUTS
  const handleInputChange = (exerciseName, setIndex, field, value) => {
    setSessionInputs(prev => ({
      ...prev,
      [`${exerciseName}-${setIndex}`]: {
        ...prev[`${exerciseName}-${setIndex}`],
        [field]: value
      }
    }));
  };

  const toggleSetValidation = (exerciseName, setIndex) => {
    const key = `${exerciseName}-${setIndex}`;
    const current = sessionInputs[key] || {};
    handleInputChange(exerciseName, setIndex, 'validated', !current.validated);
  };

  // VÉRIFICATION : Exercice terminé ? (Toutes les séries validées)
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
      const currentDay = program.schedule[selectedDayIndex];

      // On formate les données pour le backend
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
          dayName: currentDay.dayName,
          exercises: formattedExercises
        })
      });

      const data = await response.json();

      if (data.result) {
        Alert.alert("Succès", "Séance enregistrée !");
        setIsSessionActive(false); // On reverrouille
        if (data.isWeekComplete) {
          setIsWeekFinished(true); // Affiche le bouton spécial
        }
        router.back(); // Retour au dashboard
      }

    } catch (e) {
      console.error(e);
      Alert.alert("Erreur", "Impossible de sauvegarder la séance");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProgram = () => {
    // Logique future pour appeler l'IA et générer la semaine 2
    Alert.alert("ÉVOLUTION", "Analyse de vos performances en cours... Génération de la semaine suivante (À implémenter).");
  };

  if (loading || !program) {
    return <View style={styles.centered}><ActivityIndicator color={COLORS.bloodRed} /></View>;
  }

  const currentDay = program.schedule[selectedDayIndex];

  return (
    <View style={styles.container}>
      
      {/* 1. HEADER & TOGGLE JOURS */}
      <View style={styles.header}>
        <Text style={styles.programTitle}>{program.programName}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dayTabs}>
          {program.schedule.map((day, index) => (
            <TouchableOpacity 
              key={index}
              style={[styles.tab, selectedDayIndex === index && styles.activeTab]}
              onPress={() => setSelectedDayIndex(index)}
            >
              <Text style={[styles.tabText, selectedDayIndex === index && styles.activeTabText]}>
                {day.dayName}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        
        {/* 2. BOUTON DÉMARRAGE */}
        {!isSessionActive && !isWeekFinished && (
          <IronButton 
            title="DÉMARRER LA SÉANCE" 
            onPress={() => setIsSessionActive(true)}
            variant="metal"
          />
        )}

        {/* 3. LISTE DES EXERCICES */}
        {currentDay.exercises.map((exercise, exIndex) => {
          const isDone = isExerciseComplete(exercise);
          
          return (
            <View key={exIndex} style={[styles.exerciseCard, !isSessionActive && {opacity: 0.5}]}>
              {/* Titre Exercice (Barré si fini) */}
              <View style={styles.exerciseHeader}>
                <Text style={[styles.exerciseName, isDone && styles.strikethrough]}>
                  {exercise.name}
                </Text>
                <Text style={styles.exerciseMeta}>{exercise.sets} x {exercise.reps}</Text>
              </View>
              
              <Text style={styles.exerciseNote}>💡 {exercise.note}</Text>

              {/* Lignes de Séries */}
              {Array.from({ length: exercise.sets }).map((_, setIndex) => {
                const key = `${exercise.name}-${setIndex}`;
                const setInput = sessionInputs[key] || {};
                
                return (
                  <View key={setIndex} style={styles.setRow}>
                    <Text style={styles.setLabel}>Série {setIndex + 1}</Text>
                    
                    {/* Input Poids */}
                    <TextInput 
                      style={styles.input} 
                      placeholder="kg" 
                      placeholderTextColor="#555"
                      keyboardType="numeric"
                      editable={isSessionActive}
                      value={setInput.weight}
                      onChangeText={(val) => handleInputChange(exercise.name, setIndex, 'weight', val)}
                    />

                    {/* Input Reps */}
                    <TextInput 
                      style={styles.input} 
                      placeholder="reps" 
                      placeholderTextColor="#555"
                      keyboardType="numeric"
                      editable={isSessionActive}
                      value={setInput.reps}
                      onChangeText={(val) => handleInputChange(exercise.name, setIndex, 'reps', val)}
                    />

                    {/* Checkbox de Validation */}
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

        {/* 4. BOUTON VALIDATION FINALE */}
        {isSessionActive && (
          <IronButton 
            title="TERMINER LA SÉANCE" 
            onPress={handleFinishSession} 
          />
        )}

        {/* 5. BOUTON SPÉCIAL (Si semaine finie) */}
        {isWeekFinished && (
          <View style={styles.upgradeContainer}>
            <Text style={styles.upgradeText}>SEMAINE TERMINÉE !</Text>
            <IronButton 
              title="GÉNÉRER SEMAINE SUIVANTE (IA)" 
              onPress={handleUpdateProgram}
              variant="primary" // Rouge pour attirer l'attention
            />
          </View>
        )}

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  centered: { flex: 1, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center' },
  header: { padding: SPACING.m, paddingTop: 60, backgroundColor: COLORS.metalDark },
  programTitle: { fontSize: 22, color: COLORS.text, fontWeight: 'bold', marginBottom: SPACING.m },
  dayTabs: { flexDirection: 'row' },
  tab: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, marginRight: 10, backgroundColor: 'rgba(255,255,255,0.1)' },
  activeTab: { backgroundColor: COLORS.bloodRed },
  tabText: { color: COLORS.textSecondary, fontWeight: '600' },
  activeTabText: { color: 'white' },
  
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
  exerciseName: { fontSize: 18, fontWeight: 'bold', color: 'white', flex: 1 },
  strikethrough: { textDecorationLine: 'line-through', color: COLORS.textSecondary },
  exerciseMeta: { color: COLORS.bloodRed, fontWeight: 'bold' },
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
    backgroundColor: COLORS.success, // Vert quand validé
    borderColor: COLORS.success,
  },
  
  upgradeContainer: {
    marginTop: SPACING.l,
    padding: SPACING.m,
    backgroundColor: 'rgba(138, 3, 3, 0.1)',
    borderRadius: RADIUS.m,
    borderWidth: 1,
    borderColor: COLORS.bloodRed,
    alignItems: 'center'
  },
  upgradeText: {
    color: COLORS.bloodRed,
    fontWeight: 'bold',
    marginBottom: SPACING.s,
    letterSpacing: 1
  }
});