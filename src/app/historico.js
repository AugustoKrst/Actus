import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import AppShell from '../components/AppShell';
import { Card, PageHeading } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { listCompletedWorkouts } from '../lib/exercises';

export default function WorkoutHistoryScreen() {
  const { session } = useAuth();
  const { colors } = useTheme();
  const s = createStyles(colors);
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadHistory = useCallback(async () => {
    setLoading(true);
    setError('');
    try { setWorkouts(await listCompletedWorkouts(session.user.uid)); }
    catch { setError('Não foi possível carregar seu histórico. Confira sua conexão e tente novamente.'); }
    finally { setLoading(false); }
  }, [session.user.uid]);

  useFocusEffect(useCallback(() => { loadHistory(); }, [loadHistory]));

  return <AppShell><View style={s.page}>
    <PageHeading eyebrow="SUA JORNADA" title="Histórico de treinos" description="Seus treinos concluídos ficam guardados aqui." action={workouts.length > 0 ? <Pressable onPress={() => router.push('/treino')} style={s.newButton}><Text style={s.newButtonText}>＋ Novo treino</Text></Pressable> : null} />
    {loading ? <View style={s.loading}><ActivityIndicator color={colors.green} /><Text style={s.muted}>Carregando seu histórico...</Text></View> : error ? <Card style={s.emptyCard}><Text style={s.emptyTitle}>Não carregamos seu histórico</Text><Text style={s.emptyCopy}>{error}</Text><Pressable onPress={loadHistory} style={s.secondaryButton}><Text style={s.secondaryText}>Tentar novamente</Text></Pressable></Card> : workouts.length === 0 ? <Card style={s.emptyCard}><View style={s.emptyIcon}><Text style={s.emptyGlyph}>◷</Text></View><Text style={s.emptyTitle}>Seu histórico começa aqui</Text><Text style={s.emptyCopy}>Quando você concluir um treino, ele aparecerá nesta lista para você acompanhar sua jornada.</Text><Pressable onPress={() => router.push('/treino')} style={s.primaryButton}><Text style={s.primaryText}>Montar meu primeiro treino</Text></Pressable></Card> : <View style={s.list}>{workouts.map((workout) => <Card key={workout.id} style={s.workoutCard}>
      <View style={s.cardHeading}><View style={s.titleGroup}><Text style={s.workoutTitle}>{workout.title}</Text><Text style={s.date}>{formatDate(workout.completedAt)}</Text></View><View style={s.completedBadge}><Text style={s.completedText}>Concluído</Text></View></View>
      <View style={s.details}><Detail label="DURAÇÃO" value={`${workout.duration} min`} colors={colors} /><Detail label="EXERCÍCIOS" value={`${workout.exercises?.length || 0}`} colors={colors} /><Detail label="NÍVEL" value={workout.level} colors={colors} /></View>
      <Pressable onPress={() => router.push({ pathname: '/sessao', params: { id: workout.id } })} style={s.viewButton}><Text style={s.viewButtonText}>Ver treino</Text><Text style={s.arrow}>→</Text></Pressable>
    </Card>)}</View>}
  </View></AppShell>;
}

function Detail({ label, value, colors }) { const s = createStyles(colors); return <View style={s.detail}><Text style={s.detailLabel}>{label}</Text><Text style={s.detailValue}>{value}</Text></View>; }

function formatDate(timestamp) {
  const date = timestamp?.toDate?.();
  if (!date || Number.isNaN(date.getTime())) return 'Treino concluído';
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }).format(date);
}

function createStyles(colors) { return StyleSheet.create({
  page: { width: '100%', maxWidth: 1120 }, list: { width: '100%', maxWidth: 840, gap: 12 }, loading: { minHeight: 220, alignItems: 'center', justifyContent: 'center', gap: 12 }, muted: { color: colors.muted, fontSize: 12 },
  newButton: { minHeight: 42, paddingHorizontal: 14, borderRadius: 9, backgroundColor: colors.green, alignItems: 'center', justifyContent: 'center' }, newButtonText: { color: 'white', fontWeight: '700', fontSize: 12 },
  emptyCard: { width: '100%', maxWidth: 620, minHeight: 300, padding: 28, justifyContent: 'center', alignItems: 'center' }, emptyIcon: { width: 54, height: 54, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.pale }, emptyGlyph: { color: colors.green, fontSize: 24 }, emptyTitle: { color: colors.ink, fontSize: 17, fontWeight: '700', textAlign: 'center', marginTop: 18 }, emptyCopy: { color: colors.muted, fontSize: 12, lineHeight: 19, textAlign: 'center', maxWidth: 390, marginTop: 8 },
  primaryButton: { minHeight: 46, paddingHorizontal: 18, backgroundColor: colors.green, borderRadius: 9, alignItems: 'center', justifyContent: 'center', marginTop: 20 }, primaryText: { color: 'white', fontSize: 12, fontWeight: '700' }, secondaryButton: { minHeight: 42, paddingHorizontal: 16, backgroundColor: colors.pale, borderRadius: 9, alignItems: 'center', justifyContent: 'center', marginTop: 16 }, secondaryText: { color: colors.green, fontSize: 12, fontWeight: '700' },
  workoutCard: { padding: 19 }, cardHeading: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }, titleGroup: { flex: 1 }, workoutTitle: { color: colors.ink, fontSize: 15, fontWeight: '700' }, date: { color: colors.muted, fontSize: 11, marginTop: 5 }, completedBadge: { paddingHorizontal: 9, paddingVertical: 6, borderRadius: 20, backgroundColor: colors.pale }, completedText: { color: colors.green, fontSize: 9, fontWeight: '800' },
  details: { flexDirection: 'row', gap: 22, paddingVertical: 15, marginTop: 13, borderTopWidth: 1, borderTopColor: colors.line, borderBottomWidth: 1, borderBottomColor: colors.line }, detail: { flex: 1 }, detailLabel: { color: colors.subtle, fontSize: 8, fontWeight: '800', letterSpacing: 0.8 }, detailValue: { color: colors.ink, fontSize: 12, fontWeight: '700', marginTop: 5 },
  viewButton: { minHeight: 42, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 7, paddingHorizontal: 3 }, viewButtonText: { color: colors.green, fontSize: 12, fontWeight: '700' }, arrow: { color: colors.green, fontSize: 18 },
}); }
