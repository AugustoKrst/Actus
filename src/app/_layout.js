import { Redirect, Stack, usePathname } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { isFirebaseConfigured } from '../lib/firebaseConfig';
import FirebaseSetupScreen from '../components/FirebaseSetupScreen';
import { ThemeProvider, useTheme } from '../context/ThemeContext';

function AppNavigator() {
  const { session, ready } = useAuth();
  const { colors } = useTheme();
  const pathname = usePathname();
  if (!ready) return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.canvas }}><ActivityIndicator color={colors.green} /></View>;
  if (!session && pathname !== '/login') return <Redirect href="/login" />;
  if (session && (pathname === '/login' || pathname === '/')) return <Redirect href="/inicio" />;
  return <><StatusBar style={colors.canvas === '#101B16' ? 'light' : 'dark'} /><Stack screenOptions={{ headerShown: false }} /></>;
}

export default function RootLayout() {
  return <SafeAreaProvider><ThemeProvider>{!isFirebaseConfigured ? <FirebaseSetupScreen /> : <AuthProvider><AppNavigator /></AuthProvider>}</ThemeProvider></SafeAreaProvider>;
}
