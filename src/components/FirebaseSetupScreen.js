import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { missingConfig } from '../lib/firebaseConfig';
import { useTheme } from '../context/ThemeContext';

export default function FirebaseSetupScreen() {
  const { colors } = useTheme(); const s = createStyles(colors);
  return <SafeAreaView style={s.safe}><ScrollView contentContainerStyle={s.page}><View style={s.card}>
    <View style={s.logo}><Text style={s.logoMark}>✳</Text><Text style={s.logoText}>Actus</Text></View>
    <Text style={s.eyebrow}>CONFIGURAÇÃO NECESSÁRIA</Text>
    <Text style={s.title}>Conecte seu projeto Firebase</Text>
    <Text style={s.body}>O app abriu, mas ainda não recebeu as credenciais do Firebase. Configure o arquivo local <Text style={s.code}>.env</Text> para ativar login e salvar seus treinos.</Text>
    <Text style={s.section}>1. Crie o arquivo de configuração</Text>
    <Text style={s.codeBlock}>Copy-Item .env.example .env</Text>
    <Text style={s.section}>2. Copie os valores do Firebase Console</Text>
    <Text style={s.body}>Abra Configurações do projeto → Geral → Seus apps → app Web → Configuração do SDK. Cole os valores reais no arquivo .env:</Text>
    <View style={s.keys}>{missingConfig.map((key) => <Text key={key} style={s.key}>•  {key}</Text>)}</View>
    <Text style={s.section}>3. Reinicie o Expo</Text>
    <Text style={s.codeBlock}>npx expo start --clear</Text>
    <Text style={s.note}>Os valores de exemplo de .env.example não conectam a um projeto. Não precisa enviar suas chaves por aqui.</Text>
  </View></ScrollView></SafeAreaView>;
}

function createStyles(colors) { return StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.canvas },
  page: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  card: { width: '100%', maxWidth: 620, padding: 28, borderRadius: 18, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line },
  logo: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 30 },
  logoMark: { color: colors.green, fontSize: 24 },
  logoText: { color: colors.ink, fontSize: 21, fontWeight: '800' },
  eyebrow: { color: colors.green, fontWeight: '800', letterSpacing: 1.4, fontSize: 10 },
  title: { color: colors.ink, fontSize: 27, fontWeight: '700', marginTop: 8 },
  body: { color: colors.muted, fontSize: 13, lineHeight: 21, marginTop: 10 },
  code: { color: colors.dark, fontWeight: '700' },
  section: { color: colors.ink, fontSize: 13, fontWeight: '700', marginTop: 23, marginBottom: 9 },
  codeBlock: { color: colors.dark, backgroundColor: colors.pale, borderRadius: 8, padding: 12, fontSize: 12, fontFamily: 'monospace' },
  keys: { backgroundColor: colors.field, borderColor: colors.line, borderWidth: 1, borderRadius: 8, padding: 12, marginTop: 10, gap: 6 },
  key: { color: colors.muted, fontFamily: 'monospace', fontSize: 10 },
  note: { color: colors.muted, fontSize: 11, lineHeight: 17, marginTop: 20 },
}); }
