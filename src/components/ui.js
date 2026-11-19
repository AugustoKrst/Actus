import { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import AppText from './AppText';

export { AppText };

export function Header({ eyebrow, title, description, action }) {
  const { colors, tokens } = useTheme();
  const s = styles(colors, tokens);
  return <View style={s.heading}>
    <View style={s.headingCopy}>
      {eyebrow ? <AppText style={s.eyebrow}>{eyebrow}</AppText> : null}
      <AppText style={s.title}>{title}</AppText>
      {description ? <AppText style={s.description}>{description}</AppText> : null}
    </View>
    {action}
  </View>;
}

export function PageHeading(props) { return <Header {...props} />; }

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  accessibilityLabel,
  style,
  textStyle,
  icon,
  iconPosition = 'leading',
}) {
  const { colors, tokens } = useTheme();
  const s = styles(colors, tokens);
  const unavailable = disabled || loading;
  const buttonContent = loading
    ? <ActivityIndicator size="small" color={variant === 'secondary' || variant === 'ghost' ? colors.primary : colors.textOnPrimary} />
    : <>
      {icon && iconPosition === 'leading' ? icon : null}
      <AppText style={[s.buttonText, s[`buttonText_${variant}`], s[`buttonText_${size}`], textStyle]}>{title}</AppText>
      {icon && iconPosition === 'trailing' ? icon : null}
    </>;

  return <Pressable
    onPress={onPress}
    disabled={unavailable}
    accessibilityRole="button"
    accessibilityLabel={accessibilityLabel || title}
    accessibilityState={{ disabled: unavailable, busy: loading }}
    style={({ pressed }) => [s.button, s[`button_${variant}`], s[`button_${size}`], unavailable && s.buttonDisabled, pressed && !unavailable && s.buttonPressed, style]}
  >
    {buttonContent}
  </Pressable>;
}

export function Input({
  label,
  value,
  onChangeText,
  error,
  helper,
  style,
  accessibilityLabel,
  icon,
  secureTextEntry = false,
  onFocus,
  onBlur,
  ...inputProps
}) {
  const { colors, tokens } = useTheme();
  const s = styles(colors, tokens);
  const [focused, setFocused] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const labelText = label || accessibilityLabel;
  const canTogglePassword = secureTextEntry;

  return <View style={s.inputGroup}>
    {label ? <AppText style={s.inputLabel}>{label}</AppText> : null}
    <View style={[s.inputFrame, focused && s.inputFrameFocused, error && s.inputFrameError]}>
      {icon ? <View style={s.inputIcon}>{icon}</View> : null}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        onFocus={(event) => { setFocused(true); onFocus?.(event); }}
        onBlur={(event) => { setFocused(false); onBlur?.(event); }}
        accessibilityLabel={accessibilityLabel || labelText}
        accessibilityHint={error || helper}
        secureTextEntry={canTogglePassword && !passwordVisible}
        style={[s.input, icon && s.inputWithIcon, canTogglePassword && s.inputWithTrailingIcon, style]}
        placeholderTextColor={colors.textSecondary}
        {...inputProps}
      />
      {canTogglePassword ? <Pressable onPress={() => setPasswordVisible((visible) => !visible)} style={s.passwordToggle} accessibilityRole="button" accessibilityLabel={passwordVisible ? 'Ocultar senha' : 'Mostrar senha'}>
        <Feather name={passwordVisible ? 'eye-off' : 'eye'} size={18} color={colors.textSecondary} />
      </Pressable> : null}
    </View>
    {error ? <AppText accessibilityRole="alert" style={s.inputErrorText}>{error}</AppText> : helper ? <AppText style={s.inputHelper}>{helper}</AppText> : null}
  </View>;
}

