import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import AppShell from '../components/AppShell';
import { Card, PageHeading } from '../components/ui';
import { useTheme } from '../context/ThemeContext';

export default function HomeScreen() {
  const { colors } = useTheme();
  const s = createStyles(colors);
  const compact = useWindowDimensions().width <= 700;

  return <AppShell><View style={s.page}>
    <PageHeading eyebrow="SEU ESPAÇO DE MOVIMENTO" title="Um passo de cada vez." description="Cuide do seu corpo com treinos que cabem na sua rotina." />

    <View style={[s.hero, compact && s.heroCompact]}>
      <View style={s.heroCopy}>
        <View style={s.eyebrowPill}><View style={s.liveDot} /><Text style={s.heroEyebrow}>MOVIMENTO NO SEU RITMO</Text></View>
        <Text style={s.heroTitle}>Hoje é um bom dia para começar.</Text>
        <Text style={s.heroDescription}>Escolha seu tempo, seu espaço e o que quer treinar. A gente prepara o próximo passo junto com você.</Text>
        <Pressable onPress={() => router.push('/treino')} style={s.primaryButton} accessibilityRole="button">
          <Text style={s.primaryButtonText}>Iniciar meu treino</Text><Text style={s.primaryArrow}>→</Text>
        </Pressable>
        <Pressable onPress={() => router.push('/historico')} style={s.historyLink} accessibilityRole="button"><Text style={s.historyLinkText}>Ver meu histórico</Text></Pressable>
      </View>
      <View style={[s.heroAside, compact && s.heroAsideCompact]}>
        <View style={s.orbitLarge} /><View style={s.orbitSmall} />
        <View style={s.stepCard}><Text style={s.stepIcon}>✳</Text><Text style={s.stepLabel}>SEU PRÓXIMO PASSO</Text><Text style={s.stepTitle}>Comece leve.</Text><Text style={s.stepCaption}>A constância nasce aos poucos.</Text></View>
        <View style={s.timeBadge}><Text style={s.timeNumber}>20</Text><Text style={s.timeLabel}>MIN</Text></View>
      </View>
    </View>

    <View style={s.sectionHeading}><Text style={s.sectionEyebrow}>MOVIMENTO TAMBÉM É CUIDADO</Text><Text style={s.sectionTitle}>Quebre o tempo parado</Text></View>
    <View style={[s.infoGrid, compact && s.infoGridCompact]}>
      <Card style={s.infoCard}>
        <View style={s.infoIcon}><Text style={s.infoIconText}>↗</Text></View>
        <Text style={s.infoTitle}>O corpo gosta de movimento</Text>
        <Text style={s.infoBody}>Passar muito tempo sentado ou deitado faz parte do comportamento sedentário. Pequenas pausas para se movimentar ajudam a interromper esse tempo.</Text>
        <Text style={s.source}>Fonte: Guia de Atividade Física do Ministério da Saúde.</Text>
      </Card>
      <View style={s.tipCard}>
        <Text style={s.tipEyebrow}>UMA PAUSA QUE FAZ BEM</Text>
        <View style={s.tipNumberRow}><Text style={s.tipNumber}>5</Text><Text style={s.tipUnit}>minutos</Text></View>
        <Text style={s.tipText}>A cada hora, experimente levantar, alongar ou caminhar por alguns minutos.</Text>
        <View style={s.tipDivider} />
        <Text style={s.tipFoot}>Qualquer começo conta. Respeite seu ritmo.</Text>
      </View>
    </View>

    <View style={s.bottomCta}>
      <View style={s.bottomCopy}><Text style={s.bottomTitle}>Seu treino começa com você.</Text><Text style={s.bottomText}>Monte uma sequência personalizada para hoje.</Text></View>
      <Pressable onPress={() => router.push('/treino')} style={s.bottomButton} accessibilityRole="button"><Text style={s.bottomButtonText}>Escolher meu treino</Text><Text style={s.bottomArrow}>→</Text></Pressable>
    </View>
  </View></AppShell>;
}

