import React from 'react';
import { Tabs } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { View, Platform } from 'react-native';
import { COLORS } from '../../constants/theme'; // Assure-toi que ce chemin est bon

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        // 1. Couleurs Globales (IronIQ Style)
        tabBarActiveTintColor: COLORS.bloodRed, // Rouge Sang quand actif
        tabBarInactiveTintColor: COLORS.textSecondary, // Gris quand inactif
        
        // 2. Style de la barre (Fond Noir Métal)
        tabBarStyle: {
          backgroundColor: COLORS.background, // Noir
          borderTopColor: COLORS.metalMedium, // Ligne grise fine au-dessus
          height: Platform.OS === 'ios' ? 88 : 60, // Un peu plus haut pour le confort
          paddingBottom: Platform.OS === 'ios' ? 28 : 8,
          paddingTop: 8,
        },
        headerShown: false, // On cache le header par défaut (tu as tes propres headers)
      }}
    >
      {/* Omglet 1 : Programme (Gauche) */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Programme',
          tabBarIcon: ({ color }) => <FontAwesome size={24} name="list-alt" color={color} />,
        }}
      />

      {/* Omglet 2 : BOUTON CENTRAL (Generate) */}
      <Tabs.Screen
        name="generate" // Doit correspondre à ton fichier generate.jsx
        options={{
          title: 'Générer',
          tabBarLabelStyle: { fontWeight: 'bold' },
          tabBarIcon: ({ focused }) => (
            // Astuce pour faire ressortir l'icône centrale
            <View style={{
              alignItems: 'center',
              justifyContent: 'center',
              top: -10, // On le remonte un peu pour l'effet "Flottant"
              backgroundColor: focused ? COLORS.bloodRed : COLORS.metalDark,
              width: 50,
              height: 50,
              borderRadius: 25,
              borderWidth: 2,
              borderColor: focused ? COLORS.bloodRedLight : COLORS.metalMedium,
              elevation: 5, // Ombre Android
              shadowColor: '#000', // Ombre iOS
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.5,
              shadowRadius: 3,
            }}>
              <FontAwesome 
                size={24} 
                name="bolt" // L'éclair !
                color={COLORS.text} // Toujours blanc à l'intérieur du cercle
              />
            </View>
          ),
        }}
      />

      {/* Omglet 3 : Profil (Droite) */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color }) => <FontAwesome size={24} name="user" color={color} />,
        }}
      />
    </Tabs>
  );
}