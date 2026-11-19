import { designTokens } from '../theme';
import { useState } from 'react';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText as Text, AppTextInput as TextInput, Avatar, Button, Card, Chip, SectionTitle } from './ui';
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
    <View style={s.identity}><Avatar name={name || session.user.name} size="large" /><View style={s.identityCopy}><Text style={s.identityName}>{name || session.user.name}</Text><Text style={s.identityEmail}>{session.user.email}</Text></View></View>
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
    <Button title="Salvar alterações" loading={loading} onPress={save} style={s.button} />
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

function createStyles(colors) { const { space, radius, type } = designTokens; return StyleSheet.create({
  card: { maxWidth: 690, padding: space.xl }, identity: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.xs, marginBottom: space.xs }, identityCopy: { flex: 1, minWidth: 0 }, identityName: { color: colors.ink, fontSize: type.size.subtitle, fontWeight: '800' }, identityEmail: { color: colors.muted, fontSize: type.size.caption, marginTop: space.xxs }, label: { color: colors.subtle, fontSize: type.size.label - 1, letterSpacing: 1.1, fontWeight: '800', marginTop: space.xl - 1, marginBottom: space.xs + 1 },
  input: { minHeight: 48, borderWidth: 1, borderColor: colors.line, borderRadius: radius.xs + 1, paddingHorizontal: space.sm + 1, color: colors.ink, fontSize: type.size.caption + 1, backgroundColor: colors.field, justifyContent: 'center' }, readonly: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, readonlyText: { color: colors.ink, fontSize: type.size.caption + 1 }, verified: { color: colors.green, fontSize: type.size.label, fontWeight: '700' }, pending: { color: colors.orange, fontSize: type.size.label, fontWeight: '700' }, helper: { color: colors.muted, fontSize: type.size.label + 1, lineHeight: type.lineHeight.label + 2, marginTop: space.xs }, wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs },
  button: { marginTop: space.xl + 1 }, success: { color: colors.green, fontSize: type.size.caption, marginTop: space.sm + 2 }, error: { color: colors.red, fontSize: type.size.caption, marginTop: space.sm + 2 },
  dangerZone: { borderTopWidth: 1, borderColor: colors.line, paddingTop: space.md + 4, marginTop: space.xl + 3 }, dangerTitle: { color: colors.red, fontSize: type.size.body - 1, fontWeight: '800' }, deleteButton: { minHeight: 48, paddingHorizontal: space.sm + 2, alignItems: 'center', justifyContent: 'center', borderRadius: radius.xs + 1, backgroundColor: colors.red }, deleteButtonText: { color: colors.textOnPrimary, fontSize: type.size.label + 1, fontWeight: '800' }, deleteActions: { flexDirection: 'row', gap: space.xs + 1, marginTop: space.xs + 2 }, cancelButton: { minHeight: 48, paddingHorizontal: space.md, alignItems: 'center', justifyContent: 'center', borderRadius: radius.xs + 1, backgroundColor: colors.pale }, cancelText: { color: colors.green, fontSize: type.size.label + 1, fontWeight: '800' },
}); }
