import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, TextInput, Alert, ScrollView, ActivityIndicator, Modal } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as SecureStore from 'expo-secure-store';
import { useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS } from '../../constants/theme';
import IronButton from '../../components/ui/IronButton';

export default function ProfileScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // Modales
  const [modalVisible, setModalVisible] = useState(false); // Menu Sécurité/Légal
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [legalModalVisible, setLegalModalVisible] = useState(false);

  // Données utilisateur
  const [user, setUser] = useState({ username: '', email: '', avatar: '', bio: '', weight: 0, height: 0 });
  
  // États temporaires
  const [tempUser, setTempUser] = useState({});
  const [tempAvatar, setTempAvatar] = useState(null);
  
  // États Password
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = await SecureStore.getItemAsync('userToken');
      if (!token) { router.replace('/(auth)/login'); return; }

      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/users/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.result) {
        setUser(data.user);
        setTempUser(data.user); // Init temp data
        setTempAvatar(data.user.avatar || null);
      }
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaType.Images,
      allowsEditing: true, aspect: [1, 1], quality: 0.5, base64: true,
    });
    if (!result.canceled) {
      setTempAvatar(`data:image/jpeg;base64,${result.assets[0].base64}`);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = await SecureStore.getItemAsync('userToken');
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/users/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          ...tempUser, // Envoie bio, username, email, weight, height
          avatar: tempAvatar
        })
      });

      const data = await response.json();
      if (data.result) {
        setUser({ ...tempUser, avatar: tempAvatar });
        setIsEditing(false);
        Alert.alert("Succès", "Profil mis à jour !");
      } else {
        Alert.alert("Erreur", data.error || "Mise à jour impossible");
      }
    } catch (error) { Alert.alert("Erreur", "Problème connexion"); } finally { setSaving(false); }
  };

  const handleChangePassword = async () => {
    if (passwords.new !== passwords.confirm) {
      Alert.alert("Erreur", "Les nouveaux mots de passe ne correspondent pas");
      return;
    }
    try {
      const token = await SecureStore.getItemAsync('userToken');
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/users/password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ currentPassword: passwords.current, newPassword: passwords.new })
      });
      const data = await response.json();
      if (data.result) {
        Alert.alert("Succès", "Mot de passe modifié");
        setPasswordModalVisible(false);
        setPasswords({ current: '', new: '', confirm: '' });
      } else {
        Alert.alert("Erreur", data.error);
      }
    } catch (e) { Alert.alert("Erreur", "Problème technique"); }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "ZONE DE DANGER",
      "Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible.",
      [
        { text: "Annuler", style: "cancel" },
        { text: "SUPPRIMER", style: "destructive", onPress: async () => {
            const token = await SecureStore.getItemAsync('userToken');
            await fetch(`${process.env.EXPO_PUBLIC_API_URL}/users/profile`, {
              method: 'DELETE',
              headers: { 'Authorization': `Bearer ${token}` }
            });
            await SecureStore.deleteItemAsync('userToken');
            router.replace('/(auth)/login');
        }}
      ]
    );
  };

  if (loading) return <View style={styles.centered}><ActivityIndicator color={COLORS.bloodRed} /></View>;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{paddingBottom: 50}}>
      
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={isEditing ? pickImage : null} disabled={!isEditing}>
          <View style={[styles.avatarContainer, isEditing && styles.avatarEditable]}>
            {tempAvatar || user.avatar ? (
              <Image source={{ uri: isEditing ? tempAvatar : user.avatar }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.placeholderAvatar]}><FontAwesome name="user" size={60} color={COLORS.textSecondary} /></View>
            )}
            {isEditing && <View style={styles.editBadge}><FontAwesome name="camera" size={14} color="white" /></View>}
          </View>
        </TouchableOpacity>

        {isEditing ? (
          <View style={{width: '80%', gap: 10, marginTop: 10}}>
             <Text style={styles.labelInput}>Pseudo</Text>
             <TextInput style={styles.input} value={tempUser.username} onChangeText={t => setTempUser({...tempUser, username: t})} />
             <Text style={styles.labelInput}>Email</Text>
             <TextInput style={styles.input} value={tempUser.email} onChangeText={t => setTempUser({...tempUser, email: t})} />
          </View>
        ) : (
          <>
            <Text style={styles.username}>@{user.username}</Text>
            <Text style={styles.email}>{user.email}</Text>
          </>
        )}
      </View>

      {/* METRIQUES */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>MÉTRIQUES</Text>
        <View style={styles.metricsContainer}>
          <View style={styles.metricBox}>
            <Text style={styles.metricLabel}>POIDS (KG)</Text>
            {isEditing ? (
              <TextInput style={styles.metricInput} keyboardType="numeric" value={String(tempUser.weight || '')} onChangeText={t => setTempUser({...tempUser, weight: t})} placeholder="0" placeholderTextColor="#666" />
            ) : (<Text style={styles.metricValue}>{user.weight || '--'}</Text>)}
          </View>
          <View style={styles.metricBox}>
            <Text style={styles.metricLabel}>TAILLE (CM)</Text>
            {isEditing ? (
              <TextInput style={styles.metricInput} keyboardType="numeric" value={String(tempUser.height || '')} onChangeText={t => setTempUser({...tempUser, height: t})} placeholder="0" placeholderTextColor="#666" />
            ) : (<Text style={styles.metricValue}>{user.height || '--'}</Text>)}
          </View>
        </View>
      </View>

      {/* BIO */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>BIOGRAPHIE</Text>
          {isEditing && <Text style={styles.charCount}>{(tempUser.bio || '').length}/280</Text>}
        </View>
        {isEditing ? (
          <TextInput style={styles.bioInput} multiline value={tempUser.bio} onChangeText={t => setTempUser({...tempUser, bio: t})} maxLength={280} placeholder="Votre bio..." placeholderTextColor="#666" />
        ) : (
          <Text style={[styles.bioText, { color: user.bio ? 'white' : '#666', fontStyle: user.bio ? 'normal' : 'italic' }]}>
            {user.bio || "Aucune biographie."}
          </Text>
        )}
      </View>

      {/* ACTIONS */}
      <View style={styles.actions}>
        {isEditing ? (
          <View style={styles.editActions}>
            <IronButton title="ANNULER" onPress={() => { setIsEditing(false); setTempUser(user); setTempAvatar(user.avatar); }} variant="metal" style={{flex: 1}} />
            <IronButton title="SAUVEGARDER" onPress={handleSave} isLoading={saving} style={{flex: 1}} />
          </View>
        ) : (
          <View style={{gap: 15}}>
            <IronButton title="MODIFIER LE PROFIL" onPress={() => setIsEditing(true)} variant="metal" icon="pencil" />
            
            {/* BOUTON PARAMÈTRES / LÉGAL / DELETE */}
            <IronButton title="PARAMÈTRES & LÉGAL" onPress={() => setModalVisible(true)} variant="secondary" icon="cog" />
            
            <IronButton title="DÉCONNEXION" onPress={async () => { await SecureStore.deleteItemAsync('userToken'); router.replace('/(auth)/login'); }} variant="metal" style={{borderColor: COLORS.bloodRed}} textStyle={{color: COLORS.bloodRed}} />
          </View>
        )}
      </View>

      {/* --- MODALE PRINCIPALE --- */}
      <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>PARAMÈTRES</Text>
            
            <TouchableOpacity style={styles.modalItem} onPress={() => { setModalVisible(false); setPasswordModalVisible(true); }}>
              <Text style={styles.modalItemText}>🔒 Changer de mot de passe</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.modalItem} onPress={() => { setModalVisible(false); setLegalModalVisible(true); }}>
              <Text style={styles.modalItemText}>⚖️ Mentions Légales & CGU</Text>
            </TouchableOpacity>

            <View style={{height: 1, backgroundColor: COLORS.metalMedium, marginVertical: 10}} />

            <TouchableOpacity style={styles.modalItem} onPress={handleDeleteAccount}>
              <Text style={[styles.modalItemText, {color: COLORS.bloodRed, fontWeight: 'bold'}]}>⚠️ Supprimer mon compte</Text>
            </TouchableOpacity>

            <IronButton title="FERMER" onPress={() => setModalVisible(false)} variant="metal" style={{marginTop: 20}} />
          </View>
        </View>
      </Modal>

      {/* --- MODALE MOT DE PASSE --- */}
      <Modal animationType="slide" transparent={true} visible={passwordModalVisible} onRequestClose={() => setPasswordModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>SÉCURITÉ</Text>
            <TextInput style={styles.input} placeholder="Mot de passe actuel" placeholderTextColor="#666" secureTextEntry value={passwords.current} onChangeText={t => setPasswords({...passwords, current: t})} />
            <TextInput style={styles.input} placeholder="Nouveau mot de passe" placeholderTextColor="#666" secureTextEntry value={passwords.new} onChangeText={t => setPasswords({...passwords, new: t})} />
            <TextInput style={styles.input} placeholder="Confirmer nouveau" placeholderTextColor="#666" secureTextEntry value={passwords.confirm} onChangeText={t => setPasswords({...passwords, confirm: t})} />
            
            <View style={styles.editActions}>
              <IronButton title="ANNULER" onPress={() => setPasswordModalVisible(false)} variant="metal" style={{flex: 1}} />
              <IronButton title="VALIDER" onPress={handleChangePassword} style={{flex: 1}} />
            </View>
          </View>
        </View>
      </Modal>

      {/* --- MODALE CGU & MENTIONS LÉGALES --- */}
      <Modal 
        animationType="slide" 
        transparent={true} 
        visible={legalModalVisible} 
        onRequestClose={() => setLegalModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, {height: '85%'}]}>
            <Text style={styles.modalTitle}>MENTIONS LÉGALES & CGU</Text>
            
            <ScrollView 
              style={{marginTop: 10}} 
              contentContainerStyle={{paddingBottom: 30}}
              indicatorStyle="white"
            >
              <Text style={styles.legalText}>
                <Text style={styles.legalHeader}>CONDITIONS GÉNÉRALES D'UTILISATION (CGU)</Text>{'\n'}
                Dernière mise à jour : 13/01/2026{'\n\n'}

                <Text style={styles.legalSubtitle}>ARTICLE 1 : MENTIONS LÉGALES</Text>{'\n'}
                L'application IronIQ est un projet à but pédagogique développé dans le cadre d'une formation.{'\n'}
                Éditeur : Auvray Cédric{'\n'}
                Contact : auvray.cedric00@gmail.com{'\n'}
                Hébergement Backend : Railway Corp.{'\n'}
                Hébergement Stockage (Images) : Cloudinary Ltd.{'\n\n'}

                <Text style={styles.legalSubtitle}>ARTICLE 2 : OBJET</Text>{'\n'}
                L'application a pour objet de fournir à l'utilisateur des programmes d'entraînement sportif générés par Intelligence Artificielle et un outil de suivi de performances (carnet d'entraînement numérique).{'\n\n'}

                <Text style={styles.legalSubtitle}>ARTICLE 3 : AVERTISSEMENT SANTÉ (IMPORTANT)</Text>{'\n'}
                <Text style={{fontWeight:'bold'}}>3.1. Absence de conseil médical</Text>{'\n'}
                L'utilisateur reconnaît que l'application IronIQ ne fournit aucun conseil médical. Les programmes générés sont des suggestions basées sur des algorithmes et ne remplacent en aucun cas l'avis d'un médecin ou d'un coach sportif diplômé d'État.{'\n\n'}

                <Text style={{fontWeight:'bold'}}>3.2. Risques liés à la pratique sportive</Text>{'\n'}
                La pratique de la musculation comporte des risques de blessures graves. L'utilisateur déclare être en bonne santé et apte à la pratique sportive. IronIQ décline toute responsabilité en cas de blessure, malaise ou décès survenant pendant ou après l'utilisation de l'application. L'utilisateur s'entraîne sous sa seule et entière responsabilité.{'\n\n'}

                <Text style={{fontWeight:'bold'}}>3.3. Intelligence Artificielle</Text>{'\n'}
                Les programmes étant générés par une IA, des erreurs ou incohérences peuvent survenir (ex: charges inadaptées). L'utilisateur doit faire preuve de discernement et ne jamais tenter un exercice s'il ressent une douleur ou si la charge semble excessive.{'\n\n'}

                <Text style={styles.legalSubtitle}>ARTICLE 4 : DONNÉES PERSONNELLES (RGPD)</Text>{'\n'}
                Conformément au RGPD, nous collectons les données suivantes pour le fonctionnement du service :{'\n'}
                - Données d'identité : Pseudo, Email (pour l'authentification).{'\n'}
                - Données physiques : Poids, Taille (pour le suivi et la génération de programmes d'entraînement).{'\n'}
                - Données multimédias : Photo de profil (hébergée sur Cloudinary).{'\n'}
                - Données d'activité : Historique des séances.{'\n\n'}

                Ces données ne sont ni vendues ni transmises à des tiers publicitaires.{'\n'}
                Droit d'accès et de suppression : Vous pouvez à tout moment modifier vos données ou supprimer définitivement votre compte via la section "Paramètres" de votre Profil. La suppression est immédiate et irréversible.{'\n\n'}

                <Text style={styles.legalSubtitle}>ARTICLE 5 : RESPONSABILITÉ TECHNIQUE</Text>{'\n'}
                L'application est fournie "telle quelle" (AS IS). L'éditeur ne garantit pas l'absence de bugs ou une disponibilité continue du service (serveurs en veille, maintenance). Aucune compensation ne sera due en cas de perte de données d'entraînement. Il vous est possible de reporter tout dysfonctionnement à l'éditeur.{'\n\n'}

                <Text style={styles.legalSubtitle}>ARTICLE 6 : PROPRIÉTÉ INTELLECTUELLE</Text>{'\n'}
                Le code source, le design et la marque IronIQ sont la propriété exclusive de l'éditeur. Toute reproduction ou rétro-ingénierie est interdite. L'utilisateur reste propriétaire de sa photo de profil mais concède à IronIQ le droit de l'héberger pour l'affichage dans l'application.{'\n\n'}

                <Text style={styles.legalSubtitle}>ARTICLE 7 : LOI APPLICABLE</Text>{'\n'}
                Les présentes CGU sont soumises au droit français.
              </Text>
            </ScrollView>

            <IronButton 
              title="J'AI LU ET J'ACCEPTE" 
              onPress={() => setLegalModalVisible(false)} 
              variant="metal" 
              style={{marginTop: 15}} 
            />
          </View>
        </View>
      </Modal>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  // ... (Garder les styles précédents : container, centered, header, avatar..., section, actions) ...
  container: { flex: 1, backgroundColor: COLORS.background },
  centered: { flex: 1, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center' },
  header: { alignItems: 'center', paddingVertical: SPACING.xl, backgroundColor: COLORS.metalDark, borderBottomWidth: 1, borderBottomColor: COLORS.metalMedium },
  avatarContainer: { width: 120, height: 120, borderRadius: 60, marginBottom: SPACING.m, position: 'relative', borderWidth: 2, borderColor: COLORS.bloodRed },
  avatarEditable: { borderStyle: 'dashed', borderColor: 'white' },
  avatar: { width: '100%', height: '100%', borderRadius: 60 },
  placeholderAvatar: { backgroundColor: '#333', justifyContent: 'center', alignItems: 'center' },
  editBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: COLORS.bloodRed, width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: COLORS.background },
  username: { fontSize: 24, fontWeight: 'bold', color: 'white', letterSpacing: 1 },
  email: { fontSize: 14, color: COLORS.textSecondary, marginTop: 4 },
  section: { padding: SPACING.l },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.s },
  sectionTitle: { color: COLORS.bloodRed, fontWeight: 'bold', fontSize: 14, letterSpacing: 1 },
  charCount: { color: COLORS.textSecondary, fontSize: 12 },
  bioText: { fontSize: 16, lineHeight: 24 },
  bioInput: { backgroundColor: COLORS.metalDark, color: 'white', padding: SPACING.m, borderRadius: RADIUS.m, height: 120, textAlignVertical: 'top', fontSize: 16, borderWidth: 1, borderColor: COLORS.metalMedium },
  actions: { padding: SPACING.l },
  editActions: { flexDirection: 'row', justifyContent: 'space-between', gap: SPACING.m },
  
  // 👇 NOUVEAUX STYLES 👇
  metricsContainer: { flexDirection: 'row', gap: SPACING.m, marginTop: SPACING.s },
  metricBox: { flex: 1, backgroundColor: COLORS.metalDark, padding: SPACING.m, borderRadius: RADIUS.m, borderWidth: 1, borderColor: COLORS.metalMedium, alignItems: 'center' },
  metricLabel: { color: COLORS.textSecondary, fontSize: 12, fontWeight: 'bold', marginBottom: 4 },
  metricValue: { color: 'white', fontSize: 24, fontWeight: 'bold' },
  metricInput: { color: 'white', fontSize: 24, fontWeight: 'bold', textAlign: 'center', width: '100%', borderBottomWidth: 1, borderBottomColor: COLORS.bloodRed },
  
  labelInput: { color: COLORS.textSecondary, fontSize: 12, marginTop: 5 },
  input: { backgroundColor: COLORS.metalDark, color: 'white', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: COLORS.metalMedium, marginBottom: 10, width: '100%' },

  // Styles Modales
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.8)' },
  modalContent: { width: '90%', backgroundColor: COLORS.background, padding: 20, borderRadius: 15, borderWidth: 1, borderColor: COLORS.metalMedium },
  modalTitle: { color: COLORS.bloodRed, fontSize: 18, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  modalItem: { paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' },
  modalItemText: { color: 'white', fontSize: 16 },

  // Styles pour le texte légal
  legalText: {
    color: '#ccc', // Gris clair pour ne pas fatiguer les yeux sur fond noir
    fontSize: 14,
    lineHeight: 22, // Bon interlignage pour la lecture
    textAlign: 'left',
  },
  legalHeader: {
    fontWeight: 'bold',
    fontSize: 18,
    color: 'white',
    textDecorationLine: 'underline',
  },
  legalSubtitle: {
    fontWeight: 'bold',
    color: COLORS.bloodRed, // Mise en valeur des titres d'articles
    fontSize: 16,
    marginTop: 10,
  }
});