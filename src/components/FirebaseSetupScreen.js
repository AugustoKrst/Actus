import { designTokens } from '../theme';
import { ScrollView, StyleSheet, View } from 'react-native';
import { AppText as Text } from './ui';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { missingConfig } from '../lib/firebaseConfig';
import { useTheme } from '../context/ThemeContext';

export default function FirebaseSetupScreen() {
  const { colors } = useTheme(); const s = createStyles(colors);
  return <SafeAreaView style={s.safe}><ScrollView contentContainerStyle={s.page}><View style={s.card}>
    <View style={s.logo}><Feather name="activity" size={24} color={colors.green} accessibilityElementsHidden importantForAccessibility="no" /><Text style={s.logoText}>Actus</Text></View>
    <Text style={s.eyebrow}>CONFIGURAÇÃO NECESSÁRIA</Text>
    <Text style={s.title}>Conecte seu projeto Firebase</Text>
    <Text style={s.body}>O app abriu, mas ainda não recebeu as credenciais do Firebase. Configure o arquivo local <Text style={s.code}>.env</Text> para ativar login e salvar seus treinos.</Text>
    <Text style={s.section}>1. Crie o arquivo de configuração</Text>
    <Text style={s.codeBlock}>PowerShell: Copy-Item .env.example .env</Text>
    <Text style={s.codeBlock}>macOS/Linux: cp .env.example .env</Text>
    <Text style={s.section}>2. Copie os valores do Firebase Console</Text>
    <Text style={s.body}>Abra Configurações do projeto → Geral → Seus apps → app Web → Configuração do SDK. Cole os valores reais no arquivo .env:</Text>
    <View style={s.keys}>{missingConfig.map((key) => <Text key={key} style={s.key}>•  {key}</Text>)}</View>
    <Text style={s.section}>3. Reinicie o Expo</Text>
    <Text style={s.codeBlock}>npx expo start --clear</Text>
    <Text style={s.note}>Os valores de exemplo de .env.example não conectam a um projeto. Não precisa enviar suas chaves por aqui.</Text>
  </View></ScrollView></SafeAreaView>;
}

function createStyles(colors) { const { space, radius, type } = designTokens; return StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.canvas },
  page: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: space.md + 4 },
  card: { width: '100%', maxWidth: 620, padding: space.xl + 4, borderRadius: radius.md + 2, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line },
  logo: { flexDirection: 'row', alignItems: 'center', gap: space.xs, marginBottom: space.xxl - 2 },
  logoMark: { color: colors.green, fontSize: type.size.title },
  logoText: { color: colors.ink, fontSize: type.size.subtitle + 3, fontWeight: '800' },
  eyebrow: { color: colors.green, fontWeight: '800', letterSpacing: 1.4, fontSize: type.size.label },
  title: { color: colors.ink, fontSize: type.size.title + 3, fontWeight: '700', marginTop: space.xs },
  body: { color: colors.muted, fontSize: type.size.caption + 1, lineHeight: type.lineHeight.body - 2, marginTop: space.xs + 2 },
  code: { color: colors.dark, fontWeight: '700' },
  section: { color: colors.ink, fontSize: type.size.caption + 1, fontWeight: '700', marginTop: space.xl - 1, marginBottom: space.xs + 1 },
  codeBlock: { color: colors.dark, backgroundColor: colors.pale, borderRadius: radius.xs, padding: space.sm, fontSize: type.size.caption, fontFamily: 'monospace' },
  keys: { backgroundColor: colors.field, borderColor: colors.line, borderWidth: 1, borderRadius: radius.xs, padding: space.sm, marginTop: space.xs + 2, gap: space.xxs + 2 },
  key: { color: colors.muted, fontFamily: 'monospace', fontSize: type.size.label },
  note: { color: colors.muted, fontSize: type.size.label + 1, lineHeight: type.lineHeight.caption - 1, marginTop: space.md + 4 },
}); }
