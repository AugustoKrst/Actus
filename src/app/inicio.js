import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { AppText as Text, Button, Card, PageHeading } from '../components/ui';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AppShell from '../components/AppShell';
import { useTheme } from '../context/ThemeContext';

export default function HomeScreen() {
  const { colors, tokens } = useTheme();
  const s = createStyles(colors, tokens);
  const compact = useWindowDimensions().width <= 700;

  return <AppShell><View style={s.page}>
    <PageHeading eyebrow="SEU ESPAÇO DE MOVIMENTO" title="Um passo de cada vez." description="Cuide do seu corpo com treinos que cabem na sua rotina." />

    <View style={[s.hero, compact && s.heroCompact]}>
      <LinearGradient colors={[colors.heroStart, colors.heroEnd]} style={s.heroGradient} />
      <View style={s.heroCopy}>
        <View style={s.eyebrowPill}><View style={s.liveDot} /><Text style={s.heroEyebrow}>MOVIMENTO NO SEU RITMO</Text></View>
        <Text style={s.heroTitle}>Hoje é um bom dia para começar.</Text>
        <Text style={s.heroDescription}>Escolha seu tempo, seu espaço e o que quer treinar. A gente prepara o próximo passo junto com você.</Text>
        <Button title="Iniciar meu treino" onPress={() => router.push('/treino')} icon={<Feather name="arrow-right" size={17} color={colors.textOnPrimary} accessibilityElementsHidden importantForAccessibility="no" />} iconPosition="trailing" style={s.primaryButton} />
        <Pressable onPress={() => router.push('/historico')} style={s.historyLink} accessibilityRole="button"><Text style={s.historyLinkText}>Ver meu histórico</Text></Pressable>
      </View>
      <View style={[s.heroAside, compact && s.heroAsideCompact]}>
        <View style={s.orbitLarge} /><View style={s.orbitSmall} />
        <View style={s.stepCard}><Feather name="activity" size={21} color={colors.lime} accessibilityElementsHidden importantForAccessibility="no" /><Text style={s.stepLabel}>SEU PRÓXIMO PASSO</Text><Text style={s.stepTitle}>Comece leve.</Text><Text style={s.stepCaption}>A constância nasce aos poucos.</Text></View>
        <View style={s.timeBadge}><Text style={s.timeNumber}>20</Text><Text style={s.timeLabel}>MIN</Text></View>
      </View>
    </View>

    <View style={s.sectionHeading}><Text style={s.sectionEyebrow}>MOVIMENTO TAMBÉM É CUIDADO</Text><Text style={s.sectionTitle}>Quebre o tempo parado</Text></View>
    <View style={[s.infoGrid, compact && s.infoGridCompact]}>
      <Card style={s.infoCard}>
        <View style={s.infoIcon}><Feather name="trending-up" size={18} color={colors.green} accessibilityElementsHidden importantForAccessibility="no" /></View>
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
      <Button title="Escolher meu treino" onPress={() => router.push('/treino')} icon={<Feather name="arrow-right" size={16} color={colors.textOnPrimary} accessibilityElementsHidden importantForAccessibility="no" />} iconPosition="trailing" style={s.bottomButton} />
    </View>
    <View style={s.disclaimer}><Feather name="heart" size={16} color={colors.green} accessibilityElementsHidden importantForAccessibility="no" /><Text style={s.disclaimerText}>O Actus oferece informações gerais de atividade física e não substitui avaliação ou orientação de um profissional de saúde. Respeite seus limites e pare se sentir dor ou desconforto.</Text></View>
  </View></AppShell>;
}

