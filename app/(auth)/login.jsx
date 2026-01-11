import { Alert } from 'react-native'; 
import * as SecureStore from 'expo-secure-store'; 
import React, { useState } from 'react';
import { View, StyleSheet, Text, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS, SPACING } from '../../constants/theme';

import IronButton from '../../components/ui/IronButton';
import IronInput from '../../components/ui/IronInput';
import IronCard from '../../components/ui/IronCard';

export default function LoginScreen() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {

    if (!identifier || !password) {
      Alert.alert("Erreur", "Veuillez remplir tous les champs");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/auth/signin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      });

      const data = await response.json();

      if (data.result) {
        // 🔐 Stockage sécurisé
        await SecureStore.setItemAsync('userToken', data.token);
        await SecureStore.setItemAsync('username', data.username);
        
        console.log('✅ Connexion réussie, redirection...');
        
        // Redirection vers l'app (Tabs)
        router.replace('/(tabs)');
      } else {
        Alert.alert("Erreur", data.error || "Connexion impossible");
      }
    } catch (error) {
      console.error("Erreur réseau :", error);
      Alert.alert("Erreur", "Le serveur ne répond pas");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.screen}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        
        <View style={styles.header}>
          <Text style={styles.title}>
            IRON<Text style={{color: COLORS.bloodRed}}>IQ</Text>
            </Text>
            <Text style={styles.subtitle}>Private access agent</Text>
            </View>

        <IronCard>
          <IronInput 
            label="Identifiant" 
            placeholder="Email ou Username"
            value={identifier}
            onChangeText={setIdentifier}
            autoCorrect={false}
            autoCapitalize="none"
          />
          <IronInput 
            label="Code d'accès" 
            placeholder="••••••••" 
            secureTextEntry 
            value={password}
            onChangeText={setPassword}
          />
          
          <View style={{ height: SPACING.l }} />
          
          <IronButton 
            title="Connexion" 
            onPress={handleLogin} 
            isLoading={isLoading} 
          />
          
          <View style={{ height: SPACING.s }} />
          
          <IronButton 
            title="Créer un compte" 
            variant="metal" 
            onPress={() => router.push('/register')} 
          />
        </IronCard>

      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'flex-start',
    paddingTop: 150, 
    paddingHorizontal: SPACING.l, 
  },
  header: {
    marginBottom: SPACING.xl,
    alignItems: 'center',
  },
  title: { 
    fontSize: 42, 
    fontWeight: '900', 
    color: COLORS.text, 
    letterSpacing: 2,
    marginBottom: SPACING.xs
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 14,
    textTransform: 'uppercase',
    marginTop: SPACING.s,
    letterSpacing: 1,
    fontWeight: '600'
  },
});