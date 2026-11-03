import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
export default function Index() {
  const { session, ready } = useAuth();
  const { colors } = useTheme();
  if (!ready) return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.canvas }}><ActivityIndicator color={colors.green} /></View>;
  return <Redirect href={session ? '/inicio' : '/login'} />;
}
