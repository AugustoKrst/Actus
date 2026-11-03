import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import AppShell from '../components/AppShell';
import { Card, PageHeading } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { getSavedWorkout, saveWorkoutProgress } from '../lib/exercises';

export default function WorkoutSessionScreen() {
  const { id } = useLocalSearchParams();
  const { session } = useAuth();
  const { colors } = useTheme();
  const s = createStyles(colors);
  const workoutId = Array.isArray(id) ? id[0] : id;
  const [workout, setWorkout] = useState(null);
  const [completed, setCompleted] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    async function loadWorkout() {
      try {
        if (!workoutId) throw new Error('Não encontramos este treino. Volte e gere um novo.');
        const savedWorkout = await getSavedWorkout(session.user.uid, workoutId);
        if (active) {
          setWorkout(savedWorkout);
          setCompleted(savedWorkout.completedExerciseIds || []);
        }
      } catch (loadError) {
        if (active) setError(loadError.message || 'Não foi possível carregar seu treino.');
      } finally {
        if (active) setLoading(false);
      }
    }
    loadWorkout();
    return () => { active = false; };
  }, [session.user.uid, workoutId]);

  async function toggleExercise(exerciseId) {
    if (!workout || saving) return;
    const next = completed.includes(exerciseId) ? completed.filter((id) => id !== exerciseId) : [...completed, exerciseId];
    setSaving(true); setError('');
    try {
      await saveWorkoutProgress(session.user.uid, workout.id, next, workout.exercises.length);
      setCompleted(next);
    } catch (saveError) {
      setError(saveError.message || 'Não foi possível salvar a marcação. Tente novamente.');
    } finally {
      setSaving(false);
    }
  }

  const allDone = !!workout && workout.exercises.length > 0 && completed.length === workout.exercises.length;

  return <AppShell><View style={s.page}>
    <PageHeading eyebrow="SEU MOMENTO DE MOVIMENTO" title={allDone ? 'Treino concluído!' : 'Vamos começar'} description={workout ? `${workout.title} · ${workout.duration} min` : 'Seu treino fica salvo enquanto você faz cada exercício.'} />
    {loading ? <View style={s.loading}><ActivityIndicator color={colors.green} /><Text style={s.muted}>Carregando seu treino...</Text></View> : error && !workout ? <Card style={s.errorCard}><Text style={s.error}>{error}</Text><Pressable onPress={() => router.replace('/treino')} style={s.secondary}><Text style={s.secondaryText}>Voltar aos treinos</Text></Pressable></Card> : workout ? <>
      <Card style={s.progressCard}>
        <View style={s.progressHeading}><Text style={s.progressLabel}>SEU PROGRESSO</Text><Text style={s.progressCount}>{completed.length} de {workout.exercises.length} exercícios</Text></View>
        <View style={s.track}><View style={[s.fill, { width: `${Math.round(completed.length / workout.exercises.length * 100)}%` }]} /></View>
        {allDone ? <Text style={s.success}>Mandou bem! Você marcou todos os exercícios.</Text> : <Text style={s.hint}>Toque no círculo ao terminar cada exercício.</Text>}
      </Card>

      <View style={s.list}>{workout.exercises.map((exercise, index) => {
        const checked = completed.includes(exercise.id);
        return <Pressable key={exercise.id} onPress={() => toggleExercise(exercise.id)} disabled={saving} accessibilityRole="checkbox" accessibilityState={{ checked }} style={[s.exercise, checked && s.exerciseDone]}>
          <View style={[s.checkCircle, checked && s.checkCircleDone]}><Text style={[s.checkMark, checked && s.checkMarkDone]}>{checked ? '✓' : ''}</Text></View>
          <View style={s.exerciseContent}>
            <Text style={[s.exerciseName, checked && s.exerciseNameDone]}>{String(index + 1).padStart(2, '0')}  {exercise.name}</Text>
            <Text style={s.exerciseMeta}>{exercise.sets} séries · {exercise.reps} repetições · {exercise.rest_seconds}s de descanso</Text>
            {exercise.instructions ? <Text style={s.instructions}>{exercise.instructions}</Text> : null}
          </View>
        </Pressable>;
      })}</View>

      {!!error && <Text style={s.error}>{error}</Text>}
      <Pressable disabled={!allDone || saving} onPress={() => router.replace('/historico')} style={[s.finish, (!allDone || saving) && s.finishDisabled]}>
        <Text style={[s.finishText, !allDone && s.finishTextDisabled]}>{saving ? 'Salvando...' : allDone ? 'Treino salvo · ver histórico  ✓' : 'Marque todos os exercícios para finalizar'}</Text>
      </Pressable>
    </> : null}
  </View></AppShell>;
}

function createStyles(colors) { return StyleSheet.create({
  page: { width: '100%', maxWidth: 920 }, loading: { minHeight: 220, justifyContent: 'center', alignItems: 'center', gap: 12 }, muted: { color: colors.muted, fontSize: 12 },
  progressCard: { padding: 20 }, progressHeading: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 8, alignItems: 'center' }, progressLabel: { color: colors.green, fontSize: 10, fontWeight: '800', letterSpacing: 1 }, progressCount: { color: colors.ink, fontSize: 12, fontWeight: '700' }, track: { height: 8, borderRadius: 8, overflow: 'hidden', backgroundColor: colors.pale, marginTop: 14 }, fill: { height: 8, borderRadius: 8, backgroundColor: colors.green }, hint: { color: colors.muted, fontSize: 11, marginTop: 11 }, success: { color: colors.green, fontSize: 12, fontWeight: '700', marginTop: 11 },
  list: { gap: 10, marginTop: 15 }, exercise: { minHeight: 82, backgroundColor: colors.white, borderColor: colors.line, borderWidth: 1, borderRadius: 13, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14 }, exerciseDone: { backgroundColor: colors.pale, borderColor: colors.green }, checkCircle: { width: 27, height: 27, borderRadius: 14, borderWidth: 1.5, borderColor: colors.muted, alignItems: 'center', justifyContent: 'center' }, checkCircleDone: { backgroundColor: colors.green, borderColor: colors.green }, checkMark: { color: 'transparent', fontSize: 16, fontWeight: '800' }, checkMarkDone: { color: 'white' }, exerciseContent: { flex: 1 }, exerciseName: { color: colors.ink, fontSize: 13, fontWeight: '700' }, exerciseNameDone: { color: colors.green }, exerciseMeta: { color: colors.muted, fontSize: 10, marginTop: 5 }, instructions: { color: colors.subtle, fontSize: 10, lineHeight: 15, marginTop: 5 },
  finish: { minHeight: 49, borderRadius: 10, backgroundColor: colors.green, alignItems: 'center', justifyContent: 'center', marginTop: 17, paddingHorizontal: 14 }, finishDisabled: { backgroundColor: colors.pale }, finishText: { color: 'white', fontWeight: '700', fontSize: 12, textAlign: 'center' }, finishTextDisabled: { color: colors.muted },
  errorCard: { padding: 20 }, error: { color: colors.red, fontSize: 12, marginTop: 10 }, secondary: { minHeight: 42, justifyContent: 'center', alignItems: 'center', marginTop: 14, borderRadius: 9, backgroundColor: colors.pale }, secondaryText: { color: colors.green, fontSize: 12, fontWeight: '700' },
}); }
