import { designTokens } from '../theme';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { AppText as Text, AppTextInput as TextInput, Card, Chip, ConfirmDialog, ErrorState, PageHeading } from '../components/ui';
import { router, useFocusEffect } from 'expo-router';
import AppShell from '../components/AppShell';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { defaultExercises, deleteCustomWorkout, getWeeklyRoutine, listCustomWorkouts, listExercises, saveCustomWorkout, setWeeklyRoutine, startCustomWorkout } from '../lib/exercises';

const weekdays = [
  ['segunda', 'Segunda'], ['terca', 'Terça'], ['quarta', 'Quarta'], ['quinta', 'Quinta'],
  ['sexta', 'Sexta'], ['sabado', 'Sábado'], ['domingo', 'Domingo'],
];
const muscles = [['chest', 'Peito'], ['back', 'Costas'], ['legs', 'Pernas'], ['shoulders', 'Ombros'], ['arms', 'Braços'], ['core', 'Abdômen'], ['full_body', 'Corpo todo']];
const equipmentNames = { bodyweight: 'Peso corporal', dumbbells: 'Halteres', bands: 'Elástico', barbell: 'Barra', machines: 'Máquinas' };

export default function RoutineScreen() {
  const { session } = useAuth();
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const { width } = useWindowDimensions();
  const compact = width < 850;
  const uid = session.user.uid;
  const [plans, setPlans] = useState([]);
  const [routine, setRoutine] = useState(Object.fromEntries(weekdays.map(([key]) => [key, []])));
  const [catalog, setCatalog] = useState(defaultExercises);
  const [title, setTitle] = useState('');
  const [muscle, setMuscle] = useState('legs');
  const [duration, setDuration] = useState('30');
  const [level, setLevel] = useState('Iniciante');
  const [selected, setSelected] = useState([]);
  const [exerciseName, setExerciseName] = useState('');
  const [exerciseInstructions, setExerciseInstructions] = useState('');
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [startingId, setStartingId] = useState(null);
  const [removingId, setRemovingId] = useState(null);
  const [planToRemove, setPlanToRemove] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loadError, setLoadError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError(''); setLoadError(false);
    try {
      const [savedPlans, savedRoutine, remote] = await Promise.all([listCustomWorkouts(uid), getWeeklyRoutine(uid), listExercises()]);
      setPlans(savedPlans); setRoutine(savedRoutine.days);
      setCatalog([...defaultExercises, ...remote.filter((item) => !defaultExercises.some((base) => base.name.toLocaleLowerCase() === item.name?.toLocaleLowerCase()))]);
    } catch (loadError) {
      setLoadError(true);
      setError(loadError.code === 'permission-denied'
        ? 'O Firebase bloqueou os treinos personalizados. Publique as regras atuais de firestore.rules e tente novamente.'
        : 'Não foi possível carregar seus treinos. Confira a conexão e tente novamente.');
    } finally { setLoading(false); }
  }, [uid]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const filteredCatalog = useMemo(() => {
    const term = search.trim().toLocaleLowerCase();
    return catalog.filter((item) => !term || item.name.toLocaleLowerCase().includes(term));
  }, [catalog, search]);
  const selectedEquipment = [...new Set(selected.flatMap((exercise) => exercise.equipment || ['bodyweight']))];

  function addExercise(exercise) {
    setSelected((current) => current.some((item) => item.id === exercise.id) ? current : [...current, {
      id: exercise.id,
      name: exercise.name,
      muscle: exercise.muscle,
      equipment: exercise.equipment || ['bodyweight'],
      sets: 3,
      reps: exercise.reps || '10–12',
      rest_seconds: exercise.rest_seconds || 60,
      instructions: exercise.instructions || '',
    }]);
  }

  function updateSelected(id, change) {
    setSelected((current) => current.map((item) => item.id === id ? { ...item, ...change } : item));
  }

  function addPersonalExercise() {
    const name = exerciseName.trim();
    if (!name) { setError('Digite o nome do exercício que deseja adicionar.'); return; }
    const id = `personal-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    addExercise({ id, name, muscle, equipment: ['bodyweight'], reps: '10–12', rest_seconds: 60, instructions: exerciseInstructions.trim() });
    setExerciseName(''); setExerciseInstructions(''); setError('');
  }

  function beginEdit(plan) {
    setEditingId(plan.id); setTitle(plan.title); setMuscle(plan.muscle || 'full_body');
    setDuration(String(plan.duration || 30)); setLevel(plan.level || 'Iniciante');
    setSelected(plan.exercises || []); setNotice(''); setError('');
  }

  function resetEditor() {
    setEditingId(null); setTitle(''); setMuscle('legs'); setDuration('30'); setLevel('Iniciante'); setSelected([]);
    setExerciseName(''); setExerciseInstructions(''); setError('');
  }

  async function savePlan() {
    if (!title.trim()) { setError('Dê um nome para esse treino.'); return; }
    if (!selected.length) { setError('Adicione pelo menos um exercício ao treino.'); return; }
    if (selected.reduce((total, exercise) => total + Number(exercise.sets || 3), 0) > 100) { setError('Este treino pode ter até 100 séries no total. Reduza as séries ou exercícios.'); return; }
    setSaving(true); setError(''); setNotice('');
    const plan = { title: title.trim(), muscle, level, duration: Number(duration), place: 'Em casa', equipment: selectedEquipment, exercises: selected };
    try {
      const saved = await saveCustomWorkout(uid, plan, editingId);
      setPlans((current) => editingId ? current.map((item) => item.id === editingId ? { ...item, ...saved } : item) : [...current, saved].sort((a, b) => a.title.localeCompare(b.title, 'pt-BR')));
      setNotice(editingId ? 'Treino atualizado.' : 'Treino salvo. Agora você pode distribuí-lo na semana.');
      resetEditor();
    } catch (saveError) {
      setError(saveError.code === 'permission-denied' ? 'O Firebase bloqueou o salvamento. Publique as regras atuais de firestore.rules e tente novamente.' : 'Não foi possível salvar este treino. Tente novamente.');
    } finally { setSaving(false); }
  }

  async function toggleDay(day, planId) {
    const currentIds = routine[day] || [];
    const next = !planId || currentIds[0] === planId ? [] : [planId];
    const nextRoutine = { ...routine, [day]: next };
    setRoutine(nextRoutine); setError(''); setNotice('');
    try { await setWeeklyRoutine(uid, nextRoutine); }
    catch { setRoutine((value) => ({ ...value, [day]: currentIds })); setError('Não foi possível salvar sua rotina semanal. Verifique as regras do Firebase.'); }
  }

  async function removePlan(plan) {
    setRemovingId(plan.id); setError('');
    try {
      await deleteCustomWorkout(uid, plan.id);
      setPlans((current) => current.filter((item) => item.id !== plan.id));
      const updated = await getWeeklyRoutine(uid); setRoutine(updated.days);
      if (editingId === plan.id) resetEditor();
      setNotice('Treino removido da sua biblioteca e dos dias programados.');
      setPlanToRemove(null);
    } catch { setError('Não foi possível remover esse treino. Tente novamente.'); }
    finally { setRemovingId(null); }
  }

  async function startPlan(plan) {
    setStartingId(plan.id); setError('');
    try { const workout = await startCustomWorkout(uid, plan); router.push({ pathname: '/sessao', params: { id: workout.id } }); }
    catch (startError) { setError(startError.code === 'permission-denied' ? 'O Firebase bloqueou o início do treino. Publique as regras atuais de firestore.rules.' : 'Não foi possível iniciar esse treino. Tente novamente.'); }
    finally { setStartingId(null); }
  }

  return <AppShell><View style={styles.page}>
    <PageHeading eyebrow="PLANEJE SUA SEMANA" title="Meus treinos" description="Monte sessões do seu jeito, use exercícios da biblioteca ou crie os seus e organize a semana." action={<Pressable onPress={resetEditor} style={styles.newButton}><Text style={styles.newButtonText}>＋ Criar treino</Text></Pressable>} />
    {!!error && !loadError && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
    {!!notice && <Text style={styles.notice}>{notice}</Text>}
    {loading ? <View style={styles.loading}><ActivityIndicator color={colors.green} /><Text style={styles.muted}>Carregando sua rotina...</Text></View> : loadError ? <ErrorState title="Não carregamos sua rotina" message={error} onRetry={() => load()} /> : <>
      <Card style={styles.weekCard}>
        <Text style={styles.cardTitle}>Sua semana</Text>
        <Text style={styles.cardCopy}>Escolha um treino para cada dia ou marque descanso. Sua semana fica simples e fácil de acompanhar.</Text>
        <View style={styles.weekGrid}>{weekdays.map(([day, label]) => {
          const dayPlans = (routine[day] || []).map((id) => plans.find((plan) => plan.id === id)).filter(Boolean);
          return <View key={day} style={[styles.dayCard, compact && styles.dayCardCompact]}>
            <View style={styles.dayHeading}><Text style={styles.dayName}>{label}</Text><Text style={[styles.dayCount, dayPlans.length > 0 && styles.dayCountActive]}>{dayPlans.length ? 'TREINO' : 'DESCANSO'}</Text></View>
            <Text style={styles.dayPlan} numberOfLines={2}>{dayPlans[0]?.title || 'Dia livre para recuperar'}</Text>
            {!plans.length ? <Text style={styles.dayEmpty}>Crie um treino abaixo</Text> : <View style={styles.dayChoices}>{plans.map((plan) => {
              const active = (routine[day] || []).includes(plan.id);
              return <Pressable key={plan.id} onPress={() => toggleDay(day, plan.id)} style={[styles.dayChoice, active && styles.dayChoiceActive]} accessibilityRole="radio" accessibilityState={{ checked: active }}><Text style={[styles.dayChoiceText, active && styles.dayChoiceTextActive]}>{plan.title}</Text></Pressable>;
            })}<Pressable onPress={() => toggleDay(day, null)} style={[styles.dayChoice, !dayPlans.length && styles.dayChoiceActive]} accessibilityRole="radio" accessibilityState={{ checked: !dayPlans.length }}><Text style={[styles.dayChoiceText, !dayPlans.length && styles.dayChoiceTextActive]}>Descanso</Text></Pressable></View>}
          </View>;
        })}</View>
      </Card>

      <View style={[styles.contentColumns, compact && styles.contentColumnsCompact]}>
        <View style={[styles.libraryColumn, compact && styles.columnFullWidth]}>
          <Text style={styles.sectionHeading}>Biblioteca de treinos</Text>
          {plans.length ? plans.map((plan) => <Card key={plan.id} style={styles.planCard}>
            <Text style={styles.planTitle}>{plan.title}</Text>
            <Text style={styles.planMeta}>{plan.exercises?.length || 0} exercícios · {plan.duration} min · {plan.level}</Text>
            <Text style={styles.planExercises} numberOfLines={2}>{(plan.exercises || []).map((exercise) => exercise.name).join('  ·  ')}</Text>
            <View style={styles.planActions}><Pressable onPress={() => startPlan(plan)} disabled={startingId === plan.id} style={styles.startButton} accessibilityRole="button" accessibilityState={{ disabled: startingId === plan.id }}><Feather name="play" size={14} color="white" accessibilityElementsHidden importantForAccessibility="no" /><Text style={styles.startButtonText}>{startingId === plan.id ? 'Abrindo...' : 'Iniciar'}</Text></Pressable><Pressable onPress={() => beginEdit(plan)} style={styles.editButton} accessibilityRole="button"><Feather name="edit-2" size={14} color={colors.green} accessibilityElementsHidden importantForAccessibility="no" /><Text style={styles.editButtonText}>Editar</Text></Pressable><Pressable onPress={() => setPlanToRemove(plan)} style={styles.removeButton} accessibilityRole="button"><Feather name="trash-2" size={14} color={colors.red} accessibilityElementsHidden importantForAccessibility="no" /><Text style={styles.removeButtonText}>Remover</Text></Pressable></View>
          </Card>) : <Card style={styles.emptyCard}><Text style={styles.emptyTitle}>Sua biblioteca está vazia</Text><Text style={styles.cardCopy}>Crie um treino personalizado e ele ficará disponível para repetir e programar na semana.</Text></Card>}
        </View>

        <Card style={[styles.editorCard, compact && styles.columnFullWidth]}>
          <Text style={styles.sectionHeading}>{editingId ? 'Editar treino' : 'Criar treino personalizado'}</Text>
          <Text style={styles.fieldLabel}>NOME DO TREINO</Text><TextInput value={title} onChangeText={setTitle} placeholder="Ex.: Pernas e glúteos" placeholderTextColor={colors.muted} style={styles.input} maxLength={60} />
          <Text style={styles.fieldLabel}>GRUPO PRINCIPAL</Text><View style={styles.chips}>{muscles.map(([key, label]) => <Chip key={key} label={label} selected={muscle === key} onPress={() => setMuscle(key)} />)}</View>
          <View style={styles.optionRow}><View style={{ flex: 1 }}><Text style={styles.fieldLabel}>DURAÇÃO</Text><View style={styles.chips}>{['20', '30', '45', '60'].map((value) => <Chip key={value} label={`${value} min`} selected={duration === value} onPress={() => setDuration(value)} />)}</View></View><View style={{ flex: 1 }}><Text style={styles.fieldLabel}>NÍVEL</Text><View style={styles.chips}>{['Iniciante', 'Intermediário', 'Avançado'].map((value) => <Chip key={value} label={value} selected={level === value} onPress={() => setLevel(value)} />)}</View></View></View>

          <Text style={styles.fieldLabel}>ESCOLHA DA BIBLIOTECA · {catalog.length} EXERCÍCIOS</Text><TextInput value={search} onChangeText={setSearch} placeholder="Buscar exercício" placeholderTextColor={colors.muted} style={styles.input} />
          <View style={styles.catalogList}>{filteredCatalog.slice(0, 36).map((exercise) => {
            const active = selected.some((item) => item.id === exercise.id);
            return <Pressable key={exercise.id} onPress={() => active ? setSelected((current) => current.filter((item) => item.id !== exercise.id)) : addExercise(exercise)} style={[styles.catalogItem, active && styles.catalogItemActive]}><Text style={[styles.catalogCheck, active && styles.catalogCheckActive]}>{active ? '✓' : '+'}</Text><View style={{ flex: 1 }}><Text style={styles.catalogName}>{exercise.name}</Text><Text style={styles.catalogMeta}>{exercise.reps} repetições · descanso {exercise.rest_seconds}s · {(exercise.equipment || []).map((item) => equipmentNames[item] || item).join(', ')}</Text></View></Pressable>;
          })}</View>

          <Text style={styles.fieldLabel}>CRIAR UM EXERCÍCIO LIVRE</Text><TextInput value={exerciseName} onChangeText={setExerciseName} placeholder="Nome do exercício" placeholderTextColor={colors.muted} style={styles.input} maxLength={60} />
          <TextInput value={exerciseInstructions} onChangeText={setExerciseInstructions} placeholder="Como fazer (opcional)" placeholderTextColor={colors.muted} style={[styles.input, styles.multiline]} multiline maxLength={220} />
          <Pressable onPress={addPersonalExercise} style={styles.outlineButton}><Text style={styles.outlineText}>＋ Adicionar ao treino</Text></Pressable>

          <Text style={styles.fieldLabel}>SEU TREINO · {selected.length} EXERCÍCIOS</Text>
          {selected.length ? selected.map((exercise, index) => <View key={exercise.id} style={styles.selectedCard}>
            <View style={styles.selectedTop}><View style={{ flex: 1 }}><Text style={styles.selectedName}>{index + 1}. {exercise.name}</Text><Text style={styles.catalogMeta}>{(exercise.equipment || ['bodyweight']).map((item) => equipmentNames[item] || item).join(', ')}</Text></View><Pressable onPress={() => setSelected((current) => current.filter((item) => item.id !== exercise.id))} accessibilityRole="button" accessibilityLabel={`Remover ${exercise.name}`} style={styles.removeExerciseButton}><Text style={styles.removeExercise}>Remover</Text></Pressable></View>
            <View style={styles.settingRow}><Text style={styles.settingLabel}>Séries</Text><Pressable onPress={() => updateSelected(exercise.id, { sets: Math.max(1, Number(exercise.sets || 3) - 1) })} style={styles.stepButton}><Text style={styles.stepText}>−</Text></Pressable><Text style={styles.settingValue}>{exercise.sets || 3}</Text><Pressable onPress={() => updateSelected(exercise.id, { sets: Math.min(10, Number(exercise.sets || 3) + 1) })} style={styles.stepButton}><Text style={styles.stepText}>＋</Text></Pressable><TextInput value={String(exercise.reps || '10–12')} onChangeText={(value) => updateSelected(exercise.id, { reps: value })} style={styles.smallInput} placeholder="Reps" placeholderTextColor={colors.muted} maxLength={24} /><TextInput value={String(exercise.rest_seconds || 60)} onChangeText={(value) => updateSelected(exercise.id, { rest_seconds: value.replace(/\D/g, '').slice(0, 3) })} keyboardType="number-pad" style={styles.smallInput} placeholder="Descanso s" placeholderTextColor={colors.muted} maxLength={3} /></View>
          </View>) : <Text style={styles.cardCopy}>Escolha exercícios da biblioteca acima ou crie um exercício livre.</Text>}
          {!!error && <Text style={styles.error}>{error}</Text>}
          <Pressable disabled={saving} onPress={savePlan} style={[styles.saveButton, saving && { opacity: 0.65 }]}><Text style={styles.saveButtonText}>{saving ? 'Salvando...' : editingId ? 'Salvar alterações' : 'Salvar meu treino'}</Text></Pressable>
          {editingId ? <Pressable onPress={resetEditor} style={styles.cancelButton}><Text style={styles.editButtonText}>Cancelar edição</Text></Pressable> : null}
        </Card>
      </View>
    </>}
  </View><ConfirmDialog visible={Boolean(planToRemove)} title="Remover este treino?" message="Ele também será retirado dos dias da sua semana. Essa ação não pode ser desfeita." confirmLabel="Remover treino" cancelLabel="Manter treino" destructive loading={Boolean(removingId)} onConfirm={() => planToRemove && removePlan(planToRemove)} onCancel={() => { if (!removingId) setPlanToRemove(null); }} /></AppShell>;
}

function createStyles(colors) { const { space, radius, type } = designTokens; return StyleSheet.create({
  page: { width: '100%', maxWidth: 1120 }, newButton: { minHeight: 48, paddingHorizontal: space.md - 1, borderRadius: radius.xs + 2, backgroundColor: colors.green, alignItems: 'center', justifyContent: 'center' }, newButtonText: { color: colors.textOnPrimary, fontSize: type.size.caption, fontWeight: '800' },
  loading: { minHeight: 180, alignItems: 'center', justifyContent: 'center', gap: space.xs + 2 }, muted: { color: colors.muted, fontSize: type.size.caption }, error: { color: colors.red, fontSize: type.size.caption, marginBottom: space.sm + 2 }, notice: { color: colors.green, fontSize: type.size.caption, fontWeight: '700', marginBottom: space.sm + 2 },
  weekCard: { padding: space.md + 4, marginBottom: space.xl - 1 }, cardTitle: { color: colors.ink, fontSize: type.size.subtitle - 1, fontWeight: '800' }, cardCopy: { color: colors.muted, fontSize: type.size.label + 1, lineHeight: type.lineHeight.caption - 1, marginTop: space.xxs + 2 }, weekGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs + 2, marginTop: space.md }, dayCard: { flexGrow: 1, flexBasis: '23%', minWidth: 220, borderWidth: 1, borderColor: colors.line, borderRadius: radius.sm + 1, padding: space.sm + 1, backgroundColor: colors.canvas }, dayCardCompact: { flexBasis: '45%', minWidth: 145 }, dayHeading: { flexDirection: 'row', justifyContent: 'space-between', gap: space.xxs + 2, alignItems: 'center' }, dayName: { color: colors.ink, fontSize: type.size.caption, fontWeight: '800' }, dayCount: { color: colors.muted, fontSize: type.size.label - 2, fontWeight: '800', letterSpacing: 0.5 }, dayCountActive: { color: colors.green }, dayPlan: { minHeight: 31, color: colors.ink, fontSize: type.size.label + 1, lineHeight: type.lineHeight.label + 2, marginTop: space.xs + 1, fontWeight: '700' }, dayEmpty: { color: colors.muted, fontSize: type.size.label, marginTop: space.xs }, dayChoices: { gap: space.xxs + 1, marginTop: space.xs + 1 }, dayChoice: { minHeight: 44, justifyContent: 'center', paddingHorizontal: space.xs, paddingVertical: space.xs, backgroundColor: colors.white, borderRadius: radius.xs, borderWidth: 1, borderColor: colors.line }, dayChoiceActive: { backgroundColor: colors.pale, borderColor: colors.green }, dayChoiceText: { color: colors.muted, fontSize: type.size.label, fontWeight: '600' }, dayChoiceTextActive: { color: colors.green, fontWeight: '800' },
  contentColumns: { flexDirection: 'row', alignItems: 'flex-start', gap: space.md + 2 }, contentColumnsCompact: { flexDirection: 'column' }, libraryColumn: { flex: 0.85, minWidth: 280 }, columnFullWidth: { width: '100%' }, editorCard: { flex: 1.15, minWidth: 300, padding: space.md + 2 }, sectionHeading: { color: colors.ink, fontSize: type.size.body + 1, fontWeight: '800', marginBottom: space.sm + 1 }, planCard: { padding: space.md - 1, marginBottom: space.xs + 2 }, planTitle: { color: colors.ink, fontSize: type.size.body - 1, fontWeight: '800' }, planMeta: { color: colors.green, fontSize: type.size.label, fontWeight: '700', marginTop: space.xxs + 1 }, planExercises: { color: colors.muted, fontSize: type.size.label, lineHeight: type.lineHeight.label + 2, marginTop: space.xs - 1 }, planActions: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs - 1, marginTop: space.sm }, startButton: { minHeight: 44, paddingHorizontal: space.sm + 1, gap: space.xxs + 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: radius.xs, backgroundColor: colors.green }, startButtonText: { color: colors.textOnPrimary, fontSize: type.size.label, fontWeight: '800' }, editButton: { minHeight: 44, paddingHorizontal: space.sm, gap: space.xxs + 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: radius.xs, backgroundColor: colors.pale }, editButtonText: { color: colors.green, fontSize: type.size.label, fontWeight: '800' }, removeButton: { minHeight: 44, paddingHorizontal: space.sm, gap: space.xxs + 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: radius.xs, backgroundColor: colors.soft }, removeButtonText: { color: colors.red, fontSize: type.size.label, fontWeight: '700' }, emptyCard: { padding: space.md + 1 }, emptyTitle: { color: colors.ink, fontSize: type.size.caption + 1, fontWeight: '800' },
  fieldLabel: { color: colors.subtle, fontSize: type.size.label - 1, fontWeight: '800', letterSpacing: 0.8, marginTop: space.md + 1, marginBottom: space.xs }, input: { minHeight: 44, borderWidth: 1, borderColor: colors.line, borderRadius: radius.xs + 1, paddingHorizontal: space.sm, paddingVertical: space.xs + 2, color: colors.ink, backgroundColor: colors.canvas, fontSize: type.size.caption }, multiline: { minHeight: 67, textAlignVertical: 'top', marginTop: space.xs }, chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xxs + 2 }, optionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }, catalogList: { maxHeight: 300, borderWidth: 1, borderColor: colors.line, borderRadius: radius.xs + 2, overflow: 'hidden', marginTop: space.xs }, catalogItem: { minHeight: 53, flexDirection: 'row', alignItems: 'center', gap: space.xs + 1, paddingHorizontal: space.xs + 2, paddingVertical: space.xs, borderBottomWidth: 1, borderColor: colors.line, backgroundColor: colors.white }, catalogItemActive: { backgroundColor: colors.pale }, catalogCheck: { width: 23, height: 23, borderRadius: radius.xs - 1, textAlign: 'center', textAlignVertical: 'center', overflow: 'hidden', color: colors.green, borderWidth: 1, borderColor: colors.line, fontSize: type.size.body - 1, fontWeight: '800' }, catalogCheckActive: { backgroundColor: colors.green, color: colors.textOnPrimary, borderColor: colors.green }, catalogName: { color: colors.ink, fontSize: type.size.label + 1, fontWeight: '700' }, catalogMeta: { color: colors.muted, fontSize: type.size.label - 1, lineHeight: type.lineHeight.label, marginTop: space.xxs - 1 }, outlineButton: { minHeight: 44, justifyContent: 'center', alignItems: 'center', borderRadius: radius.xs + 1, borderWidth: 1, borderColor: colors.green, marginTop: space.xs + 1 }, outlineText: { color: colors.green, fontSize: type.size.label + 1, fontWeight: '800' }, selectedCard: { padding: space.sm - 1, borderRadius: radius.xs + 2, borderWidth: 1, borderColor: colors.line, marginTop: space.xs, backgroundColor: colors.canvas }, selectedTop: { flexDirection: 'row', alignItems: 'center', gap: space.xs - 1 }, selectedName: { color: colors.ink, fontSize: type.size.label + 1, fontWeight: '800' }, removeExerciseButton: { minHeight: 44, justifyContent: 'center', paddingHorizontal: space.xs }, removeExercise: { color: colors.red, fontSize: type.size.label - 1, fontWeight: '700' }, settingRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: space.xxs + 2, marginTop: space.xs + 1 }, settingLabel: { color: colors.muted, fontSize: type.size.label, marginRight: space.xxs - 1 }, stepButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: radius.xs - 1, backgroundColor: colors.pale }, stepText: { color: colors.green, fontSize: type.size.body - 1, fontWeight: '800' }, settingValue: { width: 17, textAlign: 'center', color: colors.ink, fontSize: type.size.label + 1, fontWeight: '700' }, smallInput: { minWidth: 61, minHeight: 44, paddingHorizontal: space.xs - 1, borderWidth: 1, borderColor: colors.line, borderRadius: radius.xs - 1, color: colors.ink, backgroundColor: colors.white, fontSize: type.size.label }, saveButton: { minHeight: 48, justifyContent: 'center', alignItems: 'center', borderRadius: radius.xs + 2, backgroundColor: colors.green, marginTop: space.md - 1 }, saveButtonText: { color: colors.textOnPrimary, fontSize: type.size.caption, fontWeight: '800' }, cancelButton: { minHeight: 44, justifyContent: 'center', alignItems: 'center', marginTop: space.xxs + 2 },
}); }
