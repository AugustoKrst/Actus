import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Card, Chip, SectionTitle } from './ui';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const goals = ['Ganhar força', 'Ter mais disposição', 'Criar uma rotina', 'Melhorar mobilidade'];

export default function ProfileEditor() {
  const { session, updateUser } = useAuth();
  const { colors } = useTheme();
  const s = createStyles(colors);
  const [name, setName] = useState(session?.user?.name || '');
  const [goal, setGoal] = useState(session?.user?.goal || goals[2]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function save() {
    setLoading(true); setError(''); setMessage('');
    try { await updateUser({ name, goal }); setMessage('Suas preferências foram salvas.'); }
    catch (saveError) { setError(saveError.message); }
    finally { setLoading(false); }
  }

  return <Card style={s.card}>
    <SectionTitle title="Seu perfil" caption="Seus dados pessoais" />
    <Text style={s.label}>NOME</Text>
    <TextInput value={name} onChangeText={setName} style={s.input} placeholder="Seu nome" placeholderTextColor={colors.muted} />
    <Text style={s.label}>E-MAIL</Text>
    <View style={[s.input, s.readonly]}><Text style={s.readonlyText}>{session?.user?.email}</Text><Text style={s.verified}>✓ verificado</Text></View>
    <Text style={s.label}>SEU OBJETIVO PRINCIPAL</Text>
    <View style={s.wrap}>{goals.map((item) => <Chip key={item} label={item} selected={goal === item} onPress={() => setGoal(item)} />)}</View>
    {!!message && <Text style={s.success}>{message}</Text>}
    {!!error && <Text style={s.error}>{error}</Text>}
    <Pressable style={[s.button, loading && s.buttonDisabled]} disabled={loading} onPress={save} accessibilityRole="button">
      {loading ? <ActivityIndicator color="white" /> : <Text style={s.buttonText}>Salvar alterações</Text>}
    </Pressable>
  </Card>;
}

function createStyles(colors) { return StyleSheet.create({
  card: { maxWidth: 690, padding: 24 }, label: { color: colors.subtle, fontSize: 9, letterSpacing: 1.1, fontWeight: '800', marginTop: 23, marginBottom: 9 },
  input: { minHeight: 46, borderWidth: 1, borderColor: colors.line, borderRadius: 9, paddingHorizontal: 13, color: colors.ink, fontSize: 13, backgroundColor: colors.field, justifyContent: 'center' }, readonly: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, readonlyText: { color: colors.ink, fontSize: 13 }, verified: { color: colors.green, fontSize: 10, fontWeight: '600' }, wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  button: { minHeight: 47, borderRadius: 9, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.green, marginTop: 25 }, buttonDisabled: { opacity: 0.7 }, buttonText: { color: 'white', fontSize: 12, fontWeight: '700' }, success: { color: colors.green, fontSize: 12, marginTop: 14 }, error: { color: colors.red, fontSize: 12, marginTop: 14 },
}); }
