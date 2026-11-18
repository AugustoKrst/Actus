import { forwardRef, useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
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
  const [accountType, setAccountType] = useState('user');
  const [professionalRegistrationNumber, setProfessionalRegistrationNumber] = useState('');
  const [privacyConsent, setPrivacyConsent] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [touched, setTouched] = useState({});
  const emailInput = useRef(null);
  const passwordInput = useRef(null);
  const emailError = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ? '' : 'Informe um e-mail válido.';
  const nameError = name.trim().length < 2 ? 'Informe seu nome com pelo menos 2 caracteres.' : name.trim().length > 80 ? 'Use até 80 caracteres.' : '';
  const passwordError = !password ? 'Informe sua senha.' : isRegister && password.length < 8 ? 'Use pelo menos 8 caracteres.' : '';
  const registrationError = professionalRegistrationNumber.trim().length < 3 ? 'Informe seu registro profissional.' : '';
  const formValid = !emailError && !passwordError && (!isRegister || (!nameError && (accountType !== 'health_professional' || !registrationError)));
  const showFieldError = (field) => submitted || touched[field];

  async function submit() {
    setSubmitted(true);
    setError('');
    if (!formValid || (isRegister && !privacyConsent)) return;
    setLoading(true);
    try {
      if (isRegister) await register({ name, email, password, accountType, professionalRegistrationNumber, privacyConsent });
      else await login({ email, password });
      router.replace('/inicio');
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  return <SafeAreaView style={{ flex: 1, backgroundColor: colors.white }}><ScrollView contentContainerStyle={[s.page, compact && s.pageCompact]} keyboardShouldPersistTaps="handled">
    <View style={[s.left, compact && s.leftCompact]}>
      <View style={s.brand}><Feather name="activity" size={24} color={colors.lime} accessibilityElementsHidden importantForAccessibility="no" /><Text style={s.brandName}>Actus</Text></View>
      <View style={[s.hero, compact && s.heroCompact]}>
        <Text style={s.eyebrow}>MOVIMENTO DO SEU JEITO</Text>
        <Text style={[s.headline, compact && s.headlineCompact]}>Um corpo em movimento.{ '\n' }Uma vida mais leve.</Text>
        <Text style={[s.sub, compact && s.subCompact]}>Treinos feitos para a sua rotina, o seu espaço e o seu momento.</Text>
        {!compact && <View style={s.art}><View style={s.artCircle}><Feather name="arrow-up-right" size={39} color={colors.dark} accessibilityElementsHidden importantForAccessibility="no" /></View><View><Text style={s.artTitle}>Pequenos passos,{ '\n' }grandes mudanças.</Text><Text style={s.artCaption}>SEU RITMO. SUA JORNADA.</Text></View></View>}
      </View>
      {!compact && <Text style={s.footer}>© 2026 Actus · Saúde que acompanha você</Text>}
    </View>
    <KeyboardAvoidingView style={[s.right, compact && s.rightCompact]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={s.form}>
        <Text style={s.formEyebrow}>{isRegister ? 'COMECE POR AQUI' : 'BEM-VINDO DE VOLTA'}</Text>
        <Text style={s.formTitle}>{isRegister ? 'Crie sua conta' : 'Entre na sua conta'}</Text>
        <Text style={s.formSub}>{isRegister ? 'Sua jornada começa com um primeiro passo.' : 'Seu próximo treino está esperando por você.'}</Text>
        {isRegister && <Field label="SEU NOME" placeholder="Como podemos chamar você?" value={name} onChangeText={setName} error={showFieldError('name') ? nameError : ''} autoCapitalize="words" returnKeyType="next" onBlur={() => setTouched((current) => ({ ...current, name: true }))} onSubmitEditing={() => emailInput.current?.focus()} autoFocus />}
        {isRegister && <View style={s.accountTypeField}>
          <Text style={s.label}>COMO VOCÊ VAI USAR O ACTUS?</Text>
          <View style={s.accountTypeOptions}>
            <AccountTypeOption selected={accountType === 'user'} onPress={() => setAccountType('user')} title="Usuário comum" description="Quero cuidar da minha rotina e dos meus treinos." />
            <AccountTypeOption selected={accountType === 'health_professional'} onPress={() => setAccountType('health_professional')} title="Profissional de saúde" description="Quero usar o Actus no meu trabalho." />
          </View>
        </View>}
        {isRegister && accountType === 'health_professional' && <Field label="REGISTRO PROFISSIONAL" placeholder="Ex.: CREF, CRN ou CRM" value={professionalRegistrationNumber} onChangeText={setProfessionalRegistrationNumber} error={showFieldError('registration') ? registrationError : ''} autoCapitalize="characters" maxLength={40} returnKeyType="next" onBlur={() => setTouched((current) => ({ ...current, registration: true }))} onSubmitEditing={() => emailInput.current?.focus()} />}
        <Field ref={emailInput} label="E-MAIL" placeholder="voce@email.com" value={email} onChangeText={setEmail} error={showFieldError('email') ? emailError : ''} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} returnKeyType="next" onBlur={() => setTouched((current) => ({ ...current, email: true }))} onSubmitEditing={() => passwordInput.current?.focus()} />
        <Field ref={passwordInput} label="SENHA" placeholder={isRegister ? 'Mínimo de 8 caracteres' : 'Sua senha'} value={password} onChangeText={setPassword} error={showFieldError('password') ? passwordError : ''} secureTextEntry returnKeyType="done" onBlur={() => setTouched((current) => ({ ...current, password: true }))} onSubmitEditing={submit} />
        {isRegister && <View style={s.consentRow}>
          <Pressable onPress={() => setPrivacyConsent((value) => !value)} style={s.consentCheckTouch} accessibilityRole="checkbox" accessibilityLabel="Aceito a Política de Privacidade e o tratamento de dados de saúde e atividade física" accessibilityState={{ checked: privacyConsent }}><View style={[s.checkbox, privacyConsent && s.checkboxChecked]}><Text style={s.checkboxTick}>{privacyConsent ? '✓' : ''}</Text></View></Pressable>
          <Text style={s.consentText}>Li a <Text onPress={() => router.push('/privacidade')} style={s.consentLink}>Política de Privacidade</Text> e concordo com o uso dos dados informados para oferecer os recursos do Actus, incluindo dados de saúde e atividade física.</Text>
        </View>}
        {isRegister && submitted && !privacyConsent ? <Text accessibilityRole="alert" style={s.fieldError}>Aceite a Política de Privacidade para criar sua conta.</Text> : null}
        {!!error && <Text style={s.error}>{error}</Text>}
        <Pressable onPress={submit} disabled={loading || (submitted && (!formValid || (isRegister && !privacyConsent)))} accessibilityRole="button" accessibilityState={{ disabled: loading || (submitted && (!formValid || (isRegister && !privacyConsent))), busy: loading }} style={({ pressed }) => [s.button, (loading || (submitted && (!formValid || (isRegister && !privacyConsent)))) && s.buttonDisabled, pressed && !loading && { opacity: 0.85 }]}>{loading ? <ActivityIndicator color="white" /> : <Text style={s.buttonText}>{isRegister ? 'Criar minha conta  →' : 'Entrar na minha conta  →'}</Text>}</Pressable>
        <View style={s.switchRow}><Text style={s.switchText}>{isRegister ? 'Já tem uma conta?' : 'Ainda não tem uma conta?'}</Text><Pressable accessibilityRole="button" onPress={() => { setError(''); setSubmitted(false); setTouched({}); setIsRegister(!isRegister); }}><Text style={s.switchLink}>{isRegister ? ' Fazer login' : ' Criar conta'}</Text></Pressable></View>
        <View style={s.secure}><Feather name="lock" size={15} color={colors.green} accessibilityElementsHidden importantForAccessibility="no" /><Text style={s.secureText}>Seus dados ficam protegidos e só são usados para personalizar sua experiência.</Text></View>
      </View>
    </KeyboardAvoidingView>
  </ScrollView></SafeAreaView>;
}

const Field = forwardRef(function Field({ label, error, ...props }, ref) { const { colors } = useTheme(); const s = createStyles(colors); return <View style={s.field}><Text style={s.label}>{label}</Text><TextInput ref={ref} style={[s.input, error && s.inputError]} placeholderTextColor={colors.muted} accessibilityLabel={label} accessibilityHint={error || undefined} {...props} />{error ? <Text accessibilityRole="alert" style={s.fieldError}>{error}</Text> : null}</View>; });

function AccountTypeOption({ selected, onPress, title, description }) { const { colors } = useTheme(); const s = createStyles(colors); return <Pressable accessibilityRole="radio" accessibilityState={{ selected }} onPress={onPress} style={[s.accountTypeOption, selected && s.accountTypeOptionSelected]}><View style={[s.radio, selected && s.radioSelected]}>{selected && <View style={s.radioDot} />}</View><View style={s.accountTypeCopy}><Text style={s.accountTypeTitle}>{title}</Text><Text style={s.accountTypeDescription}>{description}</Text></View></Pressable>; }

function createStyles(colors) { return StyleSheet.create({
  page: { width: '100%', minWidth: 0, minHeight: '100%', flexGrow: 1, flexDirection: 'row', backgroundColor: colors.white },
  pageCompact: { width: '100%', minWidth: 0, flexDirection: 'column', alignItems: 'stretch' },
  left: { flex: 1, minHeight: 780, backgroundColor: colors.dark, paddingHorizontal: 52, paddingTop: 38, paddingBottom: 28, justifyContent: 'space-between' },
  leftCompact: { flex: 0, width: '100%', minWidth: 0, minHeight: 220, paddingHorizontal: 24, paddingVertical: 24 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 9 }, brandIcon: { color: colors.lime, fontSize: 27 }, brandName: { fontSize: 24, fontWeight: '800', letterSpacing: -1, color: 'white' },
  hero: { maxWidth: 510, alignSelf: 'center', width: '100%', marginVertical: 45 }, heroCompact: { marginVertical: 22 },
  eyebrow: { color: colors.lime, fontSize: 11, fontWeight: '800', letterSpacing: 2 }, headline: { color: 'white', fontSize: 47, fontWeight: '700', letterSpacing: -1.6, lineHeight: 55, marginTop: 18 }, headlineCompact: { fontSize: 31, lineHeight: 37, marginTop: 10 },
  sub: { color: '#C3D2C8', fontSize: 16, lineHeight: 26, marginTop: 16, maxWidth: 390 }, subCompact: { fontSize: 13, lineHeight: 20, marginTop: 8 },
  art: { height: 162, backgroundColor: '#255B45', borderRadius: 20, marginTop: 40, padding: 24, flexDirection: 'row', alignItems: 'center', gap: 20 }, artCircle: { height: 82, width: 82, borderRadius: 41, backgroundColor: colors.lime, alignItems: 'center', justifyContent: 'center' }, artSymbol: { color: colors.dark, fontSize: 43, fontWeight: '300' }, artTitle: { color: 'white', fontSize: 19, fontWeight: '700', lineHeight: 26 }, artCaption: { color: '#B7D2C2', fontSize: 9, letterSpacing: 1.5, marginTop: 11, fontWeight: '700' }, footer: { color: '#ADC3B6', fontSize: 11 },
  right: { flex: 1, minHeight: 780, justifyContent: 'center', alignItems: 'center', padding: 28, backgroundColor: colors.white }, rightCompact: { flex: 0, width: '100%', minWidth: 0, minHeight: 560, padding: 24 }, form: { maxWidth: 410, width: '100%', minWidth: 0, flexShrink: 1 },
  formEyebrow: { color: colors.green, fontWeight: '800', letterSpacing: 1.6, fontSize: 10 }, formTitle: { fontSize: 32, color: colors.ink, fontWeight: '700', letterSpacing: -0.8, marginTop: 10 }, formSub: { fontSize: 14, color: colors.muted, marginTop: 8, marginBottom: 27 },
  field: { marginBottom: 18 }, label: { color: colors.subtle, fontSize: 10, fontWeight: '800', letterSpacing: 1, marginBottom: 8 }, input: { borderWidth: 1, borderColor: colors.line, backgroundColor: colors.field, borderRadius: 11, height: 50, paddingHorizontal: 14, color: colors.ink, fontSize: 14 }, inputError: { borderColor: colors.red }, fieldError: { color: colors.red, fontSize: 10, lineHeight: 15, marginTop: 5 },
  accountTypeField: { marginBottom: 18 }, accountTypeOptions: { gap: 9 }, accountTypeOption: { minHeight: 68, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.field, borderRadius: 11, paddingHorizontal: 13, paddingVertical: 11, flexDirection: 'row', alignItems: 'center', gap: 11 }, accountTypeOptionSelected: { borderColor: colors.green, backgroundColor: colors.pale }, radio: { width: 18, height: 18, borderRadius: 9, borderWidth: 1.5, borderColor: colors.muted, alignItems: 'center', justifyContent: 'center' }, radioSelected: { borderColor: colors.green }, radioDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: colors.green }, accountTypeCopy: { flex: 1 }, accountTypeTitle: { color: colors.ink, fontSize: 13, fontWeight: '700' }, accountTypeDescription: { color: colors.muted, fontSize: 11, lineHeight: 16, marginTop: 3 },
  consentRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: 2, marginBottom: 15 }, consentCheckTouch: { minWidth: 48, minHeight: 48, alignItems: 'center', justifyContent: 'center', marginLeft: -8 }, checkbox: { width: 20, height: 20, borderWidth: 1.5, borderColor: colors.muted, borderRadius: 5, alignItems: 'center', justifyContent: 'center' }, checkboxChecked: { backgroundColor: colors.green, borderColor: colors.green }, checkboxTick: { color: 'white', fontSize: 13, fontWeight: '800' }, consentText: { flex: 1, color: colors.muted, fontSize: 10, lineHeight: 16, paddingTop: 4 }, consentLink: { color: colors.green, textDecorationLine: 'underline', fontWeight: '700' },
  button: { backgroundColor: colors.green, minHeight: 52, alignItems: 'center', justifyContent: 'center', borderRadius: 11, marginTop: 4 }, buttonDisabled: { opacity: 0.5 }, buttonText: { color: 'white', fontWeight: '700', fontSize: 14 }, error: { color: colors.red, fontSize: 13, marginBottom: 10 },
  switchRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 21 }, switchText: { color: colors.muted, fontSize: 13 }, switchLink: { color: colors.green, fontWeight: '700', fontSize: 13 }, secure: { flexDirection: 'row', gap: 9, marginTop: 32, paddingTop: 20, borderTopWidth: 1, borderTopColor: colors.line, alignItems: 'flex-start' }, lock: { color: colors.green, fontSize: 17 }, secureText: { flex: 1, color: colors.muted, fontSize: 11, lineHeight: 17 },
}); }
