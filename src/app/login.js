import { forwardRef, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { AppText as Text, AppTextInput as TextInput, Button, Card } from '../components/ui';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function LoginScreen() {
  const { login, register } = useAuth();
  const { colors, tokens } = useTheme();
  const s = createStyles(colors, tokens);
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

  return <SafeAreaView style={s.safe}><ScrollView contentContainerStyle={[s.page, compact && s.pageCompact]} keyboardShouldPersistTaps="handled">
    <View style={[s.left, compact && s.leftCompact]}>
      <LinearGradient colors={[colors.heroStart, colors.heroEnd]} style={s.leftGradient} />
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
       <Card style={s.formCard}>
        <Text style={s.formEyebrow}>{isRegister ? 'COMECE POR AQUI' : 'BEM-VINDO DE VOLTA'}</Text>
        <Text style={s.formTitle}>{isRegister ? 'Crie sua conta' : 'Entre na sua conta'}</Text>
        <Text style={s.formSub}>{isRegister ? 'Sua jornada começa com um primeiro passo.' : 'Seu próximo treino está esperando por você.'}</Text>
        {isRegister && <Field label="SEU NOME" placeholder="Como podemos chamar você?" value={name} onChangeText={setName} error={showFieldError('name') ? nameError : ''} autoCapitalize="words" returnKeyType="next" onBlur={() => setTouched((current) => ({ ...current, name: true }))} onSubmitEditing={() => emailInput.current?.focus()} autoFocus />}
        {isRegister && <View style={s.accountTypeField}>
          <Text style={s.label}>COMO VOCÊ VAI USAR O ACTUS?</Text>
          <View style={s.accountTypeOptions}>
            <AccountTypeOption selected={accountType === 'user'} onPress={() => setAccountType('user')} icon="user" title="Usuário comum" description="Quero cuidar da minha rotina e dos meus treinos." />
            <AccountTypeOption selected={accountType === 'health_professional'} onPress={() => setAccountType('health_professional')} icon="activity" title="Profissional de saúde" description="Quero usar o Actus no meu trabalho." />
          </View>
        </View>}
        {isRegister && accountType === 'health_professional' && <Field label="REGISTRO PROFISSIONAL" placeholder="Ex.: CREF, CRN ou CRM" value={professionalRegistrationNumber} onChangeText={setProfessionalRegistrationNumber} error={showFieldError('registration') ? registrationError : ''} autoCapitalize="characters" maxLength={40} returnKeyType="next" onBlur={() => setTouched((current) => ({ ...current, registration: true }))} onSubmitEditing={() => emailInput.current?.focus()} />}
        <Field ref={emailInput} label="E-MAIL" placeholder="voce@email.com" value={email} onChangeText={setEmail} error={showFieldError('email') ? emailError : ''} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} returnKeyType="next" onBlur={() => setTouched((current) => ({ ...current, email: true }))} onSubmitEditing={() => passwordInput.current?.focus()} />
        <Field ref={passwordInput} label="SENHA" placeholder={isRegister ? 'Mínimo de 8 caracteres' : 'Sua senha'} value={password} onChangeText={setPassword} error={showFieldError('password') ? passwordError : ''} secureTextEntry returnKeyType="done" onBlur={() => setTouched((current) => ({ ...current, password: true }))} onSubmitEditing={submit} />
        {isRegister && <View style={s.consentRow}>
          <Pressable onPress={() => setPrivacyConsent((value) => !value)} style={s.consentCheckTouch} accessibilityRole="checkbox" accessibilityLabel="Aceito a Política de Privacidade e o tratamento de dados de saúde e atividade física" accessibilityState={{ checked: privacyConsent }}><View style={[s.checkbox, privacyConsent && s.checkboxChecked]}>{privacyConsent ? <Feather name="check" size={14} color={colors.textOnPrimary} accessibilityElementsHidden importantForAccessibility="no" /> : null}</View></Pressable>
          <Text style={s.consentText}>Li a <Text onPress={() => router.push('/privacidade')} style={s.consentLink}>Política de Privacidade</Text> e concordo com o uso dos dados informados para oferecer os recursos do Actus, incluindo dados de saúde e atividade física.</Text>
        </View>}
        {isRegister && submitted && !privacyConsent ? <Text accessibilityRole="alert" style={s.fieldError}>Aceite a Política de Privacidade para criar sua conta.</Text> : null}
        {!!error && <Text style={s.error}>{error}</Text>}
        <Button onPress={submit} disabled={submitted && (!formValid || (isRegister && !privacyConsent))} loading={loading} title={isRegister ? 'Criar minha conta' : 'Entrar na minha conta'} icon={<Feather name="arrow-right" size={17} color={colors.textOnPrimary} />} iconPosition="trailing" size="large" style={s.button} />
        <View style={s.switchRow}><Text style={s.switchText}>{isRegister ? 'Já tem uma conta?' : 'Ainda não tem uma conta?'}</Text><Pressable accessibilityRole="button" onPress={() => { setError(''); setSubmitted(false); setTouched({}); setIsRegister(!isRegister); }}><Text style={s.switchLink}>{isRegister ? ' Fazer login' : ' Criar conta'}</Text></Pressable></View>
        <View style={s.secure}><Feather name="lock" size={15} color={colors.green} accessibilityElementsHidden importantForAccessibility="no" /><Text style={s.secureText}>Seus dados ficam protegidos e só são usados para personalizar sua experiência.</Text></View>
       </Card>
      </View>
    </KeyboardAvoidingView>
  </ScrollView></SafeAreaView>;
}