export function Chip({ label, selected, onPress, accessibilityLabel, icon, disabled = false }) {
  const { colors, tokens } = useTheme();
  const s = styles(colors, tokens);
  const content = <>
    {icon}
    <AppText style={[s.chipText, selected && s.chipTextSelected]}>{label}</AppText>
  </>;
  if (!onPress) return <View style={[s.chip, selected && s.chipSelected]}>{content}</View>;
  return <Pressable
    onPress={onPress}
    disabled={disabled}
    style={({ pressed }) => [s.chip, selected && s.chipSelected, disabled && s.buttonDisabled, pressed && !disabled && s.buttonPressed]}
    accessibilityRole="button"
    accessibilityLabel={accessibilityLabel || label}
    accessibilityState={{ selected: Boolean(selected), disabled }}
  >{content}</Pressable>;
}

export function Tag({ label, tone = 'neutral', icon }) {
  const { colors, tokens } = useTheme();
  const s = styles(colors, tokens);
  return <View style={[s.tag, s[`tag_${tone}`]]}>{icon}<AppText style={[s.tagText, s[`tagText_${tone}`]]}>{label}</AppText></View>;
}

export function Card({ children, style, accessibilityLabel }) {
  const { colors, tokens } = useTheme();
  const s = styles(colors, tokens);
  return <View accessibilityLabel={accessibilityLabel} style={[s.card, style]}>{children}</View>;
}

export function Avatar({ name = '', size = 'medium', style }) {
  const { colors, tokens } = useTheme();
  const s = styles(colors, tokens);
  const initials = name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part.slice(0, 1)).join('').toUpperCase() || '?';
  const hash = [...name].reduce((sum, character) => sum + character.charCodeAt(0), 0);
  const backgroundColor = colors.avatarPalette[hash % colors.avatarPalette.length];
  return <View accessibilityLabel={name || 'Perfil'} style={[s.avatar, s[`avatar_${size}`], { backgroundColor }, style]}>
    <AppText style={[s.avatarText, s[`avatarText_${size}`]]}>{initials}</AppText>
  </View>;
}

export function ProgressBar({ progress = 0, label, valueLabel }) {
  const { colors, tokens } = useTheme();
  const s = styles(colors, tokens);
  const boundedProgress = Math.max(0, Math.min(1, progress));
  return <View style={s.progressGroup}>
    {label || valueLabel ? <View style={s.progressHeader}>
      {label ? <AppText style={s.progressLabel}>{label}</AppText> : null}
      {valueLabel ? <AppText style={s.progressValue}>{valueLabel}</AppText> : null}
    </View> : null}
    <View style={s.progressTrack} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: Math.round(boundedProgress * 100) }}>
      <View style={[s.progressFill, { width: `${boundedProgress * 100}%` }]} />
    </View>
  </View>;
}

export function SectionHeader({ title, caption, action }) {
  const { colors, tokens } = useTheme();
  const s = styles(colors, tokens);
  return <View style={s.sectionHeader}>
    <View style={s.sectionHeaderCopy}>
      <AppText style={s.sectionTitle}>{title}</AppText>
      {caption ? <AppText style={s.sectionCaption}>{caption}</AppText> : null}
    </View>
    {action}
  </View>;
}

export function SectionTitle(props) { return <SectionHeader {...props} />; }

export function Skeleton({ width = '100%', height = 16, radius: cornerRadius }) {
  const { colors, tokens } = useTheme();
  const s = styles(colors, tokens);
  return <View accessibilityElementsHidden style={[s.skeleton, { width, height, borderRadius: cornerRadius || tokens.radius.sm }]} />;
}

export function LoadingState({ message = 'Carregando...' }) {
  const { colors, tokens } = useTheme();
  const s = styles(colors, tokens);
  return <View style={s.state} accessibilityRole="progressbar" accessibilityLabel={message}>
    <ActivityIndicator color={colors.primary} />
    <AppText style={s.stateText}>{message}</AppText>
  </View>;
}

export function EmptyState({ title, message, action, icon = 'activity' }) {
  const { colors, tokens } = useTheme();
  const s = styles(colors, tokens);
  return <Card style={s.stateCard}>
    <View style={s.emptyIcon}><Feather name={icon} size={24} color={colors.primary} /></View>
    <AppText style={s.stateTitle}>{title}</AppText>
    {message ? <AppText style={s.stateText}>{message}</AppText> : null}
    {action}
  </Card>;
}

