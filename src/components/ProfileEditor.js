import { useState } from 'react';
import { router } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { AppText as Text, AppTextInput as TextInput, Card, Chip, SectionTitle } from './ui';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { deleteMyAccount } from '../lib/account';

const goals = ['Ganhar força', 'Ter mais disposição', 'Criar uma rotina', 'Melhorar mobilidade'];

export default function ProfileEditor() {
  const { session, updateUser } = useAuth();
  if (!session?.user) return null;
  return <ProfileEditorForm key={session.user.uid} session={session} updateUser={updateUser} />;
}

function ProfileEditorForm({ session, updateUser }) {
  const { colors } = useTheme();
  const s = createStyles(colors);
  const [name, setName] = useState(session?.user?.name || '');
  const [goal, setGoal] = useState(session?.user?.goal || goals[2]);
  const [professionalRegistrationNumber, setProfessionalRegistrationNumber] = useState(session?.user?.professionalRegistrationNumber || '');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [deleting, setDeleting] = useState(false);

  async function save() {
    setLoading(true); setError(''); setMessage('');
    try {
      const changes = { name, goal };
      if (session?.user?.accountType === 'health_professional' && !session.user.professionalRegistrationNumber) changes.professionalRegistrationNumber = professionalRegistrationNumber;
      await updateUser(changes);
      setMessage('Suas preferências foram salvas.');
    }
    catch (saveError) { setError(saveError.message); }
    finally { setLoading(false); }
  }

  async function confirmDeleteAccount() {
    setDeleting(true);
    setDeleteError('');
    try {
      await deleteMyAccount(deletePassword);
      router.replace('/login');
    } catch (deleteFailure) {
      setDeleteError(deleteFailure.message || 'Não foi possível excluir sua conta. Tente novamente.');
    } finally {
      setDeleting(false);
    }
  }

  return <Card style={s.card}>
    <SectionTitle title="Seu perfil" caption="Seus dados pessoais" />
    <Text style={s.label}>NOME</Text>
    <TextInput value={name} onChangeText={setName} style={s.input} placeholder="Seu nome" placeholderTextColor={colors.muted} />
    <Text style={s.label}>E-MAIL</Text>
    <View style={[s.input, s.readonly]}><Text style={s.readonlyText}>{session?.user?.email}</Text><Text style={session?.user?.emailVerified ? s.verified : s.pending}>{session?.user?.emailVerified ? 'Verificado' : 'Não verificado'}</Text></View>
    {session?.user?.accountType === 'health_professional' && <>
      <Text style={s.label}>REGISTRO PROFISSIONAL</Text>
      {session.user.professionalRegistrationNumber
        ? <View style={[s.input, s.readonly]}><Text style={s.readonlyText}>{session.user.professionalRegistrationNumber}</Text><Text style={session.user.professionalVerified ? s.verified : s.pending}>{session.user.professionalVerified ? 'Aprovado' : 'Em análise'}</Text></View>
        : <TextInput value={professionalRegistrationNumber} onChangeText={setProfessionalRegistrationNumber} style={s.input} placeholder="Ex.: CREF, CRN ou CRM" placeholderTextColor={colors.muted} maxLength={40} accessibilityLabel="Registro profissional" />}
      {!session.user.professionalVerified && <Text style={s.helper}>Seu perfil profissional será liberado após a conferência do registro pela equipe do Actus.</Text>}
    </>}
    <Text style={s.label}>SEU OBJETIVO PRINCIPAL</Text>
    <View style={s.wrap}>{goals.map((item) => <Chip key={item} label={item} selected={goal === item} onPress={() => setGoal(item)} />)}</View>
    {!!message && <Text style={s.success}>{message}</Text>}
    {!!error && <Text style={s.error}>{error}</Text>}
    <Pressable style={[s.button, loading && s.buttonDisabled]} disabled={loading} onPress={save} accessibilityRole="button">
      {loading ? <ActivityIndicator color="white" /> : <Text style={s.buttonText}>Salvar alterações</Text>}
    </Pressable>
    <View style={s.dangerZone}>
      <Text style={s.dangerTitle}>Excluir minha conta</Text>
      <Text style={s.helper}>A exclusão remove seu perfil, seus treinos e suas conversas. Esta ação não pode ser desfeita.</Text>
      {!deleteOpen
        ? <Pressable onPress={() => { setDeleteOpen(true); setDeleteError(''); }} style={s.deleteButton} accessibilityRole="button"><Text style={s.deleteButtonText}>Continuar com a exclusão</Text></Pressable>
        : <>
          <TextInput value={deletePassword} onChangeText={setDeletePassword} style={s.input} placeholder="Digite sua senha para confirmar" placeholderTextColor={colors.muted} secureTextEntry accessibilityLabel="Senha para confirmar exclusão da conta" returnKeyType="done" onSubmitEditing={confirmDeleteAccount} />
          {!!deleteError && <Text style={s.error}>{deleteError}</Text>}
          <View style={s.deleteActions}><Pressable onPress={() => { setDeleteOpen(false); setDeletePassword(''); setDeleteError(''); }} disabled={deleting} style={s.cancelButton} accessibilityRole="button"><Text style={s.cancelText}>Cancelar</Text></Pressable><Pressable onPress={confirmDeleteAccount} disabled={deleting || !deletePassword} style={[s.deleteButton, (deleting || !deletePassword) && s.buttonDisabled]} accessibilityRole="button"><Text style={s.deleteButtonText}>{deleting ? 'Excluindo...' : 'Excluir conta'}</Text></Pressable></View>
        </>}
    </View>
  </Card>;
}

function createStyles(colors) { return StyleSheet.create({
  card: { maxWidth: 690, padding: 24 }, label: { color: colors.subtle, fontSize: 9, letterSpacing: 1.1, fontWeight: '800', marginTop: 23, marginBottom: 9 },
  input: { minHeight: 48, borderWidth: 1, borderColor: colors.line, borderRadius: 9, paddingHorizontal: 13, color: colors.ink, fontSize: 13, backgroundColor: colors.field, justifyContent: 'center' }, readonly: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, readonlyText: { color: colors.ink, fontSize: 13 }, verified: { color: colors.green, fontSize: 10, fontWeight: '700' }, pending: { color: colors.orange, fontSize: 10, fontWeight: '700' }, helper: { color: colors.muted, fontSize: 11, lineHeight: 16, marginTop: 8 }, wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  button: { minHeight: 48, borderRadius: 9, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.green, marginTop: 25 }, buttonDisabled: { opacity: 0.55 }, buttonText: { color: colors.textOnPrimary, fontSize: 12, fontWeight: '700' }, success: { color: colors.green, fontSize: 12, marginTop: 14 }, error: { color: colors.red, fontSize: 12, marginTop: 14 },
  dangerZone: { borderTopWidth: 1, borderColor: colors.line, paddingTop: 20, marginTop: 27 }, dangerTitle: { color: colors.red, fontSize: 14, fontWeight: '800' }, deleteButton: { minHeight: 48, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center', borderRadius: 9, backgroundColor: colors.red }, deleteButtonText: { color: colors.textOnPrimary, fontSize: 11, fontWeight: '800' }, deleteActions: { flexDirection: 'row', gap: 9, marginTop: 10 }, cancelButton: { minHeight: 48, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center', borderRadius: 9, backgroundColor: colors.pale }, cancelText: { color: colors.green, fontSize: 11, fontWeight: '800' },
}); }
