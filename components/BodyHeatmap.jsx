import React, { useMemo } from 'react';
import { View, Text } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { COLORS } from '../constants/theme';

// 1. MAPPING EXERCICE -> GROUPE MUSCULAIRE (Simplifié pour l'exemple)
// Dans un projet réel, ce mapping pourrait venir du Backend ou d'un fichier constant dédié.
const EXERCISE_TO_MUSCLE = {
  'Squat': ['quads', 'glutes'],
  'Leg Press': ['quads'],
  'Deadlift': ['hamstrings', 'lower_back', 'glutes'],
  'Bench Press': ['pecs', 'triceps', 'front_delt'],
  'Push-up': ['pecs', 'triceps'],
  'Pull-up': ['lats', 'biceps'],
  'Rowing': ['lats', 'rear_delt'],
  'Overhead Press': ['shoulders', 'triceps'],
  'Curl': ['biceps'],
  'Extension': ['triceps'],
  // Ajoute tes exercices ici
};

// 2. FONCTION UTILITAIRE : Interpolation de couleur
// 0 (Repos/Bleu) -> 1 (Fatigue/Rouge)
const getMuscleColor = (intensity) => {
  // Bleu froid (Repos) : #3b82f6
  // Rouge vif (Fatigue) : #ef4444 (Ta COLORS.error ou bloodRed)
  
  if (intensity <= 0) return '#3b82f6'; // Bleu
  if (intensity >= 1) return COLORS.bloodRed; // Rouge

  // Algo simple de mélange hexadécimal (ou retourner des steps discrets pour faire simple)
  return intensity > 0.5 ? COLORS.bloodRed : '#8b5cf6'; // Violet de transition si > 50%
};

export default function BodyHeatmap({ logs }) {

  // 3. ALGORITHME DE CALCUL DE FATIGUE
  const muscleFatigue = useMemo(() => {
    const scores = {
      pecs: 0, lats: 0, shoulders: 0, arms: 0,
      quads: 0, hamstrings: 0, glutes: 0, calves: 0
    };

    const now = new Date();

    logs.forEach(log => {
      const logDate = new Date(log.date);
      const hoursDiff = (now - logDate) / (1000 * 60 * 60); // Heures écoulées

      if (hoursDiff > 96) return; // Ignore si + de 4 jours (96h)

      // Facteur de décélération (100% à 0h, 0% à 96h)
      const decayFactor = Math.max(0, (96 - hoursDiff) / 96);

      log.exercises.forEach(exLog => {
        // Recherche floue ou exacte du nom
        const targets = Object.keys(EXERCISE_TO_MUSCLE).find(key => 
          exLog.exerciseName.toLowerCase().includes(key.toLowerCase())
        );

        if (targets) {
          EXERCISE_TO_MUSCLE[targets].forEach(muscle => {
            if (scores[muscle] !== undefined) {
              // On ajoute de la fatigue "arbitraire" par série validée
              // Tu pourrais raffiner avec le RPE ou le volume exact
              const sessionLoad = exLog.sets.length * 0.25; // 4 sets = 100% de fatigue ajoutée
              scores[muscle] += sessionLoad * decayFactor;
            }
          });
        }
      });
    });

    return scores;
  }, [logs]);

  // Helper pour props SVG
  const getProps = (muscleKey) => ({
    fill: getMuscleColor(Math.min(1, muscleFatigue[muscleKey] || 0)),
    stroke: "white",
    strokeWidth: "2"
  });

  return (
    <View style={{ aspectRatio: 0.5, width: '100%' }}>
      <Svg viewBox="0 0 200 400" width="100%" height="100%">
        {/* SILHOUETTE SCHÉMATIQUE (Tu devras remplacer par des Paths précis) */}
        
        {/* Tête (Neutre) */}
        <Path d="M100 20 circle 15" fill={COLORS.metalMedium} />

        {/* Épaules / Shoulders */}
        <Path d="M70 50 L130 50 L140 80 L60 80 Z" {...getProps('shoulders')} />

        {/* Pectoraux / Pecs */}
        <Path d="M75 80 L125 80 L120 110 L80 110 Z" {...getProps('pecs')} />

        {/* Dos / Lats (Visible un peu sur les cotés ou vue arrière) - Ici simplifié Abs */}
        <Path d="M80 110 L120 110 L115 150 L85 150 Z" fill={COLORS.metalLight} />

        {/* Bras (Biceps/Triceps amalgamés 'arms') */}
        <Path d="M60 80 L50 140 L70 140 L75 80 Z" {...getProps('arms')} />
        <Path d="M140 80 L150 140 L130 140 L125 80 Z" {...getProps('arms')} />

        {/* Quadriceps */}
        <Path d="M75 160 L125 160 L120 230 L80 230 Z" {...getProps('quads')} />

        {/* Ischios/Fessiers (Vue arrière simulée ou amalgamée) */}
        {/* Mollets */}
        <Path d="M80 230 L120 230 L115 290 L85 290 Z" {...getProps('calves')} />

      </Svg>
      
      {/* Légende Debug */}
      <View style={{flexDirection:'row', justifyContent:'center', gap:10, marginTop:10}}>
         <Text style={{color:'#3b82f6'}}>Reposé</Text>
         <Text style={{color:COLORS.bloodRed}}>Travaillé</Text>
      </View>
    </View>
  );
}