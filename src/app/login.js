import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function LoginScreen() {
  const { login, register } = useAuth();
  const { colors } = useTheme();
  const s = createStyles(colors);
  const compact = useWindowDimensions().width <= 700;
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit() {
    setError(''); setLoading(true);
    try {
      if (isRegister) await register({ name, email, password });
      else await login({ email, password });
      router.replace('/inicio');
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  return <SafeAreaView style={{ flex: 1, backgroundColor: colors.white }}><ScrollView contentContainerStyle={[s.page, compact && s.pageCompact]} keyboardShouldPersistTaps="handled">
    <View style={[s.left, compact && s.leftCompact]}>
      <View style={s.brand}><Text style={s.brandIcon}>✳</Text><Text style={s.brandName}>Actus</Text></View>
      <View style={[s.hero, compact && s.heroCompact]}>
        <Text style={s.eyebrow}>MOVIMENTO DO SEU JEITO</Text>
        <Text style={[s.headline, compact && s.headlineCompact]}>Um corpo em movimento.{ '\n' }Uma vida mais leve.</Text>
        <Text style={[s.sub, compact && s.subCompact]}>Treinos feitos para a sua rotina, o seu espaço e o seu momento.</Text>
        {!compact && <View style={s.art}><View style={s.artCircle}><Text style={s.artSymbol}>↗</Text></View><View><Text style={s.artTitle}>Pequenos passos,{ '\n' }grandes mudanças.</Text><Text style={s.artCaption}>SEU RITMO. SUA JORNADA.</Text></View></View>}
      </View>
      {!compact && <Text style={s.footer}>© 2026 Actus · Saúde que acompanha você</Text>}
    </View>
    <KeyboardAvoidingView style={[s.right, compact && s.rightCompact]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={s.form}>
        <Text style={s.formEyebrow}>{isRegister ? 'COMECE POR AQUI' : 'BEM-VINDO DE VOLTA'}</Text>
        <Text style={s.formTitle}>{isRegister ? 'Crie sua conta' : 'Entre na sua conta'}</Text>
        <Text style={s.formSub}>{isRegister ? 'Sua jornada começa com um primeiro passo.' : 'Seu próximo treino está esperando por você.'}</Text>
        {isRegister && <Field label="SEU NOME" placeholder="Como podemos chamar você?" value={name} onChangeText={setName} autoCapitalize="words" />}
        <Field label="E-MAIL" placeholder="voce@email.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
        <Field label="SENHA" placeholder="Mínimo de 8 caracteres" value={password} onChangeText={setPassword} secureTextEntry />
        {!!error && <Text style={s.error}>{error}</Text>}
        <Pressable onPress={submit} disabled={loading} style={({ pressed }) => [s.button, pressed && { opacity: 0.85 }]}>{loading ? <ActivityIndicator color="white" /> : <Text style={s.buttonText}>{isRegister ? 'Criar minha conta  →' : 'Entrar na minha conta  →'}</Text>}</Pressable>
        <View style={s.switchRow}><Text style={s.switchText}>{isRegister ? 'Já tem uma conta?' : 'Ainda não tem uma conta?'}</Text><Pressable onPress={() => { setError(''); setIsRegister(!isRegister); }}><Text style={s.switchLink}>{isRegister ? ' Fazer login' : ' Criar conta'}</Text></Pressable></View>
        <View style={s.secure}><Text style={s.lock}>⌑</Text><Text style={s.secureText}>Seus dados ficam protegidos e só são usados para personalizar sua experiência.</Text></View>
      </View>
    </KeyboardAvoidingView>
  </ScrollView></SafeAreaView>;
}

function Field({ label, ...props }) { const { colors } = useTheme(); const s = createStyles(colors); return <View style={s.field}><Text style={s.label}>{label}</Text><TextInput style={s.input} placeholderTextColor={colors.muted} {...props} /></View>; }

function createStyles(colors) { return StyleSheet.create({
  page: { minHeight: '100%', flexGrow: 1, flexDirection: 'row', backgroundColor: colors.white },
  pageCompact: { flexDirection: 'column' },
  left: { flex: 1, minHeight: 780, backgroundColor: colors.dark, paddingHorizontal: 52, paddingTop: 38, paddingBottom: 28, justifyContent: 'space-between' },
  leftCompact: { minHeight: 220, paddingHorizontal: 24, paddingVertical: 24 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 9 }, brandIcon: { color: colors.lime, fontSize: 27 }, brandName: { fontSize: 24, fontWeight: '800', letterSpacing: -1, color: 'white' },
  hero: { maxWidth: 510, alignSelf: 'center', width: '100%', marginVertical: 45 }, heroCompact: { marginVertical: 22 },
  eyebrow: { color: colors.lime, fontSize: 11, fontWeight: '800', letterSpacing: 2 }, headline: { color: 'white', fontSize: 47, fontWeight: '700', letterSpacing: -1.6, lineHeight: 55, marginTop: 18 }, headlineCompact: { fontSize: 31, lineHeight: 37, marginTop: 10 },
  sub: { color: '#C3D2C8', fontSize: 16, lineHeight: 26, marginTop: 16, maxWidth: 390 }, subCompact: { fontSize: 13, lineHeight: 20, marginTop: 8 },
  art: { height: 162, backgroundColor: '#255B45', borderRadius: 20, marginTop: 40, padding: 24, flexDirection: 'row', alignItems: 'center', gap: 20 }, artCircle: { height: 82, width: 82, borderRadius: 41, backgroundColor: colors.lime, alignItems: 'center', justifyContent: 'center' }, artSymbol: { color: colors.dark, fontSize: 43, fontWeight: '300' }, artTitle: { color: 'white', fontSize: 19, fontWeight: '700', lineHeight: 26 }, artCaption: { color: '#B7D2C2', fontSize: 9, letterSpacing: 1.5, marginTop: 11, fontWeight: '700' }, footer: { color: '#ADC3B6', fontSize: 11 },
  right: { flex: 1, minHeight: 780, justifyContent: 'center', alignItems: 'center', padding: 28, backgroundColor: colors.white }, rightCompact: { minHeight: 560, padding: 24 }, form: { maxWidth: 410, width: '100%' },
  formEyebrow: { color: colors.green, fontWeight: '800', letterSpacing: 1.6, fontSize: 10 }, formTitle: { fontSize: 32, color: colors.ink, fontWeight: '700', letterSpacing: -0.8, marginTop: 10 }, formSub: { fontSize: 14, color: colors.muted, marginTop: 8, marginBottom: 27 },
  field: { marginBottom: 18 }, label: { color: colors.subtle, fontSize: 10, fontWeight: '800', letterSpacing: 1, marginBottom: 8 }, input: { borderWidth: 1, borderColor: colors.line, backgroundColor: colors.field, borderRadius: 11, height: 50, paddingHorizontal: 14, color: colors.ink, fontSize: 14 },
  button: { backgroundColor: colors.green, minHeight: 52, alignItems: 'center', justifyContent: 'center', borderRadius: 11, marginTop: 4 }, buttonText: { color: 'white', fontWeight: '700', fontSize: 14 }, error: { color: colors.red, fontSize: 13, marginBottom: 10 },
  switchRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 21 }, switchText: { color: colors.muted, fontSize: 13 }, switchLink: { color: colors.green, fontWeight: '700', fontSize: 13 }, secure: { flexDirection: 'row', gap: 9, marginTop: 32, paddingTop: 20, borderTopWidth: 1, borderTopColor: colors.line, alignItems: 'flex-start' }, lock: { color: colors.green, fontSize: 17 }, secureText: { flex: 1, color: colors.muted, fontSize: 11, lineHeight: 17 },
}); }
