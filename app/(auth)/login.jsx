import { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter, Link } from 'expo-router';

export default function Login() {

  const router = useRouter();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    // 🚧 TEMPORAIRE
    console.log('Tentative de connexion avec :', { identifier, password });
    router.replace('/(tabs)');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>IronIQ - Connexion</Text>

      {/*INPUT IDENTIFIER*/}
      <TextInput
        placeholder="Email ou Nom d'utilisateur"
        style={styles.input}
        onChangeText={(value) => setIdentifier(value)}
        value={identifier}
        autoCapitalize="none" 
        autoCorrect={false}   
      />

      {/*INPUT PASSWORD*/}
      <TextInput
        placeholder="Mot de passe"
        style={styles.input}
        onChangeText={(value) => setPassword(value)}
        value={password}
        secureTextEntry={true}
        autoCapitalize="none"
      />

      <View style={styles.buttonContainer}>
        <Button title="Se Connecter" onPress={handleLogin} />
      </View>
      
      <View style={styles.footer}>
        <Text>Pas encore de compte ? </Text>
        <Link href="/register" style={styles.link}>
          S'inscrire
        </Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20 
  },
  title: { 
    fontSize: 28, 
    fontWeight: 'bold', 
    marginBottom: 30,
    color: '#333' 
  },
  input: {
    width: '100%',
    height: 50,
    backgroundColor: 'white',
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  buttonContainer: {
    width: '100%',
    marginTop: 10,
  },
  footer: { marginTop: 25, flexDirection: 'row' },
  link: { color: '#007AFF', fontWeight: 'bold' }
});