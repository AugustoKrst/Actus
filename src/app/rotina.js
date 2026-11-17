import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import AppShell from '../components/AppShell';
import { Card, Chip, PageHeading } from '../components/ui';
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
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [savedPlans, savedRoutine, remote] = await Promise.all([listCustomWorkouts(uid), getWeeklyRoutine(uid), listExercises()]);
      setPlans(savedPlans); setRoutine(savedRoutine.days);
      setCatalog([...defaultExercises, ...remote.filter((item) => !defaultExercises.some((base) => base.name.toLocaleLowerCase() === item.name?.toLocaleLowerCase()))]);
    } catch (loadError) {
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
    setError('');
    try {
      await deleteCustomWorkout(uid, plan.id);
      setPlans((current) => current.filter((item) => item.id !== plan.id));
      const updated = await getWeeklyRoutine(uid); setRoutine(updated.days);
      if (editingId === plan.id) resetEditor();
      setNotice('Treino removido da sua biblioteca e dos dias programados.');
    } catch { setError('Não foi possível remover esse treino. Tente novamente.'); }
  }

  async function startPlan(plan) {
    setStartingId(plan.id); setError('');
    try { const workout = await startCustomWorkout(uid, plan); router.push({ pathname: '/sessao', params: { id: workout.id } }); }
    catch (startError) { setError(startError.code === 'permission-denied' ? 'O Firebase bloqueou o início do treino. Publique as regras atuais de firestore.rules.' : 'Não foi possível iniciar esse treino. Tente novamente.'); }
    finally { setStartingId(null); }
  }

  return <AppShell><View style={styles.page}>
    <PageHeading eyebrow="PLANEJE SUA SEMANA" title="Meus treinos" description="Monte sessões do seu jeito, use exercícios da biblioteca ou crie os seus e organize a semana." action={<Pressable onPress={resetEditor} style={styles.newButton}><Text style={styles.newButtonText}>＋ Criar treino</Text></Pressable>} />
    {!!error && <Text style={styles.error}>{error}</Text>}
    {!!notice && <Text style={styles.notice}>{notice}</Text>}
    {loading ? <View style={styles.loading}><ActivityIndicator color={colors.green} /><Text style={styles.muted}>Carregando sua rotina...</Text></View> : <>
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
            <View style={styles.planActions}><Pressable onPress={() => startPlan(plan)} disabled={startingId === plan.id} style={styles.startButton}><Text style={styles.startButtonText}>{startingId === plan.id ? 'Abrindo...' : '▶ Iniciar'}</Text></Pressable><Pressable onPress={() => beginEdit(plan)} style={styles.editButton}><Text style={styles.editButtonText}>Editar</Text></Pressable><Pressable onPress={() => removePlan(plan)} style={styles.removeButton}><Text style={styles.removeButtonText}>Remover</Text></Pressable></View>
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
            <View style={styles.selectedTop}><View style={{ flex: 1 }}><Text style={styles.selectedName}>{index + 1}. {exercise.name}</Text><Text style={styles.catalogMeta}>{(exercise.equipment || ['bodyweight']).map((item) => equipmentNames[item] || item).join(', ')}</Text></View><Pressable onPress={() => setSelected((current) => current.filter((item) => item.id !== exercise.id))} accessibilityLabel={`Remover ${exercise.name}`}><Text style={styles.removeExercise}>Remover</Text></Pressable></View>
            <View style={styles.settingRow}><Text style={styles.settingLabel}>Séries</Text><Pressable onPress={() => updateSelected(exercise.id, { sets: Math.max(1, Number(exercise.sets || 3) - 1) })} style={styles.stepButton}><Text style={styles.stepText}>−</Text></Pressable><Text style={styles.settingValue}>{exercise.sets || 3}</Text><Pressable onPress={() => updateSelected(exercise.id, { sets: Math.min(10, Number(exercise.sets || 3) + 1) })} style={styles.stepButton}><Text style={styles.stepText}>＋</Text></Pressable><TextInput value={String(exercise.reps || '10–12')} onChangeText={(value) => updateSelected(exercise.id, { reps: value })} style={styles.smallInput} placeholder="Reps" placeholderTextColor={colors.muted} maxLength={24} /><TextInput value={String(exercise.rest_seconds || 60)} onChangeText={(value) => updateSelected(exercise.id, { rest_seconds: value.replace(/\D/g, '').slice(0, 3) })} keyboardType="number-pad" style={styles.smallInput} placeholder="Descanso s" placeholderTextColor={colors.muted} maxLength={3} /></View>
          </View>) : <Text style={styles.cardCopy}>Escolha exercícios da biblioteca acima ou crie um exercício livre.</Text>}
          {!!error && <Text style={styles.error}>{error}</Text>}
          <Pressable disabled={saving} onPress={savePlan} style={[styles.saveButton, saving && { opacity: 0.65 }]}><Text style={styles.saveButtonText}>{saving ? 'Salvando...' : editingId ? 'Salvar alterações' : 'Salvar meu treino'}</Text></Pressable>
          {editingId ? <Pressable onPress={resetEditor} style={styles.cancelButton}><Text style={styles.editButtonText}>Cancelar edição</Text></Pressable> : null}
        </Card>
      </View>
    </>}
  </View></AppShell>;
}