export function ErrorState({ title = 'Não foi possível carregar', message, onRetry, retrying = false }) {
  const { colors, tokens } = useTheme();
  const s = styles(colors, tokens);
  return <Card style={s.stateCard}>
    <View style={s.errorIcon}><Feather name="alert-circle" size={24} color={colors.danger} /></View>
    <AppText style={s.stateErrorTitle}>{title}</AppText>
    {message ? <AppText style={s.stateText}>{message}</AppText> : null}
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
        <AppText style={s.dialogTitle}>{title}</AppText>
        <AppText style={s.dialogMessage}>{message}</AppText>
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
    eyebrow: { color: colors.primary, fontSize: type.size.label, fontWeight: type.weight.bold, letterSpacing: 1.4, textTransform: 'uppercase' },
    title: { color: colors.textPrimary, fontSize: type.size.display, fontWeight: type.weight.bold, letterSpacing: -0.8, marginTop: space.xs, lineHeight: 42 },
    description: { maxWidth: 620, color: colors.textSecondary, fontSize: type.size.caption, marginTop: space.xs, lineHeight: 21 },
    button: { minHeight: metrics.touchTarget, paddingHorizontal: space.md, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: space.xs },
    button_primary: { backgroundColor: colors.primary }, button_secondary: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }, button_ghost: { backgroundColor: 'transparent' }, button_danger: { backgroundColor: colors.danger },
    button_small: { minHeight: 40, paddingHorizontal: space.sm }, button_medium: { minHeight: metrics.touchTarget }, button_large: { minHeight: 56, paddingHorizontal: space.lg, borderRadius: radius.md },
    buttonDisabled: { opacity: 0.52 }, buttonPressed: { opacity: 0.86, transform: [{ scale: 0.985 }] },
    buttonText: { color: colors.textOnPrimary, fontSize: type.size.caption, fontWeight: type.weight.bold, textAlign: 'center' }, buttonText_primary: { color: colors.textOnPrimary }, buttonText_secondary: { color: colors.primary }, buttonText_ghost: { color: colors.primary }, buttonText_danger: { color: colors.textOnPrimary }, buttonText_small: { fontSize: type.size.label }, buttonText_medium: { fontSize: type.size.caption }, buttonText_large: { fontSize: type.size.body },
    inputGroup: { gap: space.xxs }, inputLabel: { color: colors.textSecondary, fontSize: type.size.label, fontWeight: type.weight.bold, letterSpacing: 0.7 },
    inputFrame: { minHeight: metrics.touchTarget, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.field, borderRadius: radius.sm, flexDirection: 'row', alignItems: 'center' }, inputFrameFocused: { borderColor: colors.primary, borderWidth: 2 }, inputFrameError: { borderColor: colors.danger },
    input: { flex: 1, minWidth: 0, minHeight: metrics.touchTarget - 2, paddingHorizontal: space.sm, color: colors.textPrimary, fontSize: type.size.caption }, inputWithIcon: { paddingLeft: 0 }, inputWithTrailingIcon: { paddingRight: 0 }, inputIcon: { width: 44, alignItems: 'center', justifyContent: 'center' }, passwordToggle: { width: metrics.touchTarget, minHeight: metrics.touchTarget, alignItems: 'center', justifyContent: 'center' }, inputErrorText: { color: colors.danger, fontSize: type.size.label }, inputHelper: { color: colors.textSecondary, fontSize: type.size.label },
    chip: { minHeight: metrics.touchTarget, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, borderRadius: radius.pill, paddingHorizontal: space.md, paddingVertical: space.xs, justifyContent: 'center', alignItems: 'center', flexDirection: 'row', gap: space.xxs }, chipSelected: { backgroundColor: colors.surfaceAlt, borderColor: colors.primary }, chipText: { color: colors.textSecondary, fontSize: type.size.caption, fontWeight: type.weight.medium }, chipTextSelected: { color: colors.primary, fontWeight: type.weight.bold },
    tag: { minHeight: 28, paddingHorizontal: space.xs, borderRadius: radius.pill, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: space.xxs, backgroundColor: colors.surfaceAlt }, tag_success: { backgroundColor: colors.surfaceAlt }, tag_warning: { backgroundColor: colors.surfaceAlt }, tag_danger: { backgroundColor: colors.surfaceAlt }, tagText: { color: colors.textSecondary, fontSize: type.size.label, fontWeight: type.weight.semibold }, tagText_success: { color: colors.success }, tagText_warning: { color: colors.warning }, tagText_danger: { color: colors.danger },
    card: { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: metrics.cardBorder, borderRadius: radius.lg, padding: space.lg, shadowColor: metrics.shadow.color, shadowOpacity: metrics.shadow.opacity, shadowRadius: metrics.shadow.radius, shadowOffset: metrics.shadow.offset, elevation: metrics.shadow.elevation },
    avatar: { width: 48, height: 48, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' }, avatar_small: { width: 36, height: 36 }, avatar_medium: { width: 48, height: 48 }, avatar_large: { width: 64, height: 64 }, avatarText: { color: colors.textPrimary, fontWeight: type.weight.bold }, avatarText_small: { fontSize: type.size.caption }, avatarText_medium: { fontSize: type.size.body }, avatarText_large: { fontSize: type.size.title },
    progressGroup: { width: '100%', gap: space.xs }, progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: space.xs }, progressLabel: { color: colors.textSecondary, fontSize: type.size.caption }, progressValue: { color: colors.textPrimary, fontSize: type.size.caption, fontWeight: type.weight.bold }, progressTrack: { height: 8, overflow: 'hidden', borderRadius: radius.pill, backgroundColor: colors.surfaceAlt }, progressFill: { height: '100%', borderRadius: radius.pill, backgroundColor: colors.primary },
    sectionHeader: { width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: space.xs, marginBottom: space.sm }, sectionHeaderCopy: { flex: 1 }, sectionTitle: { color: colors.textPrimary, fontSize: type.size.body, fontWeight: type.weight.bold }, sectionCaption: { color: colors.textSecondary, fontSize: type.size.label, marginTop: space.xxs },
    skeleton: { backgroundColor: colors.surfaceAlt }, state: { minHeight: 180, alignItems: 'center', justifyContent: 'center', gap: space.sm }, stateCard: { width: '100%', maxWidth: 640, minHeight: 200, justifyContent: 'center', alignItems: 'center', gap: space.xs }, emptyIcon: { width: 52, height: 52, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceAlt, marginBottom: space.xs }, errorIcon: { width: 52, height: 52, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceAlt, marginBottom: space.xs }, stateTitle: { color: colors.textPrimary, fontSize: type.size.subtitle, fontWeight: type.weight.bold, textAlign: 'center' }, stateErrorTitle: { color: colors.danger, fontSize: type.size.subtitle, fontWeight: type.weight.bold, textAlign: 'center' }, stateText: { color: colors.textSecondary, fontSize: type.size.caption, textAlign: 'center', lineHeight: 20 }, stateAction: { marginTop: space.xs },
    dialogLayer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: space.xl }, dialogBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.56)' },
    dialog: { width: '100%', maxWidth: 440, gap: space.sm, padding: space.xl, borderRadius: radius.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
    dialogTitle: { color: colors.textPrimary, fontSize: type.size.subtitle, fontWeight: type.weight.bold }, dialogMessage: { color: colors.textSecondary, fontSize: type.size.caption, lineHeight: 21 }, dialogActions: { flexDirection: 'row', justifyContent: 'flex-end', flexWrap: 'wrap', gap: space.xs, marginTop: space.xs }, dialogButton: { flexGrow: 1, minWidth: 110 },
  });
}
