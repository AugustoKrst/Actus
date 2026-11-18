import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';

export function Header({ eyebrow, title, description, action }) {
  const { colors, tokens } = useTheme();
  const s = styles(colors, tokens);
  return <View style={s.heading}>
    <View style={s.headingCopy}>
      {eyebrow ? <Text style={s.eyebrow}>{eyebrow}</Text> : null}
      <Text style={s.title}>{title}</Text>
      {description ? <Text style={s.description}>{description}</Text> : null}
    </View>
    {action}
  </View>;
}

export function PageHeading(props) { return <Header {...props} />; }

export function Button({ title, onPress, variant = 'primary', loading = false, disabled = false, accessibilityLabel, style, textStyle }) {
  const { colors, tokens } = useTheme();
  const s = styles(colors, tokens);
  const unavailable = disabled || loading;
  return <Pressable
    onPress={onPress}
    disabled={unavailable}
    accessibilityRole="button"
    accessibilityLabel={accessibilityLabel || title}
    accessibilityState={{ disabled: unavailable, busy: loading }}
    style={({ pressed }) => [s.button, s[`button_${variant}`], unavailable && s.buttonDisabled, pressed && !unavailable && s.buttonPressed, style]}
  >
    {loading ? <ActivityIndicator size="small" color={variant === 'secondary' ? colors.green : 'white'} /> : <Text style={[s.buttonText, s[`buttonText_${variant}`], textStyle]}>{title}</Text>}
  </Pressable>;
}

export function Input({ label, value, onChangeText, error, helper, style, accessibilityLabel, ...inputProps }) {
  const { colors, tokens } = useTheme();
  const s = styles(colors, tokens);
  const labelText = label || accessibilityLabel;
  return <View style={s.inputGroup}>
    {label ? <Text style={s.inputLabel}>{label}</Text> : null}
    <TextInput
      value={value}
      onChangeText={onChangeText}
      accessibilityLabel={accessibilityLabel || labelText}
      accessibilityHint={error || helper}
      style={[s.input, error && s.inputError, style]}
      placeholderTextColor={colors.muted}
      {...inputProps}
    />
    {error ? <Text accessibilityRole="alert" style={s.inputErrorText}>{error}</Text> : helper ? <Text style={s.inputHelper}>{helper}</Text> : null}
  </View>;
}

export function Chip({ label, selected, onPress, accessibilityLabel }) {
  const { colors, tokens } = useTheme();
  const s = styles(colors, tokens);
  return <Pressable
    onPress={onPress}
    style={[s.chip, selected && s.chipSelected]}
    accessibilityRole="button"
    accessibilityLabel={accessibilityLabel || label}
    accessibilityState={{ selected: Boolean(selected) }}
  ><Text style={[s.chipText, selected && s.chipTextSelected]}>{label}</Text></Pressable>;
}

export function Card({ children, style, accessibilityLabel }) {
  const { colors, tokens } = useTheme();
  const s = styles(colors, tokens);
  return <View accessibilityLabel={accessibilityLabel} style={[s.card, style]}>{children}</View>;
}

export function SectionTitle({ title, caption }) {
  const { colors, tokens } = useTheme();
  const s = styles(colors, tokens);
  return <View style={s.sectionHead}><Text style={s.sectionTitle}>{title}</Text>{caption ? <Text style={s.sectionCaption}>{caption}</Text> : null}</View>;
}

export function LoadingState({ message = 'Carregando...' }) {
  const { colors, tokens } = useTheme();
  const s = styles(colors, tokens);
  return <View style={s.state} accessibilityRole="progressbar" accessibilityLabel={message}>
    <ActivityIndicator color={colors.green} />
    <Text style={s.stateText}>{message}</Text>
  </View>;
}

export function EmptyState({ title, message, action }) {
  const { colors, tokens } = useTheme();
  const s = styles(colors, tokens);
  return <Card style={s.stateCard}>
    <Text style={s.stateTitle}>{title}</Text>
    {message ? <Text style={s.stateText}>{message}</Text> : null}
    {action}
  </Card>;
}

export function ErrorState({ title = 'Não foi possível carregar', message, onRetry, retrying = false }) {
  const { colors, tokens } = useTheme();
  const s = styles(colors, tokens);
  return <Card style={s.stateCard}>
    <Text style={s.stateErrorTitle}>{title}</Text>
    {message ? <Text style={s.stateText}>{message}</Text> : null}
    {onRetry ? <Button title="Tentar novamente" onPress={onRetry} loading={retrying} variant="secondary" style={s.stateAction} /> : null}
  </Card>;
}

