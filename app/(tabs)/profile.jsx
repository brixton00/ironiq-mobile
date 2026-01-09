import { View, Text, Button, StyleSheet, Image } from 'react-native';
import { useRouter } from 'expo-router';

export default function ProfileScreen() {
  const router = useRouter();

  const handleLogout = () => {
    // 🚧 Plus tard : Supprimer le token du SecureStore ici
    console.log('Déconnexion...');
    router.replace('/(auth)/login');
  };

  return (
    <View style={styles.container}>
      {/*Placeholder PDP*/}
      <View style={styles.avatarPlaceholder}>
        <Text style={styles.avatarText}>JD</Text>
      </View>

      <Text style={styles.username}>John Doe</Text>
      <Text style={styles.email}>john.doe@gmail.com</Text>

      <View style={styles.separator} />

      <View style={styles.buttonContainer}>
        <Button title="Se déconnecter" color="red" onPress={handleLogout} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    alignItems: 'center', 
    paddingTop: 50, 
    backgroundColor: '#fff',
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  avatarText: {
    color: 'white',
    fontSize: 30,
    fontWeight: 'bold',
  },
  username: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  email: {
    fontSize: 16,
    color: 'gray',
    marginBottom: 30,
  },
  separator: {
    height: 1,
    width: '80%',
    backgroundColor: '#eee',
    marginBottom: 30,
  },
  buttonContainer: {
    width: '80%',
  }
});