import { Pressable, StyleSheet, Text, View } from 'react-native';
import AppShell from '../components/AppShell';
import { Card, PageHeading, SectionTitle } from '../components/ui';
import { useTheme } from '../context/ThemeContext';

export default function SettingsScreen() {
  const { colors, mode, toggleMode } = useTheme();
  const s = createStyles(colors);
  return <AppShell><View style={s.page}>
    <PageHeading eyebrow="PREFERÊNCIAS" title="Configurações" description="Ajuste a aparência do Actus para ficar confortável no seu dia a dia." />
    <Card style={s.card}>
      <SectionTitle title="Aparência" caption="Tema do aplicativo" />
      <View style={s.themeRow}>
        <View style={s.themeCopy}><Text style={s.themeTitle}>Modo {mode === 'light' ? 'claro' : 'escuro'}</Text><Text style={s.themeDescription}>Sua escolha fica salva neste dispositivo.</Text></View>
        <Pressable onPress={toggleMode} style={s.themeButton} accessibilityRole="button" accessibilityLabel={`Ativar modo ${mode === 'light' ? 'escuro' : 'claro'}`}>
          <Text style={s.themeButtonText}>{mode === 'light' ? 'Escuro' : 'Claro'}</Text>
        </Pressable>
      </View>
    </Card>
  </View></AppShell>;
}

function createStyles(colors) { return StyleSheet.create({
  page: { width: '100%', maxWidth: 1120 }, card: { width: '100%', maxWidth: 690, padding: 24 },
  themeRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 14, paddingTop: 8 }, themeCopy: { flex: 1, minWidth: 200 }, themeTitle: { color: colors.ink, fontSize: 14, fontWeight: '700' }, themeDescription: { color: colors.muted, fontSize: 11, marginTop: 5 },
  themeButton: { minHeight: 42, minWidth: 90, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center', borderRadius: 9, backgroundColor: colors.pale }, themeButtonText: { color: colors.green, fontSize: 12, fontWeight: '700' },
}); }
