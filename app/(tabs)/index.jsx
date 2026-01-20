import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router'; 
import * as SecureStore from 'expo-secure-store';
import { COLORS, SPACING, RADIUS } from '../../constants/theme';
import { FontAwesome } from '@expo/vector-icons';

export default function ProgramScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [myPrograms, setMyPrograms] = useState([]);
  const [templates, setTemplates] = useState([]);

  const fetchData = async () => {
    try {
      const token = await SecureStore.getItemAsync('userToken');
      if (!token) return;

      const [resUser, resTemplates] = await Promise.all([
        fetch(`${process.env.EXPO_PUBLIC_API_URL}/programs/my-programs`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${process.env.EXPO_PUBLIC_API_URL}/programs/templates`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      const dataUser = await resUser.json();
      const dataTemplates = await resTemplates.json();

      if (dataUser.result) setMyPrograms(dataUser.programs);
      if (dataTemplates.result) setTemplates(dataTemplates.templates);

    } catch (error) {
      console.error("Erreur fetch dashboard:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  // [NOUVEAU] Logique de suppression
  const handleDeleteProgram = async (programId) => {
    Alert.alert(
      "Supprimer le programme",
      "Cette action est irréversible. Êtes-vous sûr de vouloir supprimer ce programme et tout son historique ?",
      [
        { text: "Annuler", style: "cancel" },
        { 
          text: "Supprimer", 
          style: "destructive", 
          onPress: async () => {
            try {
              const token = await SecureStore.getItemAsync('userToken');
              const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/programs/${programId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
              });
              
              const data = await response.json();
              
              if (data.result) {
                // Mise à jour optimiste de l'UI (suppression locale sans recharger)
                setMyPrograms(prev => prev.filter(p => p._id !== programId));
              } else {
                Alert.alert("Erreur", data.error || "Suppression impossible");
              }
            } catch (error) {
              Alert.alert("Erreur", "Problème de connexion");
            }
          }
        }
      ]
    );
  };

  const handleProgramPress = (programId, type) => {
    router.push({
      pathname: '/program-details',
      params: { id: programId, type: type }
    });
  };

  // Composant local mis à jour
  const ProgramCard = ({ item, isTemplate }) => (
    <TouchableOpacity 
      style={[styles.card, isTemplate && styles.templateCard]} 
      onPress={() => handleProgramPress(item._id, isTemplate ? 'template' : 'custom')}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        {/* Conteneur Gauche : Icône + Titre */}
        <View style={styles.headerLeft}>
          <FontAwesome 
            name={isTemplate ? "trophy" : "user-circle"} 
            size={20} 
            color={isTemplate ? COLORS.warning : COLORS.bloodRed} 
          />
          <Text style={styles.cardTitle} numberOfLines={1}>{item.programName}</Text>
        </View>

        {/* [NOUVEAU] Bouton de suppression (Uniquement pour les programmes perso) */}
        {!isTemplate && (
          <TouchableOpacity 
            onPress={() => handleDeleteProgram(item._id)} 
            style={styles.deleteButton}
            hitSlop={{top: 10, bottom: 10, left: 10, right: 10}} // Agrandit la zone de clic
          >
            <FontAwesome name="times" size={18} color={COLORS.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.cardBody}>
        <Text style={styles.cardInfo}>{item.goal} • {item.frequency}j/sem</Text>
        {isTemplate && <Text style={styles.durationBadge}>{item.durationWeeks} semaines</Text>}
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.bloodRed} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>TES <Text style={{color: COLORS.bloodRed}}>SESSIONS</Text></Text>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.bloodRed} />}
      >
        
        <Text style={styles.sectionTitle}>MES PROGRAMMES GÉNÉRÉS</Text>
        {myPrograms.length > 0 ? (
          myPrograms.map((prog) => <ProgramCard key={prog._id} item={prog} isTemplate={false} />)
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Aucun programme actif.</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/generate')}>
              <Text style={styles.linkText}>Générer un programme maintenant</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{height: SPACING.l}} />

        <Text style={styles.sectionTitle}>PROGRAMMES ELITES (TEMPLATE)</Text>
        {templates.length > 0 ? (
          templates.map((tmpl) => <ProgramCard key={tmpl._id} item={tmpl} isTemplate={true} />)
        ) : (
          <Text style={styles.emptyText}>Bientôt disponible...</Text>
        )}

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: COLORS.background,
    paddingTop: 60,
  },
  centered: {
    flex: 1, 
    backgroundColor: COLORS.background, 
    justifyContent: 'center', 
    alignItems: 'center'
  },
  header: {
    paddingHorizontal: SPACING.l,
    marginBottom: SPACING.m,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.text,
    letterSpacing: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.l,
    paddingBottom: SPACING.xl,
  },
  sectionTitle: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: SPACING.s,
    letterSpacing: 1,
  },
  card: {
    backgroundColor: COLORS.metalDark,
    borderRadius: RADIUS.m,
    padding: SPACING.m,
    marginBottom: SPACING.m,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.bloodRed, 
  },
  templateCard: {
    borderLeftColor: COLORS.warning, 
    backgroundColor: '#1a1a1a', 
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between', // Sépare le contenu gauche du bouton suppr
    marginBottom: SPACING.s,
  },
  // [NOUVEAU] Style pour grouper icône et titre à gauche
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.s,
    flex: 1, // Prend tout l'espace disponible moins le bouton delete
  },
  // [NOUVEAU] Style du bouton suppression
  deleteButton: {
    padding: 4,
  },
  cardTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1, // Permet au texte de se couper proprement si trop long
  },
  cardBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cardInfo: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  durationBadge: {
    color: COLORS.warning,
    fontSize: 12,
    fontWeight: 'bold',
    borderWidth: 1,
    borderColor: COLORS.warning,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  emptyState: {
    padding: SPACING.l,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: RADIUS.m,
    alignItems: 'center',
  },
  emptyText: {
    color: COLORS.textSecondary,
    marginBottom: SPACING.s,
    fontStyle: 'italic',
  },
  linkText: {
    color: COLORS.bloodRed,
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  }
});