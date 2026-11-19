import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import AppShell from '../components/AppShell';
import { Card, PageHeading, SectionTitle } from '../components/ui';
import { useTheme } from '../context/ThemeContext';

export default function SettingsScreen() {
  const { colors, mode, setMode } = useTheme();
  const s = createStyles(colors);
  const modeLabel = mode === 'system' ? 'do sistema' : mode === 'light' ? 'claro' : 'escuro';
  return <AppShell><View style={s.page}>
    <PageHeading eyebrow="PREFERÊNCIAS" title="Configurações" description="Ajuste a aparência do Actus para ficar confortável no seu dia a dia." />
    <Card style={s.card}>
      <SectionTitle title="Aparência" caption="Tema do aplicativo" />
      <Text style={s.themeTitle}>Modo {modeLabel}</Text>
      <Text style={s.themeDescription}>Sua escolha fica salva neste dispositivo.</Text>
      <View style={s.modeOptions}>
        {[
          ['light', 'Claro'],
          ['dark', 'Escuro'],
          ['system', 'Sistema'],
        ].map(([value, label]) => <Pressable key={value} onPress={() => setMode(value)} style={[s.modeOption, mode === value && s.modeOptionSelected]} accessibilityRole="button" accessibilityState={{ selected: mode === value }}>
          <Text style={[s.themeButtonText, mode === value && s.themeButtonTextSelected]}>{label}</Text>
        </Pressable>)}
      </View>
    </Card>
    <Card style={s.card}>
      <SectionTitle title="Privacidade" caption="Seus dados no Actus" />
      <View style={s.themeRow}><View style={s.themeCopy}><Text style={s.themeTitle}>Política de Privacidade</Text><Text style={s.themeDescription}>Veja quais dados são usados e como solicitar sua exclusão.</Text></View><Pressable onPress={() => router.push('/privacidade')} style={s.themeButton} accessibilityRole="button"><Text style={s.themeButtonText}>Ler política</Text></Pressable></View>
    </Card>
  </View></AppShell>;
}

function createStyles(colors) { return StyleSheet.create({
  page: { width: '100%', maxWidth: 1120 }, card: { width: '100%', maxWidth: 690, padding: 24 },
  themeTitle: { color: colors.ink, fontSize: 14, fontWeight: '700' }, themeDescription: { color: colors.muted, fontSize: 11, marginTop: 5 },
  modeOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16 },
  modeOption: { minHeight: 48, minWidth: 88, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center', borderRadius: 12, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.field },
  modeOptionSelected: { borderColor: colors.green, backgroundColor: colors.pale },
  themeButtonText: { color: colors.muted, fontSize: 12, fontWeight: '700' }, themeButtonTextSelected: { color: colors.green },
}); }
