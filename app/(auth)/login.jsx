import React, { useState } from 'react';
import { View, StyleSheet, Text, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS, SPACING } from '../../constants/theme';

import IronButton from '../../components/ui/IronButton';
import IronInput from '../../components/ui/IronInput';
import IronCard from '../../components/ui/IronCard';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      console.log('Login attempt:', email);
    }, 2000);
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
            placeholder="agent@ironiq.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
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