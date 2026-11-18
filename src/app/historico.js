import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import AppShell from '../components/AppShell';
import { Button, Card, EmptyState, ErrorState, PageHeading, SectionTitle } from '../components/ui';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { deleteSavedWorkout, listCompletedWorkouts } from '../lib/exercises';

export default function WorkoutHistoryScreen() {
  const { session } = useAuth();
  const { colors } = useTheme();
  const s = createStyles(colors);
  const [workouts, setWorkouts] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [averageDuration, setAverageDuration] = useState(0);
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [confirmingDeleteId, setConfirmingDeleteId] = useState(null);
  const [deletingWorkoutId, setDeletingWorkoutId] = useState(null);

  const loadHistory = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    setError('');
    try {
      const page = await listCompletedWorkouts(session.user.uid);
      setWorkouts(page.workouts);
      setTotalCount(page.totalCount);
      setAverageDuration(page.averageDuration);
      setCursor(page.cursor);
      setHasMore(page.hasMore);
    }
    catch { setError('Não foi possível carregar seu histórico. Confira sua conexão e tente novamente.'); }
    finally { setLoading(false); setRefreshing(false); }
  }, [session.user.uid]);

  useFocusEffect(useCallback(() => { loadHistory(); }, [loadHistory]));

  async function loadMoreHistory() {
    if (!hasMore || loadingMore || !cursor) return;
    setLoadingMore(true);
    try {
      const page = await listCompletedWorkouts(session.user.uid, cursor);
      setWorkouts((current) => [...current, ...page.workouts]);
      setCursor(page.cursor);
      setHasMore(page.hasMore);
    } catch {
      setError('Não foi possível carregar mais treinos. Tente novamente.');
    } finally {
      setLoadingMore(false);
    }
  }

  async function deleteWorkout(workoutId) {
    setDeletingWorkoutId(workoutId);
    setError('');
    try {
      await deleteSavedWorkout(session.user.uid, workoutId);
      const removedWorkout = workouts.find((workout) => workout.id === workoutId);
      setWorkouts((current) => current.filter((workout) => workout.id !== workoutId));
      setTotalCount((current) => Math.max(0, current - 1));
      if (totalCount > 1 && removedWorkout) {
        setAverageDuration(Math.round((averageDuration * totalCount - (Number(removedWorkout.duration) || 0)) / (totalCount - 1)));
      } else setAverageDuration(0);
      setConfirmingDeleteId(null);
    } catch {
      setError('Não foi possível excluir este treino. Confira sua conexão e tente novamente.');
    } finally {
      setDeletingWorkoutId(null);
    }
  }

  return <AppShell scrollable={false}><View style={s.page}>
    {loading && workouts.length === 0 ? <>
      <PageHeading eyebrow="SUA JORNADA" title="Histórico de treinos" description="Seus treinos concluídos ficam guardados aqui." />
      <View style={s.loading}><ActivityIndicator color={colors.green} /><Text style={s.muted}>Carregando seu histórico...</Text></View>
    </> : error && workouts.length === 0 ? <>
      <PageHeading eyebrow="SUA JORNADA" title="Histórico de treinos" description="Seus treinos concluídos ficam guardados aqui." />
      <ErrorState title="Não carregamos seu histórico" message={error} onRetry={() => loadHistory()} />
    </> : workouts.length === 0 ? <>
      <PageHeading eyebrow="SUA JORNADA" title="Histórico de treinos" description="Seus treinos concluídos ficam guardados aqui." />
      <EmptyState title="Seu histórico começa aqui" message="Quando você concluir um treino, ele aparecerá nesta lista para acompanhar sua jornada." action={<Button title="Montar meu primeiro treino" onPress={() => router.push('/treino')} style={s.emptyAction} />} />
    </> : <FlatList
      data={workouts}
      keyExtractor={(workout) => workout.id}
      style={s.flatList}
      contentContainerStyle={s.list}
      renderItem={({ item: workout }) => <Card style={s.workoutCard}>
        <View style={s.cardHeading}><View style={s.titleGroup}><Text style={s.workoutTitle}>{workout.title}</Text><Text style={s.date}>{formatDate(workout.completedAt)}</Text></View><View style={s.completedBadge}><Text style={s.completedText}>Concluído</Text></View></View>
        <View style={s.details}><Detail label="DURAÇÃO" value={(Number(workout.duration) || 0) + ' min'} colors={colors} /><Detail label="EXERCÍCIOS" value={String(workout.exercises?.length || 0)} colors={colors} /><Detail label="NÍVEL" value={workout.level || '—'} colors={colors} /></View>
        <Pressable onPress={() => router.push({ pathname: '/sessao', params: { id: workout.id } })} style={s.viewButton} accessibilityRole="button" accessibilityLabel={'Ver treino ' + workout.title}><Text style={s.viewButtonText}>Ver treino</Text><Feather name="arrow-right" size={18} color={colors.green} accessibilityElementsHidden importantForAccessibility="no" /></Pressable>
        {confirmingDeleteId === workout.id ? <View style={s.deleteConfirmation}>
          <Text style={s.deletePrompt}>Excluir este treino do histórico?</Text>
          <View style={s.deleteActions}>
            <Pressable onPress={() => setConfirmingDeleteId(null)} disabled={deletingWorkoutId === workout.id} style={s.cancelDeleteButton} accessibilityRole="button"><Text style={s.cancelDeleteText}>Cancelar</Text></Pressable>
            <Pressable onPress={() => deleteWorkout(workout.id)} disabled={deletingWorkoutId === workout.id} style={s.confirmDeleteButton} accessibilityRole="button" accessibilityState={{ disabled: deletingWorkoutId === workout.id }}><Text style={s.confirmDeleteText}>{deletingWorkoutId === workout.id ? 'Excluindo...' : 'Excluir'}</Text></Pressable>
          </View>
        </View> : <Pressable onPress={() => setConfirmingDeleteId(workout.id)} style={s.deleteButton} accessibilityRole="button" accessibilityLabel={'Excluir treino ' + workout.title}><Text style={s.deleteButtonText}>Excluir treino</Text></Pressable>}
      </Card>}
      ListHeaderComponent={<View style={s.listHeader}>
        <PageHeading eyebrow="SUA JORNADA" title="Histórico de treinos" description="Acompanhe o que você já conquistou." action={<Button title="+ Novo treino" onPress={() => router.push('/treino')} style={s.newButton} />} />
        <Card style={s.statsCard}><SectionTitle title="Seu ritmo" caption="Resumo dos treinos concluídos" /><View style={s.statsRow}>
          <Stat label="TREINOS CONCLUÍDOS" value={String(totalCount)} colors={colors} />
          <View style={s.statDivider} />
          <Stat label="DURAÇÃO MÉDIA" value={averageDuration + ' min'} colors={colors} />
        </View></Card>
        {!!error && <Text accessibilityRole="alert" style={s.errorMessage}>{error}</Text>}
      </View>}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadHistory(true)} tintColor={colors.green} colors={[colors.green]} />}
      onEndReached={loadMoreHistory}
      onEndReachedThreshold={0.45}
      ListFooterComponent={hasMore || loadingMore || error && workouts.length ? <View style={s.listFooter}>
        {loadingMore ? <ActivityIndicator color={colors.green} /> : hasMore ? <Button title="Carregar mais treinos" onPress={loadMoreHistory} variant="secondary" /> : null}
        {error && workouts.length > 0 ? <Text accessibilityRole="alert" style={s.errorMessage}>{error}</Text> : null}
      </View> : null}
    />}
  </View></AppShell>;

}

