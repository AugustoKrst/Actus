import { useState } from 'react';
import { router, usePathname } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { AppText as Text, Avatar, ConfirmDialog } from './ui';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const primaryLinks = [
  { path: '/inicio', label: 'Início', icon: 'home' },
  { path: '/rotina', label: 'Meus treinos', icon: 'grid' },
  { path: '/historico', label: 'Histórico', icon: 'clock' },
  { path: '/treino', label: 'Montar treino', icon: 'plus-square' },
];

export default function AppShell({ children, scrollable = true }) {
  const { width } = useWindowDimensions();
  const wide = width > 760;
  const path = usePathname();
  const { session, logout } = useAuth();
  const { colors, tokens } = useTheme();
  const s = createStyles(colors, tokens);
  const [menuOpen, setMenuOpen] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const [logoutError, setLogoutError] = useState('');
  const [loggingOut, setLoggingOut] = useState(false);
  const navigationLinks = [
    ...primaryLinks,
    ...(session?.user?.role === 'health_professional'
      ? [{ path: '/atendimentos', label: 'Atendimentos', icon: 'message-circle' }]
      : session?.user?.accountType === 'user'
        ? [{ path: '/contato', label: 'Profissionais', icon: 'users' }]
        : []),
    ...(session?.user?.role === 'admin' ? [{ path: '/admin', label: 'Administração', icon: 'shield' }] : []),
  ];

  async function signOut() {
    setMenuOpen(false);
    setLogoutError('');
    setLogoutConfirmOpen(true);
  }

  async function confirmSignOut() {
    setLoggingOut(true);
    setLogoutError('');
    try {
      await logout();
      setLogoutConfirmOpen(false);
      router.replace('/login');
    } catch {
      setLogoutError('Não foi possível sair da conta. Confira sua conexão e tente novamente.');
    } finally {
      setLoggingOut(false);
    }
  }

  function navigate(pathname) {
    setMenuOpen(false);
    router.push(pathname);
  }

  function isActive(pathname) {
    return path === pathname || (pathname === '/historico' && path === '/sessao') || (pathname === '/rotina' && path === '/treinos') || (pathname === '/inicio' && path === '/');
  }

  return <SafeAreaView style={s.safe}><View style={s.frame}>
    <View style={s.main}>
      {menuOpen && <Pressable onPress={() => setMenuOpen(false)} style={s.menuBackdrop} accessibilityLabel="Fechar menu" />}
      <View style={[s.topbar, !wide && s.topbarCompact]}>
        <Pressable onPress={() => navigate('/inicio')} style={s.brand} accessibilityRole="button" accessibilityLabel="Ir para o início">
          <View style={s.brandMarkWrap}><Feather name="activity" size={19} color={colors.green} accessibilityElementsHidden importantForAccessibility="no" /></View><Text style={s.brandText}>Actus</Text>
        </Pressable>
        {wide ? <ScrollView horizontal style={s.navScroll} contentContainerStyle={s.navContent} showsHorizontalScrollIndicator={false}>
          {navigationLinks.map((item) => {
            const active = isActive(item.path);
            return <Pressable key={item.path} onPress={() => navigate(item.path)} style={[s.navItem, active && s.navItemActive]} accessibilityRole="button" accessibilityLabel={item.label} accessibilityState={{ selected: active }}>
              <Feather name={item.icon} size={15} color={active ? colors.green : colors.muted} accessibilityElementsHidden importantForAccessibility="no" /><Text style={[s.navText, active && s.navTextActive]}>{item.label}</Text>
            </Pressable>;
          })}
        </ScrollView> : <View style={s.navSpacer} />}
        <Pressable onPress={() => setMenuOpen((open) => !open)} style={s.menuButton} accessibilityRole="button" accessibilityLabel={menuOpen ? 'Fechar menu' : 'Abrir menu'} accessibilityState={{ expanded: menuOpen }}>
          <Feather name={menuOpen ? 'x' : 'menu'} size={19} color={colors.textPrimary} accessibilityElementsHidden importantForAccessibility="no" />
        </Pressable>
        {menuOpen && <View style={s.menuPanel}>
          <View style={s.menuAccount}>
            <Avatar name={session?.user?.name || ''} size="small" />
            <View style={s.accountCopy}><Text style={s.accountName}>{session?.user?.name || 'Minha conta'}</Text><Text style={s.accountEmail}>{session?.user?.email || 'Perfil pessoal'}</Text></View>
          </View>
          <View style={s.menuDivider} />
          {!wide && <>
            {navigationLinks.map((item) => {
              const active = isActive(item.path);
              return <Pressable key={item.path} onPress={() => navigate(item.path)} style={[s.menuItem, active && s.menuItemActive]} accessibilityRole="button" accessibilityLabel={item.label} accessibilityState={{ selected: active }}>
                <Feather name={item.icon} size={16} color={active ? colors.green : colors.muted} accessibilityElementsHidden importantForAccessibility="no" /><Text style={[s.menuItemText, active && s.menuItemTextActive]}>{item.label}</Text>
              </Pressable>;
            })}
            <View style={s.menuDivider} />
          </>}
          {[
            { path: '/perfil', label: 'Perfil', icon: 'user' },
            { path: '/configuracoes', label: 'Configurações', icon: 'settings' },
          ].map((item) => {
            const active = isActive(item.path);
            return <Pressable key={item.path} onPress={() => navigate(item.path)} style={[s.menuItem, active && s.menuItemActive]} accessibilityRole="button">
              <Feather name={item.icon} size={16} color={active ? colors.green : colors.muted} accessibilityElementsHidden importantForAccessibility="no" /><Text style={[s.menuItemText, active && s.menuItemTextActive]}>{item.label}</Text>
            </Pressable>;
          })}
          <View style={s.menuDivider} />
          <Pressable onPress={signOut} style={s.menuItem} accessibilityRole="button" accessibilityLabel="Sair da conta"><Feather name="log-out" size={16} color={colors.muted} accessibilityElementsHidden importantForAccessibility="no" /><Text style={s.menuItemText}>Sair da conta</Text></Pressable>
        </View>}
      </View>

      {scrollable
        ? <ScrollView contentContainerStyle={[s.content, { paddingHorizontal: wide ? 44 : 20, paddingBottom: 38 }]}>{children}</ScrollView>
        : <View style={[s.content, s.contentFixed, { paddingHorizontal: wide ? 44 : 20 }]}>{children}</View>}
    </View>
  </View><ConfirmDialog visible={logoutConfirmOpen} title="Sair da conta?" message={logoutError || 'Você poderá entrar novamente com seu e-mail e senha.'} confirmLabel="Sair" onConfirm={confirmSignOut} onCancel={() => { if (!loggingOut) setLogoutConfirmOpen(false); }} destructive loading={loggingOut} /></SafeAreaView>;
}

