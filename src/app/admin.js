import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import AppShell from '../components/AppShell';
import { Card, PageHeading } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { deleteExercise, listExercises, listRegisteredUsers, saveExercise } from '../lib/exercises';

const blank = { name: '', muscle: 'legs', equipment: 'bodyweight', places: 'home', level: '1', reps: '10–12', rest_seconds: '60', instructions: '' };
const fields = [
  ['name', 'Nome do exercício'],
  ['muscle', 'Grupo muscular: chest, back, legs, shoulders, arms, core'],
  ['equipment', 'Equipamentos: bodyweight, dumbbells, bands, barbell, machines'],
  ['places', 'Locais: home, gym, outdoors'],
  ['level', 'Nível: 1, 2 ou 3'],
  ['reps', 'Repetições'],
  ['rest_seconds', 'Descanso em segundos'],
  ['instructions', 'Instruções'],
];

export default function AdminScreen() {
  const { session } = useAuth();
  const { colors } = useTheme();
  const s = createStyles(colors);
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(blank);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');
  const [accounts, setAccounts] = useState([]);
  const [accountsCursor, setAccountsCursor] = useState(null);
  const [accountsHaveMore, setAccountsHaveMore] = useState(false);
  const [accountsLoading, setAccountsLoading] = useState(false);
  const [accountsError, setAccountsError] = useState('');

  const loadExercises = useCallback(async () => {
    try {
      setItems(await listExercises());
      setError('');
    } catch (loadError) {
      setError(loadError.code === 'permission-denied'
        ? 'Publique as regras atualizadas do Firestore para administrar o catálogo.'
        : loadError.message);
    }
  }, []);

  const loadAccounts = useCallback(async (cursor = null, append = false) => {
    setAccountsLoading(true);
    setAccountsError('');
    try {
      const page = await listRegisteredUsers(cursor);
      setAccounts((current) => append ? [...current, ...page.users] : page.users);
      setAccountsCursor(page.cursor);
      setAccountsHaveMore(page.hasMore);
    } catch (loadError) {
      setAccountsError(loadError.code === 'permission-denied'
        ? 'Publique as regras atualizadas do Firestore para consultar as contas.'
        : loadError.message);
    } finally {
      setAccountsLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    if (session?.user?.role === 'admin') {
      loadExercises();
      loadAccounts();
    } else if (session) {
      router.replace('/inicio');
    }
  }, [loadAccounts, loadExercises, session]));

  if (!session || session.user.role !== 'admin') return null;

  async function submit() {
    setError('');
    const payload = {
      ...form,
      name: form.name.trim(),
      equipment: form.equipment.split(',').map((value) => value.trim()).filter(Boolean),
      places: form.places.split(',').map((value) => value.trim()).filter(Boolean),
    };
    if (!payload.name || payload.equipment.length === 0 || payload.places.length === 0) {
      setError('Preencha o nome e informe pelo menos um equipamento e um local.');
      return;
    }
    try {
      await saveExercise(payload, editing);
      setForm(blank);
      setEditing(null);
      await loadExercises();
    } catch (saveError) {
      setError(saveError.code === 'permission-denied'
        ? 'A gravação foi bloqueada pelas regras do Firestore. Publique firestore.rules.'
        : saveError.message);
    }
  }

  function edit(item) {
    setEditing(item.id);
    setForm({
      ...item,
      equipment: item.equipment.join(', '),
      places: item.places.join(', '),
      level: String(item.level),
      rest_seconds: String(item.rest_seconds),
    });
  }

  async function remove(exerciseId) {
    setError('');
    try {
      await deleteExercise(exerciseId);
      await loadExercises();
    } catch (deleteError) {
      setError(deleteError.code === 'permission-denied'
        ? 'A exclusão foi bloqueada pelas regras do Firestore. Publique firestore.rules.'
        : deleteError.message);
    }
  }

  return <AppShell><View style={s.page}>
    <PageHeading eyebrow="ADMINISTRAÇÃO" title="Painel administrativo" description="Gerencie o catálogo de exercícios e consulte as contas cadastradas." />

    <Card style={s.card}>
      <Text style={s.sectionTitle}>{editing ? 'Editar exercício' : 'Cadastrar exercício'}</Text>
      {fields.map(([key, placeholder]) => <TextInput
        key={key}
        style={[s.input, key === 'instructions' && s.multiline]}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        value={String(form[key] ?? '')}
        onChangeText={(value) => setForm((current) => ({ ...current, [key]: value }))}
        multiline={key === 'instructions'}
        accessibilityLabel={placeholder}
      />)}
      {!!error && <Text style={s.error}>{error}</Text>}
      <Pressable onPress={submit} style={s.primaryButton} accessibilityRole="button">
        <Text style={s.primaryText}>{editing ? 'Salvar alterações' : 'Adicionar exercício'}</Text>
      </Pressable>
      {editing && <Pressable onPress={() => { setEditing(null); setForm(blank); }} style={s.cancelButton} accessibilityRole="button"><Text style={s.cancelText}>Cancelar edição</Text></Pressable>}
    </Card>

    <Card style={s.card}>
      <Text style={s.sectionTitle}>Exercícios cadastrados ({items.length})</Text>
      {items.length === 0 ? <Text style={s.muted}>Nenhum exercício cadastrado.</Text> : items.map((item) => <View key={item.id} style={s.exerciseRow}>
        <View style={s.rowCopy}><Text style={s.rowTitle}>{item.name}</Text><Text style={s.muted}>{item.muscle} · nível {item.level}</Text></View>
        <Pressable onPress={() => edit(item)} style={s.smallButton} accessibilityRole="button"><Text style={s.primaryText}>Editar</Text></Pressable>
        <Pressable onPress={() => remove(item.id)} style={s.deleteButton} accessibilityRole="button"><Text style={s.deleteText}>Excluir</Text></Pressable>
      </View>)}
    </Card>

    <Card style={s.card}>
      <Text style={s.sectionTitle}>Contas cadastradas</Text>
      <Text style={s.muted}>Nome, email e objetivo informado no perfil.</Text>
      {!!accountsError && <Text style={s.error}>{accountsError}</Text>}
      {accounts.length === 0 && accountsLoading
        ? <View style={s.loading}><ActivityIndicator color={colors.green} /><Text style={s.muted}>Carregando contas...</Text></View>
        : accounts.length === 0 && !accountsError
          ? <Text style={s.empty}>Nenhuma conta cadastrada.</Text>
          : accounts.map((account) => <View key={account.id} style={s.accountRow}>
            <Text style={s.rowTitle}>{account.name || 'Sem nome'}</Text>
            <Text style={s.accountEmail}>{account.email || 'Email não informado'}</Text>
            <Text style={s.muted}>Objetivo: {account.goal || 'Não informado'}</Text>
          </View>)}
      {accountsLoading && accounts.length > 0 && <View style={s.loading}><ActivityIndicator color={colors.green} /><Text style={s.muted}>Carregando mais contas...</Text></View>}
      {accountsHaveMore && !accountsLoading && <Pressable onPress={() => loadAccounts(accountsCursor, true)} style={s.moreButton} accessibilityRole="button"><Text style={s.cancelText}>Carregar mais contas</Text></Pressable>}
    </Card>
  </View></AppShell>;
}

