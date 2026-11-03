import { Stack } from 'expo-router';
import { AuthProvider } from './src/context/AuthContext';
import { StatusBar } from 'expo-status-bar';

export default function App() {
  return <AuthProvider><StatusBar style="dark" /><Stack screenOptions={{ headerShown: false }} /></AuthProvider>;
}
