import { useState } from 'react'; 
import { View, Text, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter, Link } from 'expo-router';
import { COLORS, SPACING } from '../../constants/theme';

import IronButton from '../../components/ui/IronButton';
import IronInput from '../../components/ui/IronInput';
import IronCard from '../../components/ui/IronCard';

export default function Register() {
  
  const router = useRouter();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordBis, setPasswordBis] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async () => {

    if (!username || !email || !password || !passwordBis) {
      Alert.alert("Erreur", "Merci de remplir tous les champs");
      return;
    }

    setIsLoading(true);

    console.log("🚀 Envoi vers :", `${process.env.EXPO_PUBLIC_API_URL}/auth/signup`); 

    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          email,
          password,
          passwordBis
        }),
      });

      const data = await response.json();
      console.log("📦 Réponse Backend :", data); 

      if (data.result) {
        router.push({
          pathname: '/(auth)/verify',
          params: { email: email }
        });
      } else {
        Alert.alert("Erreur", data.error);
        setIsLoading(false);
      }
    } catch (error) {
        setIsLoading(false);
        console.error("Erreur Fetch ou Parsing :", error);
        Alert.alert("Erreur", "Impossible de contacter le serveur");
    }
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          <View style={styles.header}>
            <Text style={styles.title}>
              IRON<Text style={{color: COLORS.bloodRed}}>IQ</Text>
            </Text>
            <Text style={styles.subtitle}>Initialisation compte agent</Text>
          </View>
          
          <IronCard>
            <IronInput
              label="Nom d'utilisateur"
              placeholder="Ex: agent01"
              onChangeText={(value) => setUsername(value)}
              value={username}
              autoCapitalize="none" 
            />

            <IronInput
              label="Email"
              placeholder="agent@ironiq.com"
              onChangeText={(value) => setEmail(value)}
              value={email}
              keyboardType="email-address" 
              autoCapitalize="none" 
              autoComplete="email"
            />

            <IronInput
              label="Mot de passe"
              placeholder="••••••••"
              onChangeText={(value) => setPassword(value)}
              value={password}
              secureTextEntry={true}
              autoCapitalize="none"
            />

            <IronInput
              label="Confirmation"
              placeholder="••••••••"
              onChangeText={(value) => setPasswordBis(value)}
              value={passwordBis}
              secureTextEntry={true}
              autoCapitalize="none"
            />
            
            <View style={{ height: SPACING.l }} />

            <IronButton 
              title="S'inscrire" 
              onPress={handleRegister} 
              isLoading={isLoading}
            />
          </IronCard>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Tu as déjà un compte ? </Text>
            <Link href="/login" style={styles.link}>
              <Text style={styles.linkText}>Se connecter</Text>
            </Link>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingHorizontal: SPACING.l,
    justifyContent: 'flex-start',
    flexGrow: 1,
    paddingTop: 150,
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
    letterSpacing: 1,
  },
  footer: { 
    marginTop: SPACING.xl, 
    flexDirection: 'row', 
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: SPACING.xl
  },
  footerText: {
    color: COLORS.textSecondary,
  },
  link: {
    marginLeft: SPACING.s
  },
  linkText: {
    color: COLORS.bloodRed,
    fontWeight: 'bold',
    textDecorationLine: 'underline'
  }
});