import { Redirect } from 'expo-router';

export default function Index() {

  // 🚧 TEMPORAIRE 
  const isAuthenticated = false; 

  if (isAuthenticated) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/(auth)/register" />;
}