export function ConfirmDialog({ visible, title, message, confirmLabel = 'Confirmar', cancelLabel = 'Cancelar', onConfirm, onCancel, destructive = false, loading = false }) {
  const { colors, tokens } = useTheme();
  const s = styles(colors, tokens);
  return <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onCancel}>
    <View style={s.dialogLayer}>
      <Pressable style={s.dialogBackdrop} onPress={loading ? undefined : onCancel} accessibilityRole="button" accessibilityLabel={cancelLabel} />
      <View style={s.dialog} accessibilityViewIsModal accessibilityRole="alert">
        <Text style={s.dialogTitle}>{title}</Text>
        <Text style={s.dialogMessage}>{message}</Text>
        <View style={s.dialogActions}>
          <Button title={cancelLabel} onPress={onCancel} variant="secondary" disabled={loading} style={s.dialogButton} />
          <Button title={confirmLabel} onPress={onConfirm} variant={destructive ? 'danger' : 'primary'} loading={loading} style={s.dialogButton} />
        </View>
      </View>
    </View>
  </Modal>;
}

function styles(colors, tokens) {
  const { space, radius, type, metrics } = tokens;
  return StyleSheet.create({
    heading: { width: '100%', maxWidth: metrics.contentMax, flexDirection: 'row', flexWrap: 'wrap', gap: space.md, justifyContent: 'space-between', alignItems: 'center', marginBottom: space.xl },
    headingCopy: { flex: 1, minWidth: 220 },
    eyebrow: { color: colors.green, fontWeight: '800', fontSize: type.caption, letterSpacing: 1.6 },
    title: { color: colors.ink, fontSize: type.display, fontWeight: '800', letterSpacing: -0.8, marginTop: space.xs },
    description: { maxWidth: 620, color: colors.muted, fontSize: type.small, marginTop: space.xs, lineHeight: 21 },
    button: { minHeight: metrics.touchTarget, paddingHorizontal: space.md, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' },
    button_primary: { backgroundColor: colors.green }, button_secondary: { backgroundColor: colors.pale, borderWidth: 1, borderColor: colors.line }, button_danger: { backgroundColor: colors.red },
    buttonDisabled: { opacity: 0.55 }, buttonPressed: { opacity: 0.82 }, buttonText: { color: 'white', fontSize: type.small, fontWeight: '800' },
    buttonText_secondary: { color: colors.green }, buttonText_danger: { color: 'white' },
    inputGroup: { gap: space.xxs }, inputLabel: { color: colors.subtle, fontSize: type.caption, fontWeight: '800', letterSpacing: 0.8 },
    input: { minHeight: metrics.touchTarget, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.field, borderRadius: radius.sm, paddingHorizontal: space.sm, color: colors.ink, fontSize: type.small },
    inputError: { borderColor: colors.red }, inputErrorText: { color: colors.red, fontSize: type.caption }, inputHelper: { color: colors.muted, fontSize: type.caption },
    chip: { minHeight: metrics.touchTarget, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.white, borderRadius: radius.sm, paddingHorizontal: space.sm, paddingVertical: space.xs, justifyContent: 'center' },
    chipSelected: { backgroundColor: colors.pale, borderColor: colors.green }, chipText: { color: colors.muted, fontSize: type.small, fontWeight: '600' }, chipTextSelected: { color: colors.dark, fontWeight: '800' },
    card: { backgroundColor: colors.white, borderColor: colors.line, borderWidth: metrics.cardBorder, borderRadius: radius.lg, padding: space.lg, shadowColor: colors.ink, shadowOpacity: 0.035, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 1 },
    sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: space.xs, marginBottom: space.sm }, sectionTitle: { fontSize: type.body, fontWeight: '800', color: colors.ink }, sectionCaption: { color: colors.muted, fontSize: type.caption },
    state: { minHeight: 180, alignItems: 'center', justifyContent: 'center', gap: space.sm }, stateCard: { width: '100%', maxWidth: 640, minHeight: 180, justifyContent: 'center', alignItems: 'center', gap: space.xs }, stateTitle: { color: colors.ink, fontSize: type.subtitle, fontWeight: '800', textAlign: 'center' }, stateErrorTitle: { color: colors.red, fontSize: type.subtitle, fontWeight: '800', textAlign: 'center' }, stateText: { color: colors.muted, fontSize: type.small, textAlign: 'center', lineHeight: 19 }, stateAction: { marginTop: space.xs },
    dialogLayer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: space.xl }, dialogBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.48)' },
    dialog: { width: '100%', maxWidth: 440, gap: space.sm, padding: space.xl, borderRadius: radius.lg, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line },
    dialogTitle: { color: colors.ink, fontSize: type.subtitle, fontWeight: '800' }, dialogMessage: { color: colors.muted, fontSize: type.small, lineHeight: 20 }, dialogActions: { flexDirection: 'row', justifyContent: 'flex-end', flexWrap: 'wrap', gap: space.xs, marginTop: space.xs }, dialogButton: { flexGrow: 1, minWidth: 110 },
  });
}