const Field = forwardRef(function Field({ label, error, ...props }, ref) { const { colors, tokens } = useTheme(); const s = createStyles(colors, tokens); return <View style={s.field}><Text style={s.label}>{label}</Text><TextInput ref={ref} style={[s.input, error && s.inputError]} placeholderTextColor={colors.textSecondary} accessibilityLabel={label} accessibilityHint={error || undefined} {...props} />{error ? <Text accessibilityRole="alert" style={s.fieldError}>{error}</Text> : null}</View>; });

function AccountTypeOption({ selected, onPress, icon, title, description }) { const { colors, tokens } = useTheme(); const s = createStyles(colors, tokens); return <Pressable accessibilityRole="radio" accessibilityState={{ selected }} onPress={onPress} style={({ pressed }) => [s.accountTypeOption, selected && s.accountTypeOptionSelected, pressed && s.optionPressed]}><View style={[s.optionIcon, selected && s.optionIconSelected]}><Feather name={icon} size={18} color={selected ? colors.primary : colors.textSecondary} accessibilityElementsHidden importantForAccessibility="no" /></View><View style={s.accountTypeCopy}><Text style={s.accountTypeTitle}>{title}</Text><Text style={s.accountTypeDescription}>{description}</Text></View><View style={[s.radio, selected && s.radioSelected]}>{selected && <View style={s.radioDot} />}</View></Pressable>; }