function createStyles(colors) { return StyleSheet.create({
  page: { width: '100%', maxWidth: 900 }, card: { width: '100%', padding: 20, marginBottom: 16 }, sectionTitle: { color: colors.ink, fontSize: 16, fontWeight: '800', marginBottom: 12 },
  input: { minHeight: 44, borderWidth: 1, borderColor: colors.line, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 9, color: colors.ink, marginBottom: 9 }, multiline: { minHeight: 80, textAlignVertical: 'top' },
  primaryButton: { minHeight: 46, alignItems: 'center', justifyContent: 'center', borderRadius: 9, backgroundColor: colors.green, marginTop: 4, paddingHorizontal: 14 }, primaryText: { color: 'white', fontSize: 11, fontWeight: '700' }, cancelButton: { padding: 12, alignItems: 'center' }, cancelText: { color: colors.green, fontSize: 11, fontWeight: '700' },
  exerciseRow: { minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: 9, borderTopWidth: 1, borderColor: colors.line, paddingVertical: 8 }, rowCopy: { flex: 1 }, rowTitle: { color: colors.ink, fontSize: 12, fontWeight: '700' }, smallButton: { paddingHorizontal: 11, paddingVertical: 9, borderRadius: 8, backgroundColor: colors.green }, deleteButton: { minHeight: 40, justifyContent: 'center', paddingHorizontal: 5 }, deleteText: { color: colors.red, fontSize: 10, fontWeight: '700' },
  accountRow: { borderTopWidth: 1, borderColor: colors.line, paddingVertical: 12, gap: 4 }, accountEmail: { color: colors.green, fontSize: 11 }, muted: { color: colors.muted, fontSize: 10, marginTop: 3 }, error: { color: colors.red, fontSize: 11, marginTop: 8 }, empty: { color: colors.muted, fontSize: 11, marginTop: 14 }, loading: { minHeight: 60, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 }, moreButton: { minHeight: 44, borderRadius: 9, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center', marginTop: 12 },
}); }
