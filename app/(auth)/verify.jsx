import { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';

export default function VerifyScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const [code, setCode] = useState('');

  const handleVerify = async () => {
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/auth/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: params.email,
          code: code,
        }),
      });

      const data = await response.json();

      if (data.result) {
        // 🛡️ C'est ICI qu'on stockera le token plus tard (SecureStore)
        console.log('Token reçu:', data.token);
        
        Alert.alert("Succès", "Compte validé ! Bienvenue chez IronIQ.");
        router.replace('/(tabs)');
      } else {
        Alert.alert("Erreur", data.error || "Code invalide");
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Erreur", "Problème de connexion serveur");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Vérification</Text>
      <Text style={styles.subtitle}>
        Un code a été envoyé à {params.email}.
        Entre-le ci-dessous pour activer ton compte.
      </Text>

      <TextInput
        placeholder="Code à 6 chiffres"
        style={styles.input}
        onChangeText={setCode}
        value={code}
        keyboardType="numeric" 
        maxLength={6}
      />

      <View style={styles.buttonContainer}>
        <Button title="Valider mon compte" onPress={handleVerify} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#f5f5f5' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 10 },
  subtitle: { fontSize: 14, color: 'gray', textAlign: 'center', marginBottom: 30 },
  input: {
    width: '100%', height: 50, backgroundColor: 'white', borderRadius: 8,
    paddingHorizontal: 15, marginBottom: 15, borderWidth: 1, borderColor: '#ddd',
    textAlign: 'center', letterSpacing: 5, fontSize: 20, fontWeight: 'bold' // Style "Code"
  },
  buttonContainer: { width: '100%', marginTop: 10 },
});