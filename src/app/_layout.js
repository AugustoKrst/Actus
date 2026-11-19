import { Redirect, Stack, usePathname } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, Platform, View } from 'react-native';
import { useFonts } from 'expo-font';
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { isFirebaseConfigured } from '../lib/firebaseConfig';
import FirebaseSetupScreen from '../components/FirebaseSetupScreen';
import { ThemeProvider, useTheme } from '../context/ThemeContext';

if (Platform.OS !== 'web') SplashScreen.preventAutoHideAsync().catch(() => {});

function AppNavigator() {
  const { session, ready } = useAuth();
  const { colors } = useTheme();
  const pathname = usePathname();
  if (!ready) return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.canvas }}><ActivityIndicator color={colors.green} /></View>;
  if (!session && pathname !== '/login' && pathname !== '/privacidade') return <Redirect href="/login" />;
  if (session && (pathname === '/login' || pathname === '/')) return <Redirect href="/inicio" />;
  return <><StatusBar style={colors.statusBarStyle} /><Stack screenOptions={{ headerShown: false }} /></>;
}

function RootContent({ fontsReady }) {
  const { ready: themeReady } = useTheme();

  useEffect(() => {
    if (fontsReady && themeReady && Platform.OS !== 'web') SplashScreen.hideAsync().catch(() => {});
  }, [fontsReady, themeReady]);

  if (!themeReady) return null;
  return !isFirebaseConfigured ? <FirebaseSetupScreen /> : <AuthProvider><AppNavigator /></AuthProvider>;
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    InterRegular: Inter_400Regular,
    InterMedium: Inter_500Medium,
    InterSemiBold: Inter_600SemiBold,
    InterBold: Inter_700Bold,
  });
  const fontsReady = fontsLoaded || Boolean(fontError);

  return <SafeAreaProvider><ThemeProvider>{fontsReady ? <RootContent fontsReady={fontsReady} /> : null}</ThemeProvider></SafeAreaProvider>;
}
