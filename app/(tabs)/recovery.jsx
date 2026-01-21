import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { useFocusEffect } from 'expo-router';
import { COLORS, SPACING } from '../../constants/theme';
import BodyHeatmap from '../../components/BodyHeatmap';

export default function RecoveryScreen() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    try {
      const token = await SecureStore.getItemAsync('userToken');
      // Appel de NOTRE NOUVELLE ROUTE
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/programs/history`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.result) {
        setLogs(data.logs);
      }
    } catch (error) {
      console.error("Erreur History:", error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchHistory();
    }, [])
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>ÉTAT DE <Text style={{color: COLORS.bloodRed}}>RÉCUPÉRATION</Text></Text>
      
      <ScrollView 
        contentContainerStyle={{ alignItems: 'center', paddingBottom: 50 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchHistory} tintColor={COLORS.bloodRed} />}
      >
        <Text style={styles.subtitle}>Analyse des dernières 96h</Text>
        
        <View style={styles.mapContainer}>
          {loading ? (
            <ActivityIndicator color={COLORS.bloodRed} size="large" />
          ) : (
            <BodyHeatmap logs={logs} />
          )}
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            L'algorithme analyse vos logs d'entraînement pour estimer la fatigue locale. 
            {"\n\n"}
            🔵 Bleu = Système nerveux et tissus récupérés.
            {"\n"}
            🔴 Rouge = Haute demande métabolique récente.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, paddingTop: 60, paddingHorizontal: SPACING.l },
  title: { fontSize: 28, fontWeight: '900', color: COLORS.text, textAlign: 'center', marginBottom: SPACING.s },
  subtitle: { color: COLORS.textSecondary, marginBottom: SPACING.l },
  mapContainer: { width: '80%', height: 500, alignItems: 'center', justifyContent: 'center' },
  infoBox: { backgroundColor: COLORS.metalDark, padding: SPACING.m, borderRadius: 8, marginTop: SPACING.l },
  infoText: { color: COLORS.textSecondary, fontSize: 14, lineHeight: 20, textAlign: 'center' }
});n