function createStyles(colors, tokens) { const { space, radius, type, metrics } = tokens; return StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background }, frame: { flex: 1, backgroundColor: colors.background }, main: { flex: 1, position: 'relative' }, menuBackdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 8 },
  topbar: { minHeight: 72, position: 'relative', backgroundColor: colors.surface, borderBottomWidth: 1, borderColor: colors.border, flexDirection: 'row', alignItems: 'center', paddingHorizontal: space.xl, zIndex: 10, elevation: 2, shadowColor: metrics.shadow.color, shadowOpacity: 0.04, shadowRadius: 10, shadowOffset: { width: 0, height: 3 } }, topbarCompact: { minHeight: 64, paddingHorizontal: space.sm },
  brand: { width: 112, flexDirection: 'row', alignItems: 'center', gap: space.xs }, brandMarkWrap: { width: 36, height: 36, borderRadius: radius.sm, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' }, brandMark: { color: colors.primary, fontSize: type.size.subtitle }, brandText: { color: colors.textPrimary, fontWeight: type.weight.bold, fontSize: type.size.subtitle + 3, letterSpacing: -0.8 },
  navSpacer: { flex: 1, minWidth: 0 },
  navScroll: { flex: 1, minWidth: 0 }, navContent: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', gap: space.xxs, paddingHorizontal: space.xs }, navItem: { minHeight: metrics.touchTarget, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space.xxs, paddingHorizontal: space.sm, borderRadius: radius.sm }, navItemActive: { backgroundColor: colors.surfaceAlt }, navIcon: { color: colors.textSecondary, fontSize: type.size.body - 1 }, navText: { color: colors.textSecondary, fontSize: type.size.label, fontWeight: type.weight.semibold }, navTextActive: { color: colors.primary, fontWeight: type.weight.bold },
  menuButton: { width: metrics.touchTarget, height: metrics.touchTarget, flexShrink: 0, marginLeft: space.xs, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceAlt },
  menuPanel: { position: 'absolute', top: 61, right: 12, width: 280, maxWidth: '92%', padding: space.xs, borderRadius: radius.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, elevation: 8, zIndex: 30, shadowColor: metrics.shadow.color, shadowOpacity: 0.14, shadowRadius: 16, shadowOffset: { width: 0, height: 7 } },
  menuAccount: { flexDirection: 'row', alignItems: 'center', gap: space.sm, padding: space.xs }, accountCopy: { flex: 1, minWidth: 0 }, accountName: { color: colors.textPrimary, fontSize: type.size.caption, fontWeight: type.weight.bold }, accountEmail: { color: colors.textSecondary, fontSize: type.size.label, marginTop: space.xxs },
  menuDivider: { height: 1, backgroundColor: colors.border, marginVertical: space.xxs }, menuItem: { minHeight: metrics.touchTarget, borderRadius: radius.sm, flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingHorizontal: space.sm }, menuItemActive: { backgroundColor: colors.surfaceAlt }, menuItemIcon: { color: colors.textSecondary, width: 20, fontSize: type.size.body + 1, textAlign: 'center' }, menuItemIconActive: { color: colors.primary }, menuItemText: { color: colors.textPrimary, fontSize: type.size.caption, fontWeight: type.weight.medium }, menuItemTextActive: { color: colors.primary, fontWeight: type.weight.bold },
  content: { width: '100%', minWidth: 0, flexGrow: 1, paddingTop: space.xl, alignItems: 'center' }, contentFixed: { width: '100%', minWidth: 0, flex: 1, paddingBottom: space.md, alignItems: 'stretch' },
}); }