function createStyles(colors, tokens) { const { space, radius, type, metrics } = tokens; return StyleSheet.create({
  page: { width: '100%', maxWidth: 1120, paddingBottom: space.md + 4 },
  hero: { width: '100%', minHeight: 330, borderRadius: radius.xl, overflow: 'hidden', flexDirection: 'row', backgroundColor: colors.heroStart, marginTop: -space.xxs, marginBottom: space.xxxl, position: 'relative' }, heroCompact: { minHeight: 0, flexDirection: 'column' }, heroGradient: { ...StyleSheet.absoluteFillObject },
  heroCopy: { flex: 1.1, justifyContent: 'center', alignItems: 'flex-start', padding: space.xxxl, zIndex: 1 },
  eyebrowPill: { flexDirection: 'row', alignItems: 'center', gap: space.xs, paddingHorizontal: space.sm, paddingVertical: space.xxs + 3, borderRadius: radius.pill, backgroundColor: 'rgba(255,255,255,0.1)' }, liveDot: { width: 6, height: 6, borderRadius: radius.pill, backgroundColor: colors.accent }, heroEyebrow: { color: colors.heroMuted, fontSize: type.size.label, letterSpacing: 1, fontWeight: type.weight.bold },
  heroTitle: { maxWidth: 490, color: colors.heroText, fontSize: type.size.display + 1, lineHeight: type.lineHeight.display + 2, fontWeight: type.weight.bold, letterSpacing: -1.1, marginTop: space.lg }, heroDescription: { maxWidth: 480, color: colors.heroMuted, fontSize: type.size.caption + 1, lineHeight: type.lineHeight.body - 2, marginTop: space.sm },
  primaryButton: { minHeight: metrics.touchTarget, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space.xl, paddingHorizontal: space.lg, marginTop: space.lg, borderRadius: radius.sm, backgroundColor: colors.primary }, historyLink: { minHeight: metrics.touchTarget, justifyContent: 'center', paddingHorizontal: space.xxs, marginTop: space.xxs }, historyLinkText: { color: colors.heroMuted, fontSize: type.size.label + 1, fontWeight: type.weight.medium },
  heroAside: { flex: 0.9, minWidth: 265, minHeight: 330, position: 'relative', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', backgroundColor: colors.heroEnd }, heroAsideCompact: { minWidth: 0, minHeight: 205 }, orbitLarge: { width: 260, height: 260, borderRadius: radius.pill, borderWidth: 1, borderColor: 'rgba(204,239,215,0.18)', position: 'absolute', right: -39, top: 35 }, orbitSmall: { width: 182, height: 182, borderRadius: radius.pill, borderWidth: 1, borderColor: 'rgba(204,239,215,0.2)', position: 'absolute', right: 1, top: 74 },
  stepCard: { width: 220, minHeight: 156, padding: space.md + 2, borderRadius: radius.md, backgroundColor: colors.heroStart, zIndex: 1, transform: [{ rotate: '-3deg' }], shadowColor: metrics.shadow.color, shadowOpacity: metrics.shadow.opacity, shadowRadius: metrics.shadow.radius, shadowOffset: metrics.shadow.offset, elevation: metrics.shadow.elevation }, stepIcon: { color: colors.accent, fontSize: type.size.subtitle + 3 }, stepLabel: { color: colors.heroMuted, fontSize: type.size.label - 2, letterSpacing: 1, fontWeight: type.weight.bold, marginTop: space.sm }, stepTitle: { color: colors.heroText, fontSize: type.size.title - 4, fontWeight: type.weight.bold, marginTop: space.xxs }, stepCaption: { color: colors.heroMuted, fontSize: type.size.label, marginTop: space.xxs }, timeBadge: { width: 66, height: 66, borderRadius: radius.pill, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', position: 'absolute', bottom: space.sm, left: space.md, zIndex: 2, transform: [{ rotate: '8deg' }] }, timeNumber: { color: colors.heroStart, fontSize: type.size.title - 4, fontWeight: type.weight.bold, lineHeight: type.lineHeight.body - 1 }, timeLabel: { color: colors.heroStart, fontSize: type.size.label - 2, fontWeight: type.weight.bold, letterSpacing: 1 },
  sectionHeading: { marginBottom: space.md - 1 }, sectionEyebrow: { color: colors.green, fontSize: type.size.label - 1, letterSpacing: 1.3, fontWeight: '800' }, sectionTitle: { color: colors.ink, fontSize: type.size.title - 2, fontWeight: '800', letterSpacing: -0.6, marginTop: space.xxs + 2 },
  infoGrid: { flexDirection: 'row', alignItems: 'stretch', gap: space.sm + 2 }, infoGridCompact: { flexDirection: 'column' }, infoCard: { flex: 1.15, padding: space.xl - 3 }, infoIcon: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center', borderRadius: radius.sm - 1, backgroundColor: colors.pale }, infoIconText: { color: colors.green, fontSize: type.size.subtitle, fontWeight: '700' }, infoTitle: { color: colors.ink, fontSize: type.size.body - 1, fontWeight: '800', marginTop: space.sm + 2 }, infoBody: { color: colors.muted, fontSize: type.size.label + 1, lineHeight: type.lineHeight.caption, marginTop: space.xs - 1 }, source: { color: colors.subtle, fontSize: type.size.label - 1, lineHeight: type.lineHeight.label, marginTop: space.sm },
  tipCard: { flex: 0.85, minWidth: 250, padding: space.xl - 3, borderRadius: radius.md - 1, backgroundColor: colors.pale, justifyContent: 'center' }, tipEyebrow: { color: colors.green, fontSize: type.size.label - 1, fontWeight: '800', letterSpacing: 1 }, tipNumberRow: { flexDirection: 'row', alignItems: 'baseline', gap: space.xs, marginTop: space.xs }, tipNumber: { color: colors.dark, fontSize: type.size.hero - 3, lineHeight: type.lineHeight.hero - 6, fontWeight: '800', letterSpacing: -2 }, tipUnit: { color: colors.green, fontSize: type.size.caption + 1, fontWeight: '700' }, tipText: { color: colors.ink, fontSize: type.size.label + 1, lineHeight: type.lineHeight.caption - 1, marginTop: space.xs - 1 }, tipDivider: { height: 1, backgroundColor: colors.line, marginVertical: space.sm + 1 }, tipFoot: { color: colors.muted, fontSize: type.size.label, lineHeight: type.lineHeight.label + 1 },
  bottomCta: { width: '100%', flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: space.sm + 2, padding: space.md + 4, marginTop: space.md, borderRadius: radius.md - 1, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.white }, bottomCopy: { flex: 1, minWidth: 200 }, bottomTitle: { color: colors.ink, fontSize: type.size.body - 1, fontWeight: '800' }, bottomText: { color: colors.muted, fontSize: type.size.label + 1, marginTop: space.xxs }, bottomButton: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space.sm + 2, paddingHorizontal: space.md - 1, borderRadius: radius.xs + 1, backgroundColor: colors.green }, bottomButtonText: { color: colors.textOnPrimary, fontSize: type.size.label + 1, fontWeight: '700' }, disclaimer: { flexDirection: 'row', alignItems: 'flex-start', gap: space.xs + 2, padding: space.sm + 2, marginTop: space.md, borderRadius: radius.sm, backgroundColor: colors.soft }, disclaimerText: { flex: 1, color: colors.muted, fontSize: type.size.label, lineHeight: type.lineHeight.label + 2 },
}); }
