import { useState } from 'react'; 
import { View, Text, TextInput, Button, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter, Link } from 'expo-router';

export default function Register() {
  
  const router = useRouter();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordBis, setPasswordBis] = useState('');

  const handleRegister = async () => {

    if (!username || !email || !password) {
      Alert.alert("Erreur", "Merci de remplir tous les champs");
      return;
    }

    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/users/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          email,
          password
        }),
      });

      const data = await response.json();

      if (data.result) {
        router.push({
          pathname: '/(auth)/verify',
          params: { email: email }
        });
      } else {
        Alert.alert("Erreur", data.error);
      }
    } catch (error) {
        console.error("Erreur Fetch:", error);
        Alert.alert("Erreur", "Impossible de contacter le serveur");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>IronIQ - Inscription</Text>
      
      {/*INPUT USERNAME*/}
      <TextInput
        placeholder="Nom d'utilisateur"
        style={styles.input}
        onChangeText={(value) => setUsername(value)}
        value={username}
        autoCapitalize="none" 
      />

      {/*INPUT EMAIL*/}
      <TextInput
        placeholder="Email"
        style={styles.input}
        onChangeText={(value) => setEmail(value)}
        value={email}
        keyboardType="email-address" 
        autoCapitalize="none" 
        autoComplete="email"
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

      {/*INPUT VERIF PASSWORD*/}
      <TextInput
        placeholder="Vérification du mot de passe"
        style={styles.input}
        onChangeText={(value) => setPasswordBis(value)}
        value={passwordBis}
        secureTextEntry={true}
        autoCapitalize="none"
      />
      
      <View style={styles.buttonContainer}>
        <Button title="S'inscrire" onPress={handleRegister} />
      </View>

      <View style={styles.footer}>
        <Text>Tu as déjà un compte ? </Text>
        <Link href="/login" style={styles.link}>
          Se connecter
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