function createStyles(colors) { return StyleSheet.create({
  page: { width: '100%', maxWidth: 1120 }, newButton: { minHeight: 43, paddingHorizontal: 15, borderRadius: 10, backgroundColor: colors.green, alignItems: 'center', justifyContent: 'center' }, newButtonText: { color: 'white', fontSize: 12, fontWeight: '800' },
  loading: { minHeight: 180, alignItems: 'center', justifyContent: 'center', gap: 10 }, muted: { color: colors.muted, fontSize: 12 }, error: { color: colors.red, fontSize: 12, marginBottom: 14 }, notice: { color: colors.green, fontSize: 12, fontWeight: '700', marginBottom: 14 },
  weekCard: { padding: 20, marginBottom: 23 }, cardTitle: { color: colors.ink, fontSize: 17, fontWeight: '800' }, cardCopy: { color: colors.muted, fontSize: 11, lineHeight: 17, marginTop: 6 }, weekGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 16 }, dayCard: { flexGrow: 1, flexBasis: '23%', minWidth: 220, borderWidth: 1, borderColor: colors.line, borderRadius: 13, padding: 13, backgroundColor: colors.canvas }, dayCardCompact: { flexBasis: '45%', minWidth: 145 }, dayHeading: { flexDirection: 'row', justifyContent: 'space-between', gap: 6, alignItems: 'center' }, dayName: { color: colors.ink, fontSize: 12, fontWeight: '800' }, dayCount: { color: colors.muted, fontSize: 8, fontWeight: '800', letterSpacing: 0.5 }, dayCountActive: { color: colors.green }, dayPlan: { minHeight: 31, color: colors.ink, fontSize: 11, lineHeight: 16, marginTop: 9, fontWeight: '700' }, dayEmpty: { color: colors.muted, fontSize: 10, marginTop: 8 }, dayChoices: { gap: 5, marginTop: 9 }, dayChoice: { paddingHorizontal: 8, paddingVertical: 8, backgroundColor: colors.white, borderRadius: 8, borderWidth: 1, borderColor: colors.line }, dayChoiceActive: { backgroundColor: colors.pale, borderColor: colors.green }, dayChoiceText: { color: colors.muted, fontSize: 10, fontWeight: '600' }, dayChoiceTextActive: { color: colors.green, fontWeight: '800' },
  contentColumns: { flexDirection: 'row', alignItems: 'flex-start', gap: 18 }, contentColumnsCompact: { flexDirection: 'column' }, libraryColumn: { flex: 0.85, minWidth: 280 }, columnFullWidth: { width: '100%' }, editorCard: { flex: 1.15, minWidth: 300, padding: 18 }, sectionHeading: { color: colors.ink, fontSize: 16, fontWeight: '800', marginBottom: 13 }, planCard: { padding: 15, marginBottom: 10 }, planTitle: { color: colors.ink, fontSize: 14, fontWeight: '800' }, planMeta: { color: colors.green, fontSize: 10, fontWeight: '700', marginTop: 5 }, planExercises: { color: colors.muted, fontSize: 10, lineHeight: 16, marginTop: 7 }, planActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 12 }, startButton: { minHeight: 36, paddingHorizontal: 13, justifyContent: 'center', borderRadius: 8, backgroundColor: colors.green }, startButtonText: { color: 'white', fontSize: 10, fontWeight: '800' }, editButton: { minHeight: 36, paddingHorizontal: 12, justifyContent: 'center', borderRadius: 8, backgroundColor: colors.pale }, editButtonText: { color: colors.green, fontSize: 10, fontWeight: '800' }, removeButton: { minHeight: 36, paddingHorizontal: 12, justifyContent: 'center', borderRadius: 8, backgroundColor: colors.soft }, removeButtonText: { color: colors.red, fontSize: 10, fontWeight: '700' }, emptyCard: { padding: 17 }, emptyTitle: { color: colors.ink, fontSize: 13, fontWeight: '800' },
  fieldLabel: { color: colors.subtle, fontSize: 9, fontWeight: '800', letterSpacing: 0.8, marginTop: 17, marginBottom: 8 }, input: { minHeight: 44, borderWidth: 1, borderColor: colors.line, borderRadius: 9, paddingHorizontal: 12, paddingVertical: 10, color: colors.ink, backgroundColor: colors.canvas, fontSize: 12 }, multiline: { minHeight: 67, textAlignVertical: 'top', marginTop: 8 }, chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 }, optionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 }, catalogList: { maxHeight: 300, borderWidth: 1, borderColor: colors.line, borderRadius: 10, overflow: 'hidden', marginTop: 8 }, catalogItem: { minHeight: 53, flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 10, paddingVertical: 8, borderBottomWidth: 1, borderColor: colors.line, backgroundColor: colors.white }, catalogItemActive: { backgroundColor: colors.pale }, catalogCheck: { width: 23, height: 23, borderRadius: 7, textAlign: 'center', textAlignVertical: 'center', overflow: 'hidden', color: colors.green, borderWidth: 1, borderColor: colors.line, fontSize: 14, fontWeight: '800' }, catalogCheckActive: { backgroundColor: colors.green, color: 'white', borderColor: colors.green }, catalogName: { color: colors.ink, fontSize: 11, fontWeight: '700' }, catalogMeta: { color: colors.muted, fontSize: 9, lineHeight: 14, marginTop: 3 }, outlineButton: { minHeight: 41, justifyContent: 'center', alignItems: 'center', borderRadius: 9, borderWidth: 1, borderColor: colors.green, marginTop: 9 }, outlineText: { color: colors.green, fontSize: 11, fontWeight: '800' }, selectedCard: { padding: 11, borderRadius: 10, borderWidth: 1, borderColor: colors.line, marginTop: 8, backgroundColor: colors.canvas }, selectedTop: { flexDirection: 'row', alignItems: 'center', gap: 7 }, selectedName: { color: colors.ink, fontSize: 11, fontWeight: '800' }, removeExercise: { color: colors.red, fontSize: 9, fontWeight: '700' }, settingRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginTop: 9 }, settingLabel: { color: colors.muted, fontSize: 10, marginRight: 3 }, stepButton: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center', borderRadius: 7, backgroundColor: colors.pale }, stepText: { color: colors.green, fontSize: 14, fontWeight: '800' }, settingValue: { width: 17, textAlign: 'center', color: colors.ink, fontSize: 11, fontWeight: '700' }, smallInput: { minWidth: 61, height: 32, paddingHorizontal: 7, borderWidth: 1, borderColor: colors.line, borderRadius: 7, color: colors.ink, backgroundColor: colors.white, fontSize: 10 }, saveButton: { minHeight: 47, justifyContent: 'center', alignItems: 'center', borderRadius: 10, backgroundColor: colors.green, marginTop: 15 }, saveButtonText: { color: 'white', fontSize: 12, fontWeight: '800' }, cancelButton: { minHeight: 39, justifyContent: 'center', alignItems: 'center', marginTop: 6 },
}); }
