import { designTokens } from '../theme';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { AppText as Text, AppTextInput as TextInput, Card, ConfirmDialog, PageHeading, Tag } from '../components/ui';
import { router, useFocusEffect } from 'expo-router';
import AppShell from '../components/AppShell';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { deleteExercise, listExercises, listProfessionalsByVerification, listRegisteredUsers, saveExercise, setProfessionalVerification } from '../lib/exercises';

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
  const [pendingProfessionals, setPendingProfessionals] = useState([]);
  const [verifiedProfessionals, setVerifiedProfessionals] = useState([]);
  const [professionalsLoading, setProfessionalsLoading] = useState(false);
  const [professionalsError, setProfessionalsError] = useState('');
  const [updatingProfessionalId, setUpdatingProfessionalId] = useState(null);
  const [exerciseToRemove, setExerciseToRemove] = useState(null);
  const [removingExercise, setRemovingExercise] = useState(false);

  const loadExercises = useCallback(async () => {
    try {
      setItems(await listExercises());
      setError('');
    } catch (loadError) {
      setError(loadError.code === 'permission-denied'
        ? 'Publique as regras atualizadas do Firestore para administrar o catálogo.'
        : 'Não foi possível carregar o catálogo de exercícios. Tente novamente.');
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
        : 'Não foi possível carregar as contas. Tente novamente.');
    } finally {
      setAccountsLoading(false);
    }
  }, []);

  const loadProfessionals = useCallback(async () => {
    setProfessionalsLoading(true);
    setProfessionalsError('');
    try {
      const [pending, verified] = await Promise.all([
        listProfessionalsByVerification(false),
        listProfessionalsByVerification(true),
      ]);
      setPendingProfessionals(pending);
      setVerifiedProfessionals(verified);
    } catch (loadError) {
      setProfessionalsError(loadError.code === 'permission-denied'
        ? 'Seu acesso administrativo não foi reconhecido. Atualize a sessão e tente novamente.'
        : 'Não foi possível carregar os profissionais. Confira a conexão e tente novamente.');
    } finally {
      setProfessionalsLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    if (session?.user?.role === 'admin') {
      loadExercises();
      loadAccounts();
      loadProfessionals();
    } else if (session) {
      router.replace('/inicio');
    }
  }, [loadAccounts, loadExercises, loadProfessionals, session]));

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
        : 'Não foi possível salvar o exercício. Confira os dados e tente novamente.');
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
    setRemovingExercise(true);
    setError('');
    try {
      await deleteExercise(exerciseId);
      setExerciseToRemove(null);
      await loadExercises();
    } catch (deleteError) {
      setError(deleteError.code === 'permission-denied'
        ? 'A exclusão foi bloqueada pelas regras do Firestore. Publique firestore.rules.'
        : 'Não foi possível excluir o exercício. Tente novamente.');
    } finally { setRemovingExercise(false); }
  }

  async function changeProfessionalVerification(professional, verified) {
    setUpdatingProfessionalId(professional.id);
    setProfessionalsError('');
    try {
      await setProfessionalVerification(professional.id, verified);
      await loadProfessionals();
    } catch {
      setProfessionalsError('Não foi possível atualizar a verificação. Confirme se as regras publicadas reconhecem seu acesso de administrador.');
    } finally {
      setUpdatingProfessionalId(null);
    }
  }

  return <AppShell><View style={s.page}>
    <PageHeading eyebrow="ADMINISTRAÇÃO" title="Painel administrativo" description="Gerencie o catálogo de exercícios e consulte as contas cadastradas." />

    <Card style={s.card}>
      <Text style={s.sectionTitle}>Profissionais pendentes</Text>
      <Text style={s.muted}>Confira o registro profissional antes de aprovar o acesso ao diretório e aos atendimentos.</Text>
      {!!professionalsError && <Text style={s.error}>{professionalsError}</Text>}
      {professionalsLoading && pendingProfessionals.length === 0
        ? <View style={s.loading}><ActivityIndicator color={colors.green} /><Text style={s.muted}>Carregando profissionais...</Text></View>
        : pendingProfessionals.length === 0
          ? (professionalsError ? null : <Text style={s.empty}>Não há profissionais aguardando aprovação.</Text>)
          : pendingProfessionals.map((professional) => <View key={professional.id} style={s.professionalRow}>
            <View style={s.rowCopy}><Text style={s.rowTitle}>{professional.name || 'Profissional sem nome'}</Text><Text style={s.muted}>Registro: {professional.registrationNumber || 'Não informado'}</Text></View><Tag label="Pendente" tone="warning" />
            <Pressable onPress={() => changeProfessionalVerification(professional, true)} disabled={updatingProfessionalId === professional.id} style={s.approveButton} accessibilityRole="button" accessibilityLabel={`Aprovar ${professional.name}`}><Text style={s.approveText}>{updatingProfessionalId === professional.id ? 'Salvando...' : 'Aprovar'}</Text></Pressable>
          </View>)}
      {professionalsError && <Pressable onPress={loadProfessionals} style={s.moreButton} accessibilityRole="button"><Text style={s.cancelText}>Tentar novamente</Text></Pressable>}
    </Card>

    <Card style={s.card}>
      <Text style={s.sectionTitle}>Profissionais verificados</Text>
      {verifiedProfessionals.length === 0 && !professionalsLoading
        ? <Text style={s.empty}>Nenhum profissional aprovado por enquanto.</Text>
        : verifiedProfessionals.map((professional) => <View key={professional.id} style={s.professionalRow}>
          <View style={s.rowCopy}><Text style={s.rowTitle}>{professional.name || 'Profissional sem nome'}</Text><Text style={s.muted}>Registro: {professional.registrationNumber || 'Não informado'}</Text></View><Tag label="Verificado" tone="success" />
          <Pressable onPress={() => changeProfessionalVerification(professional, false)} disabled={updatingProfessionalId === professional.id} style={s.revokeButton} accessibilityRole="button" accessibilityLabel={`Revogar verificação de ${professional.name}`}><Text style={s.revokeText}>{updatingProfessionalId === professional.id ? 'Salvando...' : 'Revogar'}</Text></Pressable>
        </View>)}
    </Card>

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
        <Pressable onPress={() => setExerciseToRemove(item)} style={s.deleteButton} accessibilityRole="button" accessibilityLabel={`Excluir exercício ${item.name}`}><Text style={s.deleteText}>Excluir</Text></Pressable>
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
  </View><ConfirmDialog visible={Boolean(exerciseToRemove)} title="Excluir este exercício?" message={exerciseToRemove ? `“${exerciseToRemove.name}” será removido do catálogo. Essa ação não pode ser desfeita.` : ''} confirmLabel="Excluir exercício" cancelLabel="Manter exercício" destructive loading={removingExercise} onConfirm={() => exerciseToRemove && remove(exerciseToRemove.id)} onCancel={() => { if (!removingExercise) setExerciseToRemove(null); }} /></AppShell>;
}