function Detail({ label, value, colors }) { const s = createStyles(colors); return <View style={s.detail}><Text style={s.detailLabel}>{label}</Text><Text style={s.detailValue}>{value}</Text></View>; }

function Stat({ label, value, colors }) {
  const s = createStyles(colors);
  return <View style={s.stat}><Text style={s.statValue}>{value}</Text><Text style={s.statLabel}>{label}</Text></View>;
}

function formatDate(timestamp) {
  const date = timestamp?.toDate?.();
  if (!date || Number.isNaN(date.getTime())) return 'Treino concluído';
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }).format(date);
}

function createStyles(colors) { return StyleSheet.create({
  page: { flex: 1, width: '100%', maxWidth: 1120, minHeight: 0, alignSelf: 'center' }, flatList: { flex: 1 }, list: { width: '100%', maxWidth: 840, alignSelf: 'center', gap: 12, paddingBottom: 24 }, listHeader: { gap: 14, marginBottom: 16 }, listFooter: { gap: 10, alignItems: 'center', paddingVertical: 14 }, loading: { minHeight: 220, alignItems: 'center', justifyContent: 'center', gap: 12 }, muted: { color: colors.muted, fontSize: 12 },
  newButton: { minHeight: 48, paddingHorizontal: 14, borderRadius: 9, backgroundColor: colors.green, alignItems: 'center', justifyContent: 'center' }, emptyAction: { marginTop: 12 },
  statsCard: { padding: 18 }, statsRow: { flexDirection: 'row', alignItems: 'center', gap: 18 }, stat: { flex: 1, gap: 5 }, statValue: { color: colors.ink, fontSize: 22, fontWeight: '800' }, statLabel: { color: colors.subtle, fontSize: 9, fontWeight: '800', letterSpacing: 0.7 }, statDivider: { width: 1, height: 38, backgroundColor: colors.line },
  emptyCard: { width: '100%', maxWidth: 620, minHeight: 300, padding: 28, justifyContent: 'center', alignItems: 'center' }, emptyIcon: { width: 54, height: 54, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.pale }, emptyGlyph: { color: colors.green, fontSize: 24 }, emptyTitle: { color: colors.ink, fontSize: 17, fontWeight: '700', textAlign: 'center', marginTop: 18 }, emptyCopy: { color: colors.muted, fontSize: 12, lineHeight: 19, textAlign: 'center', maxWidth: 390, marginTop: 8 },
  primaryButton: { minHeight: 46, paddingHorizontal: 18, backgroundColor: colors.green, borderRadius: 9, alignItems: 'center', justifyContent: 'center', marginTop: 20 }, primaryText: { color: 'white', fontSize: 12, fontWeight: '700' }, secondaryButton: { minHeight: 42, paddingHorizontal: 16, backgroundColor: colors.pale, borderRadius: 9, alignItems: 'center', justifyContent: 'center', marginTop: 16 }, secondaryText: { color: colors.green, fontSize: 12, fontWeight: '700' },
  workoutCard: { padding: 19 }, cardHeading: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }, titleGroup: { flex: 1 }, workoutTitle: { color: colors.ink, fontSize: 15, fontWeight: '700' }, date: { color: colors.muted, fontSize: 11, marginTop: 5 }, completedBadge: { paddingHorizontal: 9, paddingVertical: 6, borderRadius: 20, backgroundColor: colors.pale }, completedText: { color: colors.green, fontSize: 9, fontWeight: '800' },
  details: { flexDirection: 'row', gap: 22, paddingVertical: 15, marginTop: 13, borderTopWidth: 1, borderTopColor: colors.line, borderBottomWidth: 1, borderBottomColor: colors.line }, detail: { flex: 1 }, detailLabel: { color: colors.subtle, fontSize: 8, fontWeight: '800', letterSpacing: 0.8 }, detailValue: { color: colors.ink, fontSize: 12, fontWeight: '700', marginTop: 5 },
  viewButton: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 7, paddingHorizontal: 3 }, viewButtonText: { color: colors.green, fontSize: 12, fontWeight: '700' }, arrow: { color: colors.green, fontSize: 18 },
  deleteButton: { minHeight: 48, alignSelf: 'flex-start', justifyContent: 'center', paddingHorizontal: 3 }, deleteButtonText: { color: colors.red, fontSize: 11, fontWeight: '700' },
  deleteConfirmation: { marginTop: 7, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.line }, deletePrompt: { color: colors.ink, fontSize: 11, fontWeight: '700' }, deleteActions: { flexDirection: 'row', gap: 9, marginTop: 10 },
  cancelDeleteButton: { minHeight: 48, paddingHorizontal: 14, justifyContent: 'center', borderRadius: 8, backgroundColor: colors.pale }, cancelDeleteText: { color: colors.green, fontSize: 11, fontWeight: '700' }, confirmDeleteButton: { minHeight: 48, paddingHorizontal: 14, justifyContent: 'center', borderRadius: 8, backgroundColor: colors.red }, confirmDeleteText: { color: 'white', fontSize: 11, fontWeight: '700' },
  errorMessage: { color: colors.red, fontSize: 12, marginBottom: 12 },
}); }