function createStyles(colors) { return StyleSheet.create({
  page: { width: '100%', maxWidth: 1120, paddingBottom: 20 },
  hero: { width: '100%', minHeight: 330, borderRadius: 20, overflow: 'hidden', flexDirection: 'row', backgroundColor: colors.heroCanvas, marginTop: -3, marginBottom: 38 }, heroCompact: { minHeight: 0, flexDirection: 'column' },
  heroCopy: { flex: 1.1, justifyContent: 'center', alignItems: 'flex-start', padding: 34, zIndex: 1 },
  eyebrowPill: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 11, paddingVertical: 7, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)' }, liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.lime }, heroEyebrow: { color: '#D3E5D9', fontSize: 9, letterSpacing: 1, fontWeight: '800' },
  heroTitle: { maxWidth: 490, color: 'white', fontSize: 35, lineHeight: 42, fontWeight: '800', letterSpacing: -1.1, marginTop: 19 }, heroDescription: { maxWidth: 480, color: '#C4D8CC', fontSize: 13, lineHeight: 21, marginTop: 11 },
  primaryButton: { minHeight: 49, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 20, paddingHorizontal: 18, marginTop: 21, borderRadius: 10, backgroundColor: colors.lime }, primaryButtonText: { color: '#173126', fontSize: 12, fontWeight: '800' }, primaryArrow: { color: '#173126', fontSize: 18 }, historyLink: { paddingVertical: 10, paddingHorizontal: 2, marginTop: 5 }, historyLinkText: { color: '#D4E6DA', fontSize: 11, fontWeight: '600' },
  heroAside: { flex: 0.9, minWidth: 265, minHeight: 330, position: 'relative', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', backgroundColor: colors.heroAccent }, heroAsideCompact: { minWidth: 0, minHeight: 205 }, orbitLarge: { width: 260, height: 260, borderRadius: 130, borderWidth: 1, borderColor: 'rgba(204,239,215,0.18)', position: 'absolute', right: -39, top: 35 }, orbitSmall: { width: 182, height: 182, borderRadius: 91, borderWidth: 1, borderColor: 'rgba(204,239,215,0.2)', position: 'absolute', right: 1, top: 74 },
  stepCard: { width: 220, minHeight: 156, padding: 18, borderRadius: 16, backgroundColor: '#2C7655', zIndex: 1, transform: [{ rotate: '-3deg' }], shadowColor: '#0C291B', shadowOpacity: 0.2, shadowRadius: 15, shadowOffset: { width: 0, height: 8 }, elevation: 6 }, stepIcon: { color: colors.lime, fontSize: 21 }, stepLabel: { color: '#C8DBCF', fontSize: 8, letterSpacing: 1, fontWeight: '800', marginTop: 14 }, stepTitle: { color: 'white', fontSize: 20, fontWeight: '800', marginTop: 5 }, stepCaption: { color: '#D1E1D6', fontSize: 10, marginTop: 5 }, timeBadge: { width: 66, height: 66, borderRadius: 33, backgroundColor: colors.lime, alignItems: 'center', justifyContent: 'center', position: 'absolute', bottom: 15, left: 20, zIndex: 2, transform: [{ rotate: '8deg' }] }, timeNumber: { color: '#173126', fontSize: 20, fontWeight: '800', lineHeight: 22 }, timeLabel: { color: '#173126', fontSize: 8, fontWeight: '800', letterSpacing: 1 },
  sectionHeading: { marginBottom: 15 }, sectionEyebrow: { color: colors.green, fontSize: 9, letterSpacing: 1.3, fontWeight: '800' }, sectionTitle: { color: colors.ink, fontSize: 22, fontWeight: '800', letterSpacing: -0.6, marginTop: 6 },
  infoGrid: { flexDirection: 'row', alignItems: 'stretch', gap: 14 }, infoGridCompact: { flexDirection: 'column' }, infoCard: { flex: 1.15, padding: 21 }, infoIcon: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center', borderRadius: 11, backgroundColor: colors.pale }, infoIconText: { color: colors.green, fontSize: 18, fontWeight: '700' }, infoTitle: { color: colors.ink, fontSize: 14, fontWeight: '800', marginTop: 14 }, infoBody: { color: colors.muted, fontSize: 11, lineHeight: 18, marginTop: 7 }, source: { color: colors.subtle, fontSize: 9, lineHeight: 14, marginTop: 12 },
  tipCard: { flex: 0.85, minWidth: 250, padding: 21, borderRadius: 15, backgroundColor: colors.pale, justifyContent: 'center' }, tipEyebrow: { color: colors.green, fontSize: 9, fontWeight: '800', letterSpacing: 1 }, tipNumberRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginTop: 8 }, tipNumber: { color: colors.dark, fontSize: 43, lineHeight: 48, fontWeight: '800', letterSpacing: -2 }, tipUnit: { color: colors.green, fontSize: 13, fontWeight: '700' }, tipText: { color: colors.ink, fontSize: 11, lineHeight: 17, marginTop: 7 }, tipDivider: { height: 1, backgroundColor: colors.line, marginVertical: 13 }, tipFoot: { color: colors.muted, fontSize: 10, lineHeight: 15 },
  bottomCta: { width: '100%', flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 14, padding: 20, marginTop: 16, borderRadius: 15, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.white }, bottomCopy: { flex: 1, minWidth: 200 }, bottomTitle: { color: colors.ink, fontSize: 14, fontWeight: '800' }, bottomText: { color: colors.muted, fontSize: 11, marginTop: 4 }, bottomButton: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 14, paddingHorizontal: 15, borderRadius: 9, backgroundColor: colors.green }, bottomButtonText: { color: 'white', fontSize: 11, fontWeight: '700' }, bottomArrow: { color: 'white', fontSize: 16 },
}); }
