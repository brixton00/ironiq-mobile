import { View, Text, StyleSheet } from 'react-native';

export default function ProgramScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.header}>Ton Programme du Jour</Text>
      
      <View style={styles.card}>
        <Text style={styles.cardText}>Aucun programme généré pour l'instant.</Text>
        <Text style={styles.info}>Va dans l'onglet Profil ou clique sur un bouton (à créer) pour générer ta séance via l'IA.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    alignItems: 'center', 
    justifyContent: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  card: {
    padding: 20,
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#eee',
    alignItems: 'center',
  },
  cardText: {
    fontSize: 16,
    marginBottom: 10,
  },
  info: {
    fontSize: 12,
    color: 'gray',
    textAlign: 'center',
  }
});