function createStyles(colors, tokens) { const { space, radius, type, metrics } = tokens; return StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  page: { width: '100%', minWidth: 0, minHeight: '100%', flexGrow: 1, flexDirection: 'row', backgroundColor: colors.background }, pageCompact: { flexDirection: 'column', alignItems: 'stretch' },
  left: { flex: 1, minHeight: 700, position: 'relative', overflow: 'hidden', backgroundColor: colors.heroStart, paddingHorizontal: space.xxxl, paddingTop: space.xl, paddingBottom: space.xl, justifyContent: 'space-between' }, leftCompact: { flex: 0, width: '100%', minWidth: 0, minHeight: 230, paddingHorizontal: space.xl, paddingVertical: space.md }, leftGradient: { ...StyleSheet.absoluteFillObject },
  brand: { flexDirection: 'row', alignItems: 'center', gap: space.xs, zIndex: 1 }, brandName: { fontSize: type.size.subtitle, fontWeight: type.weight.bold, letterSpacing: -0.5, color: colors.heroText },
  hero: { maxWidth: 520, alignSelf: 'center', width: '100%', marginVertical: space.xxxl, zIndex: 1 }, heroCompact: { marginVertical: space.md },
  eyebrow: { color: colors.accent, fontSize: type.size.label, fontWeight: type.weight.bold, letterSpacing: 1.6 }, headline: { color: colors.heroText, fontSize: 46, fontWeight: type.weight.bold, letterSpacing: -1.6, lineHeight: 54, marginTop: space.md }, headlineCompact: { fontSize: 30, lineHeight: 36, marginTop: space.xs },
  sub: { color: colors.heroMuted, fontSize: type.size.body, lineHeight: 25, marginTop: space.md, maxWidth: 390 }, subCompact: { fontSize: type.size.caption, lineHeight: 20, marginTop: space.xs },
  art: { height: 148, backgroundColor: colors.heroEnd, borderRadius: radius.xl, marginTop: space.xl, padding: space.xl, flexDirection: 'row', alignItems: 'center', gap: space.md }, artCircle: { height: 72, width: 72, borderRadius: radius.pill, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' }, artTitle: { color: colors.heroText, fontSize: type.size.subtitle, fontWeight: type.weight.bold, lineHeight: 25 }, artCaption: { color: colors.heroMuted, fontSize: type.size.label, letterSpacing: 1.2, marginTop: space.sm, fontWeight: type.weight.bold }, footer: { color: colors.heroMuted, fontSize: type.size.label },
  right: { flex: 1, minHeight: 700, justifyContent: 'center', alignItems: 'center', padding: space.xl, backgroundColor: colors.background }, rightCompact: { flex: 0, width: '100%', minWidth: 0, minHeight: 0, padding: space.md }, form: { maxWidth: 460, width: '100%', minWidth: 0, flexShrink: 1 }, formCard: { padding: space.xl, borderRadius: radius.xl, gap: space.xxs },
  formEyebrow: { color: colors.primary, fontWeight: type.weight.bold, letterSpacing: 1.3, fontSize: type.size.label }, formTitle: { fontSize: type.size.display, lineHeight: 40, color: colors.textPrimary, fontWeight: type.weight.bold, letterSpacing: -0.8, marginTop: space.xs }, formSub: { fontSize: type.size.caption, lineHeight: 20, color: colors.textSecondary, marginTop: space.xxs, marginBottom: space.md },
  field: { marginBottom: space.sm }, label: { color: colors.textSecondary, fontSize: type.size.label, fontWeight: type.weight.bold, letterSpacing: 0.7, marginBottom: space.xxs }, input: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.field, borderRadius: radius.sm, minHeight: metrics.touchTarget, paddingHorizontal: space.sm, color: colors.textPrimary, fontSize: type.size.caption }, inputError: { borderColor: colors.danger }, fieldError: { color: colors.danger, fontSize: type.size.label, lineHeight: 15, marginTop: space.xxs },
  accountTypeField: { marginBottom: space.sm }, accountTypeOptions: { gap: space.xs }, accountTypeOption: { minHeight: 76, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.field, borderRadius: radius.md, paddingHorizontal: space.sm, paddingVertical: space.xs, flexDirection: 'row', alignItems: 'center', gap: space.sm }, accountTypeOptionSelected: { borderColor: colors.primary, backgroundColor: colors.surfaceAlt }, optionPressed: { opacity: 0.82 }, optionIcon: { width: 42, height: 42, borderRadius: radius.sm, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' }, optionIconSelected: { backgroundColor: colors.accent }, radio: { width: 20, height: 20, borderRadius: radius.pill, borderWidth: 1.5, borderColor: colors.textSecondary, alignItems: 'center', justifyContent: 'center' }, radioSelected: { borderColor: colors.primary }, radioDot: { width: 10, height: 10, borderRadius: radius.pill, backgroundColor: colors.primary }, accountTypeCopy: { flex: 1 }, accountTypeTitle: { color: colors.textPrimary, fontSize: type.size.caption, fontWeight: type.weight.bold }, accountTypeDescription: { color: colors.textSecondary, fontSize: type.size.label, lineHeight: 16, marginTop: space.xxs },
  consentRow: { flexDirection: 'row', alignItems: 'flex-start', gap: space.xs, marginTop: space.xxs, marginBottom: space.sm }, consentCheckTouch: { minWidth: metrics.touchTarget, minHeight: metrics.touchTarget, alignItems: 'center', justifyContent: 'center', marginLeft: -space.xs }, checkbox: { width: 22, height: 22, borderWidth: 1.5, borderColor: colors.textSecondary, borderRadius: radius.xs, alignItems: 'center', justifyContent: 'center' }, checkboxChecked: { backgroundColor: colors.primary, borderColor: colors.primary }, consentText: { flex: 1, color: colors.textSecondary, fontSize: type.size.label, lineHeight: 17, paddingTop: space.xxs }, consentLink: { color: colors.primary, textDecorationLine: 'underline', fontWeight: type.weight.bold },
  button: { backgroundColor: colors.primary, marginTop: space.xxs }, error: { color: colors.danger, fontSize: type.size.caption, marginBottom: space.xs },
  switchRow: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', marginTop: space.md }, switchText: { color: colors.textSecondary, fontSize: type.size.caption }, switchLink: { color: colors.primary, fontWeight: type.weight.bold, fontSize: type.size.caption }, secure: { flexDirection: 'row', gap: space.xs, marginTop: space.xl, paddingTop: space.md, borderTopWidth: 1, borderTopColor: colors.border, alignItems: 'flex-start' }, secureText: { flex: 1, color: colors.textSecondary, fontSize: type.size.label, lineHeight: 17 },
}); }