function createStyles(colors) { const { space, radius, type } = designTokens; return StyleSheet.create({
  page: { width: '100%', maxWidth: 900 }, card: { width: '100%', padding: space.md + 4, marginBottom: space.md }, sectionTitle: { color: colors.ink, fontSize: type.size.body + 1, fontWeight: '800', marginBottom: space.sm },
  input: { minHeight: 44, borderWidth: 1, borderColor: colors.line, borderRadius: radius.xs, paddingHorizontal: space.sm, paddingVertical: space.xs + 1, color: colors.ink, marginBottom: space.xs + 1 }, multiline: { minHeight: 80, textAlignVertical: 'top' },
  primaryButton: { minHeight: 46, alignItems: 'center', justifyContent: 'center', borderRadius: radius.xs + 1, backgroundColor: colors.green, marginTop: space.xxs, paddingHorizontal: space.sm + 2 }, primaryText: { color: colors.textOnPrimary, fontSize: type.size.label + 1, fontWeight: '700' }, cancelButton: { padding: space.sm, alignItems: 'center' }, cancelText: { color: colors.green, fontSize: type.size.label + 1, fontWeight: '700' },
  exerciseRow: { minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: space.xs + 1, borderTopWidth: 1, borderColor: colors.line, paddingVertical: space.xs }, rowCopy: { flex: 1 }, rowTitle: { color: colors.ink, fontSize: type.size.caption, fontWeight: '700' }, smallButton: { paddingHorizontal: space.sm - 1, paddingVertical: space.xs + 1, borderRadius: radius.xs, backgroundColor: colors.green }, deleteButton: { minHeight: 40, justifyContent: 'center', paddingHorizontal: space.xxs + 1 }, deleteText: { color: colors.red, fontSize: type.size.label, fontWeight: '700' },
  professionalRow: { minHeight: 68, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: space.xs + 2, borderTopWidth: 1, borderColor: colors.line, paddingVertical: space.xs + 2 }, approveButton: { minHeight: 44, paddingHorizontal: space.sm + 2, borderRadius: radius.xs + 1, justifyContent: 'center', backgroundColor: colors.green }, approveText: { color: colors.textOnPrimary, fontSize: type.size.label + 1, fontWeight: '800' }, revokeButton: { minHeight: 44, paddingHorizontal: space.sm + 2, borderRadius: radius.xs + 1, justifyContent: 'center', backgroundColor: colors.soft }, revokeText: { color: colors.red, fontSize: type.size.label + 1, fontWeight: '800' },
  accountRow: { borderTopWidth: 1, borderColor: colors.line, paddingVertical: space.sm, gap: space.xxs }, accountEmail: { color: colors.green, fontSize: type.size.label + 1 }, muted: { color: colors.muted, fontSize: type.size.label, marginTop: space.xxs - 1 }, error: { color: colors.red, fontSize: type.size.label + 1, marginTop: space.xs }, empty: { color: colors.muted, fontSize: type.size.label + 1, marginTop: space.sm + 2 }, loading: { minHeight: 60, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space.xs + 2 }, moreButton: { minHeight: 44, borderRadius: radius.xs + 1, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center', marginTop: space.sm },
}); }
